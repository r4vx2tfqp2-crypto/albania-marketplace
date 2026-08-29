// Lets the admin send an announcement email to a chosen audience (sellers,
// buyers, or everyone) from the admin panel's Announcements tab
// (client/src/pages/AdminPanel.jsx). Recipient emails live only in
// Supabase Auth (auth.users) -- the client can't read that with the anon
// key -- so audience resolution has to happen server-side with the
// service-role key, same as admin-user-stats.
//
// Access is independently verified here (not just via config.toml's
// verify_jwt, which only proves *a* valid session) by checking the
// caller's own JWT resolves to the admin email -- same pattern as every
// other admin-only function in this project.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = 'julsina76@gmail.com'
const FROM = 'Tregu <noreply@tregu.store>'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c] as string))

async function allUsers() {
  const users: { id: string; email?: string }[] = []
  const perPage = 1000
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...(data?.users || []))
    if ((data?.users || []).length < perPage) break
  }
  return users
}

async function resolveRecipients(audience: string): Promise<string[]> {
  const users = await allUsers()
  const emailById = new Map(users.filter(u => u.email).map(u => [u.id, u.email!]))

  if (audience === 'all') return [...new Set(emailById.values())]

  const { data: shops, error } = await supabaseAdmin.from('shops').select('user_id')
  if (error) throw error
  const sellerIds = new Set((shops || []).map(s => s.user_id))

  if (audience === 'sellers') {
    return [...new Set([...sellerIds].map(id => emailById.get(id)).filter(Boolean) as string[])]
  }
  if (audience === 'buyers') {
    return [...new Set([...emailById.entries()].filter(([id]) => !sellerIds.has(id)).map(([, email]) => email))]
  }
  throw new Error('Invalid audience')
}

const emailHtml = (subject: string, bodyHtml: string) => `
<div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1A1916;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
    <div style="width:32px;height:32px;background:#1A1916;color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;">T</div>
    <span style="font-weight:700;font-size:20px;">tregu</span>
  </div>
  <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;">${esc(subject)}</h1>
  <div style="font-size:14px;line-height:1.7;color:#5C5A55;white-space:pre-wrap;">${bodyHtml}</div>
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #F0EFEC;font-size:12px;color:#9A9890;">
    Tregu.store — Platforma e pare shqiptare e tregtise elektronike
  </div>
</div>`

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await callerClient.auth.getUser()
  if (authError || !user) return json({ error: 'Not authenticated' }, 401)
  if (user.email !== ADMIN_EMAIL) return json({ error: 'Forbidden' }, 403)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const audience = String(body?.audience || '')
  if (!['all', 'sellers', 'buyers'].includes(audience)) {
    return json({ error: 'audience must be all, sellers, or buyers' }, 400)
  }
  const subject = String(body?.subject || '').trim().slice(0, 200)
  const message = String(body?.message || '').trim().slice(0, 20000)
  if (!subject || !message) return json({ error: 'Subject and message are required' }, 400)

  // dryRun: resolve + return the recipient list/count without sending --
  // lets the admin panel show "this will go to N people" before the
  // irreversible send action.
  const dryRun = body?.dryRun === true

  let recipients: string[]
  try {
    recipients = await resolveRecipients(audience)
  } catch (err: any) {
    return json({ error: err.message || 'Failed to resolve recipients' }, 500)
  }

  if (dryRun) return json({ recipientCount: recipients.length })
  if (recipients.length === 0) return json({ error: 'No recipients match this audience' }, 400)
  if (!RESEND_API_KEY) return json({ error: 'Email sending is not configured' }, 500)

  const html = emailHtml(subject, esc(message).replace(/\n/g, '<br/>'))

  // Resend's batch endpoint caps at 100 recipients per call.
  const BATCH_SIZE = 100
  let sent = 0
  const failures: string[] = []
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.map(to => ({ from: FROM, to, subject, html }))),
      })
      if (res.ok) sent += batch.length
      else failures.push(...batch)
    } catch {
      failures.push(...batch)
    }
  }

  return json({ success: true, sent, failed: failures.length, total: recipients.length })
})

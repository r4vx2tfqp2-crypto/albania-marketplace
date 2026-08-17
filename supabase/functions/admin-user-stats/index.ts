// Signup counts for the admin analytics tab (client/src/pages/AdminPanel.jsx).
// There's no `profiles` table in this app -- account data lives only in
// Supabase Auth (auth.users), which the client can't query directly (no
// RLS-bypassing access with the anon key). Reading it requires the
// service-role admin API, so this has to happen server-side.
//
// Returns only a total count and a list of signup timestamps -- never
// emails, names, or any other PII -- so the response itself can't leak
// user data even though it's easy to reach (same-origin fetch, valid JWT).
// Access is still restricted to the actual admin account: verify_jwt in
// config.toml only proves the caller has *a* valid Supabase session, not
// that they're the admin, so that check happens here explicitly, the same
// pattern the DB triggers and AdminRoute already use.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ADMIN_EMAIL = 'julsina76@gmail.com'

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

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

  const createdDates: string[] = []
  let total = 0
  const perPage = 1000
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) return json({ error: error.message }, 500)
    const users = data?.users || []
    total += users.length
    for (const u of users) if (u.created_at) createdDates.push(u.created_at)
    if (users.length < perPage) break
  }

  return json({ total, createdDates })
})

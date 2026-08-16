// Replaces direct client-side `orders` table access from ConfirmDelivery.jsx
// (the buyer email-link flow: /confirm-delivery?order=<uuid>&confirm=yes or
// &preference=...). The order id is an unguessable UUID delivered only via
// the buyer's own email, so no extra secret is needed here -- but now that
// anon has no write access to `orders` (see
// 20260816000001_fix_open_rls_policies.sql), this update has to happen
// server-side via the service-role key instead of the open table policy
// that previously backed it.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const PREF_LABELS: Record<string, string> = {
  delivered: 'Dorezim personal',
  neighbour: 'Tek fqinji',
  door: 'Para deres',
  reschedule: 'Riplanifico dorezimin',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const orderId = String(body?.orderId || '')
  if (!orderId) return json({ error: 'Mungon ID e porosise.' }, 400)

  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('id, notes')
    .eq('id', orderId)
    .maybeSingle()
  if (!existing) return json({ error: 'Porosia nuk u gjet.' }, 404)

  const preference = body?.preference ? String(body.preference) : null
  if (preference) {
    if (!PREF_LABELS[preference]) return json({ error: 'Preference e pavlefshme.' }, 400)
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        delivery_preference: preference,
        notes: (existing.notes ? existing.notes + ' | ' : '') + 'Preference: ' + PREF_LABELS[preference],
      })
      .eq('id', orderId)
    if (error) return json({ error: 'Dicka shkoi keq.' }, 500)
    return json({ success: true, status: 'preference_set' })
  }

  const confirm = body?.confirm ? String(body.confirm) : null
  if (confirm === 'yes') {
    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)
      .select('id')
      .single()
    if (error || !updated) return json({ error: 'Dicka shkoi keq.' }, 500)
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/order-notification`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: { id: updated.id }, type: 'customer_confirmed' }),
      })
    } catch (_err) { /* best-effort notification */ }
    return json({ success: true, status: 'confirmed' })
  }
  if (confirm === 'no') {
    return json({ success: true, status: 'problem' })
  }

  return json({ error: 'Kerkese e pavlefshme.' }, 400)
})

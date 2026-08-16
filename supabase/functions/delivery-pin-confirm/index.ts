// Replaces direct client-side `orders` table access from DeliveryConfirm.jsx
// (the courier PIN-entry flow). Previously the client queried
// `orders?delivery_pin=eq.<pin>` directly with the public anon key under an
// RLS policy that allowed anyone to read/write any order -- meaning the
// whole ~9000-value PIN space could be brute-forced from outside, exposing
// every customer's PII and letting an attacker mark any order delivered.
//
// Now `orders` RLS no longer grants anon this access at all (see
// 20260816000001_fix_open_rls_policies.sql); this function uses the
// service-role key to do the lookup/update server-side, plus a simple
// per-IP rate limit backed by delivery_pin_attempts.
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

const getClientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 15

async function allowAttempt(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const { count } = await supabaseAdmin
    .from('delivery_pin_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since)
  if ((count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) return false
  await supabaseAdmin.from('delivery_pin_attempts').insert({ ip })
  return true
}

const ORDER_FIELDS = 'id, customer_name, customer_phone, customer_address, customer_city, notes, items, total, latitude, longitude, status'
const DELIVERY_OPTIONS = ['delivered', 'neighbour', 'door', 'failed']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const ip = getClientIp(req)
  if (!(await allowAttempt(ip))) {
    return json({ error: 'Shume tentativa. Provoni perseri me vone.' }, 429)
  }

  const pin = String(body?.pin || '').trim()
  if (!/^\d{4}$/.test(pin)) return json({ error: 'PIN i pavlefshem.' }, 400)

  if (body?.action === 'confirm') {
    const orderId = String(body?.orderId || '')
    if (!orderId) return json({ error: 'Mungon ID e porosise.' }, 400)

    const { data: existing } = await supabaseAdmin
      .from('orders')
      .select('id, status, notes')
      .eq('id', orderId)
      .eq('delivery_pin', pin)
      .maybeSingle()
    if (!existing) return json({ error: 'PIN i gabuar.' }, 401)
    if (existing.status === 'delivered') {
      return json({ error: 'Kjo porosi eshte konfirmuar tashme si e dorezuar.' }, 409)
    }

    const deliveryOption = DELIVERY_OPTIONS.includes(body?.deliveryOption) ? body.deliveryOption : 'delivered'
    const neighbourName = deliveryOption === 'neighbour' ? String(body?.neighbourName || '').trim().slice(0, 200) : ''
    if (deliveryOption === 'neighbour' && !neighbourName) {
      return json({ error: 'Emri i fqinjit mungon.' }, 400)
    }
    const newStatus = deliveryOption === 'failed' ? 'confirmed' : 'delivered'
    const deliveryNote = deliveryOption === 'neighbour' ? 'U la tek fqinji: ' + neighbourName
      : deliveryOption === 'door' ? 'U la para deres'
      : deliveryOption === 'failed' ? 'Nuk u dorezua'
      : 'U dorezua'

    const { data: updated, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: newStatus,
        delivery_preference: deliveryOption,
        notes: (existing.notes ? existing.notes + ' | ' : '') + deliveryNote,
      })
      .eq('id', orderId)
      .eq('delivery_pin', pin)
      .select('id')
      .single()
    if (error || !updated) return json({ error: 'Konfirmimi deshtoi.' }, 500)

    const signature = typeof body?.signature === 'string' ? body.signature : null
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/order-notification`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order: { id: updated.id, signature }, type: 'delivery_confirmed' }),
      })
    } catch (_err) { /* best-effort notification */ }

    return json({ success: true })
  }

  // default action: lookup by PIN
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select(ORDER_FIELDS)
    .eq('delivery_pin', pin)
    .maybeSingle()
  if (!order) return json({ error: 'PIN i gabuar. Kontrolloni dhe provoni perseri.' }, 404)
  if (order.status === 'delivered') {
    return json({ error: 'Kjo porosi eshte konfirmuar tashme si e dorezuar.' }, 409)
  }

  return json({ order })
})

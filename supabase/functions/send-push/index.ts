// Sends a Web Push notification triggered by real app events: a seller
// updating an order's status (notifies the buyer) or a buyer placing an
// order (notifies the seller). Called from client/src/pages/SellerOrders.jsx
// and client/src/pages/Checkout.jsx respectively, right after the DB
// mutation that caused the event.
//
// Unlike the admin-only functions in this project, this one is callable
// by any authenticated user -- but it deliberately never accepts a
// free-form recipient or message from the caller. Only a fixed
// { orderId, event } pair is accepted; the function re-fetches the
// order/shop rows itself, verifies the caller actually has a legitimate
// relationship to that specific order (is the buyer, or owns the shop),
// and builds the notification title/body from a fixed template. Without
// this, any logged-in user could push arbitrary text to any other
// registered user's device -- the same class of risk order-notification's
// own comment already documents for email, just for push instead.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:info@tregu.store'
const SITE_URL = 'https://www.tregu.store'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'u konfirmua',
  packed: 'u paketua',
  picked_up: 'u mor nga kurieri',
  on_the_way: 'eshte ne rruge drejt jush',
  delivered: 'u dorezua',
}

async function sendToUser(userId: string, payload: { title: string; body: string; url: string; tag?: string }) {
  const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', userId)
  if (!subs || subs.length === 0) return { sent: 0, failed: 0 }

  let sent = 0, failed = 0
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
      sent++
    } catch (err: any) {
      failed++
      // 404/410 = the browser has invalidated this subscription (uninstalled,
      // cleared data, etc) -- stop trying it and clean up the row instead of
      // failing on it forever.
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }))
  return { sent, failed }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser()
  if (authError || !caller) return json({ error: 'Not authenticated' }, 401)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const orderId = String(body?.orderId || '')
  const event = String(body?.event || '')
  if (!orderId || !['status_changed', 'new_order'].includes(event)) {
    return json({ error: 'orderId and a valid event are required' }, 400)
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, buyer_id, shop_id')
    .eq('id', orderId)
    .maybeSingle()
  if (orderErr || !order) return json({ error: 'Order not found' }, 404)

  let shop: { user_id: string; name: string } | null = null
  if (order.shop_id) {
    const { data } = await supabaseAdmin.from('shops').select('user_id, name').eq('id', order.shop_id).maybeSingle()
    shop = data
  }

  if (event === 'status_changed') {
    // Only the shop that owns this order may announce its own status
    // change -- prevents any random logged-in user from pinging a
    // stranger's order.
    if (!shop || shop.user_id !== caller.id) return json({ error: 'Forbidden' }, 403)
    if (!order.buyer_id) return json({ sent: 0, failed: 0, note: 'Guest order, no account to notify' })

    const label = STATUS_LABELS[order.status] || 'u perditesua'
    const result = await sendToUser(order.buyer_id, {
      title: 'Tregu — Perditesim porosie',
      body: `Porosia juaj #${order.id.slice(0, 8)} ${label}.`,
      url: `${SITE_URL}/orders`,
      tag: `order-${order.id}`,
    })
    return json(result)
  }

  // event === 'new_order': only the buyer who actually placed this order
  // may trigger the seller's "you have a new order" notification.
  if (order.buyer_id !== caller.id) return json({ error: 'Forbidden' }, 403)
  if (!shop) return json({ sent: 0, failed: 0, note: 'Order has no shop to notify' })

  const result = await sendToUser(shop.user_id, {
    title: 'Tregu — Porosi e re!',
    body: `Keni nje porosi te re ne ${shop.name}.`,
    url: `${SITE_URL}/seller/orders`,
    tag: `new-order-${order.id}`,
  })
  return json(result)
})

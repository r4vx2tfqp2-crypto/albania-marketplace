import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_URL = 'https://tregu.store'
const ADMIN_EMAIL = 'tregusupport@gmail.com'
const FROM = 'Tregu <noreply@tregu.store>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    if (!body) return new Response(JSON.stringify({ error: 'Empty body' }), { status: 400, headers: corsHeaders })

    const { order, type } = JSON.parse(body)
    if (!order) return new Response(JSON.stringify({ error: 'No order data' }), { status: 400, headers: corsHeaders })

    const itemsList = order.items?.map((i: any) =>
      `<tr><td style="padding:6px 0;font-size:14px;color:#1A1916;">${i.name} ${i.size ? `(${i.size})` : ''}</td><td style="padding:6px 0;font-size:14px;color:#1A1916;text-align:right;">x${i.qty} — ${i.price?.toLocaleString()} L</td></tr>`
    ).join('') || ''

    const results = []

    if (type === 'delivery_confirmed') {
      // 1. Notify admin
      results.push(await sendEmail(
        ADMIN_EMAIL,
        `Porosia u dorezua — ${order.customer_name} #${order.id?.slice(0, 8)}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1D9E75;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Porosia u dorezua!</h1>
          </div>
          <div style="background:#F7F6F3;padding:24px;border-radius:0 0 12px 12px;">
            <p style="font-size:15px;color:#1A1916;">Porosia <strong>#${order.id?.slice(0, 8)}</strong> u dorezua tek <strong>${order.customer_name}</strong></p>
            <p style="font-size:14px;color:#5C5A55;">📞 ${order.customer_phone} | 📍 ${order.customer_address}, ${order.customer_city}</p>
            <table width="100%" style="margin:16px 0;">${itemsList}</table>
            <div style="background:#1D9E75;padding:14px;border-radius:8px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:18px;font-weight:bold;">Totali: ${order.total?.toLocaleString()} L</p>
            </div>
          </div>
        </div>`
      ))

      // 2. Ask customer to confirm
      if (order.customer_email) {
        results.push(await sendEmail(
          order.customer_email,
          `A e morrët porosinë tuaj? — Tregu #${order.id?.slice(0, 8)}`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1A1916;padding:24px;border-radius:12px 12px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:22px;">Porosia juaj ka arritur!</h1>
            </div>
            <div style="background:#F7F6F3;padding:24px;border-radius:0 0 12px 12px;">
              <p style="font-size:15px;color:#1A1916;">Pershendetje <strong>${order.customer_name}</strong>,</p>
              <p style="font-size:14px;color:#5C5A55;margin-bottom:20px;">Porosia juaj eshte shënuar si e dorezuar. A e morrët?</p>
              <table width="100%" style="background:#fff;padding:16px;border-radius:8px;margin-bottom:20px;">${itemsList}
                <tr><td colspan="2" style="border-top:1px solid #eee;padding-top:10px;font-size:15px;font-weight:bold;">Totali: ${order.total?.toLocaleString()} L</td></tr>
              </table>
              <div style="text-align:center;margin-bottom:16px;">
                <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=yes" style="background:#1D9E75;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">Po, e mora!</a>
              </div>
              <div style="text-align:center;">
                <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=no" style="color:#E24B4A;font-size:14px;text-decoration:none;">Jo, kam nje problem</a>
              </div>
              <p style="font-size:12px;color:#9A9890;margin-top:24px;text-align:center;">Faleminderit qe blini ne Tregu.store</p>
            </div>
          </div>`
        ))
      }

    } else if (type === 'customer_confirmed') {
      // Customer confirmed receipt — notify admin
      results.push(await sendEmail(
        ADMIN_EMAIL,
        `Klienti konfirmoi marrjen — #${order.id?.slice(0, 8)}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1D9E75;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Klienti konfirmoi!</h1>
          </div>
          <div style="background:#F7F6F3;padding:24px;border-radius:0 0 12px 12px;">
            <p style="font-size:15px;color:#1A1916;"><strong>${order.customer_name}</strong> konfirmoi marrjen e porosise <strong>#${order.id?.slice(0, 8)}</strong></p>
            <p style="font-size:14px;color:#5C5A55;">Totali: ${order.total?.toLocaleString()} L</p>
          </div>
        </div>`
      ))

    } else {
      // New order — notify admin
      results.push(await sendEmail(
        ADMIN_EMAIL,
        `Porosi e re — ${order.customer_name} — ${order.total?.toLocaleString()} L`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1A1916;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Porosi e re ne Tregu!</h1>
          </div>
          <div style="background:#F7F6F3;padding:24px;border-radius:0 0 12px 12px;">
            <h2 style="font-size:18px;margin:0 0 16px;">Porosia #${order.id?.slice(0, 8)}</h2>
            <div style="background:#fff;padding:16px;border-radius:8px;margin-bottom:16px;">
              <p style="margin:4px 0;font-weight:bold;">${order.customer_name}</p>
              <p style="margin:4px 0;color:#5C5A55;">📞 ${order.customer_phone}</p>
              <p style="margin:4px 0;color:#5C5A55;">📍 ${order.customer_address}, ${order.customer_city}</p>
              ${order.notes ? `<p style="margin:4px 0;color:#5C5A55;">Shenime: ${order.notes}</p>` : ''}
            </div>
            <table width="100%" style="background:#fff;padding:16px;border-radius:8px;margin-bottom:16px;">${itemsList}</table>
            <div style="background:#1D9E75;padding:16px;border-radius:8px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:bold;">Totali: ${order.total?.toLocaleString()} L</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Pagese me dorezim</p>
            </div>
            <div style="margin-top:16px;text-align:center;">
              <a href="${SITE_URL}/admin" style="background:#1A1916;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Shiko ne Admin Panel</a>
            </div>
          </div>
        </div>`
      ))

      // Send order confirmation to buyer
      if (order.customer_email) {
        results.push(await sendEmail(
          order.customer_email,
          `Porosia juaj u konfirmua — Tregu #${order.id?.slice(0, 8)}`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1A1916;padding:24px;border-radius:12px 12px 0 0;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:#1D9E75;border-radius:8px;display:inline-block;text-align:center;line-height:36px;font-weight:bold;color:#fff;font-size:18px;">T</div>
                <span style="color:#fff;font-size:22px;font-weight:bold;margin-left:10px;">tregu</span>
              </div>
            </div>
            <div style="background:#F7F6F3;padding:24px;border-radius:0 0 12px 12px;">
              <h2 style="font-size:20px;margin:0 0 8px;">Porosia juaj u konfirmua!</h2>
              <p style="font-size:15px;color:#1A1916;margin-bottom:20px;">Pershendetje <strong>${order.customer_name}</strong>, faleminderit per porosine tuaj!</p>
              
              <div style="background:#fff;padding:16px;border-radius:8px;margin-bottom:16px;">
                <p style="font-size:12px;font-weight:500;color:#9A9890;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Detajet e porosise</p>
                <p style="margin:4px 0;font-size:14px;font-weight:600;">Porosia #${order.id?.slice(0, 8)}</p>
                <p style="margin:4px 0;font-size:13px;color:#5C5A55;">📍 ${order.customer_address}, ${order.customer_city}</p>
              </div>

              <table width="100%" style="background:#fff;padding:16px;border-radius:8px;margin-bottom:16px;border-collapse:collapse;">
                <tr><th style="text-align:left;font-size:12px;color:#9A9890;text-transform:uppercase;padding-bottom:8px;">Produkti</th><th style="text-align:right;font-size:12px;color:#9A9890;text-transform:uppercase;padding-bottom:8px;">Cmimi</th></tr>
                ${itemsList}
                <tr><td colspan="2" style="border-top:1px solid #eee;padding-top:10px;"></td></tr>
                <tr><td style="font-size:15px;font-weight:bold;padding-top:4px;">Totali</td><td style="font-size:15px;font-weight:bold;text-align:right;">${order.total?.toLocaleString()} L</td></tr>
              </table>

              <div style="background:#E1F5EE;padding:14px;border-radius:8px;margin-bottom:20px;">
                <p style="margin:0;font-size:14px;color:#0F6E56;">💵 <strong>Pagesa me dorezim</strong> — paguani kur te merrni porosine</p>
              </div>

              <p style="font-size:13px;color:#5C5A55;line-height:1.6;">Shitesi do te kontaktoje per detajet e dorezimit. Nese keni pyetje kontaktoni: <a href="mailto:tregusupport@gmail.com" style="color:#1D9E75;">tregusupport@gmail.com</a></p>

              <p style="font-size:12px;color:#9A9890;margin-top:24px;text-align:center;">Faleminderit qe blini ne <a href="${SITE_URL}" style="color:#1D9E75;">Tregu.store</a></p>
            </div>
          </div>`
        ))
      }
    }

    console.log('Results:', JSON.stringify(results))
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
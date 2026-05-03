import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_URL = 'https://tregu.store'
const ADMIN_EMAIL = 'info@tregu.store'
const FROM = 'Tregu <noreply@tregu.store>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    const data = await res.json()
    console.log('Email sent to', to, ':', JSON.stringify(data))
    return data
  } catch (err) {
    console.error('Email error:', err)
    return null
  }
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

    console.log('Processing type:', type, 'delivery_preference:', order.delivery_preference)

    const itemsRows = order.items?.map((i: any) => `
      <tr>
        <td style="padding:8px;font-size:13px;color:#1A1916;border-bottom:1px solid #F0EFEC;">${i.name}${i.size ? ` (${i.size})` : ''}</td>
        <td style="padding:8px;font-size:13px;color:#5C5A55;text-align:center;border-bottom:1px solid #F0EFEC;">x${i.qty}</td>
        <td style="padding:8px;font-size:13px;color:#1A1916;text-align:right;border-bottom:1px solid #F0EFEC;font-weight:600;">${(i.price * i.qty).toLocaleString()} L</td>
      </tr>`
    ).join('') || ''

    const subtotal = order.items?.reduce((sum: number, i: any) => sum + (i.price * i.qty), 0) || 0
    const deliveryFee = 300
    const tvsh = Math.round(subtotal * 0.20)

    if (type === 'delivery_confirmed') {
      const deliveryPref = order.delivery_preference || 'delivered'
      const neighbourName = order.neighbour_name || ''
      const signature = order.signature || null

      console.log('Delivery pref:', deliveryPref, 'Neighbour:', neighbourName)

      const prefMap: Record<string, {icon: string, title: string, color: string}> = {
        delivered: { icon: '✅', title: 'U dorezua personalisht', color: '#1D9E75' },
        neighbour: { icon: '🏠', title: 'U la tek fqinji', color: '#378ADD' },
        door: { icon: '📦', title: 'U la para deres', color: '#854F0B' },
        failed: { icon: '❌', title: 'Nuk u dorezua', color: '#E24B4A' },
      }
      const pref = prefMap[deliveryPref] || prefMap.delivered

      // Admin email
      await sendEmail(
        ADMIN_EMAIL,
        `${pref.icon} Porosia u dorezua — ${order.customer_name} #${order.id?.slice(0, 8)}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:${pref.color};padding:20px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;">${pref.icon} ${pref.title}</h2>
          </div>
          <div style="background:#F7F6F3;padding:20px;border-radius:0 0 12px 12px;">
            <p><strong>${order.customer_name}</strong> — ${order.customer_phone}</p>
            <p>${order.customer_address}, ${order.customer_city}</p>
            ${neighbourName ? `<p>Fqinji: <strong>${neighbourName}</strong></p>` : ''}
            ${signature ? `<p>Firma:</p><img src="${signature}" style="max-width:200px;border:1px solid #ddd;border-radius:8px;" />` : ''}
            <p style="font-size:18px;font-weight:bold;color:${pref.color};">Totali: ${order.total?.toLocaleString()} L</p>
          </div>
        </div>`
      )

      // Buyer email
      if (order.customer_email) {
        let deliverySection = ''
        if (deliveryPref === 'delivered') {
          deliverySection = `<div style="background:#E1F5EE;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0;color:#0F6E56;font-size:14px;">✅ Porosia juaj u dorezua personalisht. Shpresojme ta gezoni!</p>
          </div>`
        } else if (deliveryPref === 'neighbour') {
          deliverySection = `<div style="background:#E6F1FB;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 8px;color:#185FA5;font-size:14px;font-weight:bold;">🏠 Porosia u la tek fqinji juaj</p>
            ${neighbourName ? `<p style="margin:0 0 8px;color:#185FA5;font-size:14px;">Emri i fqinjit: <strong>${neighbourName}</strong></p>` : ''}
            ${signature ? `<p style="margin:8px 0 4px;color:#185FA5;font-size:13px;">Firma e fqinjit:</p><img src="${signature}" style="max-width:200px;border:1px solid #ddd;border-radius:8px;" />` : ''}
            <p style="margin:8px 0 0;color:#185FA5;font-size:13px;">Ju lutem terhiqni porosine sa me shpejt.</p>
          </div>`
        } else if (deliveryPref === 'door') {
          deliverySection = `<div style="background:#FAEEDA;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0;color:#854F0B;font-size:14px;">📦 Porosia juaj u la para deres suaj. Ju lutem terhiqni sa me shpejt.</p>
          </div>`
        } else if (deliveryPref === 'failed') {
          deliverySection = `<div style="background:#FBEAF0;border-radius:10px;padding:16px;margin-bottom:20px;">
            <p style="margin:0 0 8px;color:#99355A;font-size:14px;font-weight:bold;">❌ Porosia nuk u dorezua</p>
            <p style="margin:0;color:#99355A;font-size:13px;">Shoferi nuk mundi te dorezoje. Do te kontaktoheni shpejt.</p>
          </div>`
        }

        await sendEmail(
          order.customer_email,
          `${pref.icon} ${pref.title} — Tregu #${order.id?.slice(0, 8)}`,
          `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F0EFEC;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
            <tr><td style="background:#1A1916;border-radius:12px 12px 0 0;padding:20px 24px;">
              <span style="background:#1D9E75;padding:6px 12px;border-radius:8px;color:#fff;font-weight:bold;font-size:18px;">T</span>
              <span style="color:#fff;font-size:20px;font-weight:bold;margin-left:10px;">tregu</span>
            </td></tr>
            <tr><td style="background:${pref.color};padding:16px 24px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:18px;font-weight:bold;">${pref.icon} ${pref.title}</p>
            </td></tr>
            <tr><td style="background:#fff;padding:24px;">
              <p style="font-size:15px;color:#1A1916;">Pershendetje <strong>${order.customer_name}</strong>,</p>
              ${deliverySection}
              <div style="background:#F7F6F3;border-radius:8px;padding:14px;margin-bottom:16px;">
                <p style="margin:0;font-size:12px;color:#9A9890;text-transform:uppercase;font-weight:bold;">Porosia</p>
                <p style="margin:4px 0 0;font-size:13px;color:#1A1916;">Nr: #${order.id?.slice(0, 8).toUpperCase()}</p>
                <p style="margin:3px 0 0;font-size:13px;color:#5C5A55;">Totali: ${order.total?.toLocaleString()} L</p>
              </div>
              ${deliveryPref !== 'failed' ? `
              <p style="font-size:14px;color:#5C5A55;margin-bottom:12px;">A e keni marre porosine?</p>
              <table width="100%"><tr>
                <td align="center" style="padding-bottom:10px;">
                  <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=yes" style="background:#1D9E75;color:#fff;padding:12px 32px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:bold;display:inline-block;">✓ Po, e kam!</a>
                </td>
              </tr><tr>
                <td align="center">
                  <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=no" style="color:#E24B4A;font-size:13px;text-decoration:none;">Jo, kam problem</a>
                </td>
              </tr></table>` : ''}
              <p style="font-size:12px;color:#9A9890;text-align:center;margin-top:20px;">info@tregu.store | tregu.store</p>
            </td></tr>
            <tr><td style="background:#1A1916;border-radius:0 0 12px 12px;padding:14px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">© 2026 Tregu.store</p>
            </td></tr>
          </table></td></tr></table></body></html>`
        )
      }

    } else if (type === 'customer_confirmed') {
      await sendEmail(
        ADMIN_EMAIL,
        `✅ Klienti konfirmoi — #${order.id?.slice(0, 8)}`,
        `<div style="font-family:sans-serif;padding:20px;max-width:500px;">
          <h2 style="color:#1D9E75;">Klienti konfirmoi marrjen!</h2>
          <p><strong>${order.customer_name}</strong> konfirmoi porosine <strong>#${order.id?.slice(0, 8)}</strong></p>
          <p>Totali: ${order.total?.toLocaleString()} L</p>
        </div>`
      )

    } else {
      // New order
      await sendEmail(
        ADMIN_EMAIL,
        `🛍️ Porosi e re — ${order.customer_name} — ${order.total?.toLocaleString()} L`,
        `<div style="font-family:sans-serif;max-width:600px;padding:20px;">
          <div style="background:#1A1916;padding:20px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;">🛍️ Porosi e re ne Tregu!</h2>
          </div>
          <div style="background:#F7F6F3;padding:20px;border-radius:0 0 12px 12px;">
            <p><strong>${order.customer_name}</strong></p>
            <p>📞 ${order.customer_phone}</p>
            <p>📍 ${order.customer_address}, ${order.customer_city}</p>
            ${order.notes ? `<p>📝 ${order.notes}</p>` : ''}
            <table width="100%" style="margin:16px 0;">${itemsRows}</table>
            <p style="font-size:20px;font-weight:bold;color:#1D9E75;">Totali: ${order.total?.toLocaleString()} L</p>
          </div>
        </div>`
      )

      if (order.customer_email) {
        await sendEmail(
          order.customer_email,
          `✅ Porosia juaj u konfirmua — Tregu #${order.id?.slice(0, 8)}`,
          `<!DOCTYPE html><html><body style="margin:0;padding:20px;background:#F0EFEC;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
            <tr><td style="background:#1A1916;border-radius:12px 12px 0 0;padding:20px 24px;">
              <span style="background:#1D9E75;padding:6px 12px;border-radius:8px;color:#fff;font-weight:bold;font-size:18px;">T</span>
              <span style="color:#fff;font-size:20px;font-weight:bold;margin-left:10px;">tregu</span>
            </td></tr>
            <tr><td style="background:#1D9E75;padding:16px 24px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:16px;font-weight:bold;">✓ Porosia juaj u konfirmua!</p>
            </td></tr>
            <tr><td style="background:#fff;padding:24px;">
              <p style="font-size:15px;">Pershendetje <strong>${order.customer_name}</strong>, faleminderit!</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="48%" style="background:#F7F6F3;border-radius:8px;padding:12px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;color:#9A9890;text-transform:uppercase;font-weight:bold;">Bleresi</p>
                    <p style="margin:0;font-size:13px;font-weight:bold;">${order.customer_name}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#5C5A55;">📞 ${order.customer_phone}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#5C5A55;">📍 ${order.customer_address}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#F7F6F3;border-radius:8px;padding:12px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:11px;color:#9A9890;text-transform:uppercase;font-weight:bold;">Porosia</p>
                    <p style="margin:0;font-size:13px;">#${order.id?.slice(0, 8).toUpperCase()}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#1D9E75;font-weight:bold;">Konfirmuar ✓</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#5C5A55;">Pagesa me dorezim 💵</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr style="background:#1A1916;">
                  <td style="padding:8px;font-size:11px;color:#fff;text-transform:uppercase;border-radius:6px 0 0 0;">Produkti</td>
                  <td style="padding:8px;font-size:11px;color:#fff;text-align:center;">Sasia</td>
                  <td style="padding:8px;font-size:11px;color:#fff;text-align:right;border-radius:0 6px 0 0;">Totali</td>
                </tr>
                ${itemsRows}
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td align="right">
                <table><tr>
                  <td style="font-size:13px;color:#5C5A55;padding:2px 12px 2px 0;">Nentotali:</td>
                  <td style="font-size:13px;font-weight:500;">${subtotal.toLocaleString()} L</td>
                </tr><tr>
                  <td style="font-size:13px;color:#5C5A55;padding:2px 12px 2px 0;">Dorezim:</td>
                  <td style="font-size:13px;font-weight:500;">${deliveryFee.toLocaleString()} L</td>
                </tr><tr>
                  <td style="font-size:13px;color:#5C5A55;padding:2px 12px 2px 0;">TVSH 20%:</td>
                  <td style="font-size:13px;font-weight:500;">${tvsh.toLocaleString()} L</td>
                </tr><tr><td colspan="2" style="padding-top:8px;">
                  <div style="background:#1A1916;border-radius:6px;padding:10px 16px;display:flex;justify-content:space-between;">
                    <span style="color:#fff;font-weight:bold;">TOTALI:</span>
                    <span style="color:#1D9E75;font-weight:bold;font-size:16px;">${order.total?.toLocaleString()} L</span>
                  </div>
                </td></tr></table>
              </td></tr></table>

              <div style="background:#E8F4FF;border-radius:10px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 10px;font-size:14px;font-weight:bold;">📦 Si preferoni dorezimin?</p>
                <table width="100%">
                  <tr><td style="padding-bottom:8px;"><a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=delivered" style="display:block;background:#1D9E75;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">✅ Dorezone personalisht tek une</a></td></tr>
                  <tr><td style="padding-bottom:8px;"><a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=neighbour" style="display:block;background:#378ADD;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">🏠 Mund ta lesh tek fqinji</a></td></tr>
                  <tr><td style="padding-bottom:8px;"><a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=door" style="display:block;background:#854F0B;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">📦 Mund ta lesh para deres</a></td></tr>
                  <tr><td><a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=reschedule" style="display:block;background:#E24B4A;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">📅 Riplanifico dorezimin</a></td></tr>
                </table>
              </div>

              <div style="text-align:center;margin-bottom:16px;">
                <a href="${SITE_URL}/orders" style="background:#1A1916;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;display:inline-block;">Gjurmo Porosine →</a>
              </div>
              <p style="font-size:12px;color:#9A9890;text-align:center;">info@tregu.store | tregu.store</p>
            </td></tr>
            <tr><td style="background:#1A1916;border-radius:0 0 12px 12px;padding:14px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">© 2026 Tregu.store</p>
            </td></tr>
          </table></td></tr></table></body></html>`
        )
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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

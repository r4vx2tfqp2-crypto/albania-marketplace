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

    const subtotal = order.items?.reduce((sum: number, i: any) => sum + (i.price * i.qty), 0) || 0
    const deliveryFee = 300
    const tvsh = Math.round(subtotal * 0.20)

    const itemsRows = order.items?.map((i: any) => `
      <tr>
        <td style="padding:10px 8px;font-size:13px;color:#1A1916;border-bottom:1px solid #F0EFEC;">${i.name}${i.size ? ` (${i.size})` : ''}</td>
        <td style="padding:10px 8px;font-size:13px;color:#5C5A55;text-align:center;border-bottom:1px solid #F0EFEC;">x${i.qty}</td>
        <td style="padding:10px 8px;font-size:13px;color:#1A1916;text-align:right;border-bottom:1px solid #F0EFEC;font-weight:600;">${(i.price * i.qty).toLocaleString()} L</td>
      </tr>`
    ).join('') || ''

    const results = []

    if (type === 'delivery_confirmed') {
      results.push(await sendEmail(
        ADMIN_EMAIL,
        `✅ Porosia u dorezua — ${order.customer_name} #${order.id?.slice(0, 8)}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1D9E75;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Porosia u dorezua!</h1>
          </div>
          <div style="background:#F7F6F3;padding:24px;border-radius:0 0 12px 12px;">
            <p style="font-size:15px;color:#1A1916;">Porosia <strong>#${order.id?.slice(0, 8)}</strong> u dorezua tek <strong>${order.customer_name}</strong></p>
            <p style="font-size:14px;color:#5C5A55;">Opsioni: ${order.delivery_preference || 'U dorezua'}</p>
            <div style="background:#1D9E75;padding:14px;border-radius:8px;text-align:center;margin-top:16px;">
              <p style="margin:0;color:#fff;font-size:18px;font-weight:bold;">Totali: ${order.total?.toLocaleString()} L</p>
            </div>
          </div>
        </div>`
      ))

      if (order.customer_email) {
        results.push(await sendEmail(
          order.customer_email,
          `📦 Porosia juaj ka arritur! — Tregu #${order.id?.slice(0, 8)}`,
          `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F0EFEC;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <tr><td style="background:#1A1916;border-radius:12px 12px 0 0;padding:24px 28px;">
                  <table width="100%"><tr>
                    <td><table cellpadding="0" cellspacing="0"><tr>
                      <td style="background:#1D9E75;width:36px;height:36px;border-radius:8px;text-align:center;line-height:36px;font-weight:bold;color:#fff;font-size:18px;">T</td>
                      <td style="padding-left:10px;color:#fff;font-size:22px;font-weight:bold;vertical-align:middle;">tregu</td>
                    </tr></table></td>
                  </tr></table>
                </td></tr>
                <tr><td style="background:#1D9E75;padding:16px 28px;text-align:center;">
                  <p style="margin:0;color:#fff;font-size:16px;font-weight:bold;">📦 Porosia juaj ka arritur!</p>
                </td></tr>
                <tr><td style="background:#fff;padding:28px;">
                  <p style="font-size:15px;color:#1A1916;">Pershendetje <strong>${order.customer_name}</strong>,</p>
                  <p style="font-size:14px;color:#5C5A55;">Porosia juaj eshte shënuar si e dorezuar. A e morrët?</p>
                  <table width="100%" style="margin:20px 0;"><tr>
                    <td align="center" style="padding-bottom:12px;">
                      <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=yes" style="background:#1D9E75;color:#fff;padding:14px 40px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:bold;display:inline-block;">✓ Po, e mora!</a>
                    </td>
                  </tr><tr>
                    <td align="center">
                      <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=no" style="color:#E24B4A;font-size:14px;text-decoration:none;">Jo, kam nje problem</a>
                    </td>
                  </tr></table>
                  <p style="font-size:12px;color:#9A9890;text-align:center;">Faleminderit qe blini ne tregu.store</p>
                </td></tr>
                <tr><td style="background:#1A1916;border-radius:0 0 12px 12px;padding:16px 28px;text-align:center;">
                  <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">© 2026 Tregu.store</p>
                </td></tr>
              </table>
            </td></tr>
          </table></body></html>`
        ))
      }

    } else if (type === 'customer_confirmed') {
      results.push(await sendEmail(
        ADMIN_EMAIL,
        `✅ Klienti konfirmoi marrjen — #${order.id?.slice(0, 8)}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1D9E75;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Klienti konfirmoi!</h1>
          </div>
          <div style="background:#F7F6F3;padding:24px;">
            <p style="font-size:15px;color:#1A1916;"><strong>${order.customer_name}</strong> konfirmoi marrjen e porosise <strong>#${order.id?.slice(0, 8)}</strong></p>
            <p style="font-size:14px;color:#5C5A55;">Totali: ${order.total?.toLocaleString()} L</p>
          </div>
        </div>`
      ))

    } else if (type === 'set_preference') {
      // Buyer set delivery preference - just update noted
      results.push({ success: true, message: 'Preference noted' })

    } else {
      // New order
      results.push(await sendEmail(
        ADMIN_EMAIL,
        `🛍️ Porosi e re — ${order.customer_name} — ${order.total?.toLocaleString()} L`,
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
              ${order.notes ? `<p style="margin:4px 0;color:#5C5A55;">📝 ${order.notes}</p>` : ''}
            </div>
            <div style="background:#1D9E75;padding:16px;border-radius:8px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:20px;font-weight:bold;">Totali: ${order.total?.toLocaleString()} L</p>
            </div>
            <div style="margin-top:16px;text-align:center;">
              <a href="${SITE_URL}/admin" style="background:#1A1916;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">Shiko ne Admin Panel</a>
            </div>
          </div>
        </div>`
      ))

      if (order.customer_email) {
        results.push(await sendEmail(
          order.customer_email,
          `✅ Porosia juaj u konfirmua — Tregu #${order.id?.slice(0, 8)}`,
          `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F0EFEC;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
                <tr><td style="background:#1A1916;border-radius:12px 12px 0 0;padding:24px 28px;">
                  <table width="100%"><tr>
                    <td><table cellpadding="0" cellspacing="0"><tr>
                      <td style="background:#1D9E75;width:36px;height:36px;border-radius:8px;text-align:center;line-height:36px;font-weight:bold;color:#fff;font-size:18px;">T</td>
                      <td style="padding-left:10px;color:#fff;font-size:22px;font-weight:bold;vertical-align:middle;">tregu</td>
                    </tr></table></td>
                    <td align="right">
                      <p style="margin:0;color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;">FATURE</p>
                      <p style="margin:4px 0 0;color:#fff;font-size:14px;font-weight:bold;">#${order.id?.slice(0, 8).toUpperCase()}</p>
                    </td>
                  </tr></table>
                </td></tr>
                <tr><td style="background:#1D9E75;padding:16px 28px;text-align:center;">
                  <p style="margin:0;color:#fff;font-size:16px;font-weight:bold;">✓ Porosia juaj u konfirmua!</p>
                </td></tr>
                <tr><td style="background:#fff;padding:28px;">
                  <p style="font-size:15px;color:#1A1916;margin:0 0 20px;">Pershendetje <strong>${order.customer_name}</strong>, faleminderit per porosine!</p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr>
                      <td width="48%" style="background:#F7F6F3;border-radius:8px;padding:14px;vertical-align:top;">
                        <p style="margin:0 0 6px;font-size:11px;color:#9A9890;text-transform:uppercase;font-weight:bold;">BLERESI</p>
                        <p style="margin:0;font-size:13px;color:#1A1916;font-weight:bold;">${order.customer_name}</p>
                        <p style="margin:3px 0 0;font-size:12px;color:#5C5A55;">📞 ${order.customer_phone}</p>
                        <p style="margin:3px 0 0;font-size:12px;color:#5C5A55;">📍 ${order.customer_address}, ${order.customer_city}</p>
                      </td>
                      <td width="4%"></td>
                      <td width="48%" style="background:#F7F6F3;border-radius:8px;padding:14px;vertical-align:top;">
                        <p style="margin:0 0 6px;font-size:11px;color:#9A9890;text-transform:uppercase;font-weight:bold;">POROSIA</p>
                        <p style="margin:0;font-size:12px;color:#5C5A55;">Nr: <strong>#${order.id?.slice(0, 8).toUpperCase()}</strong></p>
                        <p style="margin:3px 0 0;font-size:12px;color:#5C5A55;">Pagesa: Me dorezim 💵</p>
                        <p style="margin:3px 0 0;font-size:12px;color:#1D9E75;font-weight:bold;">Statusi: Konfirmuar ✓</p>
                      </td>
                    </tr>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                    <tr style="background:#1A1916;">
                      <td style="padding:10px 8px;font-size:11px;color:#fff;text-transform:uppercase;border-radius:6px 0 0 0;">Produkti</td>
                      <td style="padding:10px 8px;font-size:11px;color:#fff;text-align:center;">Sasia</td>
                      <td style="padding:10px 8px;font-size:11px;color:#fff;text-align:right;border-radius:0 6px 0 0;">Totali</td>
                    </tr>
                    ${itemsRows}
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr><td align="right">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size:13px;color:#5C5A55;padding:3px 16px 3px 0;">Nentotali:</td>
                          <td style="font-size:13px;color:#1A1916;font-weight:500;min-width:80px;text-align:right;">${subtotal.toLocaleString()} L</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:#5C5A55;padding:3px 16px 3px 0;">Tarifa e dorezimit:</td>
                          <td style="font-size:13px;color:#1A1916;font-weight:500;text-align:right;">${deliveryFee.toLocaleString()} L</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:#5C5A55;padding:3px 16px 3px 0;">TVSH 20%:</td>
                          <td style="font-size:13px;color:#1A1916;font-weight:500;text-align:right;">${tvsh.toLocaleString()} L</td>
                        </tr>
                        <tr><td colspan="2" style="padding-top:8px;">
                          <table width="100%"><tr><td style="background:#1A1916;border-radius:6px;padding:10px 16px;">
                            <table width="100%"><tr>
                              <td style="color:#fff;font-size:14px;font-weight:bold;">TOTALI:</td>
                              <td style="color:#1D9E75;font-size:16px;font-weight:bold;text-align:right;">${order.total?.toLocaleString()} L</td>
                            </tr></table>
                          </td></tr></table>
                        </td></tr>
                      </table>
                    </td></tr>
                  </table>

                  <div style="background:#E8F4FF;border-radius:10px;padding:16px;margin-bottom:20px;">
                    <p style="margin:0 0 10px;font-size:14px;color:#1A1916;font-weight:bold;">📦 Si preferoni dorezimin?</p>
                    <p style="margin:0 0 12px;font-size:13px;color:#5C5A55;">Klikoni opsionin tuaj preferues — shoferi do te informohet:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding-bottom:8px;">
                        <a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=delivered" style="display:block;background:#1D9E75;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">✅ Dorezone personalisht tek une</a>
                      </td></tr>
                      <tr><td style="padding-bottom:8px;">
                        <a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=neighbour" style="display:block;background:#378ADD;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">🏠 Mund ta lesh tek fqinji</a>
                      </td></tr>
                      <tr><td style="padding-bottom:8px;">
                        <a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=door" style="display:block;background:#854F0B;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">📦 Mund ta lesh para deres</a>
                      </td></tr>
                      <tr><td>
                        <a href="${SITE_URL}/confirm-delivery?order=${order.id}&preference=reschedule" style="display:block;background:#E24B4A;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">📅 Riplanifico dorezimin</a>
                      </td></tr>
                    </table>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                    <tr><td align="center">
                      <a href="${SITE_URL}/orders" style="background:#1A1916;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;display:inline-block;">Gjurmo Porosine →</a>
                    </td></tr>
                  </table>

                  <p style="font-size:12px;color:#9A9890;">Per cdo pyetje: <a href="mailto:info@tregu.store" style="color:#1D9E75;">info@tregu.store</a></p>
                </td></tr>
                <tr><td style="background:#1A1916;border-radius:0 0 12px 12px;padding:16px 28px;text-align:center;">
                  <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">© 2026 Tregu.store — Platforma e pare shqiptare e tregtise elektronike</p>
                </td></tr>
              </table>
            </td></tr>
          </table></body></html>`
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

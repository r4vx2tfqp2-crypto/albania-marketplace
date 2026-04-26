import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SITE_URL = 'https://albania-marketplace.vercel.app'

serve(async (req) => {
  try {
    const body = await req.text()
    if (!body) return new Response(JSON.stringify({ error: 'Empty body' }), { status: 400 })

    const { order, type } = JSON.parse(body)
    if (!order) return new Response(JSON.stringify({ error: 'No order data' }), { status: 400 })

    const itemsList = order.items?.map((i: any) =>
      `• ${i.name} ${i.size ? `(${i.size})` : ''} x${i.qty} — ${i.price?.toLocaleString()} L`
    ).join('<br>') || 'No items'

    const emails = []

    if (type === 'delivery_confirmed') {
      // Email 1: Admin notification
      emails.push({
        from: 'Tregu <onboarding@resend.dev>',
        to: 'julsina76@gmail.com',
        subject: `✅ Order delivered — ${order.customer_name} — #${order.id?.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1D9E75; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">✅ Order Delivered!</h1>
            </div>
            <div style="background: #F7F6F3; padding: 24px; border-radius: 0 0 12px 12px;">
              <h2 style="font-size: 18px; margin: 0 0 16px;">Order #${order.id?.slice(0, 8)} delivered</h2>
              <div style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 4px 0;"><strong>${order.customer_name}</strong></p>
                <p style="margin: 4px 0; color: #5C5A55;">📞 ${order.customer_phone}</p>
                <p style="margin: 4px 0; color: #5C5A55;">📍 ${order.customer_address}, ${order.customer_city}</p>
              </div>
              <div style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 14px;">${itemsList}</p>
              </div>
              <div style="background: #1D9E75; padding: 16px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #fff; font-size: 20px; font-weight: bold;">Total: ${order.total?.toLocaleString()} L</p>
              </div>
              <div style="margin-top: 16px; text-align: center;">
                <a href="${SITE_URL}/admin" style="background: #1A1916; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">View in Admin Panel →</a>
              </div>
            </div>
          </div>
        `
      })

      // Email 2: Customer confirmation request
      if (order.customer_email) {
        emails.push({
          from: 'Tregu <onboarding@resend.dev>',
          to: order.customer_email,
          subject: `Did you receive your order? — Tregu #${order.id?.slice(0, 8)}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1A1916; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">📦 Your order has arrived!</h1>
              </div>
              <div style="background: #F7F6F3; padding: 24px; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #1A1916; margin-bottom: 16px;">Hi <strong>${order.customer_name}</strong>,</p>
                <p style="font-size: 15px; color: #5C5A55; margin-bottom: 24px;">Your order #${order.id?.slice(0, 8)} has been marked as delivered. Did you receive it?</p>
                
                <div style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 14px; color: #1A1916;">${itemsList}</p>
                  <div style="border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px;">
                    <strong>Total: ${order.total?.toLocaleString()} L</strong>
                  </div>
                </div>

                <div style="text-align: center; margin-bottom: 16px;">
                  <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=yes" 
                    style="background: #1D9E75; color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
                    ✓ Yes, I received it!
                  </a>
                </div>

                <div style="text-align: center;">
                  <a href="${SITE_URL}/confirm-delivery?order=${order.id}&confirm=no" 
                    style="color: #E24B4A; font-size: 14px; text-decoration: none;">
                    ✕ No, I have a problem
                  </a>
                </div>

                <p style="font-size: 12px; color: #9A9890; margin-top: 24px; text-align: center;">
                  Thank you for shopping on Tregu — Albania's marketplace
                </p>
              </div>
            </div>
          `
        })
      }

    } else {
      // New order email to admin
      emails.push({
        from: 'Tregu <onboarding@resend.dev>',
        to: 'julsina76@gmail.com',
        subject: `🛍️ New order — ${order.customer_name} — ${order.total?.toLocaleString()} L`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1A1916; padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">🛍️ New Order on Tregu!</h1>
            </div>
            <div style="background: #F7F6F3; padding: 24px; border-radius: 0 0 12px 12px;">
              <h2 style="font-size: 18px; margin: 0 0 16px;">Order #${order.id?.slice(0, 8)}</h2>
              <div style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 4px 0;"><strong>${order.customer_name}</strong></p>
                <p style="margin: 4px 0; color: #5C5A55;">📞 ${order.customer_phone}</p>
                <p style="margin: 4px 0; color: #5C5A55;">📍 ${order.customer_address}, ${order.customer_city}</p>
                ${order.notes ? `<p style="margin: 4px 0; color: #5C5A55;">📝 ${order.notes}</p>` : ''}
              </div>
              <div style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 14px;">${itemsList}</p>
              </div>
              <div style="background: #1D9E75; padding: 16px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #fff; font-size: 20px; font-weight: bold;">Total: ${order.total?.toLocaleString()} L</p>
                <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 13px;">Cash on delivery</p>
              </div>
              <div style="margin-top: 16px; text-align: center;">
                <a href="${SITE_URL}/admin" style="background: #1A1916; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">View in Admin Panel →</a>
              </div>
            </div>
          </div>
        `
      })
    }

    // Send all emails
    const results = await Promise.all(
      emails.map(email =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(email),
        }).then(r => r.json())
      )
    )

    console.log('Emails sent:', JSON.stringify(results))

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
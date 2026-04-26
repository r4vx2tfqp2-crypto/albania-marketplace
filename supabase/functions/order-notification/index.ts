import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { order } = await req.json()

  const itemsList = order.items?.map((i: any) => 
    `• ${i.name} ${i.size ? `(${i.size})` : ''} x${i.qty} — ${i.price?.toLocaleString()} L`
  ).join('\n') || 'No items'

  // Email to you (admin)
  const adminEmail = {
    from: 'Tregu <notifications@tregu.al>',
    to: 'julsina76@gmail.com',
    subject: `🛍️ New order — ${order.customer_name} — ${order.total?.toLocaleString()} L`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1A1916; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">🛍️ New Order!</h1>
        </div>
        <div style="background: #F7F6F3; padding: 24px; border-radius: 0 0 12px 12px;">
          <h2 style="font-size: 18px; margin: 0 0 16px;">Order #${order.id?.slice(0, 8)}</h2>
          
          <div style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; color: #9A9890;">CUSTOMER</h3>
            <p style="margin: 4px 0;"><strong>${order.customer_name}</strong></p>
            <p style="margin: 4px 0; color: #5C5A55;">📞 ${order.customer_phone}</p>
            <p style="margin: 4px 0; color: #5C5A55;">📍 ${order.customer_address}, ${order.customer_city}</p>
            ${order.notes ? `<p style="margin: 4px 0; color: #5C5A55;">📝 ${order.notes}</p>` : ''}
          </div>

          <div style="background: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; color: #9A9890;">ITEMS</h3>
            <pre style="margin: 0; font-family: sans-serif; font-size: 14px; color: #1A1916;">${itemsList}</pre>
          </div>

          <div style="background: #1D9E75; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #fff; font-size: 20px; font-weight: bold;">Total: ${order.total?.toLocaleString()} L</p>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 13px;">Cash on delivery</p>
          </div>

          <div style="margin-top: 16px; text-align: center;">
            <a href="https://albania-marketplace.vercel.app/admin" style="background: #1A1916; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
              View in Admin Panel →
            </a>
          </div>
        </div>
      </div>
    `
  }

  // Send admin email
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adminEmail),
  })

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
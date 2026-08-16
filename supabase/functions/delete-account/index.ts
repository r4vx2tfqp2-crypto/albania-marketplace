// Replaces the client-side "delete account" flow (client/src/pages/Settings.jsx),
// which only deleted the user's products/shops rows and then just signed
// out -- the Supabase Auth user itself was never removed (client code has
// no access to the admin API needed for that), so the login still worked
// and order/review history was untouched. Deleting the auth user requires
// the service-role key, so this has to happen server-side.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

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

  // Identify the caller from their own JWT (never trust a client-supplied
  // user id) -- a plain anon-key client scoped to this request's token.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await callerClient.auth.getUser()
  if (authError || !user) return json({ error: 'Not authenticated' }, 401)

  const uid = user.id

  // Products and shops: fully remove, same as the previous client-side
  // behaviour.
  await supabaseAdmin.from('products').delete().eq('user_id', uid)
  await supabaseAdmin.from('shops').delete().eq('user_id', uid)

  // Reviews: fully remove the account's own reviews.
  await supabaseAdmin.from('reviews').delete().eq('buyer_id', uid)

  // Orders: unlink from the account rather than delete outright -- sellers'
  // order/accounting records for real transactions shouldn't disappear
  // retroactively just because the buyer deleted their account.
  await supabaseAdmin.from('orders').update({ buyer_id: null }).eq('buyer_id', uid)

  // Finally remove the actual login -- this is the step the client could
  // never do on its own.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid)
  if (deleteError) return json({ error: deleteError.message }, 500)

  return json({ success: true })
})

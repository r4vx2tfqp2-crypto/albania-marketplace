// Buyer-facing natural-language search: takes a free-text query like
// "lekure e zeze per dimer nen 5000 leke" and returns matching product IDs,
// ranked by relevance, instead of requiring exact keyword matches. Called
// from client/src/pages/Search.jsx's AI search mode.
//
// No login required -- most buyers browse as guests, and this never
// touches anything but public product data. Sends the model a compact
// summary of the current catalog (id/name/category/price/details) rather
// than running a separate vector/embeddings pipeline: at this catalog
// size that's simpler and cheap enough, and avoids standing up infra this
// small marketplace doesn't need yet. Capped to the most recent 300
// in-stock products so a single search stays a bounded, predictable request
// -- if the catalog grows well past that, this cap (and the "most recent"
// ordering it's built on) needs revisiting so older/long-tail listings
// don't become permanently unsearchable by AI search.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const CATALOG_LIMIT = 300

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

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const query = String(body?.query || '').trim().slice(0, 300)
  if (!query) return json({ error: 'query is required' }, 400)

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, category, price, sizes, details, in_stock')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(CATALOG_LIMIT)

  if (error) return json({ error: 'Could not load catalog' }, 500)
  if (!products || products.length === 0) return json({ productIds: [] })

  // Compact one-line-per-product catalog listing -- keeps token usage
  // bounded and avoids sending full descriptions/images the model doesn't
  // need to match against a search query.
  const catalogDoc = products.map(p => {
    const details = p.details && typeof p.details === 'object'
      ? Object.entries(p.details).filter(([k]) => k !== 'colors').map(([k, v]) => `${k}=${v}`).join(', ')
      : ''
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? ` madhesite=[${p.sizes.join(',')}]` : ''
    return `${p.id} :: ${p.name} :: kategoria=${p.category} :: cmimi=${p.price}L${sizes}${details ? ` :: ${details}` : ''}`
  }).join('\n')

  const promptText =
    `Ti je motori i kerkimit i nje tregu online shqiptar. Perdoruesi ka shkruar kete kerkim ` +
    `ne gjuhe natyrale: "${query}"\n\nMe poshte eshte katalogu i produkteve (id :: emri :: kategoria :: cmimi :: detaje):\n` +
    `${catalogDoc}\n\nKthe listen e ID-ve te produkteve qe permbushin me mire kerkimin, te renditura nga me ` +
    `relevanti tek me pak relevanti. Merr parasysh kuptimin (p.sh. "per dimer" -> sezoni=Dimer, "nen X leke" ` +
    `-> cmimi < X, "lekure" -> materiali qe permban lekure, etj). Perfshi vetem produkte qe realisht perputhen; ` +
    `nese asnje nuk perputhet, kthe nje liste bosh.`

  const tool = {
    name: 'submit_results',
    description: 'Submit the ranked list of matching product IDs.',
    input_schema: {
      type: 'object',
      properties: {
        productIds: { type: 'array', items: { type: 'string' }, description: 'Product IDs, most relevant first' },
      },
      required: ['productIds'],
    },
  }

  let aiRes: Response
  try {
    aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: promptText }],
        tools: [tool],
        tool_choice: { type: 'tool', name: 'submit_results' },
      }),
    })
  } catch {
    return json({ error: 'AI request failed' }, 502)
  }

  if (!aiRes.ok) {
    const errText = await aiRes.text().catch(() => '')
    console.error('Anthropic error', aiRes.status, errText)
    return json({ error: 'AI request failed' }, 502)
  }

  const aiJson = await aiRes.json()
  const toolUse = aiJson?.content?.find((b: any) => b.type === 'tool_use' && b.name === 'submit_results')
  if (!toolUse) return json({ error: 'AI returned no result' }, 502)

  // Only return IDs that are actually in the catalog we sent -- the model
  // shouldn't be able to invent one, and this is a cheap, free safety net.
  const validIds = new Set(products.map(p => p.id))
  const productIds = (toolUse.input?.productIds || []).filter((id: unknown) => typeof id === 'string' && validIds.has(id))

  return json({ productIds })
})

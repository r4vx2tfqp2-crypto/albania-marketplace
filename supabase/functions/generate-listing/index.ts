// Seller-facing AI helper: given a product name, category, and (usually) a
// photo, generates a sales-ready Albanian description plus a best guess at
// that category's spec fields (brand, material, condition, etc.). Called
// from client/src/pages/AddProduct.jsx and EditProduct.jsx's "Gjenero me
// AI" button -- the seller always reviews/edits the result before it's
// saved, this never writes to the DB itself.
//
// Requires the caller to be a logged-in user (checked below) so this can't
// be hit anonymously and run up API cost for free -- it doesn't need to
// verify shop ownership beyond that, since it's called before the product
// even exists (both on create and while editing) and never touches the DB.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Trimmed mirror of client/src/data/productCategoryData.js's CATEGORY_DETAILS
// -- just enough (key/label/type/options) to steer the model's output field
// names and, for select fields, keep it to a real option instead of
// inventing new ones. Kept in sync by hand; if a category or field is added
// on the client, add it here too so AI-filled fields actually match what
// the form can display.
const CATEGORY_DETAILS: Record<string, { key: string; label: string; type?: string; options?: string[] }[]> = {
  shoes: [
    { key: 'brand', label: 'Marka' },
    { key: 'model', label: 'Modeli' },
    { key: 'material', label: 'Materiali' },
    { key: 'gender', label: 'Gjinia', type: 'select', options: ['Burra', 'Gra', 'Femije Djale', 'Femije Vajze', 'Unisex'] },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri me etikete', 'I ri pa etikete', 'Si i ri', 'I perdorur mire', 'I perdorur'] },
    { key: 'sole', label: 'Sholla' },
    { key: 'closure', label: 'Mbyllja', type: 'select', options: ['Lidhese', 'Velcro', 'Rreshqitese', 'Pa mbyllje'] },
    { key: 'season', label: 'Sezoni', type: 'select', options: ['Te gjitha stinet', 'Vere', 'Dimer', 'Pranvere/Vjeshte'] },
    { key: 'country', label: 'Vendi i prodhimit' },
  ],
  clothes: [
    { key: 'brand', label: 'Marka' },
    { key: 'material', label: 'Materiali' },
    { key: 'gender', label: 'Gjinia', type: 'select', options: ['Burra', 'Gra', 'Femije Djale', 'Femije Vajze', 'Unisex'] },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri me etikete', 'I ri pa etikete', 'Si i ri', 'I perdorur mire', 'I perdorur'] },
    { key: 'fit', label: 'Forma', type: 'select', options: ['Regular', 'Slim Fit', 'Oversized', 'Loose', 'Skinny'] },
    { key: 'season', label: 'Sezoni', type: 'select', options: ['Te gjitha stinet', 'Vere', 'Dimer', 'Pranvere/Vjeshte'] },
    { key: 'care', label: 'Kujdesi' },
    { key: 'country', label: 'Vendi i prodhimit' },
  ],
  electronics: [
    { key: 'brand', label: 'Marka' },
    { key: 'model', label: 'Modeli' },
    { key: 'storage', label: 'Kapaciteti' },
    { key: 'ram', label: 'RAM' },
    { key: 'processor', label: 'Procesori' },
    { key: 'screen', label: 'Ekrani' },
    { key: 'battery', label: 'Bateria' },
    { key: 'camera', label: 'Kamera' },
    { key: 'connectivity', label: 'Lidhshmeria' },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri me kuti', 'I ri pa kuti', 'I rinovuar', 'I perdorur mire', 'I perdorur'] },
    { key: 'warranty', label: 'Garancia' },
    { key: 'accessories', label: 'Aksesore te perfshire' },
    { key: 'country', label: 'Vendi i prodhimit' },
  ],
  beauty: [
    { key: 'brand', label: 'Marka' },
    { key: 'product_type', label: 'Lloji i produktit', type: 'select', options: ['Fondante', 'Buzekuq', 'Maskara', 'Hije sysh', 'Parfum', 'Krem', 'Serum', 'Shampo', 'Kondicionues', 'Lak thonjsh', 'Bronzer', 'Blush', 'Primer', 'Concealer', 'Toner', 'Moisturizer'] },
    { key: 'volume', label: 'Volumi/Sasia' },
    { key: 'skin_type', label: 'Tipi i lekures', type: 'select', options: ['Te gjitha tipet', 'Lekure e thate', 'Lekure yndyrore', 'Lekure e kombinuar', 'Lekure e ndjeshme', 'Lekure normale'] },
    { key: 'ingredients', label: 'Perberesit kryesore' },
    { key: 'finish', label: 'Finish', type: 'select', options: ['Mat', 'Shkellqyes', 'Saten', 'Natyral'] },
    { key: 'spf', label: 'SPF' },
    { key: 'origin', label: 'Origjina' },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri i pahapur', 'I ri i hapur', 'I perdorur pak'] },
  ],
  home: [
    { key: 'brand', label: 'Marka' },
    { key: 'furniture_type', label: 'Lloji', type: 'select', options: ['Divan/Sofa', 'Karrige', 'Tavoline', 'Krevat', 'Dollap', 'Raft', 'Komode', 'Pasqyre', 'Llamba', 'Tapete', 'Perde', 'Jasteke', 'Takeme kuzhine', 'Dekor'] },
    { key: 'material', label: 'Materiali' },
    { key: 'dimensions', label: 'Permasat (GxLxA)' },
    { key: 'weight', label: 'Pesha' },
    { key: 'assembly', label: 'Montimi', type: 'select', options: ['Gati per perdorim', 'Kerkon montim', 'Montim i lehte'] },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri ne kuti', 'I ri pa kuti', 'Si i ri', 'I perdorur mire', 'I perdorur'] },
    { key: 'room', label: 'Dhoma', type: 'select', options: ['Dhome ndenje', 'Dhome gjumi', 'Kuzhine', 'Banjo', 'Ballkon', 'Zyre', 'Dhome femijesh'] },
    { key: 'style', label: 'Stili', type: 'select', options: ['Modern', 'Klasik', 'Skandinav', 'Industrial', 'Rustik', 'Minimal'] },
  ],
  sports: [
    { key: 'brand', label: 'Marka' },
    { key: 'sport_type', label: 'Sporti' },
    { key: 'product_type', label: 'Lloji i produktit' },
    { key: 'material', label: 'Materiali' },
    { key: 'gender', label: 'Gjinia', type: 'select', options: ['Burra', 'Gra', 'Femije', 'Unisex'] },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri me etikete', 'I ri pa etikete', 'Si i ri', 'I perdorur mire'] },
    { key: 'level', label: 'Niveli', type: 'select', options: ['Fillestar', 'Mesem', 'Profesionist'] },
  ],
  construction: [
    { key: 'brand', label: 'Marka' },
    { key: 'product_type', label: 'Lloji i produktit' },
    { key: 'power', label: 'Fuqia' },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri ne kuti', 'I ri pa kuti', 'Si i ri', 'I perdorur mire', 'I perdorur'] },
    { key: 'material', label: 'Materiali' },
    { key: 'dimensions', label: 'Permasat/Kapaciteti' },
    { key: 'warranty', label: 'Garancia' },
    { key: 'accessories', label: 'Aksesore te perfshire' },
  ],
  gifts: [
    { key: 'occasion', label: 'Rasti' },
    { key: 'recipient', label: 'Per kend' },
    { key: 'material', label: 'Materiali' },
    { key: 'dimensions', label: 'Permasat' },
    { key: 'includes', label: 'Perfshine' },
    { key: 'condition', label: 'Gjendja', type: 'select', options: ['I ri', 'Si i ri'] },
  ],
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: { user: caller }, error: authError } = await callerClient.auth.getUser()
  if (authError || !caller) return json({ error: 'Not authenticated' }, 401)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const name = String(body?.name || '').slice(0, 200)
  const category = String(body?.category || '')
  const existingDescription = String(body?.existingDescription || '').slice(0, 1000)
  const imageBase64: string | undefined = body?.imageBase64 // data URI, e.g. "data:image/jpeg;base64,...."

  const fields = CATEGORY_DETAILS[category]
  if (!name || !fields) return json({ error: 'name and a valid category are required' }, 400)

  const fieldsDoc = fields.map(f =>
    f.type === 'select' ? `- ${f.key} ("${f.label}"): one of [${f.options!.join(', ')}]` : `- ${f.key} ("${f.label}"): short free text`
  ).join('\n')

  const promptText =
    `Je nje asistent qe ndihmon shitesit ne nje treg online shqiptar (Tregu.store) te ` +
    `plotesojne listimin e nje produkti. Emri i produktit: "${name}". Kategoria: "${category}".` +
    (existingDescription ? ` Shenime nga shitesi: "${existingDescription}".` : '') +
    `\n\nShkruaj nje pershkrim tërheqës shitjeje ne shqip (2-4 fjali, ton natyral, jo i teprume) ` +
    `dhe plotëso çdo fushe specifikimi qe mund ta percaktosh me besim nga emri/foto -- lëri bosh ` +
    `(mos e perfshi ne objekt) çdo fushe qe nuk mund ta dish me siguri. Fushat e mundshme:\n${fieldsDoc}` +
    `\n\nPer fushat e tipit "one of [...]" duhet te perdoresh SAKTESISHT nje nga opsionet e dhena, fjale per fjale.`

  const content: any[] = [{ type: 'text', text: promptText }]
  if (imageBase64 && imageBase64.startsWith('data:')) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
    if (match) {
      content.unshift({ type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } })
    }
  }

  const tool = {
    name: 'submit_listing',
    description: 'Submit the generated product description and spec fields.',
    input_schema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Albanian sales description, 2-4 sentences' },
        details: {
          type: 'object',
          description: 'Only include keys you can confidently fill in',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['description', 'details'],
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
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
        tools: [tool],
        tool_choice: { type: 'tool', name: 'submit_listing' },
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
  const toolUse = aiJson?.content?.find((b: any) => b.type === 'tool_use' && b.name === 'submit_listing')
  if (!toolUse) return json({ error: 'AI returned no result' }, 502)

  // Drop any key the model returned that isn't a real field for this
  // category (or an empty value) instead of trusting it blindly -- keeps
  // the client from ever writing an unknown key into `details`.
  const validKeys = new Set(fields.map(f => f.key))
  const rawDetails = toolUse.input?.details || {}
  const details: Record<string, string> = {}
  for (const [k, v] of Object.entries(rawDetails)) {
    if (validKeys.has(k) && typeof v === 'string' && v.trim()) details[k] = v.trim()
  }

  return json({ description: String(toolUse.input?.description || '').trim(), details })
})

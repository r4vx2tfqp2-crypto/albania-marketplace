import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://onngupovxaequeqplikx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubmd1cG92eGFlcXVlcXBsaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUzODUsImV4cCI6MjA5MjczMTM4NX0.aTiKdVjl02JenqpQzbg2qcniscHMJyml9LMdmRsqqKg';
const SITE = 'https://www.tregu.store';

// Runs at build time (see vercel.json buildCommand) so the sitemap always
// reflects the current catalog instead of the static file this replaced,
// which only listed static pages -- individual products/shops (the actual
// sellable inventory, and the highest search-intent pages) were never
// discoverable via sitemap at all.
const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/search', changefreq: 'daily', priority: '0.9' },
  { loc: '/legal', changefreq: 'monthly', priority: '0.3' },
];

// Matches the category keys used by client/src/pages/Search.jsx and the
// middleware's per-category bot responses.
const CATEGORIES = ['shoes', 'clothes', 'electronics', 'beauty', 'home', 'sports', 'gifts'];
const CATEGORY_PAGES = CATEGORIES.map(c => ({
  loc: `/search?category=${c}`,
  changefreq: 'daily',
  priority: '0.7',
}));

async function fetchProducts() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id,created_at&order=created_at.desc&limit=10000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch products for sitemap:', err.message);
    return [];
  }
}

// Only approved shops are publicly visible (matches the "Public read shops"
// RLS policy) -- a pending/rejected shop's page isn't reachable by a normal
// visitor and shouldn't be offered to crawlers.
async function fetchShops() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shops?status=eq.approved&select=id,created_at&limit=10000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch shops for sitemap:', err.message);
    return [];
  }
}

function toXml(entries) {
  const rows = entries.map(({ loc, changefreq, priority, lastmod }) => {
    const lastmodLine = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
    return `  <url>\n    <loc>${SITE}${loc}</loc>${lastmodLine}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>`;
}

async function main() {
  const [products, shops] = await Promise.all([fetchProducts(), fetchShops()]);

  const productEntries = products.map(p => ({
    loc: `/product/${p.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: p.created_at ? p.created_at.split('T')[0] : undefined,
  }));

  const shopEntries = shops.map(s => ({
    loc: `/shop/${s.id}`,
    changefreq: 'weekly',
    priority: '0.6',
    lastmod: s.created_at ? s.created_at.split('T')[0] : undefined,
  }));

  const all = [...STATIC_PAGES, ...CATEGORY_PAGES, ...productEntries, ...shopEntries];
  const xml = toXml(all);

  const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`✅ Sitemap: ${all.length} URLs (${productEntries.length} products, ${shopEntries.length} shops) → ${outPath}`);
}

main();

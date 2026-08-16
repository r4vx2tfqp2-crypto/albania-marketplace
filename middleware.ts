// Vercel Routing Middleware — runs before static file serving, works
// regardless of the app framework (this is a plain Vite/React SPA, not
// Next.js). tregu.store is a pure client-side SPA: vercel.json rewrites
// every path to the same client/dist/index.html, whose <head> is static.
// That means every route -- homepage, /search, every /product/:id, every
// /shop/:id, and any typo'd URL alike -- serves byte-identical
// title/description/canonical in the raw pre-JS HTML, and even a genuinely
// nonexistent page returns 200 (soft 404). Two consequences:
//  - Share-preview bots (WhatsApp, Facebook, ...) never execute JS, so they
//    only ever see the generic homepage tags for every link shared.
//  - Search crawlers do run JS eventually, but the raw HTML tags (including
//    <link rel="canonical" href="https://www.tregu.store/">, i.e. the
//    homepage) are what they see first -- telling them every /product/:id
//    and /shop/:id page is a duplicate of the homepage, which suppresses
//    indexing of the actual product/shop pages.
// This intercepts bot requests only and returns a minimal server-rendered
// page with correct tags per route; human visitors fall through untouched
// to the normal SPA, which already sets richer client-side tags via
// react-helmet-async (see client/src/pages/Product.jsx, Shop.jsx, Home.jsx).
const BOT_RE =
  /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|applebot|iframely|embedly|pinterest|vkshare|w3c_validator|prerender|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|sogou|exabot/i;

const SITE_URL = 'https://www.tregu.store';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_TITLE = 'Tregu — Te gjitha dyqanet shqiptare ne nje vend';
const DEFAULT_DESC =
  'Tregu.store — Platforma e pare shqiptare e tregtise elektronike. Zbulo produkte nga dyqane lokale te verifikuara. Krahaso cmimet, porosit online, pagesa me dorezim.';

const SUPABASE_URL = 'https://onngupovxaequeqplikx.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubmd1cG92eGFlcXVlcXBsaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUzODUsImV4cCI6MjA5MjczMTM4NX0.aTiKdVjl02JenqpQzbg2qcniscHMJyml9LMdmRsqqKg';
const supabaseHeaders = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };

// Static routes whose content never depends on a DB lookup.
const STATIC_PAGES: Record<string, { title: string; desc: string }> = {
  '/': { title: DEFAULT_TITLE, desc: DEFAULT_DESC },
  '/search': {
    title: 'Kerko Produkte | Tregu.store',
    desc: 'Kerko ndermjet mijera produkteve nga dyqane shqiptare te verifikuara. Filtro sipas kategorise dhe cmimit.',
  },
  '/legal': {
    title: 'Kushtet dhe Privatesia | Tregu.store',
    desc: 'Lexoni kushtet e perdorimit dhe politiken e privatesise se platformes Tregu.store.',
  },
};

// Matches client/src/i18n/sq.js's cat_* labels and the category keys stored
// on products (see client/src/pages/AddProduct.jsx). /search?category=X
// used to serve byte-identical title/canonical to bare /search -- and the
// canonical explicitly pointed away to /search -- which told crawlers all
// 5 category pages were duplicates of the search page, directly
// contradicting the sitemap listing them as separate indexable URLs.
const CATEGORY_LABELS: Record<string, string> = {
  shoes: 'Këpucë',
  clothes: 'Rroba',
  electronics: 'Elektronikë',
  beauty: 'Bukuri',
  home: 'Shtëpi',
  sports: 'Sporte',
  gifts: 'Dhurata',
};

export const config = {
  matcher: ['/product/:id*', '/shop/:id*', '/search', '/legal', '/'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = request.headers.get('user-agent') ?? '';
  if (!BOT_RE.test(ua)) return undefined; // human — continue to SPA

  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === '/search') {
    const category = url.searchParams.get('category');
    const label = category ? CATEGORY_LABELS[category] : undefined;
    if (label) {
      return pageResponse({
        title: `${label} | Tregu.store`,
        desc: `Zbulo produkte ${label.toLowerCase()} nga dyqane shqiptare te verifikuara ne Tregu.store. Krahaso cmimet dhe porosit online.`,
        canonical: `${SITE_URL}/search?category=${encodeURIComponent(category!)}`,
      });
    }
  }

  const staticPage = STATIC_PAGES[pathname];
  if (staticPage) {
    return pageResponse({
      title: staticPage.title,
      desc: staticPage.desc,
      canonical: pathname === '/' ? `${SITE_URL}/` : `${SITE_URL}${pathname}`,
    });
  }

  if (pathname.startsWith('/product/')) {
    const id = pathname.replace(/^\/product\//, '').split('/')[0];
    if (!id) return undefined;
    return productResponse(id);
  }

  if (pathname.startsWith('/shop/')) {
    const id = pathname.replace(/^\/shop\//, '').split('/')[0];
    if (!id) return undefined;
    return shopResponse(id);
  }

  return undefined;
}

async function productResponse(id: string): Promise<Response | undefined> {
  let product: Record<string, any> | null = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(id)}&select=name,description,price,category,images,in_stock,rating,review_count&limit=1`,
      { headers: supabaseHeaders }
    );
    if (res.ok) {
      const rows = await res.json();
      product = rows?.[0] ?? null;
    }
  } catch {
    return undefined; // network error — fall through to SPA
  }

  if (!product) return notFoundResponse();

  const price = product.price ? `${Number(product.price).toLocaleString('sq-AL')} L` : '';
  const title = `${product.name}${price ? ` — ${price}` : ''} | Tregu.store`;
  const descBits = [product.description?.slice(0, 140), product.category].filter(Boolean).join(' — ');
  const desc = `${descBits}${descBits ? '. ' : ''}Bli online ne Tregu.store — pagesa me dorezim.`;
  const image = (product.images?.[0] as string | undefined) ?? DEFAULT_IMAGE;
  const canonical = `${SITE_URL}/product/${id}`;

  // Product rich-result schema -- lets price/availability/rating show up
  // directly in Google search results instead of just a plain blue link.
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.length ? product.images : [DEFAULT_IMAGE],
    description: product.description || desc,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'ALL',
      price: product.price ?? undefined,
      availability: product.in_stock === false
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };
  if (product.rating && product.review_count) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.review_count,
    };
  }

  return pageResponse({ title, desc, canonical, image, refresh: true, jsonLd });
}

async function shopResponse(id: string): Promise<Response | undefined> {
  let shop: Record<string, any> | null = null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shops?id=eq.${encodeURIComponent(id)}&select=name,description,category,location,logo_url,status&limit=1`,
      { headers: supabaseHeaders }
    );
    if (res.ok) {
      const rows = await res.json();
      shop = rows?.[0] ?? null;
    }
  } catch {
    return undefined; // network error — fall through to SPA
  }

  // Same visibility rule as the "Public read shops" RLS policy: only
  // approved shops (or, for a logged-in owner, their own) are meant to be
  // publicly reachable -- a bot has no session, so only approved shops
  // should ever get indexed here.
  if (!shop || shop.status !== 'approved') return notFoundResponse();

  const title = `${shop.name} — Dyqan Online | Tregu.store`;
  const desc = shop.description?.slice(0, 155) || `${shop.name} — dyqan online ne Tregu.store. Shiko produktet dhe porosit me pagese ne dorezim.`;
  const image = (shop.logo_url as string | undefined) ?? DEFAULT_IMAGE;

  return pageResponse({ title, desc, canonical: `${SITE_URL}/shop/${id}`, image, refresh: true });
}

function notFoundResponse(): Response {
  const html = `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8"/>
<title>Nuk u gjet | Tregu.store</title>
<meta name="robots" content="noindex"/>
</head>
<body>
<p>Ky produkt ose dyqan nuk ekziston me ose eshte hequr.</p>
</body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function pageResponse(opts: { title: string; desc: string; canonical: string; image?: string; refresh?: boolean; jsonLd?: Record<string, any> }): Response {
  const title = esc(opts.title);
  const desc = esc(opts.desc);
  const image = esc(opts.image ?? DEFAULT_IMAGE);
  const canonical = opts.canonical;
  const jsonLdTag = opts.jsonLd
    ? `<script type="application/ld+json">${safeJsonLd(opts.jsonLd)}</script>\n`
    : '';

  const html = `<!DOCTYPE html>
<html lang="sq">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<meta name="description" content="${desc}"/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:type"        content="website"/>
<meta property="og:site_name"   content="Tregu"/>
<meta property="og:url"         content="${canonical}"/>
<meta property="og:title"       content="${title}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:image"       content="${image}"/>
<meta property="og:locale"      content="sq_AL"/>
<meta name="twitter:card"        content="summary_large_image"/>
<meta name="twitter:title"       content="${title}"/>
<meta name="twitter:description" content="${desc}"/>
<meta name="twitter:image"       content="${image}"/>
${opts.refresh ? `<meta http-equiv="refresh" content="0;url=${canonical}"/>\n` : ''}${jsonLdTag}</head>
<body>
<a href="${canonical}">${title}</a>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// JSON.stringify alone isn't safe to drop into a <script> body: a product
// name/description containing "</script>" would close the tag early. `<`
// is not meaningful JSON syntax, so escaping it as a unicode sequence is
// enough to neutralize that without touching the parsed data.
function safeJsonLd(obj: Record<string, any>): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// Product/shop photos are stored (via resizeImage.js) at up to 1600px on
// their longest edge, ~500KB each -- fine for a full product photo, wildly
// oversized for a ~120px card thumbnail or a ~40px avatar. Every grid page
// (Home, Search, Feed, Cart...) was requesting that same full-size file for
// every card, which is the single biggest thing making the app feel slow
// on mobile data: a page with 8-16 product cards could easily pull several
// MB just for thumbnails that render at a fraction of that resolution.
//
// Routes the image through Vercel's built-in image-optimization endpoint
// (enabled for the Supabase storage host via vercel.json's `images` key)
// to resize + re-encode (AVIF/WebP where supported) on the way to the
// browser, cached at the edge after the first request. Falls back to the
// original URL untouched for anything not on that allow-listed host (e.g.
// a future different storage provider) so a config mismatch never breaks
// an image outright.
const OPTIMIZED_HOST = "onngupovxaequeqplikx.supabase.co";

// Must mirror vercel.json's images.sizes exactly -- the endpoint 400s on
// any `w` that isn't one of these, which silently breaks the <img> (blank
// box with a broken-image icon, no console error a caller would notice).
// Snapping every request to the nearest allowed size here means a caller
// passing an arbitrary pixel value can't accidentally ship a broken image.
const ALLOWED_WIDTHS = [64, 96, 128, 200, 256, 400, 640, 828, 1080, 1600];
function snapWidth(width) {
  return ALLOWED_WIDTHS.find(w => w >= width) || ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

export function optimizedImageUrl(url, width, quality = 75) {
  if (!url || typeof url !== "string") return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== OPTIMIZED_HOST) return url;
  } catch {
    return url;
  }
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${snapWidth(width)}&q=${quality}`;
}

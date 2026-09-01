// Resizes/compresses an image file in the browser before upload. Product
// photos come straight off phone cameras (often 3-8MB, sometimes 15MB+
// HEIC) and were previously uploaded at full resolution with only a label
// claiming a "5MB max" that nothing actually enforced -- slow and
// unreliable on mobile data. This shrinks anything over maxDimension and
// re-encodes as JPEG at a sane quality, typically landing well under 500KB.
//
// iPhones default to shooting HEIC, which only Safari can decode via
// <img>/canvas -- on every other browser it used to fall through untouched
// and get uploaded as a raw .heic file that just doesn't render for buyers.
// heic2any (WASM libheif, works everywhere) converts it to JPEG first so
// the resize step below always has something every browser can decode.
const HEIC_TYPES = ["image/heic", "image/heif"];
async function toDecodable(file) {
  const isHeic = HEIC_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name);
  if (!isHeic) return file;
  try {
    const { default: heic2any } = await import("heic2any");
    const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return null; // conversion failed -- caller decides how to handle an undecodable photo
  }
}

export async function resizeImage(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  const source = await toDecodable(file);
  if (!source) return null; // signals "this photo can't be shown in a browser, don't upload it"

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(source);

    const fallback = () => { URL.revokeObjectURL(url); resolve(source); };

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { fallback(); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob || blob.size >= source.size) { resolve(source); return; }
        const resized = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
        resolve(resized);
      }, "image/jpeg", quality);
    };
    img.onerror = fallback;
    img.src = url;
  });
}

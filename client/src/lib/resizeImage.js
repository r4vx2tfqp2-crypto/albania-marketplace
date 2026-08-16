// Resizes/compresses an image file in the browser before upload. Product
// photos come straight off phone cameras (often 3-8MB, sometimes 15MB+
// HEIC) and were previously uploaded at full resolution with only a label
// claiming a "5MB max" that nothing actually enforced -- slow and
// unreliable on mobile data. This shrinks anything over maxDimension and
// re-encodes as JPEG at a sane quality, typically landing well under 500KB.
//
// Falls back to the original file if the browser can't decode it (e.g.
// HEIC in a non-Safari browser) so a resize failure never blocks the
// upload entirely -- it just skips compression for that one file.
export function resizeImage(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    const fallback = () => { URL.revokeObjectURL(url); resolve(file); };

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
        if (!blob || blob.size >= file.size) { resolve(file); return; }
        const resized = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
        resolve(resized);
      }, "image/jpeg", quality);
    };
    img.onerror = fallback;
    img.src = url;
  });
}

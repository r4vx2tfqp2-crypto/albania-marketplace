// Shared client for the generate-listing edge function (AI-written product
// description + category spec-field autofill), used by both AddProduct.jsx
// (photo is still a local File, not yet uploaded) and EditProduct.jsx
// (photo is already an uploaded URL) so the base64-conversion/auth/fetch
// logic lives in exactly one place.
import { supabase } from './supabase';

const GENERATE_LISTING_URL = 'https://onngupovxaequeqplikx.supabase.co/functions/v1/generate-listing';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

async function urlToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(blob);
  });
}

// imageFile: a local File (AddProduct, before upload) -- OR --
// imageUrl: an already-uploaded photo URL (EditProduct). Pass at most one.
export async function generateListing({ name, category, existingDescription, imageFile, imageUrl }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  let imageBase64;
  try {
    if (imageFile) imageBase64 = await fileToDataUrl(imageFile);
    else if (imageUrl) imageBase64 = await urlToDataUrl(imageUrl);
  } catch {
    imageBase64 = undefined; // fall through to a text-only generation rather than failing outright
  }

  const res = await fetch(GENERATE_LISTING_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
    body: JSON.stringify({ name, category, existingDescription, imageBase64 }),
  });
  if (!res.ok) throw new Error('AI generation failed');
  return res.json(); // { description, details }
}

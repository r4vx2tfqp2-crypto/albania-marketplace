import { supabase } from "./supabase";

// Public by design (same trust level as the already-hardcoded Supabase
// anon key) -- a VAPID public key identifies the sending application to
// the push service, it isn't a secret. The matching private key lives
// only in Supabase's edge function secrets, never in client code.
const VAPID_PUBLIC_KEY = "BO-tpgI77rGzrYq9ky4FWUnEJ0r6Kskw3WQD9aKN06piHRBM7LZXv7NxMJCcyv4AfvFE97_yc6QSeYsOTUgRFVg";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export function notificationPermission() {
  return pushSupported() ? Notification.permission : "unsupported";
}

// Subscribes the current browser to push and saves it under the current
// user -- called from the Settings toggle, always as a direct result of
// an explicit user click (requestPermission() only works from a user
// gesture anyway, browsers reject it otherwise).
export async function enablePush() {
  if (!pushSupported()) throw new Error("Njoftimet nuk mbeshteten ne kete shfletues.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Nuk u dha leje per njoftime.");

  const registration = await registerServiceWorker();
  if (!registration) throw new Error("Regjistrimi i service worker deshtoi.");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Duhet te jeni te kyçur.");

  const keys = subscription.toJSON().keys;
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
  }, { onConflict: "endpoint" });
  if (error) throw error;

  return true;
}

export async function disablePush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
}

// Whether THIS browser currently has an active push subscription -- used
// to render the Settings toggle in the right initial state.
export async function isPushEnabled() {
  if (!pushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  return !!subscription;
}

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

  // A push subscription's endpoint is reused across accounts on a shared
  // browser (e.g. one person signs out, another signs in on the same
  // device) unless explicitly unsubscribed first -- pushManager.subscribe()
  // on an already-subscribed registration just returns the existing
  // subscription. Without this, the upsert below can try to claim a
  // row another user's account already owns for this same endpoint,
  // which RLS correctly rejects (a user can't reassign someone else's
  // row) -- and worse, if that failed silently, the *previous* user
  // would keep quietly receiving their own push notifications on what
  // is now someone else's device. Force a clean, unclaimed endpoint by
  // dropping any existing subscription before creating a new one.
  const existing = await registration.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  try {
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
  } catch (err) {
    // Roll back the browser-level subscription we just created -- without
    // this, isPushEnabled() would report "on" for a subscription with no
    // backing DB row, so nothing would ever actually be delivered but the
    // UI would show it as working.
    await subscription.unsubscribe().catch(() => {});
    throw err;
  }

  return true;
}

export async function disablePush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  // Unsubscribe regardless of whether the delete below succeeds -- an
  // explicit "turn off notifications" action should always stop this
  // browser from receiving them, even if clearing the DB row hits a
  // transient error. The error is still surfaced (not swallowed) so a
  // real failure isn't silently invisible.
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
  if (error) throw error;
}

// Whether push is enabled for the CURRENT logged-in user specifically --
// not just "does this browser have some push subscription" (which could
// be true because a *previous* user on a shared device enabled it and
// never disabled it, e.g. by closing the tab instead of signing out).
// RLS on push_subscriptions already scopes SELECT to auth.uid() = user_id,
// so a stale subscription belonging to someone else simply won't be
// found here -- which is exactly the correct "off" answer for this user.
export async function isPushEnabled() {
  if (!pushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return false;

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", subscription.endpoint)
    .maybeSingle();
  return !error && !!data;
}

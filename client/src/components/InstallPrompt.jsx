import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import styles from "./InstallPrompt.module.css";

const DISMISS_KEY = "tregu_install_dismissed_at";
const DISMISS_DAYS = 14; // re-offer after this long instead of hiding forever on one dismiss

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function recentlyDismissed() {
  const at = localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  return Date.now() - Number(at) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

// Android/Chrome/desktop Chrome & Edge fire `beforeinstallprompt`, which we
// can capture and trigger programmatically. iOS Safari never fires this
// event at all -- Apple only supports installing via the Share sheet's
// "Add to Home Screen", which cannot be triggered from a web page, so
// that platform gets a manual-instructions banner instead.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    if (isIos()) {
      setShowIosHint(true);
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner} role="region" aria-label="Instalo aplikacionin Tregu">
      <div className={styles.iconWrap}>
        {showIosHint ? <Share size={16} /> : <Download size={16} />}
      </div>
      <div className={styles.text}>
        {showIosHint ? (
          <>
            <div className={styles.title}>Instalo Tregu ne telefon</div>
            <div className={styles.sub}>Prek <strong>Share</strong> ne Safari, mandej <strong>"Add to Home Screen"</strong>.</div>
          </>
        ) : (
          <>
            <div className={styles.title}>Instalo Tregu ne telefon</div>
            <div className={styles.sub}>Hape si aplikacion, pa shfletues, direkt nga ekrani kryesor.</div>
          </>
        )}
      </div>
      {!showIosHint && (
        <button className={styles.installBtn} onClick={install}>Instalo</button>
      )}
      <button className={styles.closeBtn} onClick={dismiss} aria-label="Mbyll">
        <X size={16} />
      </button>
    </div>
  );
}

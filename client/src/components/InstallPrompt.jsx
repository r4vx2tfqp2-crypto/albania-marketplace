import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, ArrowDown, ArrowUp, Menu } from "lucide-react";
import styles from "./InstallPrompt.module.css";

const DISMISS_KEY = "tregu_install_dismissed_at";
const DISMISS_DAYS = 14; // re-offer after this long instead of hiding forever on one dismiss
// How long to wait for the browser's own auto-install event before
// falling back to manual instructions -- Chrome/Edge on Android and
// desktop USUALLY fire this quickly if they're going to at all, but
// there's no guarantee it fires (repeated past dismissals suppress it,
// and some Chromium-based browsers just don't support it). Without this
// fallback, anyone on a browser that never fires it saw no banner and no
// help whatsoever.
const AUTO_PROMPT_WAIT_MS = 2500;

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// iPadOS 13+ reports its UA as desktop Safari (no "iPad" substring), the
// one reliable way left to tell it apart from a real Mac is touch support.
function isIpad() {
  return /iPad/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (/EdgA?\//.test(ua)) return "edge";
  if (/CriOS|Chrome/.test(ua)) return "chrome";
  if (/FxiOS|Firefox/.test(ua)) return "firefox";
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) return "safari";
  return "other";
}

function getPlatform() {
  if (isIos()) return isIpad() ? "ipad" : "iphone";
  if (isAndroid()) return "android";
  return "desktop";
}

function recentlyDismissed() {
  const at = localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  return Date.now() - Number(at) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

// Device/browser-specific step lists for the "how do I install this"
// modal -- shown whenever we can't do a one-click install ourselves
// (always the case on iOS; on Android/desktop, only when the browser
// never fires beforeinstallprompt). Every platform gets *something*
// concrete here rather than a generic "check your browser" shrug.
function getSteps(platform, browser) {
  if (platform === "iphone" || platform === "ipad") {
    const ipad = platform === "ipad";
    return {
      note: "Kjo banderole nuk eshte vete butoni — butoni real \"Share\" i perket Safari-t, jo faqes sone, per arsye sigurie te vendosura nga Apple.",
      steps: [
        { icon: ipad ? <ArrowUp size={18} /> : <ArrowDown size={18} />, text: <>Ne Safari (jo Chrome apo nje app tjeter), prekni ikonen <strong>Share</strong> <Share size={13} style={{ display: "inline", verticalAlign: -2 }} /> — zakonisht ne {ipad ? "cepin lart djathtas" : "mesin e shirit poshte ekranit"}. Nese s'e shihni aty, kontrolloni {ipad ? "poshte" : "lart, prane adresës"}.</> },
        { icon: <PlusSquare size={18} />, text: <>Ne listen qe hapet, rrëshqisni poshte dhe prekni <strong>"Add to Home Screen"</strong>.</> },
        { icon: "✓", text: <>Prekni <strong>"Add"</strong> lart djathtas. Ikona e Tregu do te shfaqet ne ekranin kryesor.</> },
      ],
    };
  }

  if (platform === "android") {
    if (browser === "firefox") {
      return {
        note: "Firefox per Android e quan kete \"Instalo\" ne menune kryesore.",
        steps: [
          { icon: <Menu size={18} />, text: <>Prekni menune (tre pika, lart djathtas).</> },
          { icon: <PlusSquare size={18} />, text: <>Prekni <strong>"Instalo"</strong> ose <strong>"Shto ne ekranin kryesor"</strong>.</> },
        ],
      };
    }
    return {
      note: "Ne Chrome ose Samsung Internet, kjo eshte zakonisht dy prekje.",
      steps: [
        { icon: <Menu size={18} />, text: <>Prekni menune (tre pika, lart djathtas ne Chrome).</> },
        { icon: <PlusSquare size={18} />, text: <>Prekni <strong>"Instalo aplikacionin"</strong> ose <strong>"Shto ne ekranin kryesor"</strong>.</> },
      ],
    };
  }

  // desktop
  if (browser === "safari") {
    return {
      note: "Ne Safari per Mac (Sonoma ose me te ri), instalimi eshte pjese e menuse File.",
      steps: [
        { icon: <Menu size={18} />, text: <>Hapni menune <strong>File</strong> lart ne ekran.</> },
        { icon: <PlusSquare size={18} />, text: <>Zgjidhni <strong>"Add to Dock..."</strong> dhe konfirmoni.</> },
      ],
    };
  }
  if (browser === "firefox") {
    return {
      note: "Firefox per desktop nuk mbeshtet ende instalimin si aplikacion i vecante.",
      steps: [
        { icon: "i", text: <>Hapeni tregu.store ne Chrome ose Edge per ta instaluar si aplikacion — Firefox desktop nuk e mbeshtet kete akoma.</> },
      ],
    };
  }
  return {
    note: "Ne Chrome ose Edge, instalimi eshte zakonisht nje ikone direkt ne shiritin e adreses.",
    steps: [
      { icon: <Download size={18} />, text: <>Kerkoni nje ikone instalimi (kompjuter me shenjen +) ne anen e djathte te shiritit te adreses.</> },
      { icon: <Menu size={18} />, text: <>Nese s'e shihni, hapni menune (tre pika, lart djathtas) dhe kerkoni <strong>"Instalo Tregu..."</strong>.</> },
    ],
  };
}

// Android/Chrome/desktop Chrome & Edge USUALLY fire `beforeinstallprompt`,
// which we can capture and trigger programmatically for a real one-click
// install. iOS Safari never fires this event at all -- Apple only
// supports installing via the Share sheet, which can't be triggered from
// a web page. And even on platforms that support the event, it isn't
// guaranteed to fire (suppressed after repeated dismissals, or just not
// supported by that particular browser) -- so every platform falls back
// to an explicit, device-specific "how to install" modal instead of
// silently showing nothing.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [waitedForAutoPrompt, setWaitedForAutoPrompt] = useState(false);
  const platform = getPlatform();
  const browser = getBrowser();
  const isIosPlatform = platform === "iphone" || platform === "ipad";

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    if (isIosPlatform) {
      setVisible(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: if the browser never fires the event, still offer manual
    // instructions instead of leaving Android/desktop visitors with no
    // path to install at all.
    const timer = setTimeout(() => {
      setWaitedForAutoPrompt(true);
      setVisible((v) => v || true);
    }, AUTO_PROMPT_WAIT_MS);

    return () => { window.removeEventListener("beforeinstallprompt", handler); clearTimeout(timer); };
  }, [isIosPlatform]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowModal(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;
  // On non-iOS, don't render anything until either the real prompt
  // arrived or the fallback timer elapsed -- avoids a flash of "Shiko si"
  // that then jumps to a real "Instalo" button a second later.
  if (!isIosPlatform && !deferredPrompt && !waitedForAutoPrompt) return null;

  const hasOneClick = !!deferredPrompt;
  const { note, steps } = getSteps(platform, browser);

  return (
    <>
      <div className={styles.banner} role="region" aria-label="Instalo aplikacionin Tregu">
        <div className={styles.iconWrap}>
          {isIosPlatform ? <Share size={16} /> : <Download size={16} />}
        </div>
        <div className={styles.text}>
          <div className={styles.title}>Instalo Tregu ne telefon</div>
          <div className={styles.sub}>
            {hasOneClick
              ? "Hape si aplikacion, pa shfletues, direkt nga ekrani kryesor."
              : "Shto ne ekranin kryesor per ta hapur si aplikacion."}
          </div>
        </div>
        {hasOneClick ? (
          <button className={styles.installBtn} onClick={install}>Instalo</button>
        ) : (
          <button className={styles.installBtn} onClick={() => setShowModal(true)}>Shiko si</button>
        )}
        <button className={styles.closeBtn} onClick={dismiss} aria-label="Mbyll">
          <X size={16} />
        </button>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)} aria-label="Mbyll">
              <X size={18} />
            </button>
            <h2 className={styles.modalTitle}>Si te instalosh Tregu</h2>
            <p className={styles.modalNote}>{note}</p>
            <ol className={styles.steps}>
              {steps.map((s, i) => (
                <li key={i}>
                  <span className={styles.stepIcon}>{s.icon}</span>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
            <button className={styles.modalGotIt} onClick={() => setShowModal(false)}>Kuptova</button>
          </div>
        </div>
      )}
    </>
  );
}

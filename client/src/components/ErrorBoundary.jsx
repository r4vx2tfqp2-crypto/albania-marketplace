import { Component } from "react";

// Two failure modes this catches:
//
// 1. Stale chunk after a deploy. Routes like SellerDashboard/AdminPanel are
//    code-split (client/src/App.jsx); each deploy renames their JS chunk
//    files (new content hash). A tab left open from before a deploy still
//    holds the *old* chunk filenames, so clicking into one of those routes
//    tries to fetch a file that no longer exists on the server -- the
//    dynamic import() rejects, React has nothing to render, and with no
//    error handling the whole tree just unmounts to a blank page instead
//    of navigating. lazyWithRetry below catches that specific failure and
//    does one full reload (which fetches the current index.html and the
//    current chunk hashes), so it self-heals invisibly instead of leaving
//    the visitor stuck.
// 2. Any other uncaught render error. This class component is the actual
//    React error boundary (Suspense only covers the *loading* state, not
//    errors) -- it's the backstop so a bug anywhere in the tree shows a
//    "something went wrong, reload" message instead of a silent blank page.
const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

export function lazyImport(importer) {
  return async () => {
    try {
      return await importer();
    } catch (err) {
      const isChunkError = CHUNK_ERROR_PATTERN.test(err?.message || "");
      const alreadyReloaded = sessionStorage.getItem("chunk-reload-attempted");
      if (isChunkError && !alreadyReloaded) {
        sessionStorage.setItem("chunk-reload-attempted", "1");
        window.location.reload();
        return new Promise(() => {}); // never resolve -- the reload is already in flight
      }
      throw err;
    }
  };
}

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // A stale-chunk error that made it here means the one-time reload in
    // lazyImport already happened (or this error came from a normal, not
    // lazy-loaded, import) -- either way a reload is still the right fix,
    // and the "attempted" guard prevents a loop if reloading doesn't help.
    const isChunkError = CHUNK_ERROR_PATTERN.test(error?.message || "");
    if (isChunkError && !sessionStorage.getItem("chunk-reload-attempted")) {
      sessionStorage.setItem("chunk-reload-attempted", "1");
      window.location.reload();
    }
  }

  componentDidMount() {
    // A clean mount means whatever we're showing loaded fine -- clear the
    // guard so a genuine future stale-chunk event (e.g. after the next
    // deploy, later in this same tab) can still trigger one more reload.
    sessionStorage.removeItem("chunk-reload-attempted");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-1)" }}>Dicka shkoi keq.</div>
          <div style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 320 }}>Faqja hasi ne nje problem. Provoni ta rifreskoni.</div>
          <button onClick={() => window.location.reload()}
            style={{ padding: "10px 22px", borderRadius: 10, background: "var(--text-1)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)" }}>
            Rifresko faqen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

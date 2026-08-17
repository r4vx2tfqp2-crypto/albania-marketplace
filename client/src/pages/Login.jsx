import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setError(error.message); setLoading(false); return; }
    navigate("/seller");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } }
    });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.session) {
      // Email confirmation is off (or already satisfied) -- Supabase
      // handed back a live session, so the account is immediately usable.
      // Skip the extra login step entirely instead of making them retype
      // what they just typed.
      navigate("/seller");
      return;
    }
    // Email confirmation required -- no session yet. Switch to the sign-in
    // tab with the same email/password already filled in (same `form`
    // state backs both tabs) so confirming later is a single click, not a
    // full retype.
    setSuccess("Llogaria u krijua! Kontrolloni email-in per te konfirmuar llogarine, mandej shtypni \"Kyçu\".");
    setTab("login");
    setLoading(false);
  };

  // Works for both sign-in and sign-up -- Supabase creates the account
  // automatically on first Google sign-in, so one button covers both tabs.
  // No explicit redirectTo: omitting it falls back to the project's
  // configured site_url, which is already allow-listed (unlike a custom
  // path, which would need adding to Supabase's redirect allow-list first).
  const handleGoogleSignIn = async () => {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) setError(error.message);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className="sr-only">{tab === "login" ? t('sign_in_title') : t('register')} — Tregu</h1>
        <div className={styles.logo}>
          <div className={styles.logoMark}>T</div>
          <span className={styles.logoText}>tregu</span>
        </div>
        {error && <div className={styles.error} role="alert">{error}</div>}
        {success && <div className={styles.successMsg} role="status">{success}</div>}

        <button type="button" className={styles.googleBtn} onClick={handleGoogleSignIn}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Vazhdo me Google
        </button>
        <div className={styles.divider}>ose</div>

        <div className={styles.tabs}>
          <button className={styles.tab + (tab === "login" ? " " + styles.active : "")} onClick={() => setTab("login")}>{t("sign_in_title")}</button>
          <button className={styles.tab + (tab === "register" ? " " + styles.active : "")} onClick={() => setTab("register")}>{t("register")}</button>
        </div>
        {tab === "login" ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-email">{t("email")}</label>
              <input id="login-email" required type="email" className={styles.input} placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-password">{t("password")}</label>
              <input id="login-password" required type="password" className={styles.input} placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? t("signing_in") : t("sign_in_title")}
            </button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none" }}>
                Keni harruar fjalekalimin?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-name">{t("name")}</label>
              <input id="register-name" required className={styles.input} placeholder="Erion Brahimi"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-email">{t("email")}</label>
              <input id="register-email" required type="email" className={styles.input} placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="register-password">{t("password")}</label>
              <input id="register-password" required type="password" className={styles.input} placeholder="min 6 karaktere"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? t("creating_account") : t("register")}
            </button>
          </form>
        )}
        <Link to="/" className={styles.backLink}>{t("back_to_marketplace")}</Link>
      </div>
    </div>
  );
}

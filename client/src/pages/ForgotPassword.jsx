import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./Login.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://tregu.store/reset-password",
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>T</div>
          <span className={styles.logoText}>tregu</span>
        </div>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Email u dergua!</h2>
            <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
              Kontrolloni emailin tuaj dhe klikoni linkun per te rivendosur fjalekalimin.
            </p>
            <Link to="/login" style={{ color: "var(--green)", fontSize: 14, textDecoration: "none" }}>Kthehu te hyrja</Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Keni harruar fjalekalimin?</h1>
            <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
              Shkruani emailin tuaj dhe do ju dergojme nje link per te rivendosur fjalekalimin.
            </p>
            {error && (
              <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input required type="email" className={styles.input} placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Duke derguar..." : "Dergo linkun"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Link to="/login" style={{ color: "var(--text-3)", fontSize: 14, textDecoration: "none" }}>Kthehu te hyrja</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

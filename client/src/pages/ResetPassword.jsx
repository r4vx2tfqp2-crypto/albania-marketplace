import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./Login.module.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  // Clicking the emailed reset link should leave the visitor with an active
  // recovery session by the time this page mounts (supabase-js exchanges
  // the code/token in the URL automatically). If it's missing -- expired
  // link, link already used, or the link was blocked before reaching this
  // page -- fail with a clear message instead of a confusing error only
  // after the user fills in the form and submits.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setInvalidLink(true);
      setReady(true);
    }).catch(() => { setInvalidLink(true); setReady(true); });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Fjalëkalimet nuk përputhen!"); return; }
    if (password.length < 6) { setError("Fjalëkalimi duhet te kete te pakten 6 karaktere!"); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>T</div>
          <span className={styles.logoText}>tregu</span>
        </div>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Fjalëkalimi u ndryshua!</h2>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>Duke u ridrejtuar...</p>
          </div>
        ) : !ready ? (
          <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center" }}>Duke u ngarkuar...</p>
        ) : invalidLink ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Linku ka skaduar</h2>
            <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.6 }}>
              Ky link per rivendosjen e fjalekalimit eshte i pavlefshem ose ka skaduar. Kerkoni nje link te ri.
            </p>
            <Link to="/forgot-password" style={{ color: "var(--green)", fontSize: 14, textDecoration: "none" }}>Kerko link te ri</Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Rivendos fjalekalimin</h1>
            {error && (
              <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Fjalëkalimi i ri</label>
                <input required type="password" className={styles.input} placeholder="min 6 karaktere"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Konfirmo fjalekalimin</label>
                <input required type="password" className={styles.input} placeholder="Ripersërit fjalekalimin"
                  value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Duke ndryshuar..." : "Ndrysho fjalekalimin"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

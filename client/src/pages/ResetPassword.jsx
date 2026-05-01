import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import styles from "./Login.module.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Fjalëkalimet nuk përputhen!"); return; }
    if (password.length < 6) { setError("Fjalëkalimi duhet të ketë të paktën 6 karaktere!"); return; }
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
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Fjalëkalimi u ndryshua!
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)" }}>Duke u ridrejtuar...</p>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Rivendos fjalëkalimin</h1>
            {error && (
              <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Fjalëkalimi i ri</label>
                <input required type="password" className={styles.input}
                  placeholder="min 6 karaktere" value={password}
                  onChange={e => setPassword(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Konfirmo fjalëkalimin</label>
                <input required type="password" className={styles.input}
                  placeholder="Ripërsërit fjalëkalimin" value={confirm}
                  onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Duke ndryshuar..." : "Ndrysho fjalëkalimin"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

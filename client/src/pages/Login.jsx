import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', password: '', name: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) { setError(error.message); setLoading(false); return; }
    navigate('/seller');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } }
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess('Account created! Please check your email to confirm, then log in.');
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>T</div>
          <span className={styles.logoText}>tregu</span>
        </div>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.active : ''}`} onClick={() => setTab('login')}>{t('sign_in_title')}</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => setTab('register')}>{t('register')}</button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.successMsg}>{success}</div>}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>{t('email')}</label>
              <input required type="email" className={styles.input} placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('password')}</label>
              <input required type="password" className={styles.input} placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? t('signing_in') : t('sign_in_title')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>{t('name')}</label>
              <input required className={styles.input} placeholder="Erion Brahimi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('email')}</label>
              <input required type="email" className={styles.input} placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('password')}</label>
              <input required type="password" className={styles.input} placeholder="min 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? t('creating_account') : t('register')}
            </button>
          </form>
        )}
        <Link to="/" className={styles.backLink}>{t('back_to_marketplace')}</Link>
      </div>
    </div>
  );
}
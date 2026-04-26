import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import styles from './AddProduct.module.css';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    newPassword: '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    const updates = { data: { name: form.name } };
    if (form.newPassword) updates.password = form.newPassword;
    const { error } = await supabase.auth.updateUser(updates);
    if (!error) setSuccess(t('settings_saved'));
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate('/profile')}>
          <ArrowLeft size={16} /> {t('back')}
        </button>
        <h1 className={styles.title}>{t('account_settings')}</h1>
        {success && (
          <div style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
            {success}
          </div>
        )}
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>{t('name')}</label>
              <input className={styles.input} placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('email')}</label>
              <input className={styles.input} value={form.email} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>{t('new_password')}</label>
              <input type="password" className={styles.input} placeholder="min 6 characters" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} />
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/profile')}>{t('cancel')}</button>
            <button type="submit" className={styles.publishBtn} disabled={loading}>
              {loading ? t('saving') : t('save_changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
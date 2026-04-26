import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import styles from './AddProduct.module.css';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    // Delete user's products
    await supabase.from('products').delete().eq('user_id', user.id);

    // Delete user's shops
    await supabase.from('shops').delete().eq('user_id', user.id);

    // Sign out and delete account
    await signOut();
    navigate('/');
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

        {/* Delete account */}
        <div style={{ marginTop: 40, padding: 24, background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>
            Fshi llogarinë
          </h2>
          <p style={{ fontSize: 14, color: 'var(--red)', marginBottom: 16, lineHeight: 1.6 }}>
            Kjo veprim do të fshijë përgjithmonë llogarinë tuaj, dyqanet dhe produktet tuaja. Kjo veprim nuk mund të kthehet mbrapsht.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{ background: 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              Fshi llogarinë time
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)', marginBottom: 12 }}>
                Jeni i sigurt? Kjo veprim nuk mund të kthehet mbrapsht!
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  style={{ background: 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  {deleteLoading ? 'Duke fshirë…' : 'Po, fshi llogarinë'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ background: 'transparent', color: 'var(--red)', padding: '10px 20px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, border: '1px solid var(--red)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  Anulo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { pushSupported, notificationPermission, isPushEnabled, enablePush, disablePush } from '../lib/push';
import styles from './AddProduct.module.css';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    newPassword: '',
  });

  const [pushOn, setPushOn] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => { isPushEnabled().then(setPushOn); }, []);

  const togglePush = async () => {
    setPushLoading(true);
    setPushError('');
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
      } else {
        await enablePush();
        setPushOn(true);
      }
    } catch (err) {
      setPushError(err.message || 'Dicka shkoi keq.');
    }
    setPushLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    const updates = { data: { name: form.name } };
    if (form.newPassword) updates.password = form.newPassword;
    const { error: updateError } = await supabase.auth.updateUser(updates);
    if (updateError) setError(updateError.message);
    else setSuccess(t('settings_saved'));
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('https://onngupovxaequeqplikx.supabase.co/functions/v1/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + session?.access_token,
          'Content-Type': 'application/json',
        },
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setDeleteError(result.error || 'Dicka shkoi keq. Provoni perseri.');
        setDeleteLoading(false);
        return;
      }
    } catch (err) {
      setDeleteError('Dicka shkoi keq. Provoni perseri.');
      setDeleteLoading(false);
      return;
    }
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
        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
            {error}
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

        {/* Push notifications */}
        <div style={{ marginTop: 24, padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: pushOn ? 'var(--green-light)' : 'var(--surface-2)', color: pushOn ? 'var(--green-dark)' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {pushOn ? <Bell size={18} /> : <BellOff size={18} />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>Njoftimet push</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  {pushSupported()
                    ? 'Merr njoftime per porosite direkt ne telefon, edhe kur Tregu nuk eshte hapur.'
                    : 'Ky shfletues nuk mbeshtet njoftimet push.'}
                </div>
              </div>
            </div>
            {pushSupported() && (
              <button type="button" onClick={togglePush} disabled={pushLoading}
                role="switch" aria-checked={pushOn} aria-label="Aktivizo njoftimet push"
                style={{ flexShrink: 0, width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', background: pushOn ? 'var(--green)' : 'var(--border-strong)', transition: 'background 0.15s' }}>
                <span style={{ position: 'absolute', top: 3, left: pushOn ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            )}
          </div>
          {pushError && (
            <div role="alert" style={{ marginTop: 12, background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
              {pushError}
            </div>
          )}
          {notificationPermission() === 'denied' && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-3)' }}>
              Njoftimet jane te bllokuara per Tregu ne shfletuesin tuaj. Per t'i aktivizuar, ndryshoni lejet e sajtit nga cilesimet e shfletuesit.
            </div>
          )}
        </div>

        {/* Delete account */}
        <div style={{ marginTop: 40, padding: 24, background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>
            Fshi llogarinë
          </h2>
          <p style={{ fontSize: 14, color: 'var(--red)', marginBottom: 16, lineHeight: 1.6 }}>
            Kjo veprim do të fshijë përgjithmonë llogarinë tuaj, dyqanet dhe produktet tuaja. Kjo veprim nuk mund të kthehet mbrapsht.
          </p>

          {deleteError && (
            <div style={{ background: '#fff', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid var(--red)' }}>
              {deleteError}
            </div>
          )}

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
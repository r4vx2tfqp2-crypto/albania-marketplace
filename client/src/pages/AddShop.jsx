import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './AddProduct.module.css';

const CITIES = ['Tirana', 'Durrës', 'Shkodër', 'Vlorë', 'Korçë', 'Fier', 'Berat', 'Lushnjë'];
const COLORS = ['#1D9E75','#D4537E','#378ADD','#993556','#BA7517','#534AB7'];
const CATEGORIES = ['Sports & Shoes','Clothes & Fashion','Electronics','Beauty & Cosmetics','Home & Living','Shoes','Gifts'];

export default function AddShop() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', category: 'Clothes & Fashion',
    location: 'Tirana', phone: '', color: '#1D9E75',
  });

  const getInitials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.from('shops').insert({
      name: form.name,
      description: form.description,
      category: form.category,
      location: form.location,
      phone: form.phone,
      color: form.color,
      initials: getInitials(form.name),
      verified: false,
      rating: 0,
      review_count: 0,
      delivery_options: ['Cash on delivery'],
    });

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSaved(true);
    setTimeout(() => navigate('/seller'), 2000);
  };

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', color: 'var(--green)' }}>
        <CheckCircle size={64} strokeWidth={1.5} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>Shop created!</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className={styles.title}>Create your shop</h1>

        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Shop name *</label>
              <input required className={styles.input} placeholder="e.g. SportShop Tirana" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description *</label>
              <textarea required className={styles.textarea} placeholder="Tell customers what you sell…" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Category *</label>
                <select required className={styles.select} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>City *</label>
                <select required className={styles.select} value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Phone (WhatsApp) *</label>
                <input required className={styles.input} placeholder="+355 69 123 4567" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Shop color</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {COLORS.map(c => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm({...form, color: c})}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: c,
                        border: form.color === c ? '3px solid var(--text-1)' : '2px solid transparent',
                        transition: 'border 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {form.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: form.color + '33', color: form.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                  {getInitials(form.name)}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{form.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{form.location} · {form.category}</div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/seller')}>Cancel</button>
            <button type="submit" className={styles.publishBtn} disabled={loading}>
              {loading ? 'Creating…' : 'Create shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
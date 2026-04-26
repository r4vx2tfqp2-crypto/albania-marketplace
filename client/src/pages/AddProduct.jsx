import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './AddProduct.module.css';

const CATEGORIES = ['shoes', 'clothes', 'electronics', 'beauty', 'home', 'sports', 'gifts'];

export default function AddProduct() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', price: '', category: 'shoes',
    description: '', stock: '', sizes: '',
    shop_id: '', trending: false
  });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    const { data } = await supabase.from('shops').select('id, name');
    setShops(data || []);
    if (data && data.length > 0) setForm(f => ({ ...f, shop_id: data[0].id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.from('products').insert({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      description: form.description,
      shop_id: form.shop_id,
      sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()) : [],
      in_stock: true,
      trending: form.trending,
      rating: 0,
      review_count: 0,
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
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>Product published!</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <h1 className={styles.title}>Add product</h1>

        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Shop *</label>
              <select required className={styles.select} value={form.shop_id} onChange={e => setForm({...form, shop_id: e.target.value})}>
                {shops.length === 0 && <option value="">No shops yet — add a shop first</option>}
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Product name *</label>
              <input required className={styles.input} placeholder="e.g. Nike Air Max 270" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Price (ALL) *</label>
                <input required type="number" className={styles.input} placeholder="3200" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Category *</label>
                <select required className={styles.select} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description *</label>
              <textarea
                required
                className={styles.textarea}
                placeholder="Describe your product…"
                rows={4}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Sizes (comma separated)</label>
                <input className={styles.input} placeholder="S, M, L or 40, 41, 42" value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} />
              </div>
            </div>

            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.trending} onChange={e => setForm({...form, trending: e.target.checked})} />
              Mark as trending
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/seller')}>Cancel</button>
            <button type="submit" className={styles.publishBtn} disabled={loading}>
              {loading ? 'Publishing…' : 'Publish product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
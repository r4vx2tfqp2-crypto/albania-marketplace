import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './AddProduct.module.css';

const CATEGORIES = ['shoes', 'clothes', 'electronics', 'beauty', 'home', 'sports', 'gifts'];

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', price: '', category: 'shoes',
    description: '', sizes: '', in_stock: true, trending: false
  });

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '',
        price: data.price || '',
        category: data.category || 'shoes',
        description: data.description || '',
        sizes: data.sizes?.join(', ') || '',
        in_stock: data.in_stock ?? true,
        trending: data.trending || false,
      });
    }
    setFetching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.from('products').update({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      description: form.description,
      sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
      in_stock: form.in_stock,
      trending: form.trending,
    }).eq('id', id);

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSaved(true);
    setTimeout(() => navigate('/seller'), 2000);
  };

  if (fetching) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center', color: 'var(--green)' }}>
        <CheckCircle size={64} strokeWidth={1.5} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>Product updated!</h2>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate('/seller')}>
          <ArrowLeft size={16} /> Back to dashboard
        </button>

        <h1 className={styles.title}>Edit product</h1>

        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Product name *</label>
              <input required className={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Price (ALL) *</label>
                <input required type="number" className={styles.input} value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
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
              <textarea required className={styles.textarea} rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Sizes (comma separated)</label>
              <input className={styles.input} placeholder="S, M, L or 40, 41, 42" value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.in_stock} onChange={e => setForm({...form, in_stock: e.target.checked})} />
                In stock
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.trending} onChange={e => setForm({...form, trending: e.target.checked})} />
                Mark as trending
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/seller')}>Cancel</button>
            <button type="submit" className={styles.publishBtn} disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

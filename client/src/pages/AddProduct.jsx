import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import styles from './AddProduct.module.css';

const CATEGORIES = ['shoes', 'clothes', 'electronics', 'beauty', 'home', 'sports', 'gifts'];

export default function AddProduct() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', price: '', category: 'shoes',
    description: '', stock: '', sizes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => navigate('/seller'), 1800);
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

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Photo upload */}
          <div className={styles.photoUpload}>
            <Upload size={24} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />
            <div className={styles.photoText}>Click to upload photos</div>
            <div className={styles.photoSub}>JPG, PNG up to 5MB each</div>
          </div>

          <div className={styles.formGrid}>
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
                placeholder="Describe your product — material, features, condition…"
                rows={4}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Sizes (optional)</label>
                <input className={styles.input} placeholder="e.g. S, M, L or 40, 41, 42" value={form.sizes} onChange={e => setForm({...form, sizes: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Stock quantity</label>
                <input type="number" className={styles.input} placeholder="e.g. 10" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/seller')}>Cancel</button>
            <button type="submit" className={styles.publishBtn}>Publish product</button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './AddProduct.module.css';

const CATEGORIES = ['shoes', 'clothes', 'electronics', 'beauty', 'home', 'sports', 'gifts'];

const CATEGORY_FIELDS = {
  shoes: [
    { key: 'sizes', label: 'Available sizes', placeholder: '36, 37, 38, 39, 40, 41, 42, 43', type: 'text' },
    { key: 'material', label: 'Material', placeholder: 'e.g. Leather, Mesh, Synthetic', type: 'text' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Adidas, Puma', type: 'text' },
    { key: 'color', label: 'Color', placeholder: 'e.g. Black, White, Red', type: 'text' },
    { key: 'condition', label: 'Condition', placeholder: 'New / Used', type: 'text' },
  ],
  clothes: [
    { key: 'sizes', label: 'Available sizes', placeholder: 'XS, S, M, L, XL, XXL', type: 'text' },
    { key: 'material', label: 'Material', placeholder: 'e.g. Cotton, Polyester, Linen', type: 'text' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Zara, H&M', type: 'text' },
    { key: 'color', label: 'Color', placeholder: 'e.g. Blue, Black, White', type: 'text' },
    { key: 'gender', label: 'Gender', placeholder: 'Men / Women / Unisex', type: 'text' },
  ],
  electronics: [
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Apple, Samsung, Sony', type: 'text' },
    { key: 'model', label: 'Model', placeholder: 'e.g. iPhone 15 Pro, Galaxy S24', type: 'text' },
    { key: 'storage', label: 'Storage / Specs', placeholder: 'e.g. 256GB, 16GB RAM', type: 'text' },
    { key: 'color', label: 'Color', placeholder: 'e.g. Space Black, Silver', type: 'text' },
    { key: 'warranty', label: 'Warranty', placeholder: 'e.g. 1 year, 6 months', type: 'text' },
    { key: 'condition', label: 'Condition', placeholder: 'New / Refurbished / Used', type: 'text' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g. 187g', type: 'text' },
  ],
  beauty: [
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Charlotte Tilbury, Dyson', type: 'text' },
    { key: 'volume', label: 'Volume / Size', placeholder: 'e.g. 50ml, 30g', type: 'text' },
    { key: 'skin_type', label: 'Skin type', placeholder: 'e.g. All skin types, Oily, Dry', type: 'text' },
    { key: 'ingredients', label: 'Key ingredients', placeholder: 'e.g. Hyaluronic acid, Vitamin C', type: 'text' },
    { key: 'color', label: 'Shade / Color', placeholder: 'e.g. Fair, Medium, Deep', type: 'text' },
  ],
  home: [
    { key: 'material', label: 'Material', placeholder: 'e.g. Wood, Metal, Fabric', type: 'text' },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 120x60x75 cm', type: 'text' },
    { key: 'color', label: 'Color', placeholder: 'e.g. White, Oak, Black', type: 'text' },
    { key: 'weight', label: 'Weight', placeholder: 'e.g. 5kg', type: 'text' },
    { key: 'brand', label: 'Brand', placeholder: 'e.g. IKEA, Local made', type: 'text' },
  ],
  sports: [
    { key: 'brand', label: 'Brand', placeholder: 'e.g. Nike, Adidas, Wilson', type: 'text' },
    { key: 'sizes', label: 'Available sizes', placeholder: 'S, M, L or one size', type: 'text' },
    { key: 'color', label: 'Color', placeholder: 'e.g. Blue, Red', type: 'text' },
    { key: 'material', label: 'Material', placeholder: 'e.g. Polyester, Carbon fiber', type: 'text' },
    { key: 'sport_type', label: 'Sport type', placeholder: 'e.g. Football, Tennis, Gym', type: 'text' },
    { key: 'condition', label: 'Condition', placeholder: 'New / Used', type: 'text' },
  ],
  gifts: [
    { key: 'occasion', label: 'Occasion', placeholder: 'e.g. Birthday, Wedding, Christmas', type: 'text' },
    { key: 'color', label: 'Color', placeholder: 'e.g. Red, Gold, Mixed', type: 'text' },
    { key: 'material', label: 'Material', placeholder: 'e.g. Wood, Glass, Fabric', type: 'text' },
    { key: 'dimensions', label: 'Dimensions', placeholder: 'e.g. 20x15x10 cm', type: 'text' },
    { key: 'brand', label: 'Brand (optional)', placeholder: 'e.g. Handmade, Local', type: 'text' },
  ],
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', price: '', category: 'shoes',
    description: '', shop_id: '', trending: false,
  });
  const [extraFields, setExtraFields] = useState({});

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('shops').select('id, name').eq('user_id', user.id);
    setShops(data || []);
    if (data && data.length > 0) setForm(f => ({ ...f, shop_id: data[0].id }));
  };

  const handleCategoryChange = (category) => {
    setForm(f => ({ ...f, category }));
    setExtraFields({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const sizes = extraFields.sizes
      ? extraFields.sizes.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const details = { ...extraFields };
    delete details.sizes;

    const { error } = await supabase.from('products').insert({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      description: form.description,
      shop_id: form.shop_id,
      sizes,
      details,
      in_stock: true,
      trending: form.trending,
      rating: 0,
      review_count: 0,
      user_id: user.id,
    });

    if (error) {
      setError('Something went wrong: ' + error.message);
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
                {shops.length === 0 && <option value="">No shops yet — create a shop first</option>}
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {shops.length === 0 && (
                <button type="button" onClick={() => navigate('/seller/add-shop')} style={{ marginTop: 8, fontSize: 13, color: 'var(--green)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  + Create a shop first
                </button>
              )}
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
                <select required className={styles.select} value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
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
                rows={3}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            {/* Dynamic category fields */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                {form.category} details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {CATEGORY_FIELDS[form.category]?.map(field => (
                  <div key={field.key} className={styles.field}>
                    <label className={styles.label}>{field.label}</label>
                    <input
                      className={styles.input}
                      placeholder={field.placeholder}
                      value={extraFields[field.key] || ''}
                      onChange={e => setExtraFields(f => ({ ...f, [field.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <label className={styles.checkLabel} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.trending} onChange={e => setForm({...form, trending: e.target.checked})} />
              Mark as trending
            </label>

          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/seller')}>Cancel</button>
            <button type="submit" className={styles.publishBtn} disabled={loading || shops.length === 0}>
              {loading ? 'Publishing…' : 'Publish product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
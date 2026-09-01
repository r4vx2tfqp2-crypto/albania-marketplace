import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Upload, X, Plus, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resizeImage } from '../lib/resizeImage';
import { colorToHex } from '../lib/colors';
import { generateListing } from '../lib/aiListing';
import { CATEGORIES, PRESET_SIZES, PRESET_COLORS, CATEGORY_DETAILS } from '../data/productCategoryData';
import styles from './AddProduct.module.css';

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [failedImageCount, setFailedImageCount] = useState(0);

  // Combined ordered photo list -- each item is either an already-uploaded
  // photo ({ type: "existing", url }) or a newly-picked file awaiting
  // upload ({ type: "new", file, preview }). Keeping one ordered list (like
  // AddProduct.jsx's imagePreviews) instead of two separate arrays makes
  // remove/reorder-by-position trivial and keeps the "first = cover photo"
  // rule consistent with AddProduct.jsx.
  const [photos, setPhotos] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [customSize, setCustomSize] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [form, setForm] = useState({ name: '', price: '', category: 'shoes', description: '', in_stock: true });
  const [details, setDetails] = useState({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*').eq('id', id).single();
    if (data) {
      setForm({
        name: data.name || '',
        price: data.price || '',
        category: data.category || 'shoes',
        description: data.description || '',
        in_stock: data.in_stock ?? true,
      });
      setSelectedSizes(data.sizes || []);
      setPhotos((data.images || []).map(url => ({ type: 'existing', url })));
      // "colors" is stored inside the free-form `details` JSON (as a
      // comma-joined string, same as AddProduct.jsx writes it) rather than
      // its own column -- split it back out so the swatch picker below can
      // drive it, and keep the rest of details for the category fields.
      const { colors, ...restDetails } = data.details || {};
      setDetails(restDetails);
      setSelectedColors(colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : []);
    }
    setFetching(false);
  };

  const handleCategoryChange = (category) => {
    setForm(f => ({ ...f, category }));
    setSelectedSizes([]);
    setDetails({});
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({ type: 'new', file, preview: URL.createObjectURL(file) }));
    setPhotos(prev => [...prev, ...newFiles].slice(0, 10));
  };

  const removePhoto = (index) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const toggleSize = (size) => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleColor = (color) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);

  const addCustomSize = () => {
    const sizes = customSize.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    setSelectedSizes(prev => [...new Set([...prev, ...sizes])]);
    setCustomSize('');
  };

  const addCustomColor = () => {
    if (!customColor.trim()) return;
    setSelectedColors(prev => [...new Set([...prev, customColor.trim()])]);
    setCustomColor('');
  };

  const uploadOne = async (file, path, attempt = 1) => {
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (error) {
      if (attempt < 3) return uploadOne(file, path, attempt + 1);
      return null;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleGenerateAI = async () => {
    if (!form.name.trim()) { setAiError('Shkruaj emrin e produktit se pari.'); return; }
    setAiGenerating(true);
    setAiError('');
    const cover = photos[0];
    try {
      const result = await generateListing({
        name: form.name,
        category: form.category,
        existingDescription: form.description,
        imageFile: cover?.type === 'new' ? cover.file : undefined,
        imageUrl: cover?.type === 'existing' ? cover.url : undefined,
      });
      if (result.description) setForm(f => ({ ...f, description: result.description }));
      if (result.details) setDetails(d => ({ ...d, ...result.details }));
    } catch {
      setAiError('Gjenerimi me AI deshtoi. Provo perseri.');
    }
    setAiGenerating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const existingUrls = photos.filter(p => p.type === 'existing').map(p => p.url);
    const newPhotos = photos.filter(p => p.type === 'new');
    let uploadedUrls = [];
    let failed = 0;
    if (newPhotos.length > 0) {
      // Index new uploads past the current photo count so they can't collide
      // with (overwrite) the paths of photos already kept in this listing.
      for (let i = 0; i < newPhotos.length; i++) {
        const resized = await resizeImage(newPhotos[i].file);
        if (resized) {
          const ext = resized.name.split('.').pop();
          const path = id + '/' + (existingUrls.length + i) + '.' + ext;
          const url = await uploadOne(resized, path);
          if (url) uploadedUrls.push(url); else failed++;
        } else {
          failed++; // e.g. an unconvertible HEIC photo -- never uploaded, so it can't show as broken
        }
        setUploadProgress(Math.round(((i + 1) / newPhotos.length) * 100));
      }
      setFailedImageCount(failed);
    }
    // Preserve the on-screen order: walk `photos` and substitute each "new"
    // entry with its uploaded URL in the same position.
    let uploadIdx = 0;
    const finalImages = photos.map(p => p.type === 'existing' ? p.url : uploadedUrls[uploadIdx++]).filter(Boolean);

    const productDetails = { ...details };
    if (selectedColors.length > 0) productDetails.colors = selectedColors.join(', ');

    const { data, error } = await supabase.from('products').update({
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      description: form.description,
      sizes: selectedSizes,
      details: productDetails,
      images: finalImages,
      in_stock: form.in_stock,
    }).eq('id', id).select();

    // A blocked-by-RLS update (wrong owner, stale/invalid id) returns
    // error: null with zero rows affected, not an error -- check the
    // returned row explicitly instead of only checking `error`, otherwise
    // this silently shows "saved" for a write that never happened.
    if (error || !data || data.length === 0) {
      setError('Dicka shkoi gabim. Provo perseri.');
      setLoading(false);
      return;
    }

    setSaved(true);
    setTimeout(() => navigate('/seller'), 2000);
  };

  if (fetching) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Duke ngarkuar…</div>;

  if (saved) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh', gap: 12, textAlign: 'center', color: 'var(--green)' }}>
        <CheckCircle size={64} strokeWidth={1.5} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-1)' }}>Produkti u perditesua!</h2>
        {failedImageCount > 0 && (
          <p style={{ color: '#854F0B', fontSize: 13, background: 'var(--amber-light)', padding: '8px 14px', borderRadius: 8, maxWidth: 360 }}>
            {failedImageCount} nga fotot nuk u ngarkuan dot (lidhje e paqendrueshme ose format i pasuportuar, p.sh. HEIC). Provoni t'i konvertoni ne JPG dhe shtoni me vone duke redaktuar perseri.
          </p>
        )}
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Duke u ridrejtuar...</p>
      </div>
    );
  }

  const presetSizes = PRESET_SIZES[form.category] || PRESET_SIZES.default;
  const categoryDetails = CATEGORY_DETAILS[form.category] || [];
  const showsSizes = form.category === 'shoes' || form.category === 'clothes' || form.category === 'sports';

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate('/seller')}>
          <ArrowLeft size={16} /> Kthehu te paneli
        </button>

        <h1 className={styles.title}>Ndrysho produktin</h1>

        {error && (
          <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* SECTION 1 - PHOTOS */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--text-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>1</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Foto produktit</h2>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Deri ne 10 foto</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
                  <img src={p.type === 'existing' ? p.url : p.preview} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10, border: i === 0 ? '2px solid var(--green)' : '1px solid var(--border)' }} alt="" />
                  {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--green)', color: '#fff', fontSize: 9, textAlign: 'center', borderRadius: '0 0 8px 8px', padding: '2px 0' }}>KRYESORE</div>}
                  <button type="button" onClick={() => removePhoto(i)}
                    aria-label={'Hiq foton ' + (i + 1)}
                    style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <label style={{ cursor: 'pointer', width: 90, height: 90, border: '2px dashed var(--border-strong)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 11, gap: 4 }}>
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageChange} />
                  {photos.length === 0 ? <Upload size={20} /> : <Plus size={20} />}
                  Shto foto
                </label>
              )}
            </div>
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ background: 'var(--border)', borderRadius: 4, height: 4 }}>
                  <div style={{ background: 'var(--green)', height: '100%', borderRadius: 4, width: uploadProgress + '%', transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Duke ngarkuar {uploadProgress}%</div>
              </div>
            )}
          </div>

          {/* SECTION 2 - BASIC INFO */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--text-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>2</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Informacioni bazë</h2>
            </div>

            <div className={styles.field} style={{ marginBottom: 14 }}>
              <label className={styles.label} htmlFor="product-name">Emri i produktit *</label>
              <input id="product-name" required className={styles.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-price">Çmimi (ALL) *</label>
                <input id="product-price" required type="number" className={styles.input} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-category">Kategoria *</label>
                <select id="product-category" required className={styles.select} value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <label className={styles.label} htmlFor="product-description" style={{ marginBottom: 0 }}>Pershkrimi *</label>
                <button type="button" onClick={handleGenerateAI} disabled={aiGenerating || !form.name.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--green)', background: 'var(--green-light)', color: 'var(--green-dark)', fontSize: 12, fontWeight: 600, cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', opacity: form.name.trim() ? 1 : 0.5, flexShrink: 0 }}>
                  <Sparkles size={12} /> {aiGenerating ? 'Duke gjeneruar...' : 'Gjenero me AI'}
                </button>
              </div>
              <textarea id="product-description" required className={styles.textarea} rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              {aiError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{aiError}</div>}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.in_stock} onChange={e => setForm({ ...form, in_stock: e.target.checked })} />
              Ne stok
            </label>
          </div>

          {/* SECTION 3 - SIZES */}
          {showsSizes && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--text-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>3</div>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Masat e disponueshme</h2>
              </div>
              {presetSizes.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {presetSizes.map(size => (
                    <button key={size} type="button" onClick={() => toggleSize(size)}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                        borderColor: selectedSizes.includes(size) ? 'var(--text-1)' : 'var(--border-strong)',
                        background: selectedSizes.includes(size) ? 'var(--text-1)' : 'transparent',
                        color: selectedSizes.includes(size) ? '#fff' : 'var(--text-2)' }}>
                      {size}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input className={styles.input} placeholder="Shto mase tjeter (p.sh. 46, 47)..."
                  value={customSize} onChange={e => setCustomSize(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                  style={{ flex: 1 }} />
                <button type="button" onClick={addCustomSize}
                  style={{ padding: '0 16px', background: 'var(--text-1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  Shto
                </button>
              </div>
              {selectedSizes.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selectedSizes.map(s => (
                    <span key={s} style={{ background: 'var(--green-light)', color: 'var(--green-dark)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {s}
                      <button type="button" onClick={() => toggleSize(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4 - COLORS */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--text-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {showsSizes ? '4' : '3'}
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Ngjyrat e disponueshme</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {PRESET_COLORS.map(color => (
                <button key={color} type="button" onClick={() => toggleColor(color)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px 6px 8px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                    borderColor: selectedColors.includes(color) ? 'var(--text-1)' : 'var(--border-strong)',
                    background: selectedColors.includes(color) ? 'var(--text-1)' : 'transparent',
                    color: selectedColors.includes(color) ? '#fff' : 'var(--text-2)' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: colorToHex(color), border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                  {color}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className={styles.input} placeholder="Shto ngjyre tjeter..."
                value={customColor} onChange={e => setCustomColor(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomColor(); } }}
                style={{ flex: 1 }} />
              <button type="button" onClick={addCustomColor}
                style={{ padding: '0 16px', background: 'var(--text-1)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                Shto
              </button>
            </div>
            {selectedColors.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selectedColors.map(c => (
                  <span key={c} style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: colorToHex(c), border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                    {c}
                    <button type="button" onClick={() => toggleColor(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5 - DETAILS */}
          {categoryDetails.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--text-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {showsSizes ? '5' : '4'}
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Detajet e produktit</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {categoryDetails.map(field => (
                  <div key={field.key} className={styles.field}>
                    <label className={styles.label}>{field.label}</label>
                    {field.type === 'select' ? (
                      <select className={styles.select} value={details[field.key] || ''}
                        onChange={e => setDetails(d => ({ ...d, [field.key]: e.target.value }))}>
                        <option value="">Zgjidh...</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className={styles.input} placeholder={field.placeholder}
                        value={details[field.key] || ''}
                        onChange={e => setDetails(d => ({ ...d, [field.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/seller')}>Anulo</button>
            <button type="submit" className={styles.publishBtn} disabled={loading}>
              {loading ? 'Duke ruajtur...' : 'Ruaj ndryshimet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

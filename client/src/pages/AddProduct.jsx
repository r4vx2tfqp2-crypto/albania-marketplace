import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Upload, X, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "./AddProduct.module.css";

const CATEGORIES = [
  { key: "shoes", label: "Kepuce & Sandale", icon: "👟" },
  { key: "clothes", label: "Rroba & Mode", icon: "👕" },
  { key: "electronics", label: "Elektronike", icon: "📱" },
  { key: "beauty", label: "Bukuri & Kozmetike", icon: "💄" },
  { key: "home", label: "Shtepi & Jetese", icon: "🏠" },
  { key: "sports", label: "Sporte & Fitness", icon: "⚽" },
  { key: "gifts", label: "Dhurata", icon: "🎁" },
];

const PRESET_SIZES = {
  shoes: ["35","36","37","38","39","40","41","42","43","44","45"],
  clothes: ["XS","S","M","L","XL","XXL","XXXL"],
  sports: ["XS","S","M","L","XL","XXL"],
  default: [],
};

const PRESET_COLORS = ["E zeze","E bardhe","Gri","Kafe","E kuqe","Blu","E gjelber","Verdhe","Portokalli","Rozë","Vjollce","Ari","Argjend"];

const CATEGORY_DETAILS = {
  shoes: [
    { key: "brand", label: "Marka", placeholder: "Nike, Adidas, Zara..." },
    { key: "material", label: "Materiali", placeholder: "Lekure, Mesh, Sintetik..." },
    { key: "gender", label: "Gjinia", type: "select", options: ["Burra", "Gra", "Femije", "Unisex"] },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri", "Si i ri", "I perdorur"] },
  ],
  clothes: [
    { key: "brand", label: "Marka", placeholder: "Zara, H&M, Nike..." },
    { key: "material", label: "Materiali", placeholder: "Pambuk, Liri, Poliester..." },
    { key: "gender", label: "Gjinia", type: "select", options: ["Burra", "Gra", "Femije", "Unisex"] },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri", "Si i ri", "I perdorur"] },
  ],
  electronics: [
    { key: "brand", label: "Marka", placeholder: "Apple, Samsung, Sony..." },
    { key: "model", label: "Modeli", placeholder: "iPhone 15 Pro, Galaxy S24..." },
    { key: "storage", label: "Kapaciteti", placeholder: "64GB, 128GB, 256GB..." },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri", "I rinovuar", "I perdorur"] },
    { key: "warranty", label: "Garancia", placeholder: "1 vit, 2 vjet, Pa garanci..." },
  ],
  beauty: [
    { key: "brand", label: "Marka", placeholder: "L Oreal, Maybelline..." },
    { key: "volume", label: "Volumi/Sasia", placeholder: "30ml, 50ml, 100ml..." },
    { key: "skin_type", label: "Tipi i lekures", type: "select", options: ["Te gjitha tipet", "Lekure e thate", "Lekure yndyrore", "Lekure e ndjeshme"] },
  ],
  home: [
    { key: "brand", label: "Marka", placeholder: "IKEA, Ashley..." },
    { key: "material", label: "Materiali", placeholder: "Dru, Metal, Qelq..." },
    { key: "dimensions", label: "Permasat", placeholder: "120x60x75 cm..." },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri", "Si i ri", "I perdorur"] },
  ],
  sports: [
    { key: "brand", label: "Marka", placeholder: "Nike, Adidas, Puma..." },
    { key: "sport_type", label: "Sporti", placeholder: "Futboll, Basketboll, Tenis..." },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri", "I perdorur"] },
  ],
  gifts: [
    { key: "occasion", label: "Rasti", placeholder: "Ditelindja, Dasma, Vjetori..." },
    { key: "material", label: "Materiali", placeholder: "Dru, Qelq, Metal..." },
    { key: "dimensions", label: "Permasat", placeholder: "20x15x10 cm..." },
  ],
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState(1);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [form, setForm] = useState({ name: "", price: "", category: "shoes", description: "", shop_id: "", trending: false });
  const [details, setDetails] = useState({});

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("shops").select("id, name").eq("user_id", user.id);
    setShops(data || []);
    if (data && data.length > 0) setForm(f => ({ ...f, shop_id: data[0].id }));
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const combined = [...images, ...newFiles].slice(0, 10);
    setImages(combined);
    setImagePreviews(combined.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (color) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const addCustomSize = () => {
    const sizes = customSize.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
    setSelectedSizes(prev => [...new Set([...prev, ...sizes])]);
    setCustomSize("");
  };

  const addCustomColor = () => {
    if (!customColor.trim()) return;
    setSelectedColors(prev => [...new Set([...prev, customColor.trim()])]);
    setCustomColor("");
  };

  const uploadImages = async (productId) => {
    const urls = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split(".").pop();
      const path = productId + "/" + i + "." + ext;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
      setUploadProgress(Math.round(((i + 1) / images.length) * 100));
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const productDetails = { ...details };
    if (selectedColors.length > 0) productDetails.colors = selectedColors.join(", ");

    const { data: product, error: insertError } = await supabase.from("products").insert({
      name: form.name, price: parseFloat(form.price), category: form.category,
      description: form.description, shop_id: form.shop_id,
      sizes: selectedSizes,
      details: productDetails,
      in_stock: true, trending: form.trending, rating: 0, review_count: 0, user_id: user.id,
    }).select().single();
    if (insertError) { setError("Dicka shkoi gabim: " + insertError.message); setLoading(false); return; }
    if (images.length > 0) {
      const imageUrls = await uploadImages(product.id);
      await supabase.from("products").update({ images: imageUrls }).eq("id", product.id);
    }
    setSaved(true);
    setTimeout(() => navigate("/seller"), 2000);
  };

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, textAlign: "center", color: "var(--green)" }}>
        <CheckCircle size={64} strokeWidth={1.5} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-1)" }}>Produkti u publikua!</h2>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Duke u ridrejtuar...</p>
      </div>
    );
  }

  const presetSizes = PRESET_SIZES[form.category] || PRESET_SIZES.default;
  const categoryDetails = CATEGORY_DETAILS[form.category] || [];

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kthehu
        </button>
        <h1 className={styles.title}>Shto produkt te ri</h1>

        {error && (
          <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* SECTION 1 - PHOTOS */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--text-1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>1</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Foto produktit</h2>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>Deri ne 10 foto</span>
            </div>
            <label style={{ cursor: "pointer", display: "block" }}>
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
              {imagePreviews.length === 0 ? (
                <div style={{ border: "2px dashed var(--border-strong)", borderRadius: 12, padding: 32, textAlign: "center" }}>
                  <Upload size={28} strokeWidth={1.5} style={{ color: "var(--text-3)", marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Kliko per te ngarkuar foto</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>JPG, PNG — Max 5MB secila — Deri ne 10 foto</div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
                      <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: i === 0 ? "2px solid var(--green)" : "1px solid var(--border)" }} alt="" />
                      {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--green)", color: "#fff", fontSize: 9, textAlign: "center", borderRadius: "0 0 8px 8px", padding: "2px 0" }}>KRYESORE</div>}
                      <button type="button" onClick={(e) => { e.preventDefault(); removeImage(i); }}
                        style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--red)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 10 && (
                    <div style={{ width: 90, height: 90, border: "2px dashed var(--border-strong)", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 11, gap: 4 }}>
                      <Plus size={20} />
                      Shto foto
                    </div>
                  )}
                </div>
              )}
            </label>
            {loading && uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ background: "var(--border)", borderRadius: 4, height: 4 }}>
                  <div style={{ background: "var(--green)", height: "100%", borderRadius: 4, width: uploadProgress + "%", transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Duke ngarkuar {uploadProgress}%</div>
              </div>
            )}
          </div>

          {/* SECTION 2 - BASIC INFO */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--text-1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>2</div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Informacioni bazë</h2>
            </div>

            <div className={styles.field} style={{ marginBottom: 14 }}>
              <label className={styles.label}>Dyqani *</label>
              <select required className={styles.select} value={form.shop_id} onChange={e => setForm({...form, shop_id: e.target.value})}>
                {shops.length === 0 && <option value="">Nuk ka dyqane — krijo nje dyqan fillimisht</option>}
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className={styles.field} style={{ marginBottom: 14 }}>
              <label className={styles.label}>Emri i produktit *</label>
              <input required className={styles.input} placeholder="p.sh. Nike Air Max 270 — Madhesia 42"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div className={styles.field}>
                <label className={styles.label}>Çmimi (ALL) *</label>
                <input required type="number" className={styles.input} placeholder="3200"
                  value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Kategoria *</label>
                <select required className={styles.select} value={form.category}
                  onChange={e => { setForm(f => ({...f, category: e.target.value})); setSelectedSizes([]); setDetails({}); }}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Pershkrimi *</label>
              <textarea required className={styles.textarea} rows={3}
                placeholder="Pershkruaj produktin — materiali, veçorite kryesore, gjendja..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>

          {/* SECTION 3 - SIZES */}
          {(form.category === "shoes" || form.category === "clothes" || form.category === "sports") && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--text-1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>3</div>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Masat e disponueshme</h2>
              </div>
              {presetSizes.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {presetSizes.map(size => (
                    <button key={size} type="button" onClick={() => toggleSize(size)}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
                        borderColor: selectedSizes.includes(size) ? "var(--text-1)" : "var(--border-strong)",
                        background: selectedSizes.includes(size) ? "var(--text-1)" : "transparent",
                        color: selectedSizes.includes(size) ? "#fff" : "var(--text-2)" }}>
                      {size}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <input className={styles.input} placeholder="Shto mase tjeter (p.sh. 46, 47)..."
                  value={customSize} onChange={e => setCustomSize(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                  style={{ flex: 1 }} />
                <button type="button" onClick={addCustomSize}
                  style={{ padding: "0 16px", background: "var(--text-1)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}>
                  Shto
                </button>
              </div>
              {selectedSizes.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {selectedSizes.map(s => (
                    <span key={s} style={{ background: "var(--green-light)", color: "var(--green-dark)", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                      {s}
                      <button type="button" onClick={() => toggleSize(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4 - COLORS */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--text-1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {form.category === "shoes" || form.category === "clothes" || form.category === "sports" ? "4" : "3"}
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Ngjyrat e disponueshme</h2>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {PRESET_COLORS.map(color => (
                <button key={color} type="button" onClick={() => toggleColor(color)}
                  style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
                    borderColor: selectedColors.includes(color) ? "var(--text-1)" : "var(--border-strong)",
                    background: selectedColors.includes(color) ? "var(--text-1)" : "transparent",
                    color: selectedColors.includes(color) ? "#fff" : "var(--text-2)" }}>
                  {color}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className={styles.input} placeholder="Shto ngjyre tjeter..."
                value={customColor} onChange={e => setCustomColor(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomColor(); } }}
                style={{ flex: 1 }} />
              <button type="button" onClick={addCustomColor}
                style={{ padding: "0 16px", background: "var(--text-1)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13 }}>
                Shto
              </button>
            </div>
            {selectedColors.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selectedColors.map(c => (
                  <span key={c} style={{ background: "var(--blue-light)", color: "var(--blue)", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                    {c}
                    <button type="button" onClick={() => toggleColor(c)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5 - DETAILS */}
          {categoryDetails.length > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 24, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--text-1)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {form.category === "shoes" || form.category === "clothes" || form.category === "sports" ? "5" : "4"}
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Detajet e produktit</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {categoryDetails.map(field => (
                  <div key={field.key} className={styles.field}>
                    <label className={styles.label}>{field.label}</label>
                    {field.type === "select" ? (
                      <select className={styles.select} value={details[field.key] || ""}
                        onChange={e => setDetails(d => ({...d, [field.key]: e.target.value}))}>
                        <option value="">Zgjidh...</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input className={styles.input} placeholder={field.placeholder}
                        value={details[field.key] || ""}
                        onChange={e => setDetails(d => ({...d, [field.key]: e.target.value}))} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRENDING */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16, marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={form.trending} onChange={e => setForm({...form, trending: e.target.checked})}
                style={{ width: 16, height: 16, cursor: "pointer" }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Shenjo si Trending 🔥</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Produkti do te shfaqet ne seksionin Trending</div>
              </div>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/seller")}>Anulo</button>
            <button type="submit" className={styles.publishBtn} disabled={loading || shops.length === 0}>
              {loading ? "Duke publikuar..." : "Publiko produktin →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

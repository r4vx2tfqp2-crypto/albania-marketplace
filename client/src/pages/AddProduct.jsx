import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Upload, X, Plus, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { resizeImage } from "../lib/resizeImage";
import { colorToHex } from "../lib/colors";
import { generateListing } from "../lib/aiListing";
import { CATEGORIES, PRESET_SIZES, PRESET_COLORS, CATEGORY_DETAILS } from "../data/productCategoryData";
import styles from "./AddProduct.module.css";

const DRAFT_KEY = "tregu_add_product_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function AddProduct() {
  const navigate = useNavigate();
  const draft = loadDraft();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [failedImageCount, setFailedImageCount] = useState(0);
  const [step, setStep] = useState(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedSizes, setSelectedSizes] = useState(draft?.selectedSizes || []);
  const [selectedColors, setSelectedColors] = useState(draft?.selectedColors || []);
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [form, setForm] = useState(draft?.form || { name: "", price: "", category: "shoes", description: "", shop_id: "" });
  const [details, setDetails] = useState(draft?.details || {});
  const [draftRestored, setDraftRestored] = useState(!!draft);

  useEffect(() => { fetchShops(); }, []);

  // Autosave text fields (not photos -- Files can't survive localStorage)
  // so an accidental refresh/back/crash mid-listing, especially during the
  // slow photo-upload step, doesn't force a full restart.
  useEffect(() => {
    const hasContent = form.name || form.price || form.description || selectedSizes.length || selectedColors.length || Object.keys(details).length;
    if (!hasContent) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, details, selectedSizes, selectedColors }));
  }, [form, details, selectedSizes, selectedColors]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm({ name: "", price: "", category: "shoes", description: "", shop_id: form.shop_id });
    setDetails({});
    setSelectedSizes([]);
    setSelectedColors([]);
    setDraftRestored(false);
  };

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

  const uploadOne = async (file, path, attempt = 1) => {
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) {
      if (attempt < 3) return uploadOne(file, path, attempt + 1); // flaky mobile connection -- retry before giving up
      return null;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const uploadImages = async (productId) => {
    const urls = [];
    let failed = 0;
    for (let i = 0; i < images.length; i++) {
      const resized = await resizeImage(images[i]);
      if (resized) {
        const ext = resized.name.split(".").pop();
        const path = productId + "/" + i + "." + ext;
        const url = await uploadOne(resized, path);
        if (url) urls.push(url); else failed++;
      } else {
        failed++; // e.g. an unconvertible HEIC photo -- never uploaded, so it can't show as broken
      }
      setUploadProgress(Math.round(((i + 1) / images.length) * 100));
    }
    setFailedImageCount(failed);
    return urls;
  };

  const handleGenerateAI = async () => {
    if (!form.name.trim()) { setAiError("Shkruaj emrin e produktit se pari."); return; }
    setAiGenerating(true);
    setAiError("");
    try {
      const result = await generateListing({
        name: form.name,
        category: form.category,
        existingDescription: form.description,
        imageFile: images[0], // first/cover photo, still a local File at this stage
      });
      if (result.description) setForm(f => ({ ...f, description: result.description }));
      if (result.details) setDetails(d => ({ ...d, ...result.details }));
    } catch {
      setAiError("Gjenerimi me AI deshtoi. Provo perseri.");
    }
    setAiGenerating(false);
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
      in_stock: true, rating: 0, review_count: 0, user_id: user.id,
    }).select().single();
    if (insertError) { setError("Dicka shkoi gabim: " + insertError.message); setLoading(false); return; }
    if (images.length > 0) {
      const imageUrls = await uploadImages(product.id);
      await supabase.from("products").update({ images: imageUrls }).eq("id", product.id);
    }
    localStorage.removeItem(DRAFT_KEY);
    setSaved(true);
    setTimeout(() => navigate("/seller"), 2500);
  };

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60dvh", gap: 12, textAlign: "center", color: "var(--green)" }}>
        <CheckCircle size={64} strokeWidth={1.5} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-1)" }}>Produkti u publikua!</h2>
        {failedImageCount > 0 && (
          <p style={{ color: "#854F0B", fontSize: 13, background: "var(--amber-light)", padding: "8px 14px", borderRadius: 8, maxWidth: 360 }}>
            {failedImageCount} nga fotot nuk u ngarkuan dot (lidhje e paqendrueshme ose format i pasuportuar, p.sh. HEIC). Provoni t'i konvertoni ne JPG dhe shtoni me vone duke redaktuar produktin.
          </p>
        )}
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
        {draftRestored && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--blue-light)", color: "var(--blue)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 13 }}>
            <span>Rikuperuam nje draft te paplotesuar. Fotot duhen shtuar perseri.</span>
            <button type="button" onClick={clearDraft} style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, flexShrink: 0 }}>
              Fillo nga e para
            </button>
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
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>JPG, PNG — ngjeshen automatikisht — Deri ne 10 foto</div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  {imagePreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative", width: 90, height: 90 }}>
                      <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: i === 0 ? "2px solid var(--green)" : "1px solid var(--border)" }} alt="" />
                      {i === 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--green)", color: "#fff", fontSize: 9, textAlign: "center", borderRadius: "0 0 8px 8px", padding: "2px 0" }}>KRYESORE</div>}
                      <button type="button" onClick={(e) => { e.preventDefault(); removeImage(i); }}
                        aria-label={"Hiq foton " + (i + 1)}
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
              <label className={styles.label} htmlFor="product-shop">Dyqani *</label>
              <select id="product-shop" required className={styles.select} value={form.shop_id} onChange={e => setForm({...form, shop_id: e.target.value})}>
                {shops.length === 0 && <option value="">Nuk ka dyqane — krijo nje dyqan fillimisht</option>}
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className={styles.field} style={{ marginBottom: 14 }}>
              <label className={styles.label} htmlFor="product-name">Emri i produktit *</label>
              <input id="product-name" required className={styles.input} placeholder="p.sh. Nike Air Max 270 — Madhesia 42"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-price">Çmimi (ALL) *</label>
                <input id="product-price" required type="number" className={styles.input} placeholder="3200"
                  value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="product-category">Kategoria *</label>
                <select id="product-category" required className={styles.select} value={form.category}
                  onChange={e => { setForm(f => ({...f, category: e.target.value})); setSelectedSizes([]); setDetails({}); }}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <label className={styles.label} htmlFor="product-description" style={{ marginBottom: 0 }}>Pershkrimi *</label>
                <button type="button" onClick={handleGenerateAI} disabled={aiGenerating || !form.name.trim()}
                  title={images.length === 0 ? "Shto nje foto per rezultate me te sakta" : ""}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, border: "1px solid var(--green)", background: "var(--green-light)", color: "var(--green-dark)", fontSize: 12, fontWeight: 600, cursor: form.name.trim() ? "pointer" : "not-allowed", fontFamily: "var(--font-body)", opacity: form.name.trim() ? 1 : 0.5, flexShrink: 0 }}>
                  <Sparkles size={12} /> {aiGenerating ? "Duke gjeneruar..." : "Gjenero me AI"}
                </button>
              </div>
              <textarea id="product-description" required className={styles.textarea} rows={3}
                placeholder="Pershkruaj produktin — materiali, veçorite kryesore, gjendja..."
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              {aiError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>{aiError}</div>}
              {!aiError && images.length === 0 && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>Këshillë: shto nje foto para se te gjenerosh me AI per pershkrim dhe detaje me te sakta.</div>
              )}
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
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px 6px 8px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
                    borderColor: selectedColors.includes(color) ? "var(--text-1)" : "var(--border-strong)",
                    background: selectedColors.includes(color) ? "var(--text-1)" : "transparent",
                    color: selectedColors.includes(color) ? "#fff" : "var(--text-2)" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: colorToHex(color), border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
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
                  <span key={c} style={{ background: "var(--blue-light)", color: "var(--blue)", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: colorToHex(c), border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0 }} />
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

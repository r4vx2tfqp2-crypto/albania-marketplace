import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Upload, X, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import styles from "./AddProduct.module.css";

const CATEGORIES = ["shoes", "clothes", "electronics", "beauty", "home", "sports", "gifts"];

const CATEGORY_FIELDS = {
  shoes: [
    { key: "sizes", label: "Available sizes", placeholder: "36, 37, 38, 39, 40, 41, 42, 43" },
    { key: "material", label: "Material", placeholder: "e.g. Leather, Mesh" },
    { key: "brand", label: "Brand", placeholder: "e.g. Nike, Adidas" },
    { key: "color", label: "Color", placeholder: "e.g. Black, White" },
  ],
  clothes: [
    { key: "sizes", label: "Available sizes", placeholder: "XS, S, M, L, XL" },
    { key: "material", label: "Material", placeholder: "e.g. Cotton, Linen" },
    { key: "brand", label: "Brand", placeholder: "e.g. Zara, H&M" },
    { key: "color", label: "Color", placeholder: "e.g. Blue, Black" },
    { key: "gender", label: "Gender", placeholder: "Men / Women / Unisex" },
  ],
  electronics: [
    { key: "brand", label: "Brand", placeholder: "e.g. Apple, Samsung" },
    { key: "model", label: "Model", placeholder: "e.g. iPhone 15 Pro" },
    { key: "storage", label: "Storage / Specs", placeholder: "e.g. 256GB" },
    { key: "color", label: "Color", placeholder: "e.g. Space Black" },
    { key: "warranty", label: "Warranty", placeholder: "e.g. 1 year" },
    { key: "condition", label: "Condition", placeholder: "New / Refurbished / Used" },
  ],
  beauty: [
    { key: "brand", label: "Brand", placeholder: "e.g. Charlotte Tilbury" },
    { key: "volume", label: "Volume / Size", placeholder: "e.g. 50ml" },
    { key: "skin_type", label: "Skin type", placeholder: "e.g. All skin types" },
    { key: "color", label: "Shade / Color", placeholder: "e.g. Fair, Medium" },
  ],
  home: [
    { key: "material", label: "Material", placeholder: "e.g. Wood, Metal" },
    { key: "dimensions", label: "Dimensions", placeholder: "e.g. 120x60x75 cm" },
    { key: "color", label: "Color", placeholder: "e.g. White, Oak" },
    { key: "brand", label: "Brand", placeholder: "e.g. IKEA" },
  ],
  sports: [
    { key: "brand", label: "Brand", placeholder: "e.g. Nike, Adidas" },
    { key: "sizes", label: "Available sizes", placeholder: "S, M, L or one size" },
    { key: "color", label: "Color", placeholder: "e.g. Blue, Red" },
    { key: "sport_type", label: "Sport type", placeholder: "e.g. Football, Tennis" },
  ],
  gifts: [
    { key: "occasion", label: "Occasion", placeholder: "e.g. Birthday, Wedding" },
    { key: "color", label: "Color", placeholder: "e.g. Red, Gold" },
    { key: "material", label: "Material", placeholder: "e.g. Wood, Glass" },
    { key: "dimensions", label: "Dimensions", placeholder: "e.g. 20x15x10 cm" },
  ],
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [shops, setShops] = useState([]);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ name: "", price: "", category: "shoes", description: "", shop_id: "", trending: false });
  const [extraFields, setExtraFields] = useState({});

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("shops").select("id, name").eq("user_id", user.id);
    setShops(data || []);
    if (data && data.length > 0) setForm(f => ({ ...f, shop_id: data[0].id }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
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

  const handleCategoryChange = (category) => {
    setForm(f => ({ ...f, category }));
    setExtraFields({});
  };

  const generateWithAI = async () => {
    if (images.length === 0) { setError("Ngarko nje foto para se te perdoresh AI!"); return; }
    setAiLoading(true);
    setError("");

    try {
      const file = images[0];
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = () => rej(new Error("Read failed"));
        reader.readAsDataURL(file);
      });

      const mimeType = file.type || "image/jpeg";
      const GEMINI_KEY = "AIzaSyAeAZ-IgdpUZSoDquHrWxcRoAKVBSVqDVo";

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: { mime_type: mimeType, data: base64 }
                },
                {
                  text: "You are helping an Albanian seller list a product on Tregu.store marketplace. Analyze this product image and respond ONLY with a JSON object (no markdown, no extra text) with these exact fields: {name: string (product name in Albanian max 60 chars), description: string (product description in Albanian 2-3 sentences), category: string (one of: shoes clothes electronics beauty home sports gifts), price: number (suggested price in Albanian Lek ALL realistic), brand: string (brand if visible else empty string), color: string (main color in Albanian)}. Be accurate."
                }
              ]
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
          })
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setForm(f => ({
        ...f,
        name: parsed.name || f.name,
        description: parsed.description || f.description,
        category: CATEGORIES.includes(parsed.category) ? parsed.category : f.category,
        price: parsed.price ? String(parsed.price) : f.price,
      }));

      if (parsed.brand || parsed.color) {
        setExtraFields(f => ({
          ...f,
          ...(parsed.brand ? { brand: parsed.brand } : {}),
          ...(parsed.color ? { color: parsed.color } : {}),
        }));
      }

    } catch (err) {
      console.error("AI error:", err);
      setError("AI nuk mundi te gjeneroje. Provoni perseri.");
    }

    setAiLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const sizes = extraFields.sizes ? extraFields.sizes.split(",").map(s => s.trim()).filter(Boolean) : [];
    const details = { ...extraFields };
    delete details.sizes;
    const { data: product, error: insertError } = await supabase.from("products").insert({
      name: form.name, price: parseFloat(form.price), category: form.category,
      description: form.description, shop_id: form.shop_id, sizes, details,
      in_stock: true, trending: form.trending, rating: 0, review_count: 0, user_id: user.id,
    }).select().single();
    if (insertError) { setError("Something went wrong: " + insertError.message); setLoading(false); return; }
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

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kthehu
        </button>
        <h1 className={styles.title}>Shto produkt</h1>
        {error && (
          <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>

            {/* Image upload */}
            <div className={styles.field}>
              <label className={styles.label}>Foto produktit (deri ne 5)</label>
              <label style={{ cursor: "pointer" }}>
                <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageChange} />
                {imagePreviews.length === 0 ? (
                  <div className={styles.photoUpload}>
                    <Upload size={24} strokeWidth={1.5} style={{ color: "var(--text-3)" }} />
                    <div className={styles.photoText}>Kliko per te ngarkuar foto</div>
                    <div className={styles.photoSub}>JPG, PNG deri ne 5MB</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: "relative", width: 100, height: 100 }}>
                        <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} alt="" />
                        <button type="button" onClick={(e) => { e.preventDefault(); removeImage(i); }}
                          style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "var(--red)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <div style={{ width: 100, height: 100, border: "2px dashed var(--border-strong)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 24 }}>+</div>
                  </div>
                )}
              </label>

              {/* AI Generate button */}
              {imagePreviews.length > 0 && (
                <button type="button" onClick={generateWithAI} disabled={aiLoading}
                  style={{ marginTop: 12, width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)",
                    background: aiLoading ? "var(--border)" : "linear-gradient(135deg, #1D9E75, #185FA5)",
                    color: "#fff", border: "none", cursor: aiLoading ? "not-allowed" : "pointer",
                    fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Sparkles size={16} />
                  {aiLoading ? "AI po gjeneron..." : "Gjenero me AI automatikisht"}
                </button>
              )}

              {/* AI Generate button */}
              {imagePreviews.length > 0 && (
                <button type="button" onClick={generateWithAI} disabled={aiLoading}
                  style={{ marginTop: 12, width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)",
                    background: aiLoading ? "var(--border)" : "linear-gradient(135deg, #1D9E75, #185FA5)",
                    color: "#fff", border: "none", cursor: aiLoading ? "not-allowed" : "pointer",
                    fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  ✨ {aiLoading ? "AI po gjeneron..." : "Gjenero me AI automatikisht"}
                </button>
              )}

              {loading && uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ background: "var(--border)", borderRadius: 4, height: 4 }}>
                    <div style={{ background: "var(--green)", height: "100%", borderRadius: 4, width: uploadProgress + "%", transition: "width 0.3s" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Duke ngarkuar {uploadProgress}%</div>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Dyqani *</label>
              <select required className={styles.select} value={form.shop_id} onChange={e => setForm({...form, shop_id: e.target.value})}>
                {shops.length === 0 && <option value="">Nuk ka dyqane — krijo nje dyqan fillimisht</option>}
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {shops.length === 0 && (
                <button type="button" onClick={() => navigate("/seller/add-shop")} style={{ marginTop: 8, fontSize: 13, color: "var(--green)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-body)" }}>
                  + Krijo nje dyqan fillimisht
                </button>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Emri i produktit *</label>
              <input required className={styles.input} placeholder="p.sh. Nike Air Max 270" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label}>Cmimi (ALL) *</label>
                <input required type="number" className={styles.input} placeholder="3200" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Kategoria *</label>
                <select required className={styles.select} value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Pershkrimi *</label>
              <textarea required className={styles.textarea} placeholder="Pershkruaj produktin..." rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>
                {form.category} detajet
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {CATEGORY_FIELDS[form.category]?.map(field => (
                  <div key={field.key} className={styles.field}>
                    <label className={styles.label}>{field.label}</label>
                    <input className={styles.input} placeholder={field.placeholder}
                      value={extraFields[field.key] || ""}
                      onChange={e => setExtraFields(f => ({ ...f, [field.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={form.trending} onChange={e => setForm({...form, trending: e.target.checked})} />
              Shenjo si trending
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/seller")}>Anulo</button>
            <button type="submit" className={styles.publishBtn} disabled={loading || shops.length === 0}>
              {loading ? "Duke publikuar..." : "Publiko produktin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

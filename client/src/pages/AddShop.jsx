import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";
import { resizeImage } from "../lib/resizeImage";
import styles from "./AddProduct.module.css";

const CITIES = ["Tirana", "Durres", "Shkoder", "Vlore", "Korce", "Fier", "Berat", "Lushnje"];
const COLORS = ["#1D9E75","#D4537E","#378ADD","#993556","#BA7517","#534AB7"];
const COLOR_NAMES = ["E gjelber","Rozë","Blu","Bordo","Kafe","Vjollce"];
const CATEGORIES = ["Kepuce & Sporte","Rroba & Mode","Elektronike","Bukuri & Kozmetike","Shtepi & Jetese","Kepuce","Dhurata","Vegla & Ndertim"];
const DRAFT_KEY = "tregu_add_shop_draft";

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function AddShop() {
  const navigate = useNavigate();
  const draft = loadDraft();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [draftRestored, setDraftRestored] = useState(!!draft);
  const [form, setForm] = useState(draft || {
    name: "", description: "", category: "Clothes & Fashion",
    location: "Tirana", phone: "", email: "", color: "#1D9E75", delivery_fee: 300,
  });

  // Autosave text fields (not the logo -- Files can't survive localStorage)
  // so an accidental refresh/back doesn't force a full restart.
  useEffect(() => {
    if (!form.name && !form.description && !form.phone && !form.email) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm({ name: "", description: "", category: "Clothes & Fashion", location: "Tirana", phone: "", email: "", color: "#1D9E75", delivery_fee: 300 });
    setDraftRestored(false);
  };

  const getInitials = (name) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (shopId) => {
    if (!logoFile) return null;
    const resized = await resizeImage(logoFile, { maxDimension: 800, quality: 0.85 });
    const ext = resized.name.split(".").pop();
    const path = "logos/" + shopId + "." + ext;
    const { error } = await supabase.storage.from("product-images").upload(path, resized, { upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();

    const { data: shop, error: shopError } = await supabase.from("shops").insert({
      name: form.name,
      description: form.description,
      category: form.category,
      location: form.location,
      phone: form.phone,
      email: form.email,
      color: form.color,
      delivery_fee: parseInt(form.delivery_fee) || 300,
      initials: getInitials(form.name),
      verified: false,
      rating: 0,
      review_count: 0,
      delivery_options: ["Cash on delivery"],
      user_id: user.id,
    }).select().single();

    if (shopError) { setError("Dicka shkoi gabim: " + shopError.message); setLoading(false); return; }

    // Upload logo if provided
    if (logoFile) {
      const logoUrl = await uploadLogo(shop.id);
      if (logoUrl) await supabase.from("shops").update({ logo_url: logoUrl }).eq("id", shop.id);
    }

    localStorage.removeItem(DRAFT_KEY);
    setSaved(true);
    setTimeout(() => navigate("/seller"), 2000);
  };

  if (saved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, textAlign: "center", color: "var(--green)" }}>
        <CheckCircle size={64} strokeWidth={1.5} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-1)" }}>Dyqani u krijua!</h2>
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
        <h1 className={styles.title}>Krijo dyqanin tend</h1>
        {error && (
          <div style={{ background: "var(--red-light)", color: "var(--red)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        {draftRestored && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "var(--blue-light)", color: "var(--blue)", padding: "12px 16px", borderRadius: "var(--radius-md)", marginBottom: 16, fontSize: 13 }}>
            <span>Rikuperuam nje draft te paplotesuar. Logo duhet shtuar perseri.</span>
            <button type="button" onClick={clearDraft} style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, flexShrink: 0 }}>
              Fillo nga e para
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>

            {/* Logo upload */}
            <div className={styles.field}>
              <label className={styles.label}>Logo i dyqanit (opsional)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {logoPreview ? (
                  <img src={logoPreview} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: "1px solid var(--border)" }} alt="logo" />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: 12, background: form.color + "22", color: form.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, border: "1px solid var(--border)" }}>
                    {form.name ? getInitials(form.name) : "T"}
                  </div>
                )}
                <label style={{ cursor: "pointer" }}>
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogoChange} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", fontSize: 13, color: "var(--text-2)", background: "var(--surface)", cursor: "pointer" }}>
                    <Upload size={14} />
                    {logoPreview ? "Ndrysho logon" : "Ngarko logon"}
                  </div>
                </label>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>JPG ose PNG, ngjeshet automatikisht. Nese nuk ngarkoni logo, do te perdoren inicalet e dyqanit.</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="shop-name">Emri i dyqanit *</label>
              <input id="shop-name" required className={styles.input} placeholder="p.sh. SportShop Tirana"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="shop-description">Pershkrimi *</label>
              <textarea id="shop-description" required className={styles.textarea} placeholder="Cfare shisni..." rows={3}
                value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="shop-category">Kategoria *</label>
                <select id="shop-category" required className={styles.select} value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="shop-location">Qyteti *</label>
                <select id="shop-location" required className={styles.select} value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="shop-phone">Telefon (WhatsApp) *</label>
                <input id="shop-phone" required className={styles.input} placeholder="+355 69 123 4567"
                  value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="shop-email">Email i dyqanit *</label>
                <input id="shop-email" required type="email" className={styles.input} placeholder="dyqani@example.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="shop-delivery-fee">Tarifa e dorezimit (ALL)</label>
              <input id="shop-delivery-fee" type="number" className={styles.input} placeholder="300"
                value={form.delivery_fee}
                onChange={e => setForm({...form, delivery_fee: e.target.value})} />
              <span style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, display: "block" }}>
                Cmimi qe klienti paguan per dorezim. Default: 300 L
              </span>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>Ngjyra e dyqanit</span>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }} role="radiogroup" aria-label="Ngjyra e dyqanit">
                {COLORS.map((c, i) => (
                  <button type="button" key={c} onClick={() => setForm({...form, color: c})}
                    role="radio" aria-checked={form.color === c} aria-label={COLOR_NAMES[i]}
                    style={{ width: 32, height: 32, borderRadius: "50%", background: c,
                      border: form.color === c ? "3px solid var(--text-1)" : "2px solid transparent",
                      transition: "border 0.15s" }} />
                ))}
              </div>
            </div>

            {form.name && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "var(--surface-2)", borderRadius: "var(--radius-lg)" }}>
                {logoPreview ? (
                  <img src={logoPreview} style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", objectFit: "cover" }} alt="logo" />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: form.color + "33", color: form.color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
                    {getInitials(form.name)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{form.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{form.location} · {form.category}</div>
                  {form.email && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{form.email}</div>}
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn-secondary" onClick={() => navigate("/seller")}>Anulo</button>
            <button type="submit" className={styles.publishBtn} disabled={loading}>
              {loading ? "Duke krijuar..." : "Krijo dyqanin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Reviews({ productId, shopId, type = "product" }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, text: "", author: "" });
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchReviews(); }, [productId, shopId]);

  const fetchReviews = async () => {
    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });
    if (type === "product" && productId) query = query.eq("product_id", productId);
    if (type === "shop" && shopId) query = query.eq("shop_id", shopId);
    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const insert = {
      rating: form.rating,
      text: form.text,
      author: form.author || (user?.email?.split("@")[0] || "Anonim"),
      buyer_id: user?.id || null,
      type,
    };
    if (type === "product") insert.product_id = productId;
    if (type === "shop") insert.shop_id = shopId;
    await supabase.from("reviews").insert(insert);
    const newReviews = [...reviews, { ...insert, id: Date.now(), created_at: new Date().toISOString() }];
    const avg = newReviews.reduce((s, r) => s + r.rating, 0) / newReviews.length;
    if (type === "product" && productId) {
      await supabase.from("products").update({ rating: Math.round(avg * 10) / 10, review_count: newReviews.length }).eq("id", productId);
    }
    if (type === "shop" && shopId) {
      await supabase.from("shops").update({ rating: Math.round(avg * 10) / 10, review_count: newReviews.length }).eq("id", shopId);
    }
    setSuccess(true);
    setShowForm(false);
    setForm({ rating: 5, text: "", author: "" });
    await fetchReviews();
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, margin: 0 }}>Vleresime</h3>
          {avgRating && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: "#F59E0B", fontSize: 16 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{avgRating}</span>
              <span style={{ color: "var(--text-3)", fontSize: 13 }}>({reviews.length})</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: "var(--text-1)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          + Ler vleresim
        </button>
      </div>

      {success && (
        <div style={{ background: "var(--green-light)", color: "var(--green-dark)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          Vleresimi u shtua me sukses!
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "var(--surface-2)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Emri juaj</label>
            <input style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", fontSize: 14, fontFamily: "var(--font-body)", background: "var(--surface)", color: "var(--text-1)", outline: "none", boxSizing: "border-box" }}
              placeholder="p.sh. Erion B." value={form.author}
              onChange={e => setForm({...form, author: e.target.value})} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Vleresimi</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm({...form, rating: n})}
                  style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", opacity: n <= form.rating ? 1 : 0.3, transition: "opacity 0.15s", color: "#F59E0B" }}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Komenti (opsional)</label>
            <textarea style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", fontSize: 14, fontFamily: "var(--font-body)", background: "var(--surface)", color: "var(--text-1)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              rows={3} placeholder="Cfar mendoni per kete produkt?"
              value={form.text} onChange={e => setForm({...form, text: e.target.value})} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={submitting}
              style={{ flex: 1, background: "var(--green)", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              {submitting ? "Duke derguar..." : "Dergo vleresimin"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              style={{ background: "transparent", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 16px", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Anulo
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: "var(--text-3)", fontSize: 14 }}>Duke ngarkuar...</div>
      ) : reviews.length === 0 ? (
        <div style={{ color: "var(--text-3)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
          Nuk ka vleresime ende. Jini i pari! ⭐
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--green-light)", color: "var(--green-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                    {r.author?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.author || "Anonim"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>{new Date(r.created_at).toLocaleDateString("sq-AL")}</div>
                  </div>
                </div>
                <div style={{ color: "#F59E0B", fontSize: 14 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              </div>
              {r.text && <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{r.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

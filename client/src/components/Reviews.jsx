import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Reviews({ productId, shopId, type = "product", onReviewAdded }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({ rating: 5, text: "", author: "" });
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchReviews();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, [productId, shopId]);

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
    setSubmitError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // reviews.buyer_id is required by RLS to match auth.uid() -- an
      // anonymous submission (buyer_id: null) is rejected outright, so
      // don't let a logged-out visitor submit a review that will silently
      // fail.
      setSubmitError("Duhet te kyçeni per te lene nje vleresim.");
      return;
    }
    setSubmitting(true);
    const insert = {
      rating: form.rating,
      text: form.text,
      author: form.author || (user.email?.split("@")[0] || "Anonim"),
      buyer_id: user.id,
      type,
    };
    if (type === "product") insert.product_id = productId;
    if (type === "shop") insert.shop_id = shopId;
    const { error } = await supabase.from("reviews").insert(insert);
    if (error) {
      setSubmitError("Dicka shkoi keq. Provoni perseri.");
      setSubmitting(false);
      return;
    }
    // The product/shop rating + review_count aggregate is now recomputed
    // server-side (a DB trigger recomputes it directly from the reviews
    // table on every insert/delete) instead of being written here as the
    // reviewing user -- that write was silently failing for anyone who
    // wasn't the product/shop owner, since it's correctly RLS-restricted to
    // auth.uid() = user_id.
    setSuccess(true);
    setShowForm(false);
    setForm({ rating: 5, text: "", author: "" });
    await fetchReviews();
    if (onReviewAdded) onReviewAdded();
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Fshi kete vleresim?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) { window.alert("Fshirja deshtoi. Provoni perseri."); return; }
    await fetchReviews();
    if (onReviewAdded) onReviewAdded();
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
          {submitError && (
            <div role="alert" style={{ background: "var(--red-light)", color: "var(--red)", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
              {submitError}
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="review-author" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Emri juaj</label>
            <input id="review-author" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", fontSize: 14, fontFamily: "var(--font-body)", background: "var(--surface)", color: "var(--text-1)", boxSizing: "border-box" }}
              placeholder="p.sh. Erion B." value={form.author}
              onChange={e => setForm({...form, author: e.target.value})} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Vleresimi</span>
            <div style={{ display: "flex", gap: 6 }} role="radiogroup" aria-label="Vleresimi ne yje">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm({...form, rating: n})}
                  role="radio" aria-checked={n === form.rating} aria-label={n + (n === 1 ? " yll" : " yje")}
                  style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", opacity: n <= form.rating ? 1 : 0.3, transition: "opacity 0.15s", color: "#F59E0B" }}>
                  ★
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="review-text" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Komenti (opsional)</label>
            <textarea id="review-text" style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", fontSize: 14, fontFamily: "var(--font-body)", background: "var(--surface)", color: "var(--text-1)", resize: "vertical", boxSizing: "border-box" }}
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "#F59E0B", fontSize: 14 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  {currentUser && currentUser.id === r.buyer_id && (
                    <button onClick={() => handleDelete(r.id)}
                      style={{ background: "var(--red-light)", color: "var(--red)", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                      Fshi
                    </button>
                  )}
                </div>
              </div>
              {r.text && <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0, lineHeight: 1.6 }}>{r.text}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

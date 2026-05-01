import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Share2, Store } from "lucide-react";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";

export default function Feed() {
  const navigate = useNavigate();
  const { addToCart, toggleSaved, isSaved } = useCart();
  const [products, setProducts] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState("up");
  const touchStartY = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*, shops(*)")
      .eq("in_stock", true)
      .order("created_at", { ascending: false })
      .limit(50);
    setProducts(data || []);
    setLoading(false);
  };

  const next = () => {
    if (current < products.length - 1 && !animating) {
      setDirection("up");
      setAnimating(true);
      setTimeout(() => { setCurrent(c => c + 1); setAnimating(false); }, 300);
    }
  };
  const prev = () => {
    if (current > 0 && !animating) {
      setDirection("down");
      setAnimating(true);
      setTimeout(() => { setCurrent(c => c - 1); setAnimating(false); }, 300);
    }
  };

  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (!touchStartY.current) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    touchStartY.current = null;
  };

  const handleWheel = (e) => { e.deltaY > 0 ? next() : prev(); };

  const handleShare = async (product) => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: product.name + " - " + product.price?.toLocaleString() + " L",
        url: window.location.origin + "/product/" + product.id,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + "/product/" + product.id);
      alert("Linku u kopjua!");
    }
  };

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <div style={{ color: "#fff", fontSize: 16 }}>Duke ngarkuar...</div>
    </div>
  );

  if (products.length === 0) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <div style={{ color: "#fff", fontSize: 16 }}>Nuk ka produkte</div>
    </div>
  );

  const product = products[current];
  const saved = isSaved(product.id);
  const shop = product.shops;
  const hasImage = product.images && product.images.length > 0;

  const handleAddToCart = () => {
    addToCart(product, product.sizes?.[0] || null);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{ height: "100vh", width: "100%", background: "#000", position: "relative", overflow: "hidden", userSelect: "none" }}>

      {/* PRODUCT IMAGE */}
      <div style={{ position: "absolute", inset: 0, transition: "opacity 0.3s ease", opacity: animating ? 0 : 1 }}>
        {hasImage ? (
          <img src={product.images[0]} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1A1916 0%, #2A2926 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 120 }}>
            {product.category === "shoes" ? "👟" : product.category === "clothes" ? "👕" :
             product.category === "electronics" ? "📱" : product.category === "beauty" ? "💄" :
             product.category === "home" ? "🏠" : "🛍️"}
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)" }} />
      </div>

      {/* TOP BAR */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <button onClick={() => navigate("/")}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 13, cursor: "pointer", backdropFilter: "blur(8px)" }}>
          ← Kthehu
        </button>
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", backdropFilter: "blur(8px)" }}>
          <span style={{ color: "#fff", fontSize: 12 }}>{current + 1} / {products.length}</span>
        </div>
      </div>

      {/* RIGHT SIDE ACTIONS */}
      <div style={{ position: "absolute", right: 16, bottom: 180, display: "flex", flexDirection: "column", gap: 20, zIndex: 10, alignItems: "center" }}>
        <button onClick={() => toggleSaved(product)}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", flexDirection: "column", gap: 2 }}>
          <Heart size={22} fill={saved ? "#E24B4A" : "none"} color={saved ? "#E24B4A" : "#fff"} strokeWidth={2} />
          <span style={{ color: "#fff", fontSize: 10 }}>Ruaj</span>
        </button>

        <button onClick={handleAddToCart}
          style={{ background: added ? "rgba(29,158,117,0.8)" : "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", flexDirection: "column", gap: 2, transition: "background 0.2s" }}>
          <ShoppingCart size={22} color="#fff" strokeWidth={2} />
          <span style={{ color: "#fff", fontSize: 10 }}>Shto</span>
        </button>

        <button onClick={() => handleShare(product)}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", flexDirection: "column", gap: 2 }}>
          <Share2 size={22} color="#fff" strokeWidth={2} />
          <span style={{ color: "#fff", fontSize: 10 }}>Ndaj</span>
        </button>

        <button onClick={() => shop && navigate("/shop/" + shop.id)}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)", flexDirection: "column", gap: 2 }}>
          <Store size={22} color="#fff" strokeWidth={2} />
          <span style={{ color: "#fff", fontSize: 10 }}>Dyqan</span>
        </button>
      </div>



      {/* BOTTOM INFO */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 80, padding: "24px 20px 32px", zIndex: 10 }}>
        {/* Shop */}
        {shop && (
          <button onClick={() => navigate("/shop/" + shop.id)}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginBottom: 12, padding: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: shop.color + "44", color: shop.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, border: "2px solid " + shop.color, overflow: "hidden" }}>
              {shop.logo_url ? <img src={shop.logo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : shop.initials}
            </div>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>@{shop.name}</span>
            {shop.verified && <span style={{ background: "#1D9E75", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10 }}>✓</span>}
          </button>
        )}

        {/* Product name */}
        <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.3 }}>{product.name}</h2>

        {/* Description */}
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: "0 0 12px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.description}
        </p>

        {/* Sizes preview */}
        {product.sizes?.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {product.sizes.slice(0, 5).map(size => (
              <span key={size} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, backdropFilter: "blur(8px)" }}>{size}</span>
            ))}
          </div>
        )}

        {/* Price + Buy button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#fff", fontSize: 24, fontWeight: 800 }}>{product.price?.toLocaleString()} L</span>
          <button onClick={() => navigate("/product/" + product.id)}
            style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 24, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Shiko produktin →
          </button>
        </div>
      </div>

      {/* SWIPE HINT - only show on first product */}
      {current === 0 && (
        <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, animation: "pulse 2s infinite" }}>
          <ChevronUp size={20} color="rgba(255,255,255,0.5)" />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Rrëshqit lart</span>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5; transform: translateX(-50%) translateY(0); } 50% { opacity: 1; transform: translateX(-50%) translateY(-5px); } }
      `}</style>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import styles from "./ProductCard.module.css";

const BG_COLORS = ["#E1F5EE","#E6F1FB","#FBEAF0","#FAEEDA","#EAF3DE","#EEEDFE"];
const TEXT_COLORS = ["#0F6E56","#185FA5","#99355A","#854F0B","#3B6D11","#3C3489"];

const COLOR_MAP = {
  "e zeze": "#1A1916", "e bardhe": "#FFFFFF", "gri": "#9A9890",
  "kafe": "#8B4513", "e kuqe": "#E53E3E", "blu": "#3182CE",
  "e gjelber": "#38A169", "verdhe": "#D69E2E", "portokalli": "#DD6B20",
  "rozë": "#ED64A6", "vjollce": "#805AD5", "ari": "#B7791F", "argjend": "#A0AEC0"
};

export default function ProductCard({ product, index = 0 }) {
  const { toggleSaved, isSaved, addToCart } = useCart();
  const saved = isSaved(product.id);
  const colorIdx = index % BG_COLORS.length;
  const shop = product.shops || null;
  const formatPrice = (p) => p.toLocaleString("sq-AL") + " L";
  const inStock = product.inStock ?? product.in_stock ?? true;

  const colors = product.details?.colors
    ? product.details.colors.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  return (
    <div className={styles.card}>
      <Link to={"/product/" + product.id} className={styles.imageWrap} style={{ background: BG_COLORS[colorIdx] }}>
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className={styles.imagePlaceholder} style={{ color: TEXT_COLORS[colorIdx] }}>
            {product.category === "shoes" ? "👟" :
             product.category === "clothes" ? "👕" :
             product.category === "electronics" ? "📱" :
             product.category === "beauty" ? "💄" :
             product.category === "home" ? "🏠" : "🛍️"}
          </div>
        )}
        <div className={styles.badges}>
          {product.trending && (
            <span className="badge badge-deal">🔥 Trending</span>
          )}
          {!inStock && (
            <span className="badge badge-out">Pa stok</span>
          )}
        </div>
        <button
          className={styles.saveBtn + (saved ? " " + styles.saved : "")}
          onClick={(e) => { e.preventDefault(); toggleSaved(product); }}
        >
          <Heart size={15} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
        </button>
      </Link>

      <div className={styles.body}>
        <Link to={"/product/" + product.id} className={styles.name}>{product.name}</Link>

        {shop && (
          <Link to={"/shop/" + shop.id} className={styles.shop}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: shop.color + "22", color: shop.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
              {shop.logo_url ? <img src={shop.logo_url} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : shop.initials}
            </div>
            {shop.name}
            {shop.verified && <span style={{ background: "#1877F2", color: "#fff", fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 8 }}>✓</span>}
          </Link>
        )}

        {/* Sizes preview */}
        {product.sizes && product.sizes.length > 0 && (
          <div className={styles.sizesRow}>
            {product.sizes.slice(0, 5).map(s => (
              <span key={s} className={styles.sizeTag}>{s}</span>
            ))}
            {product.sizes.length > 5 && <span className={styles.sizeTag}>+{product.sizes.length - 5}</span>}
          </div>
        )}

        {/* Color dots */}
        {colors.length > 0 && (
          <div className={styles.colorDots}>
            {colors.slice(0, 6).map(c => {
              const hex = COLOR_MAP[c.toLowerCase()] || "#9A9890";
              return (
                <div key={c} title={c} style={{ width: 12, height: 12, borderRadius: "50%", background: hex, border: "1px solid var(--border)", flexShrink: 0 }} />
              );
            })}
            {colors.length > 6 && <span style={{ fontSize: 10, color: "var(--text-3)" }}>+{colors.length - 6}</span>}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.priceWrap}>
            <div className={styles.price}>{formatPrice(product.price)}</div>
            <div className={styles.delivery}>✓ Pagese me dorezim</div>
            <div className={styles.rating}>
              <span style={{ color: product.rating ? "#F59E0B" : "var(--border-strong)", fontSize: 11 }}>
                {"★".repeat(Math.round(product.rating || 0))}{"☆".repeat(5 - Math.round(product.rating || 0))}
              </span>
              {product.review_count > 0 && <span className={styles.ratingCount}>({product.review_count})</span>}
            </div>
          </div>
          <button
            className={styles.addBtn}
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            disabled={!inStock}
            title="Shto ne shporte"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

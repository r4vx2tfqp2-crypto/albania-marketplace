import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCart } from "../context/CartContext";
import styles from "./ProductCard.module.css";

const COLORS = ["#E1F5EE","#E6F1FB","#FBEAF0","#FAEEDA","#EAF3DE","#EEEDFE"];
const TEXT_COLORS = ["#0F6E56","#185FA5","#99355A","#854F0B","#3B6D11","#3C3489"];

export default function ProductCard({ product, index = 0 }) {
  const { toggleSaved, isSaved, addToCart } = useCart();
  const saved = isSaved(product.id);
  const colorIdx = index % COLORS.length;
  const shop = product.shops || null;
  const formatPrice = (p) => p.toLocaleString("sq-AL") + " L";
  const inStock = product.inStock ?? product.in_stock ?? true;

  return (
    <div className={styles.card}>
      <Link to={"/product/" + product.id} className={styles.imageWrap} style={{ background: COLORS[colorIdx] }}>
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
        {product.trending && <span className="badge badge-deal" style={{ position: "absolute", top: 10, left: 10 }}>Trending</span>}
        {!inStock && <span className="badge badge-out" style={{ position: "absolute", top: 10, left: 10 }}>Out of stock</span>}
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
          <Link to={"/shop/" + shop.id} className={styles.shop} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: shop.color + "22", color: shop.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
              {shop.logo_url ? <img src={shop.logo_url} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : shop.initials}
            </div>
            {shop.name}
            {shop.verified && <span className={styles.verifiedDot} title="Verified shop" />}
          </Link>
        )}
        <div className={styles.footer}>
          <div>
            <div className={styles.price}>{formatPrice(product.price)}</div>
            <div className={styles.rating}>
              <span className="stars">{"★".repeat(Math.round(product.rating || 0))}</span>
              <span className={styles.ratingCount}>({product.review_count || 0})</span>
            </div>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => addToCart(product)}
            disabled={!inStock}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

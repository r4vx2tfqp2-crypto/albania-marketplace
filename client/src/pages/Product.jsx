import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, ArrowLeft, CheckCircle, Truck, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import { Helmet } from "react-helmet-async";
import Reviews from "../components/Reviews";
import styles from "./Product.module.css";

const BG_COLORS = ["#E1F5EE","#E6F1FB","#FBEAF0","#FAEEDA","#EAF3DE","#EEEDFE"];
const TEXT_COLORS = ["#0F6E56","#185FA5","#99355A","#854F0B","#3B6D11","#3C3489"];

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToCart, toggleSaved, isSaved } = useCart();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase.from("products").select("*, shops(*)").eq("id", id).single();
    if (data) {
      setProduct(data);
      setShop(data.shops);
      setSelectedSize(data.sizes?.[0] || null);
      if (data.details?.colors) {
        const colors = data.details.colors.split(",").map(c => c.trim()).filter(Boolean);
        setSelectedColor(colors[0] || null);
      }
    }
    const { data: reviewsData } = await supabase.from("reviews").select("*").eq("product_id", id);
    setReviews(reviewsData || []);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--text-3)" }}>Loading...</div>;
  if (!product) return <div style={{ padding: 80, textAlign: "center", color: "var(--text-3)" }}>Product not found</div>;

  const saved = isSaved(product.id);
  const idx = 0;
  const formatPrice = (p) => p.toLocaleString("sq-AL") + " L";
  const hasImages = product.images && product.images.length > 0;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const colors = product.details?.colors
    ? product.details.colors.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  const specs = product.details
    ? Object.entries(product.details).filter(([key, value]) => key !== "colors" && value)
    : [];

  const whatsappMessage = "Pershendetje! Jam i interesuar per: " + product.name + " nga dyqani juaj ne Tregu.";
  const seoTitle = product.name + " — " + (shop?.name || "Tregu") + " | Tregu.store";
  const seoDesc = (product.description || "").slice(0, 155) + " | Bli online ne Tregu.store me pagese me dorezim.";
  const seoImage = product.images?.[0] || "https://tregu.store/og-image.png";
  const whatsappPhone = shop?.phone?.replace(/\s+/g, "").replace("+", "");
  const whatsappUrl = "https://wa.me/" + whatsappPhone + "?text=" + encodeURIComponent(whatsappMessage);

  return (
    <div className={styles.page}>
      <div className="container">
        <Helmet>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDesc} />
          <meta property="og:title" content={seoTitle} />
          <meta property="og:description" content={seoDesc} />
          <meta property="og:image" content={seoImage} />
          <meta property="og:url" content={"https://tregu.store/product/" + product.id} />
          <meta property="og:type" content="product" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> {t("back")}
        </button>
        <div className={styles.layout}>
          <div className={styles.imageSection}>
            <div className={styles.imageMain} style={{ background: BG_COLORS[idx] }}>
              {hasImages ? (
                <img src={product.images[activeImage]} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-xl)" }} />
              ) : (
                <span className={styles.imageEmoji} style={{ color: TEXT_COLORS[idx] }}>
                  {product.category === "shoes" ? "👟" : product.category === "clothes" ? "👕" : product.category === "electronics" ? "📱" : product.category === "beauty" ? "💄" : product.category === "home" ? "🏠" : "🛍️"}
                </span>
              )}
              {product.trending && <span className="badge badge-deal" style={{ position: "absolute", top: 16, left: 16 }}>{t("trending")}</span>}
            </div>
            {hasImages && product.images.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {product.images.map((img, i) => (
                  <img key={i} src={img} alt="thumb" onClick={() => setActiveImage(i)}
                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, cursor: "pointer",
                      border: activeImage === i ? "2px solid var(--text-1)" : "2px solid transparent",
                      opacity: activeImage === i ? 1 : 0.6, transition: "all 0.15s" }} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.topMeta}>
              <span className={styles.category}>{product.category}</span>
              {!product.in_stock && <span className="badge badge-out">{t("out_of_stock")}</span>}
            </div>
            <h1 className={styles.name}>{product.name}</h1>
            <div className={styles.ratingRow}>
              <span className="stars">{"★".repeat(Math.round(product.rating || 0))}</span>
              <span className={styles.ratingVal}>{product.rating || 0}</span>
              <span className={styles.reviewCount}>({product.review_count || 0} {t("reviews")})</span>
            </div>

            {/* 1. PRICE */}
            <div className={styles.price}>{formatPrice(product.price)}</div>

            {/* 2. SIZE PICKER */}
            {product.sizes?.length > 0 && (
              <div className={styles.sizeSection}>
                <div className={styles.sizeLabel}>{t("size")}</div>
                <div className={styles.sizes}>
                  {product.sizes.map(size => (
                    <button key={size}
                      className={styles.sizeBtn + (selectedSize === size ? " " + styles.sizeSelected : "")}
                      onClick={() => setSelectedSize(size)}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. COLOR PICKER */}
            {colors.length > 0 && (
              <div className={styles.sizeSection}>
                <div className={styles.sizeLabel}>Ngjyra</div>
                <div className={styles.sizes}>
                  {colors.map(color => (
                    <button key={color}
                      className={styles.sizeBtn + (selectedColor === color ? " " + styles.sizeSelected : "")}
                      onClick={() => setSelectedColor(color)}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. SPECS - interactive if multiple options */}
            {specs.length > 0 && (
              <div style={{ margin: "16px 0" }}>
                {specs.map(([key, value]) => {
                  const options = value.includes(",") ? value.split(",").map(v => v.trim()).filter(Boolean) : null;
                  return (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                        {key}
                      </div>
                      {options ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {options.map(opt => (
                            <button key={opt} className={styles.sizeBtn}
                              style={{ fontSize: 13 }}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. DESCRIPTION */}
            <div className={styles.description}>
              <div className={styles.descTitle}>{t("about_product")}</div>
              <p className={styles.descText}>{product.description}</p>
            </div>

            {/* 6. ADD TO CART */}
            <div className={styles.actions}>
              <button className={styles.addToCart + (added ? " " + styles.addedSuccess : "")} onClick={handleAddToCart} disabled={!product.in_stock}>
                <ShoppingCart size={16} />
                {added ? t("added_to_cart") : t("add_to_cart")}
              </button>
              <button className={styles.saveBtn + (saved ? " " + styles.saved : "")} onClick={() => toggleSaved(product)}>
                <Heart size={18} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
              </button>
            </div>

            {/* 7. BUY NOW */}
            <button className={styles.buyNow} onClick={() => { addToCart(product, selectedSize, selectedColor); navigate("/checkout"); }}>
              {t("buy_now")}
            </button>

            {/* 8. WHATSAPP */}
            <button className={styles.whatsappBtn} onClick={() => window.open(whatsappUrl, "_blank")}>
              <span>💬</span> {t("contact_whatsapp")}
            </button>

            <div className={styles.deliveryInfo}>
              <div className={styles.deliveryItem}><Truck size={14} strokeWidth={2} /><span>{t("cash_on_delivery")}</span></div>
              <div className={styles.deliveryItem}><Shield size={14} strokeWidth={2} /><span>{t("verified_seller")}</span></div>
            </div>

            {/* 9. SHOP CARD */}
            {shop && (
              <Link to={"/shop/" + shop.id} className={styles.shopCard}>
                <div className={styles.shopAvatar} style={{ background: shop.color + "22", color: shop.color }}>
                  {shop.logo_url ? (
                    <img src={shop.logo_url} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                  ) : shop.initials}
                </div>
                <div className={styles.shopInfo}>
                  <div className={styles.shopName}>{shop.name}{shop.verified && <CheckCircle size={13} strokeWidth={2} style={{ color: "var(--green)" }} />}</div>
                  <div className={styles.shopMeta}><span className="stars">★</span> {shop.rating} · {shop.location}</div>
                </div>
                <span className={styles.visitShop}>{t("visit_shop")}</span>
              </Link>
            )}
          </div>
        </div>

        <div style={{ padding: "0 0 40px" }}><Reviews productId={id} type="product" onReviewAdded={fetchProduct} /></div>
      </div>
    </div>
  );
}

cat > ~/Desktop/albania-marketplace/client/src/pages/Product.jsx << 'EOF'
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, CheckCircle, Truck, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import styles from './Product.module.css';

const COLORS = ['#E1F5EE','#E6F1FB','#FBEAF0','#FAEEDA','#EAF3DE','#EEEDFE'];
const TEXT_COLORS = ['#0F6E56','#185FA5','#99355A','#854F0B','#3B6D11','#3C3489'];

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
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase.from('products').select('*, shops(*)').eq('id', id).single();
    if (data) { setProduct(data); setShop(data.shops); setSelectedSize(data.sizes?.[0] || null); }
    const { data: reviewsData } = await supabase.from('reviews').select('*').eq('product_id', id);
    setReviews(reviewsData || []);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;
  if (!product) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>{t('no_products_yet')}</div>;

  const saved = isSaved(product.id);
  const idx = 0;
  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';
  const hasImages = product.images && product.images.length > 0;

  const handleAddToCart = () => {
    addToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const whatsappMessage = `Hi! I'm interested in buying: ${product.name} (${formatPrice(product.price)}) from your shop on Tregu.`;
  const whatsappPhone = shop?.phone?.replace(/\s+/g, '').replace('+', '');
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> {t('back')}
        </button>
        <div className={styles.layout}>
          <div className={styles.imageSection}>
            <div className={styles.imageMain} style={{ background: COLORS[idx] }}>
              {hasImages ? (
                <img src={product.images[activeImage]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }} />
              ) : (
                <span className={styles.imageEmoji} style={{ color: TEXT_COLORS[idx] }}>
                  {product.category === 'shoes' ? '👟' : product.category === 'clothes' ? '👕' : product.category === 'electronics' ? '📱' : product.category === 'beauty' ? '💄' : product.category === 'home' ? '🏠' : '🛍️'}
                </span>
              )}
              {product.trending && <span className="badge badge-deal" style={{ position:'absolute', top:16, left:16 }}>{t('trending')}</span>}
            </div>
            {hasImages && product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => setActiveImage(i)}
                    style={{
                      width: 60, height: 60, objectFit: 'cover', borderRadius: 8,
                      cursor: 'pointer',
                      border: activeImage === i ? '2px solid var(--text-1)' : '2px solid transparent',
                      opacity: activeImage === i ? 1 : 0.6,
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.infoSection}>
            <div className={styles.topMeta}>
              <span className={styles.category}>{product.category}</span>
              {!product.in_stock && <span className="badge badge-out">{t('out_of_stock')}</span>}
            </div>
            <h1 className={styles.name}>{product.name}</h1>
            <div className={styles.ratingRow}>
              <span className="stars">{'★'.repeat(Math.round(product.rating || 0))}</span>
              <span className={styles.ratingVal}>{product.rating || 0}</span>
              <span className={styles.reviewCount}>({product.review_count || 0} {t('reviews')})</span>
            </div>
            <div className={styles.price}>{formatPrice(product.price)}</div>
            {product.sizes?.length > 0 && (
              <div className={styles.sizeSection}>
                <div className={styles.sizeLabel}>{t('size')}</div>
                <div className={styles.sizes}>
                  {product.sizes.map(size => (
                    <button key={size} className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeSelected : ''}`} onClick={() => setSelectedSize(size)}>{size}</button>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.actions}>
              <button className={`${styles.addToCart} ${added ? styles.addedSuccess : ''}`} onClick={handleAddToCart} disabled={!product.in_stock}>
                <ShoppingCart size={16} />
                {added ? t('added_to_cart') : t('add_to_cart')}
              </button>
              <button className={`${styles.saveBtn} ${saved ? styles.saved : ''}`} onClick={() => toggleSaved(product)}>
                <Heart size={18} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>
            <button className={styles.buyNow} onClick={() => { addToCart(product, selectedSize); navigate('/checkout'); }}>
              {t('buy_now')}
            </button>
            <button className={styles.whatsappBtn} onClick={() => window.open(whatsappUrl, '_blank')}>
              <span>💬</span> {t('contact_whatsapp')}
            </button>
            <div className={styles.deliveryInfo}>
              <div className={styles.deliveryItem}><Truck size={14} strokeWidth={2} /><span>{t('cash_on_delivery')}</span></div>
              <div className={styles.deliveryItem}><Shield size={14} strokeWidth={2} /><span>{t('verified_seller')}</span></div>
            </div>
            {shop && (
              <Link to={`/shop/${shop.id}`} className={styles.shopCard}>
                <div className={styles.shopAvatar} style={{ background: shop.color + '22', color: shop.color }}>{shop.initials}</div>
                <div className={styles.shopInfo}>
                  <div className={styles.shopName}>{shop.name}{shop.verified && <CheckCircle size={13} strokeWidth={2} style={{ color: 'var(--green)' }} />}</div>
                  <div className={styles.shopMeta}><span className="stars">★</span> {shop.rating} · {shop.location}</div>
                </div>
                <span className={styles.visitShop}>{t('visit_shop')}</span>
              </Link>
            )}
            <div className={styles.description}>
              <div className={styles.descTitle}>{t('about_product')}</div>
              <p className={styles.descText}>{product.description}</p>
            </div>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className={styles.reviewsSection}>
            <h2 className={styles.reviewsTitle}>{t('reviews')}</h2>
            <div className={styles.reviewsList}>
              {reviews.map(r => (
                <div key={r.id} className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewAvatar}>{r.author[0]}</div>
                    <div><div className={styles.reviewAuthor}>{r.author}</div><div className="stars">{'★'.repeat(r.rating)}</div></div>
                    <div className={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <p className={styles.reviewText}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
EOF
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, CheckCircle, Truck, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import styles from './Product.module.css';

const COLORS = ['#E1F5EE','#E6F1FB','#FBEAF0','#FAEEDA','#EAF3DE','#EEEDFE'];
const TEXT_COLORS = ['#0F6E56','#185FA5','#99355A','#854F0B','#3B6D11','#3C3489'];

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleSaved, isSaved } = useCart();
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, shops(*)')
      .eq('id', id)
      .single();

    if (data) {
      setProduct(data);
      setShop(data.shops);
      setSelectedSize(data.sizes?.[0] || null);
    }

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', id);

    setReviews(reviewsData || []);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;
  if (!product) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Product not found</div>;

  const saved = isSaved(product.id);
  const idx = 0;

  const handleAddToCart = () => {
    addToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';

  const whatsappMessage = `Hi! I'm interested in buying: ${product.name} (${formatPrice(product.price)}) from your shop on Tregu.`;
  const whatsappPhone = shop?.phone?.replace(/\s+/g, '').replace('+', '');
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className={styles.layout}>
          <div className={styles.imageSection}>
            <div className={styles.imageMain} style={{ background: COLORS[idx] }}>
              <span className={styles.imageEmoji} style={{ color: TEXT_COLORS[idx] }}>
                {product.category === 'shoes' ? '👟' :
                 product.category === 'clothes' ? '👕' :
                 product.category === 'electronics' ? '📱' :
                 product.category === 'beauty' ? '💄' :
                 product.category === 'home' ? '🏠' : '🛍️'}
              </span>
              {product.trending && <span className="badge badge-deal" style={{ position:'absolute', top:16, left:16 }}>Trending</span>}
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.topMeta}>
              <span className={styles.category}>{product.category}</span>
              {!product.in_stock && <span className="badge badge-out">Out of stock</span>}
            </div>

            <h1 className={styles.name}>{product.name}</h1>

            <div className={styles.ratingRow}>
              <span className="stars">{'★'.repeat(Math.round(product.rating || 0))}</span>
              <span className={styles.ratingVal}>{product.rating || 0}</span>
              <span className={styles.reviewCount}>({product.review_count || 0} reviews)</span>
            </div>

            <div className={styles.price}>{formatPrice(product.price)}</div>

            {product.sizes?.length > 0 && (
              <div className={styles.sizeSection}>
                <div className={styles.sizeLabel}>Size</div>
                <div className={styles.sizes}>
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeSelected : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={`${styles.addToCart} ${added ? styles.addedSuccess : ''}`}
                onClick={handleAddToCart}
                disabled={!product.in_stock}
              >
                <ShoppingCart size={16} />
                {added ? 'Added to cart!' : 'Add to cart'}
              </button>
              <button
                className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
                onClick={() => toggleSaved(product)}
              >
                <Heart size={18} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>

            <button className={styles.buyNow} onClick={() => { addToCart(product, selectedSize); navigate('/checkout'); }}>
              Buy now
            </button>

            <button className={styles.whatsappBtn} onClick={() => window.open(whatsappUrl, '_blank')}>
              <span>💬</span> Contact seller on WhatsApp
            </button>

            <div className={styles.deliveryInfo}>
              <div className={styles.deliveryItem}>
                <Truck size={14} strokeWidth={2} />
                <span>Cash on delivery available</span>
              </div>
              <div className={styles.deliveryItem}>
                <Shield size={14} strokeWidth={2} />
                <span>Verified seller</span>
              </div>
            </div>

            {shop && (
              <Link to={`/shop/${shop.id}`} className={styles.shopCard}>
                <div className={styles.shopAvatar} style={{ background: shop.color + '22', color: shop.color }}>
                  {shop.initials}
                </div>
                <div className={styles.shopInfo}>
                  <div className={styles.shopName}>
                    {shop.name}
                    {shop.verified && <CheckCircle size={13} strokeWidth={2} style={{ color: 'var(--green)' }} />}
                  </div>
                  <div className={styles.shopMeta}>
                    <span className="stars">★</span> {shop.rating} · {shop.location}
                  </div>
                </div>
                <span className={styles.visitShop}>Visit shop →</span>
              </Link>
            )}

            <div className={styles.description}>
              <div className={styles.descTitle}>About this product</div>
              <p className={styles.descText}>{product.description}</p>
            </div>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className={styles.reviewsSection}>
            <h2 className={styles.reviewsTitle}>Reviews</h2>
            <div className={styles.reviewsList}>
              {reviews.map(r => (
                <div key={r.id} className={styles.review}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewAvatar}>{r.author[0]}</div>
                    <div>
                      <div className={styles.reviewAuthor}>{r.author}</div>
                      <div className="stars">{'★'.repeat(r.rating)}</div>
                    </div>
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
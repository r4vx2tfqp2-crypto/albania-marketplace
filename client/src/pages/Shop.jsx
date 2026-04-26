import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Truck } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import styles from './Shop.module.css';

export default function Shop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShop();
  }, [id]);

  const fetchShop = async () => {
    const [{ data: shopData }, { data: productsData }, { data: reviewsData }] = await Promise.all([
      supabase.from('shops').select('*').eq('id', id).single(),
      supabase.from('products').select('*').eq('shop_id', id),
      supabase.from('reviews').select('*').eq('shop_id', id),
    ]);
    setShop(shopData);
    setProducts(productsData || []);
    setReviews(reviewsData || []);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;
  if (!shop) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Shop not found</div>;

  const whatsappMessage = `Hi! I found your shop "${shop.name}" on Tregu and I'd like to know more.`;
  const whatsappPhone = shop?.phone?.replace(/\s+/g, '').replace('+', '');
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className="container">
          <button className={styles.back} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className={styles.shopHero}>
            <div className={styles.avatar} style={{ background: shop.color + '33', color: shop.color }}>
              {shop.initials}
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.nameRow}>
                <h1 className={styles.name}>{shop.name}</h1>
                {shop.verified && (
                  <span className="badge badge-verified">
                    <CheckCircle size={11} strokeWidth={2.5} /> Verified
                  </span>
                )}
              </div>
              <p className={styles.description}>{shop.description}</p>
              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <MapPin size={13} strokeWidth={2} /> {shop.location}
                </span>
                <span className={styles.metaItem}>
                  <span className="stars">★</span> {shop.rating} ({shop.review_count} reviews)
                </span>
                {shop.delivery_options && (
                  <span className={styles.metaItem}>
                    <Truck size={13} strokeWidth={2} /> {shop.delivery_options.join(', ')}
                  </span>
                )}
              </div>
              <button className={styles.whatsappBtn} onClick={() => window.open(whatsappUrl, '_blank')}>
                <span>💬</span> Contact on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.tabs}>
          {['products', 'reviews', 'info'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'products' && ` (${products.length})`}
              {t === 'reviews' && ` (${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          products.length > 0 ? (
            <div className={styles.productsGrid}>
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className={styles.empty}>No products yet in this shop.</div>
          )
        )}

        {tab === 'reviews' && (
          <div className={styles.reviewsList}>
            {reviews.length > 0 ? reviews.map(r => (
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
            )) : (
              <div className={styles.empty}>No reviews yet.</div>
            )}
          </div>
        )}

        {tab === 'info' && (
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Location</div>
              <div className={styles.infoValue}>{shop.location}, Albania</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Phone</div>
              <div className={styles.infoValue}>{shop.phone}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Category</div>
              <div className={styles.infoValue}>{shop.category}</div>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoLabel}>Status</div>
              <div className={styles.infoValue}>{shop.verified ? '✓ Verified seller' : 'Not yet verified'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
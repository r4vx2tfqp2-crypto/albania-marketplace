import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, CheckCircle, Truck } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { shops, products, reviews } from '../data/mockData';
import styles from './Shop.module.css';

export default function Shop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('products');

  const shop = shops.find(s => s.id === id);
  if (!shop) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Shop not found</div>;

  const shopProducts = products.filter(p => p.shopId === id);
  const shopReviews = reviews.filter(r => r.shopId === id);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header} style={{ '--shop-color': shop.color }}>
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
                  <span className="stars">★</span> {shop.rating} ({shop.reviewCount} reviews)
                </span>
                <span className={styles.metaItem}>
                  <Truck size={13} strokeWidth={2} /> {shop.deliveryOptions.join(', ')}
                </span>
              </div>
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
              {t === 'products' && ` (${shopProducts.length})`}
              {t === 'reviews' && ` (${shopReviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className={styles.productsGrid}>
            {shopProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}

        {tab === 'reviews' && (
          <div className={styles.reviewsList}>
            {shopReviews.length > 0 ? shopReviews.map(r => (
              <div key={r.id} className={styles.review}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewAvatar}>{r.author[0]}</div>
                  <div>
                    <div className={styles.reviewAuthor}>{r.author}</div>
                    <div className="stars">{'★'.repeat(r.rating)}</div>
                  </div>
                  <div className={styles.reviewDate}>{r.date}</div>
                </div>
                <p className={styles.reviewText}>{r.text}</p>
              </div>
            )) : (
              <div className={styles.empty}>No reviews yet for this shop.</div>
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
              <div className={styles.infoLabel}>Delivery options</div>
              <div className={styles.infoValue}>{shop.deliveryOptions.join(' · ')}</div>
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

import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle } from 'lucide-react';
import styles from './ShopCard.module.css';

function ShopCard({ shop }) {
  return (
    <Link to={`/shop/${shop.id}`} className={styles.card}>
      <div className={styles.avatar} style={{ background: shop.color + '22', color: shop.color, overflow: 'hidden' }}>
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : shop.initials}
      </div>
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{shop.name}</span>
          {shop.verified && <CheckCircle size={13} strokeWidth={2} style={{ color: 'var(--green)', flexShrink: 0 }} />}
        </div>
        <div className={styles.meta}>
          <MapPin size={11} strokeWidth={2} />
          {shop.location} · {shop.category}
        </div>
        <div className={styles.rating}>
          <span className="stars">★</span>
          <span className={styles.ratingVal}>{shop.rating}</span>
          {/* Was shop.reviewCount (camelCase) -- the real column, written by
              the DB trigger and read everywhere else in the app, is
              review_count (snake_case). shop.reviewCount was always
              undefined, so every ShopCard rendered a blank "()" here. */}
          <span className={styles.reviewCount}>({shop.review_count || 0})</span>
        </div>
      </div>
    </Link>
  );
}

export default memo(ShopCard);

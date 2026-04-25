import { Link } from 'react-router-dom';
import { MapPin, CheckCircle } from 'lucide-react';
import styles from './ShopCard.module.css';

export default function ShopCard({ shop }) {
  return (
    <Link to={`/shop/${shop.id}`} className={styles.card}>
      <div className={styles.avatar} style={{ background: shop.color + '22', color: shop.color }}>
        {shop.initials}
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
          <span className={styles.reviewCount}>({shop.reviewCount})</span>
        </div>
      </div>
    </Link>
  );
}

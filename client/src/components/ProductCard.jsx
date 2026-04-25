import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { shops } from '../data/mockData';
import styles from './ProductCard.module.css';

const COLORS = ['#E1F5EE','#E6F1FB','#FBEAF0','#FAEEDA','#EAF3DE','#EEEDFE'];
const TEXT_COLORS = ['#0F6E56','#185FA5','#99355A','#854F0B','#3B6D11','#3C3489'];

export default function ProductCard({ product, index = 0 }) {
  const { toggleSaved, isSaved, addToCart } = useCart();
  const shop = shops.find(s => s.id === product.shopId);
  const saved = isSaved(product.id);
  const colorIdx = index % COLORS.length;

  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';

  return (
    <div className={styles.card}>
      <Link to={`/product/${product.id}`} className={styles.imageWrap} style={{ background: COLORS[colorIdx] }}>
        <div className={styles.imagePlaceholder} style={{ color: TEXT_COLORS[colorIdx] }}>
          {product.category === 'shoes' ? '👟' :
           product.category === 'clothes' ? '👕' :
           product.category === 'electronics' ? '📱' :
           product.category === 'beauty' ? '💄' :
           product.category === 'home' ? '🏠' : '🛍️'}
        </div>
        {product.trending && <span className="badge badge-deal" style={{ position:'absolute', top:10, left:10 }}>Trending</span>}
        {!product.inStock && <span className="badge badge-out" style={{ position:'absolute', top:10, left:10 }}>Out of stock</span>}
        <button
          className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
          onClick={(e) => { e.preventDefault(); toggleSaved(product); }}
        >
          <Heart size={15} fill={saved ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      </Link>
      <div className={styles.body}>
        <Link to={`/product/${product.id}`} className={styles.name}>{product.name}</Link>
        <Link to={`/shop/${product.shopId}`} className={styles.shop}>
          {shop?.name}
          {shop?.verified && <span className={styles.verifiedDot} title="Verified shop" />}
        </Link>
        <div className={styles.footer}>
          <div>
            <div className={styles.price}>{formatPrice(product.price)}</div>
            <div className={styles.rating}>
              <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
              <span className={styles.ratingCount}>({product.reviewCount})</span>
            </div>
          </div>
          <button
            className={styles.addBtn}
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>T</span>
          <span className={styles.logoText}>tregu</span>
        </Link>

        <button className={styles.searchBar} onClick={() => navigate('/search')}>
          <Search size={15} strokeWidth={2} />
          <span>Search products, shops…</span>
        </button>

        <div className={styles.actions}>
          <Link to="/seller" className={styles.actionBtn} title="Seller Dashboard">
            <Store size={18} strokeWidth={1.8} />
          </Link>
          <Link to="/cart" className={styles.cartBtn}>
            <ShoppingCart size={18} strokeWidth={1.8} />
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'sq' ? 'en' : 'sq';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark}>T</span>
          <span className={styles.logoText}>tregu</span>
        </Link>

        <button className={styles.searchBar} onClick={() => navigate('/search')}>
          <Search size={15} strokeWidth={2} />
          <span>{t('search_placeholder')}</span>
        </button>

        <div className={styles.actions}>
          <button className={styles.langBtn} onClick={toggleLanguage}>
            {i18n.language === 'sq' ? '🇦🇱 SQ' : '🇬🇧 EN'}
          </button>
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

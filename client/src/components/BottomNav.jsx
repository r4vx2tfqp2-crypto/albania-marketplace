import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './BottomNav.module.css';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/favorites', icon: Heart, label: 'Saved' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: true },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const { cartCount } = useCart();

  return (
    <nav className={styles.nav}>
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          <span className={styles.iconWrap}>
            <Icon size={20} strokeWidth={1.8} />
            {badge && cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

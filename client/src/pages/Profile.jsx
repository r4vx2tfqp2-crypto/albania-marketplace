import { Link } from 'react-router-dom';
import { Package, Heart, Settings, Store, ChevronRight, User } from 'lucide-react';
import styles from './Profile.module.css';

const menuItems = [
  { icon: Package, label: 'My orders', sub: 'Track and manage orders', to: '/orders' },
  { icon: Heart, label: 'Saved items', sub: 'Your favorites', to: '/favorites' },
  { icon: Store, label: 'Seller dashboard', sub: 'Manage your shop', to: '/seller' },
  { icon: Settings, label: 'Settings', sub: 'Account preferences', to: '/settings' },
];

export default function Profile() {
  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            <User size={28} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />
          </div>
          <div>
            <div className={styles.name}>Guest User</div>
            <div className={styles.email}>Sign in to access your account</div>
          </div>
          <Link to="#" className={styles.signInBtn}>Sign in</Link>
        </div>

        <div className={styles.menu}>
          {menuItems.map(({ icon: Icon, label, sub, to }) => (
            <Link key={label} to={to} className={styles.menuItem}>
              <div className={styles.menuIcon}><Icon size={18} strokeWidth={1.8} /></div>
              <div className={styles.menuInfo}>
                <div className={styles.menuLabel}>{label}</div>
                <div className={styles.menuSub}>{sub}</div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </Link>
          ))}
        </div>

        <div className={styles.appInfo}>
          <div className={styles.appName}>tregu</div>
          <div className={styles.appVersion}>Version 1.0.0 — Albania's marketplace</div>
        </div>
      </div>
    </div>
  );
}

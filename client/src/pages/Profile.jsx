import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, Settings, Store, ChevronRight, User, LogOut, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: Package, label: t('my_orders_menu'), sub: t('my_orders_sub'), to: '/orders' },
    { icon: Heart, label: t('saved_items'), sub: t('saved_items_sub'), to: '/favorites' },
    { icon: Store, label: t('seller_dashboard'), sub: t('seller_dashboard_sub'), to: '/seller' },
    { icon: Truck, label: 'Delivery confirmation', sub: 'For delivery drivers', to: '/delivery' },
    { icon: Settings, label: t('settings'), sub: t('settings_sub'), to: '/settings' },
  ];

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            <User size={28} strokeWidth={1.5} style={{ color: 'var(--text-3)' }} />
          </div>
          <div>
            {user ? (
              <>
                <div className={styles.name}>{user.user_metadata?.name || 'Seller'}</div>
                <div className={styles.email}>{user.email}</div>
              </>
            ) : (
              <>
                <div className={styles.name}>{t('guest_user')}</div>
                <div className={styles.email}>{t('sign_in_prompt')}</div>
              </>
            )}
          </div>
          {user ? (
            <button onClick={handleSignOut} className={styles.signInBtn} style={{ background: 'var(--red-light)', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={14} /> {t('sign_out')}
            </button>
          ) : (
            <Link to="/login" className={styles.signInBtn}>{t('sign_in')}</Link>
          )}
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
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export default function Favorites() {
  const { savedItems } = useCart();
  const { t } = useTranslation();

  return (
    <div style={{ padding: '32px 0 60px' }}>
      <div className="container">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 28 }}>
          {t('saved_title')}
        </h1>
        {savedItems.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: 12, textAlign: 'center' }}>
            <Heart size={48} strokeWidth={1} style={{ color: 'var(--text-3)' }} />
            <div style={{ fontSize: 18, fontWeight: 500 }}>{t('no_saved')}</div>
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>{t('no_saved_sub')}</p>
            <Link to="/" className="btn-primary" style={{ marginTop: 8 }}>{t('browse_products')}</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {savedItems.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
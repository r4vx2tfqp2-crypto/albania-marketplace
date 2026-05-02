import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';
import Reviews from '../components/Reviews';
import styles from './Shop.module.css';

export default function Shop() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState('products');
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchShop(); }, [id]);

  const fetchShop = async () => {
    const [{ data: shopData }, { data: productsData }, { data: reviewsData }] = await Promise.all([
      supabase.from('shops').select('*').eq('id', id).single(),
      supabase.from('products').select('*').eq('shop_id', id),
      supabase.from('reviews').select('*').eq('shop_id', id),
    ]);
    setShop(shopData);
    setProducts(productsData || []);
    setReviews(reviewsData || []);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;
  if (!shop) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Shop not found</div>;

  const whatsappMessage = `Hi! I found your shop "${shop.name}" on Tregu and I'd like to know more.`;
  const rawPhone = shop?.phone?.replace(/\s+/g, '') || '';
  const whatsappPhone = rawPhone.startsWith('+355') ? rawPhone.replace('+', '') : rawPhone.startsWith('0') ? '355' + rawPhone.slice(1) : '355' + rawPhone;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const TABS = [
    { key: 'products', label: t('products_tab') },
    { key: 'reviews', label: t('reviews_tab') },
    { key: 'info', label: t('info_tab') },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className="container">
          <Helmet>
          <title>{shop.name} — Dyqan Online | Tregu.store</title>
          <meta name="description" content={shop.description?.slice(0, 155) + " | Bli online ne Tregu.store."} />
          <meta property="og:title" content={shop.name + " | Tregu.store"} />
          <meta property="og:description" content={shop.description?.slice(0, 155)} />
          {shop.logo_url && <meta property="og:image" content={shop.logo_url} />}
          <meta property="og:url" content={"https://tregu.store/shop/" + shop.id} />
        </Helmet>
        <button className={styles.back} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> {t('back')}
          </button>
          <div className={styles.shopHero}>
            <div className={styles.avatar} style={{ background: shop.color + '33', color: shop.color }}>{shop.initials}</div>
            <div className={styles.heroInfo}>
              <div className={styles.nameRow}>
                <h1 className={styles.name}>{shop.name}</h1>
                {shop.verified && <span className="badge badge-verified"><CheckCircle size={11} strokeWidth={2.5} /> Verified</span>}
              </div>
              <p className={styles.description}>{shop.description}</p>
              <div className={styles.metaRow}>
                <span className={styles.metaItem}><MapPin size={13} strokeWidth={2} /> {shop.location}</span>
                <span className={styles.metaItem}><span className="stars">★</span> {shop.rating} ({shop.review_count} {t('reviews')})</span>
                {shop.delivery_options && <span className={styles.metaItem}><Truck size={13} strokeWidth={2} /> {shop.delivery_options.join(', ')}</span>}
              </div>
              <button className={styles.whatsappBtn} onClick={() => window.open(whatsappUrl, '_blank')}>
                <span>💬</span> {t('contact_whatsapp_shop')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.tabs}>
          {TABS.map(tabItem => (
            <button key={tabItem.key} className={`${styles.tab} ${tab === tabItem.key ? styles.tabActive : ''}`} onClick={() => setTab(tabItem.key)}>
              {tabItem.label}
              {tabItem.key === 'products' && ` (${products.length})`}
              {tabItem.key === 'reviews' && ` (${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          products.length > 0 ? (
            <div className={styles.productsGrid}>
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : <div className={styles.empty}>{t('no_products_shop')}</div>
        )}

        {tab === 'reviews' && <Reviews shopId={id} type="shop" />}

        {tab === 'info' && (
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}><div className={styles.infoLabel}>{t('location')}</div><div className={styles.infoValue}>{shop.location}, Albania</div></div>
            <div className={styles.infoCard}><div className={styles.infoLabel}>{t('phone')}</div><div className={styles.infoValue}>{shop.phone}</div></div>
            <div className={styles.infoCard}><div className={styles.infoLabel}>{t('category')}</div><div className={styles.infoValue}>{shop.category}</div></div>
            <div className={styles.infoCard}><div className={styles.infoLabel}>{t('status')}</div><div className={styles.infoValue}>{shop.verified ? t('verified_seller_status') : t('not_verified')}</div></div>
          </div>
        )}
      </div>
    </div>
  );
}
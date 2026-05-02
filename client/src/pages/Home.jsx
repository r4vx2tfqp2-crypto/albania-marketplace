import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { supabase } from '../lib/supabase';
import { categories } from '../data/mockData';
import styles from './Home.module.css';
import { Helmet } from 'react-helmet-async';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('buyer');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    fetchData();
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: trending }, { data: shops }, { data: products }] = await Promise.all([
      supabase.from('products').select('*, shops(*)').eq('trending', true).order('created_at', { ascending: false }).limit(4),
      supabase.from('shops').select('*').eq('verified', true).limit(4),
      supabase.from('products').select('*, shops(*)').order('created_at', { ascending: false }).limit(8),
    ]);
    setTrendingProducts(trending || []);
    setFeaturedShops(shops || []);
    setAllProducts(products || []);
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const translatedCategories = categories.map(cat => ({
    ...cat,
    label: t(`cat_${cat.id}`)
  }));

  return (
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <Zap size={12} fill="currentColor" />
            {t('hero_tag')}
          </div>
          <h1 className={styles.heroTitle}>
            {t('hero_title').split('\n')[0]}<br />{t('hero_title').split('\n')[1]}
          </h1>
          <p className={styles.heroSub}>{t('hero_sub')}</p>
          <form onSubmit={handleSearch} className={styles.heroSearch}>
            <Search size={16} strokeWidth={2} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>{t('hero_search_btn')}</button>
          </form>
        </div>
      </div>
      
      <Helmet>
        <title>Tregu.store — Platforma e Pare Shqiptare e Tregtise Elektronike</title>
        <meta name="description" content="Zbulo produkte nga dyqane lokale te verifikuara ne Shqiperi. Porosit online, pagesa me dorezim. Kenge, rroba, elektronike dhe shume me teper." />
        <meta property="og:title" content="Tregu.store — Dyqanet Shqiptare Online" />
        <meta property="og:description" content="Platforma e pare shqiptare e tregtise elektronike. Bli dhe shit online me pagese me dorezim." />
        <meta property="og:image" content="https://tregu.store/og-image.png" />
        <meta property="og:url" content="https://tregu.store" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://tregu.store" />
      </Helmet>

      <div className="container">
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('browse_categories')}</h2>
          </div>
          <div className={styles.catGrid}>
            {translatedCategories.map((cat) => (
              <button
                key={cat.id}
                className={styles.catCard}
                onClick={() => navigate(`/search?category=${cat.id}`)}
              >
                <span className={styles.catIcon}>{cat.icon}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>
            Loading…
          </div>
        ) : (
          <>
            {trendingProducts.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <div className={styles.sectionTitleRow}>
                    <TrendingUp size={16} strokeWidth={2} style={{ color: 'var(--amber)' }} />
                    <h2 className={styles.sectionTitle}>{t('trending_now')}</h2>
                  </div>
                  <button className={styles.seeAll} onClick={() => navigate('/search?sort=trending')}>
                    {t('see_all')} <ArrowRight size={14} />
                  </button>
                </div>
                <div className={styles.productGrid}>
                  {trendingProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
              </section>
            )}

            {featuredShops.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>{t('verified_shops')}</h2>
                  <button className={styles.seeAll} onClick={() => navigate('/search?tab=shops')}>
                    {t('see_all')} <ArrowRight size={14} />
                  </button>
                </div>
                <div className={styles.shopGrid}>
                  {featuredShops.map(shop => <ShopCard key={shop.id} shop={shop} />)}
                </div>
              </section>
            )}

            {allProducts.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>{t('all_products')}</h2>
                  <button className={styles.seeAll} onClick={() => navigate('/search')}>
                    {t('see_all')} <ArrowRight size={14} />
                  </button>
                </div>
                <div className={styles.productGrid}>
                  {allProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
              </section>
            )}

            {allProducts.length === 0 && trendingProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>{t('no_products_yet')}</h2>
                <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>{t('be_first')}</p>
                <button className="btn-primary" onClick={() => navigate('/seller/add-product')}>{t('add_first_product')}</button>
              </div>
            )}
          </>
        )}
        {/* How it works */}
<section className={styles.section}>
  <div style={{ textAlign: 'center', marginBottom: 32 }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: 8 }}>
      Si funksionon Tregu?
    </h2>
    <p style={{ fontSize: 15, color: 'var(--text-3)' }}>E thjeshtë për blerësit. E thjeshtë për shitësit.</p>
  </div>

  <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
    {['buyer', 'seller'].map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        style={{
          flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-strong)',
          background: activeTab === tab ? 'var(--text-1)' : 'var(--surface)',
          color: activeTab === tab ? '#fff' : 'var(--text-2)',
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'var(--font-body)', transition: 'all 0.2s',
        }}
      >
        {tab === 'buyer' ? 'Për Blerësit' : 'Për Shitësit'}
      </button>
    ))}
  </div>

  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    {(activeTab === 'buyer' ? [
      { num: '1', icon: '🔍', title: 'Kërko', text: 'Kërko produkte nga dyqane të verifikuara në të gjithë Shqipërinë — këpucë, rroba, elektronikë dhe shumë më tepër.' },
      { num: '2', icon: '🛒', title: 'Porosit', text: 'Porosit me një klik. Pagesa me dorëzim — pa kartë bankare, pa regjistrim të komplikuar.' },
      { num: '3', icon: '📦', title: 'Merr', text: 'Produkti dorëzohet direkt në derën tënde. Konfirmo marrjen dhe lër një vlerësim.' },
    ] : [
      { num: '1', icon: '📝', title: 'Regjistrohu', text: 'Krijo llogarinë dhe dyqanin tënd falas në 5 minuta. Pa kontratë, pa kosto fillestare.' },
      { num: '2', icon: '📸', title: 'Listo', text: 'Shto produktet me foto dhe çmim. Aq e thjeshtë sa Instagram — por me sistem porosish profesional.' },
      { num: '3', icon: '💰', title: 'Fito', text: 'Merr porosi direkt në telefonin tënd. Paguhu me dorëzim. Zgjero biznesin tënd në të gjithë Shqipërinë.' },
    ]).map((step, i, arr) => (
      <div key={i} style={{ display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, fontWeight: 600, flexShrink: 0,
            background: activeTab === 'buyer' ? 'var(--green-light)' : 'var(--text-1)',
            color: activeTab === 'buyer' ? 'var(--green-dark)' : '#fff',
          }}>
            {step.num}
          </div>
          {i < arr.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 24, margin: '4px 0', background: 'var(--border)' }} />}
        </div>
        <div style={{ paddingBottom: i < arr.length - 1 ? 28 : 8, flex: 1 }}>
          <div style={{ fontSize: 16, marginBottom: 6 }}>{step.icon}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{step.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{step.text}</div>
        </div>
      </div>
    ))}

    <button
      onClick={() => navigate(activeTab === 'buyer' ? '/search' : '/seller/add-shop')}
      style={{
        width: '100%', marginTop: 16, padding: 12, borderRadius: 'var(--radius-md)',
        background: activeTab === 'buyer' ? 'var(--text-1)' : 'var(--green)',
        color: '#fff', fontSize: 14, fontWeight: 500, border: 'none',
        cursor: 'pointer', fontFamily: 'var(--font-body)',
      }}
    >
      {activeTab === 'buyer' ? 'Fillo të blesh →' : 'Hap dyqanin falas →'}
    </button>
  </div>
</section>
        <section className={styles.trustBanner}>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>✓</span>
            <div>
              <div className={styles.trustTitle}>{t('verified_shops_title')}</div>
              <div className={styles.trustSub}>{t('verified_shops_sub')}</div>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>★</span>
            <div>
              <div className={styles.trustTitle}>{t('real_reviews')}</div>
              <div className={styles.trustSub}>{t('real_reviews_sub')}</div>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>💵</span>
            <div>
              <div className={styles.trustTitle}>{t('cash_delivery')}</div>
              <div className={styles.trustSub}>{t('cash_delivery_sub')}</div>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>🚚</span>
            <div>
              <div className={styles.trustTitle}>{t('nationwide')}</div>
              <div className={styles.trustSub}>{t('nationwide_sub')}</div>
            </div>
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border)', padding: '24px 0', marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-3)' }}>tregu</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/legal" style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('terms')}</a>
            <a href="/legal" style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('privacy')}</a>
            <a href="/legal" style={{ fontSize: 13, color: 'var(--text-3)' }}>{t('copyright')}</a>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t('footer_rights')}</div>
        </div>
      </div>
    </div>
  );
}
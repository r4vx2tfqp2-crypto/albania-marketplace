import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { supabase } from '../lib/supabase';
import { categories } from '../data/mockData';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    fetchData();
    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: trending }, { data: shops }, { data: products }] = await Promise.all([
      supabase.from('products').select('*, shops(*)').eq('trending', true).limit(4),
      supabase.from('shops').select('*').eq('verified', true).limit(4),
      supabase.from('products').select('*, shops(*)').limit(8),
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
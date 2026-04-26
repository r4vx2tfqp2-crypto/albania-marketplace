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
      
      <Helmet>
       <title>Tregu — Të gjitha dyqanet shqiptare në një vend</title>
       <meta name="description" content="Zbulo produkte nga dyqane lokale të verifikuara në Shqipëri. Krahaso çmimet, porosit online, pagesa me dorëzim." />
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

  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
    {/* Buyers */}
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 22 }}>🛍️</span>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700 }}>Për Blerësit</h3>
      </div>
      {[
        { step: '1', icon: '🔍', title: 'Kërko', text: 'Kërko produkte nga dyqane të verifikuara në të gjithë Shqipërinë' },
        { step: '2', icon: '🛒', title: 'Porosit', text: 'Porosit me një klik. Pagesa me dorëzim — pa kartë bankare' },
        { step: '3', icon: '📦', title: 'Merr', text: 'Produkti dorëzohet direkt në derën tënde. Konfirmo marrjen' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 2 ? 20 : 0, position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--text-1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {item.step}
            </div>
            {i < 2 && <div style={{ width: 1, flex: 1, background: 'var(--border)', margin: '4px 0' }} />}
          </div>
          <div style={{ paddingBottom: i < 2 ? 16 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{item.title}</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{item.text}</div>
          </div>
        </div>
      ))}
      <button
        onClick={() => navigate('/search')}
        style={{ width: '100%', marginTop: 20, background: 'var(--text-1)', color: '#fff', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
      >
        Fillo të blesh →
      </button>
    </div>

    {/* Sellers */}
    <div style={{ background: 'var(--text-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 22 }}>🏪</span>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#fff' }}>Për Shitësit</h3>
      </div>
      {[
        { step: '1', icon: '📝', title: 'Regjistrohu', text: 'Krijo llogarinë dhe dyqanin tënd falas në 5 minuta' },
        { step: '2', icon: '📸', title: 'Listo', text: 'Shto produktet me foto dhe çmim. Aq e thjeshtë sa Instagram' },
        { step: '3', icon: '💰', title: 'Fito', text: 'Merr porosi direkt. Paguhu me dorëzim. Zgjero biznesin' },
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 2 ? 20 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
              {item.step}
            </div>
            {i < 2 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />}
          </div>
          <div style={{ paddingBottom: i < 2 ? 16 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{item.title}</div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{item.text}</div>
          </div>
        </div>
      ))}
      <button
        onClick={() => navigate('/seller/add-shop')}
        style={{ width: '100%', marginTop: 20, background: 'var(--green)', color: '#fff', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
      >
        Hap dyqanin falas →
      </button>
    </div>
  </div>
</section>
  
{/* Guarantees section */}
<section className={styles.section}>
  <div style={{ background: 'var(--green-light)', border: '1px solid #5DCAA5', borderRadius: 'var(--radius-xl)', padding: '32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <span style={{ fontSize: 24 }}>🛡️</span>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--green-dark)' }}>
        Garancitë tona për shitësit
      </h2>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {[
        { icon: '🆓', title: 'Falas për 6 muajt e parë', text: 'Listimi është plotësisht falas gjatë fazës së lansimit. Për 5 dyqanet e para — falas përgjithmonë!' },
        { icon: '🚫', title: 'Pa kontratë', text: 'Largohuni kur të doni, pa asnjë penalitet' },
        { icon: '📢', title: 'Njoftim 30 ditë', text: 'Njoftim paraprak 30 ditë para çdo ndryshimi të çmimeve' },
        { icon: '🔒', title: 'Pa akses bankar', text: 'Nuk kemi akses në llogarinë tuaj bankare asnjëherë' },
      ].map((g, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green-dark)', marginBottom: 3 }}>{g.title}</div>
            <div style={{ fontSize: 13, color: '#0F6E56', lineHeight: 1.5 }}>{g.text}</div>
          </div>
        </div>
      ))}
    </div>
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
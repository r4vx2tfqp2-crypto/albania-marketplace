import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { supabase } from '../lib/supabase';
import { categories } from '../data/mockData';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [featuredShops, setFeaturedShops] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    fetchData();
    return () => clearTimeout(t);
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

  return (
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <Zap size={12} fill="currentColor" />
            Albania's marketplace
          </div>
          <h1 className={styles.heroTitle}>
            All Albanian<br />shops in one place
          </h1>
          <p className={styles.heroSub}>
            Discover products from verified local shops. Compare prices, read reviews, order in seconds.
          </p>
          <form onSubmit={handleSearch} className={styles.heroSearch}>
            <Search size={16} strokeWidth={2} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products, shops…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>Search</button>
          </form>
        </div>
      </div>

      <div className="container">
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Browse by category</h2>
          </div>
          <div className={styles.catGrid}>
            {categories.map((cat) => (
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
                    <h2 className={styles.sectionTitle}>Trending now</h2>
                  </div>
                  <button className={styles.seeAll} onClick={() => navigate('/search?sort=trending')}>
                    See all <ArrowRight size={14} />
                  </button>
                </div>
                <div className={styles.productGrid}>
                  {trendingProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            )}

            {featuredShops.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>Verified shops</h2>
                  <button className={styles.seeAll} onClick={() => navigate('/search?tab=shops')}>
                    See all <ArrowRight size={14} />
                  </button>
                </div>
                <div className={styles.shopGrid}>
                  {featuredShops.map(shop => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                </div>
              </section>
            )}

            {allProducts.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>All products</h2>
                  <button className={styles.seeAll} onClick={() => navigate('/search')}>
                    See all <ArrowRight size={14} />
                  </button>
                </div>
                <div className={styles.productGrid}>
                  {allProducts.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              </section>
            )}

            {allProducts.length === 0 && trendingProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>No products yet</h2>
                <p style={{ color: 'var(--text-3)', marginBottom: 24 }}>Be the first to add a product!</p>
                <button className="btn-primary" onClick={() => navigate('/seller/add-product')}>Add first product</button>
              </div>
            )}
          </>
        )}

        <section className={styles.trustBanner}>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>✓</span>
            <div>
              <div className={styles.trustTitle}>Verified shops</div>
              <div className={styles.trustSub}>Every seller is checked</div>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>★</span>
            <div>
              <div className={styles.trustTitle}>Real reviews</div>
              <div className={styles.trustSub}>From real buyers</div>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>💵</span>
            <div>
              <div className={styles.trustTitle}>Cash on delivery</div>
              <div className={styles.trustSub}>Pay when you receive</div>
            </div>
          </div>
          <div className={styles.trustItem}>
            <span className={styles.trustIcon}>🚚</span>
            <div>
              <div className={styles.trustTitle}>Nationwide delivery</div>
              <div className={styles.trustSub}>All cities in Albania</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
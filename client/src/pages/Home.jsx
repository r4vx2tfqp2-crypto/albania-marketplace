import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { products, shops, categories } from '../data/mockData';
import styles from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const trendingProducts = products.filter(p => p.trending).slice(0, 4);
  const verifiedShops = shops.filter(s => s.verified).slice(0, 4);
  const allProducts = products.slice(0, 8);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className={`${styles.page} ${visible ? styles.visible : ''}`}>

      {/* Hero */}
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

        {/* Categories */}
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

        {/* Trending */}
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

        {/* Featured Shops */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Verified shops</h2>
            <button className={styles.seeAll} onClick={() => navigate('/search?tab=shops')}>
              See all <ArrowRight size={14} />
            </button>
          </div>
          <div className={styles.shopGrid}>
            {verifiedShops.map(shop => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </section>

        {/* All products */}
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

        {/* Trust Banner */}
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

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { products, shops, categories } from '../data/mockData';
import styles from './Search.module.css';

const CITIES = ['All cities', 'Tirana', 'Durrës', 'Shkodër', 'Vlorë'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Best rated' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [activeCity, setActiveCity] = useState('All cities');
  const [sort, setSort] = useState('relevance');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [tab, setTab] = useState(searchParams.get('tab') || 'products');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = products.filter(p => {
    const matchQ = !query || p.name.toLowerCase().includes(query.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    const shop = shops.find(s => s.id === p.shopId);
    const matchCity = activeCity === 'All cities' || shop?.location === activeCity;
    const matchVerified = !verifiedOnly || shop?.verified;
    return matchQ && matchCat && matchCity && matchVerified;
  }).sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price;
    if (sort === 'price-desc') return b.price - a.price;
    if (sort === 'rating') return b.rating - a.rating;
    return 0;
  });

  const filteredShops = shops.filter(s => {
    const matchQ = !query || s.name.toLowerCase().includes(query.toLowerCase());
    const matchCity = activeCity === 'All cities' || s.location === activeCity;
    const matchVerified = !verifiedOnly || s.verified;
    return matchQ && matchCity && matchVerified;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(q => { q.set('q', query); return q; });
  };

  return (
    <div className={styles.page}>
      <div className={styles.searchHeader}>
        <div className="container">
          <form onSubmit={handleSearch} className={styles.searchBar}>
            <SearchIcon size={16} strokeWidth={2} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search products, shops…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className={styles.input}
              autoFocus
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className={styles.clearBtn}>
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'products' ? styles.active : ''}`} onClick={() => setTab('products')}>
            Products ({filteredProducts.length})
          </button>
          <button className={`${styles.tab} ${tab === 'shops' ? styles.active : ''}`} onClick={() => setTab('shops')}>
            Shops ({filteredShops.length})
          </button>
          <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Category</div>
              <div className={styles.filterChips}>
                <button
                  className={`${styles.chip} ${!activeCategory ? styles.chipActive : ''}`}
                  onClick={() => setActiveCategory('')}
                >All</button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    className={`${styles.chip} ${activeCategory === c.id ? styles.chipActive : ''}`}
                    onClick={() => setActiveCategory(activeCategory === c.id ? '' : c.id)}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>City</div>
              <div className={styles.filterChips}>
                {CITIES.map(city => (
                  <button
                    key={city}
                    className={`${styles.chip} ${activeCity === city ? styles.chipActive : ''}`}
                    onClick={() => setActiveCity(city)}
                  >{city}</button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Sort by</div>
              <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
              Verified shops only
            </label>
          </div>
        )}

        {/* Active filters summary */}
        {(activeCategory || activeCity !== 'All cities' || verifiedOnly) && (
          <div className={styles.activeFilters}>
            {activeCategory && (
              <span className={styles.activeChip}>
                {categories.find(c => c.id === activeCategory)?.label}
                <button onClick={() => setActiveCategory('')}><X size={11} /></button>
              </span>
            )}
            {activeCity !== 'All cities' && (
              <span className={styles.activeChip}>
                {activeCity}
                <button onClick={() => setActiveCity('All cities')}><X size={11} /></button>
              </span>
            )}
            {verifiedOnly && (
              <span className={styles.activeChip}>
                Verified only
                <button onClick={() => setVerifiedOnly(false)}><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        <div className={styles.results}>
          {tab === 'products' ? (
            filteredProducts.length > 0 ? (
              <div className={styles.productGrid}>
                {filteredProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔍</div>
                <div className={styles.emptyTitle}>No products found</div>
                <div className={styles.emptySub}>Try a different search or remove some filters</div>
              </div>
            )
          ) : (
            filteredShops.length > 0 ? (
              <div className={styles.shopGrid}>
                {filteredShops.map(s => <ShopCard key={s.id} shop={s} />)}
              </div>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🏪</div>
                <div className={styles.emptyTitle}>No shops found</div>
                <div className={styles.emptySub}>Try a different location or search term</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

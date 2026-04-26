import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { supabase } from '../lib/supabase';
import { categories } from '../data/mockData';
import styles from './Search.module.css';

const CITIES = ['All cities', 'Tirana', 'Durrës', 'Shkodër', 'Vlorë'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Best rated' },
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [activeCity, setActiveCity] = useState('All cities');
  const [sort, setSort] = useState('relevance');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [tab, setTab] = useState(searchParams.get('tab') || 'products');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, [query, activeCategory, activeCity, sort, verifiedOnly]);

  const fetchData = async () => {
    setLoading(true);

    let productQuery = supabase.from('products').select('*, shops(*)');
    if (query) productQuery = productQuery.ilike('name', `%${query}%`);
    if (activeCategory) productQuery = productQuery.eq('category', activeCategory);
    if (sort === 'price-asc') productQuery = productQuery.order('price', { ascending: true });
    if (sort === 'price-desc') productQuery = productQuery.order('price', { ascending: false });
    if (sort === 'rating') productQuery = productQuery.order('rating', { ascending: false });

    let shopQuery = supabase.from('shops').select('*');
    if (query) shopQuery = shopQuery.ilike('name', `%${query}%`);
    if (verifiedOnly) shopQuery = shopQuery.eq('verified', true);

    const [{ data: productsData }, { data: shopsData }] = await Promise.all([
      productQuery,
      shopQuery,
    ]);

    let filteredProducts = productsData || [];
    if (activeCity !== 'All cities') {
      filteredProducts = filteredProducts.filter(p => p.shops?.location === activeCity);
    }
    if (verifiedOnly) {
      filteredProducts = filteredProducts.filter(p => p.shops?.verified);
    }

    setProducts(filteredProducts);
    setShops(shopsData || []);
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.searchHeader}>
        <div className="container">
          <div className={styles.searchBar}>
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
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'products' ? styles.active : ''}`} onClick={() => setTab('products')}>
            Products ({products.length})
          </button>
          <button className={`${styles.tab} ${tab === 'shops' ? styles.active : ''}`} onClick={() => setTab('shops')}>
            Shops ({shops.length})
          </button>
          <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={14} />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Category</div>
              <div className={styles.filterChips}>
                <button className={`${styles.chip} ${!activeCategory ? styles.chipActive : ''}`} onClick={() => setActiveCategory('')}>All</button>
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
                  <button key={city} className={`${styles.chip} ${activeCity === city ? styles.chipActive : ''}`} onClick={() => setActiveCity(city)}>{city}</button>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>Loading…</div>
        ) : (
          <div className={styles.results}>
            {tab === 'products' ? (
              products.length > 0 ? (
                <div className={styles.productGrid}>
                  {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                </div>
              ) : (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <div className={styles.emptyTitle}>No products found</div>
                  <div className={styles.emptySub}>Try a different search or remove some filters</div>
                </div>
              )
            ) : (
              shops.length > 0 ? (
                <div className={styles.shopGrid}>
                  {shops.map(s => <ShopCard key={s.id} shop={s} />)}
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
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { supabase } from '../lib/supabase';
import { categories } from '../data/mockData';
import styles from './Search.module.css';

const SORT_OPTIONS_KEYS = [
  { value: 'relevance', key: 'sort_relevance' },
  { value: 'price-asc', key: 'sort_price_asc' },
  { value: 'price-desc', key: 'sort_price_desc' },
  { value: 'rating', key: 'sort_rating' },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [activeCity, setActiveCity] = useState(t('all_cities'));
  const [sort, setSort] = useState('relevance');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [tab, setTab] = useState(searchParams.get('tab') || 'products');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const CITIES = [t('all_cities'), 'Tirana', 'Durrës', 'Shkodër', 'Vlorë'];

  useEffect(() => { fetchData(); }, [query, activeCategory, activeCity, sort, verifiedOnly]);

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

    const [{ data: productsData }, { data: shopsData }] = await Promise.all([productQuery, shopQuery]);

    let filtered = productsData || [];
    if (activeCity !== t('all_cities')) filtered = filtered.filter(p => p.shops?.location === activeCity);
    if (verifiedOnly) filtered = filtered.filter(p => p.shops?.verified);

    setProducts(filtered);
    setShops(shopsData || []);
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.searchHeader}>
        <div className="container">
          <div className={styles.searchBar}>
            <Search size={16} strokeWidth={2} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className={styles.input}
              autoFocus
            />
            {query && <button onClick={() => setQuery('')} className={styles.clearBtn}><X size={14} /></button>}
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'products' ? styles.active : ''}`} onClick={() => setTab('products')}>
            {t('products')} ({products.length})
          </button>
          <button className={`${styles.tab} ${tab === 'shops' ? styles.active : ''}`} onClick={() => setTab('shops')}>
            {t('shops')} ({shops.length})
          </button>
          <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={14} /> {t('filters')}
          </button>
        </div>

        {showFilters && (
          <div className={styles.filterPanel}>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>{t('category')}</div>
              <div className={styles.filterChips}>
                <button className={`${styles.chip} ${!activeCategory ? styles.chipActive : ''}`} onClick={() => setActiveCategory('')}>
                  {t('all_cities').replace('qytetet', 'kategoritë')}
                </button>
                {categories.map(c => (
                  <button key={c.id} className={`${styles.chip} ${activeCategory === c.id ? styles.chipActive : ''}`} onClick={() => setActiveCategory(activeCategory === c.id ? '' : c.id)}>
                    {c.icon} {t(`cat_${c.id}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>{t('city')}</div>
              <div className={styles.filterChips}>
                {CITIES.map(city => (
                  <button key={city} className={`${styles.chip} ${activeCity === city ? styles.chipActive : ''}`} onClick={() => setActiveCity(city)}>{city}</button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>{t('sort_by')}</div>
              <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS_KEYS.map(o => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
              </select>
            </div>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} />
              {t('verified_only')}
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
                  <div className={styles.emptyTitle}>{t('no_products_found')}</div>
                  <div className={styles.emptySub}>{t('try_different')}</div>
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
                  <div className={styles.emptyTitle}>{t('no_shops_found')}</div>
                  <div className={styles.emptySub}>{t('try_different')}</div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
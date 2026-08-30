import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { supabase } from '../lib/supabase';
import { categories } from '../data/categories';
import styles from './Search.module.css';

const AI_SEARCH_URL = 'https://onngupovxaequeqplikx.supabase.co/functions/v1/ai-search';

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

  // AI search is a distinct mode, not a live-as-you-type filter: it's a
  // real API call (an LLM ranking the catalog), so it only runs on
  // explicit submit, and its results replace the normal keyword-filtered
  // list/tabs/filters entirely while active rather than mixing with them.
  const [aiMode, setAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiError, setAiError] = useState(false);

  const CITIES = [t('all_cities'), 'Tirana', 'Durrës', 'Shkodër', 'Vlorë'];

  useEffect(() => { if (!aiMode) fetchData(); }, [query, activeCategory, activeCity, sort, verifiedOnly, aiMode]);

  const runAiSearch = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiError(false);
    setAiQuery(query.trim());
    try {
      const res = await fetch(AI_SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) throw new Error('AI search failed');
      const { productIds } = await res.json();
      if (!productIds || productIds.length === 0) { setAiResults([]); setAiLoading(false); return; }
      const { data } = await supabase.from('products').select('*, shops(*)').in('id', productIds);
      // Supabase's .in() doesn't preserve the requested order -- re-sort to
      // match the AI's relevance ranking instead of DB row order.
      const byId = Object.fromEntries((data || []).map(p => [p.id, p]));
      setAiResults(productIds.map(id => byId[id]).filter(Boolean));
    } catch {
      setAiError(true);
      setAiResults(null);
    }
    setAiLoading(false);
  };

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
      <h1 className="sr-only">{t('products')} — Tregu</h1>
      <div className={styles.searchHeader}>
        <div className="container">
          <div className={styles.searchBar}>
            <Search size={16} strokeWidth={2} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={aiMode ? 'Përshkruaj çfarë kërkon... p.sh. "këpucë të zeza për dimër nën 5000 lekë"' : t('search_placeholder')}
              aria-label={t('search_placeholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (aiMode && e.key === 'Enter') { e.preventDefault(); runAiSearch(); } }}
              className={styles.input}
              autoFocus
            />
            {query && <button onClick={() => { setQuery(''); if (aiMode) { setAiResults(null); setAiQuery(''); } }} className={styles.clearBtn} aria-label={t('clear') || 'Clear search'}><X size={14} /></button>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => { setAiMode(m => !m); setAiResults(null); setAiError(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
                border: '1px solid', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
                borderColor: aiMode ? 'var(--green)' : 'var(--border-strong)',
                background: aiMode ? 'var(--green-light)' : 'var(--surface)',
                color: aiMode ? 'var(--green-dark)' : 'var(--text-2)',
              }}>
              <Sparkles size={13} /> Kërko me AI
            </button>
            {aiMode && (
              <button type="button" onClick={runAiSearch} disabled={!query.trim() || aiLoading}
                style={{ padding: '6px 16px', borderRadius: 20, border: 'none', fontSize: 12.5, fontWeight: 600, cursor: query.trim() ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', background: 'var(--text-1)', color: '#fff', opacity: query.trim() ? 1 : 0.5 }}>
                {aiLoading ? 'Duke kërkuar...' : 'Kërko'}
              </button>
            )}
          </div>
        </div>
      </div>

      {aiMode ? (
        <div className="container">
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>Duke kërkuar me AI…</div>
          ) : aiError ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⚠️</div>
              <div className={styles.emptyTitle}>Kërkimi me AI dështoi</div>
              <div className={styles.emptySub}>Provo perseri, ose ktheu tek kerkimi normal.</div>
            </div>
          ) : aiResults === null ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Sparkles size={40} strokeWidth={1.5} /></div>
              <div className={styles.emptyTitle}>Përshkruaj çfarë kërkon</div>
              <div className={styles.emptySub}>P.sh. "diçka për dhuratë deri në 2000 lekë" ose "fustan i zi për mbrëmje"</div>
            </div>
          ) : aiResults.length > 0 ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 14px' }}>
                <Sparkles size={12} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
                Rezultate te sugjeruara nga AI për "{aiQuery}"
              </div>
              <div className={styles.productGrid}>
                {aiResults.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <div className={styles.emptyTitle}>{t('no_products_found')}</div>
              <div className={styles.emptySub}>Provo ta pershkruash ndryshe, ose perdor kerkimin normal.</div>
            </div>
          )}
        </div>
      ) : (
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
              <label className={styles.filterLabel} htmlFor="search-sort">{t('sort_by')}</label>
              <select id="search-sort" className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
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
      )}
    </div>
  );
}
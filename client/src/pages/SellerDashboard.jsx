import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Package, DollarSign, Star, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './SellerDashboard.module.css';

export default function SellerDashboard() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [{ data: shopsData }, { data: ordersData }] = await Promise.all([
      supabase.from('shops').select('*, products(*)'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    ]);
    setShops(shopsData || []);
    setProducts(shopsData?.flatMap(s => s.products || []) || []);
    setOrders(ordersData || []);
    setLoading(false);
  };

  const formatPrice = (p) => p?.toLocaleString('sq-AL') + ' L';
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const STATUS = {
    confirmed: { label: t('order_confirmed'), color: 'var(--blue)', bg: 'var(--blue-light)' },
    processing: { label: t('packed'), color: 'var(--amber)', bg: 'var(--amber-light)' },
    completed: { label: t('delivered'), color: 'var(--green)', bg: 'var(--green-light)' },
    on_the_way: { label: t('on_the_way'), color: 'var(--blue)', bg: 'var(--blue-light)' },
    delivered: { label: t('delivered'), color: 'var(--green)', bg: 'var(--green-light)' },
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('seller_dashboard_title')}</h1>
            <p className={styles.sub}>{t('manage_shops')}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {user?.email === 'julsina76@gmail.com' && (
              <Link to="/admin" className={styles.addBtn} style={{ background: 'var(--amber-light)', color: '#854F0B', border: 'none' }}>
                ⚙️ Admin Panel
              </Link>
            )}
            <Link to="/seller/add-shop" className={styles.addBtn} style={{ background: 'var(--surface)', color: 'var(--text-1)', border: '1px solid var(--border-strong)' }}>
              {t('add_shop')}
            </Link>
            <Link to="/seller/add-product" className={styles.addBtn}>
              <Plus size={16} /> {t('add_product')}
            </Link>
          </div>
        </div>

        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: 'var(--green-light)', color: 'var(--green)' }}><DollarSign size={18} /></div>
            <div className={styles.metricVal}>{formatPrice(totalRevenue)}</div>
            <div className={styles.metricLabel}>{t('total_revenue')}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}><Package size={18} /></div>
            <div className={styles.metricVal}>{orders.length}</div>
            <div className={styles.metricLabel}>{t('total_orders')}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: 'var(--amber-light)', color: '#854F0B' }}><TrendingUp size={18} /></div>
            <div className={styles.metricVal}>{products.length}</div>
            <div className={styles.metricLabel}>{t('active_products')}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: '#FBEAF0', color: 'var(--pink)' }}><Star size={18} /></div>
            <div className={styles.metricVal}>{shops.length}</div>
            <div className={styles.metricLabel}>{t('your_shops')}</div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('recent_orders')}</h2>
            </div>
            {orders.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>{t('no_orders_yet')}</div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map(order => {
                  const status = STATUS[order.status] || STATUS.confirmed;
                  return (
                    <div key={order.id} className={styles.orderRow}>
                      <div className={styles.orderInfo}>
                        <div className={styles.orderId}>#{order.id.slice(0, 8)}</div>
                        <div className={styles.orderCustomer}>{order.customer_name} · {order.customer_city}</div>
                        <div className={styles.orderProduct}>{order.items?.map(i => i.name).join(', ')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>{status.label}</span>
                        <div className={styles.orderTotal}>{formatPrice(order.total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('your_products')}</h2>
              <Link to="/seller/add-product" className={styles.seeAll}>{t('add_product')} <ArrowRight size={13} /></Link>
            </div>
            {products.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
                {t('no_products_yet_dash')} — <Link to="/seller/add-product" style={{ color: 'var(--green)' }}>{t('add_first')}</Link>
              </div>
            ) : (
              <div className={styles.productsList}>
                {products.map((p, i) => {
                  const COLORS = ['#E1F5EE','#E6F1FB','#FBEAF0','#FAEEDA'];
                  return (
                    <div key={p.id} className={styles.productRow}>
                      <div className={styles.productImg} style={{ background: COLORS[i % 4] }}>
                        {p.category === 'shoes' ? '👟' : p.category === 'clothes' ? '👕' : p.category === 'electronics' ? '📱' : '📦'}
                      </div>
                      <div className={styles.productInfo}>
                        <div className={styles.productName}>{p.name}</div>
                        <div className={styles.productMeta}>{p.in_stock ? t('in_stock') : t('out_of_stock')} · {p.category}</div>
                      </div>
                      <div className={styles.productPrice}>{p.price?.toLocaleString()} L</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {shops.length > 0 && (
          <div className={styles.section} style={{ marginTop: 20 }}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{t('your_shops')}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {shops.map(shop => (
                <Link key={shop.id} to={`/shop/${shop.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, transition: 'all 0.15s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: shop.color + '22', color: shop.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                    {shop.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{shop.products?.length || 0} {t('active_products').toLowerCase()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
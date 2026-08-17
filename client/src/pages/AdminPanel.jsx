import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PLANS = [
  { key: 'free', label: 'Free', price: 0 },
  { key: 'basic', label: 'Basic', price: 2000 },
  { key: 'premium', label: 'Premium', price: 4000 },
];

const TABS = ['overview', 'analytics', 'pending', 'shops', 'orders', 'subscriptions'];

const ORDER_STATUSES = ['confirmed', 'packed', 'picked_up', 'on_the_way', 'delivered'];
const STATUS_COLORS = {
  confirmed: { bg: 'var(--blue-light)', color: 'var(--blue)' },
  packed: { bg: 'var(--amber-light)', color: '#854F0B' },
  picked_up: { bg: 'var(--amber-light)', color: '#854F0B' },
  on_the_way: { bg: 'var(--blue-light)', color: 'var(--blue)' },
  delivered: { bg: 'var(--green-light)', color: 'var(--green-dark)' },
};

const CATEGORY_LABELS = {
  shoes: 'Kepuce & Sandale', clothes: 'Rroba & Mode', electronics: 'Elektronike',
  beauty: 'Bukuri & Kozmetike', home: 'Shtepi & Jetese', sports: 'Sporte & Fitness',
  gifts: 'Dhurata', construction: 'Vegla & Ndertim',
};

// last N whole calendar days, oldest first, each as a [start, end) range
function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    days.push({ start, end });
  }
  return days;
}

// last N whole weeks, oldest first
function lastNWeeks(n) {
  const weeks = [];
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    weeks.push({ start, end });
  }
  return weeks;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null); // { total, createdDates } -- null while loading/unavailable
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetchAll();
    fetchUserStats();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: shopsData }, { data: ordersData }, { data: productsData }] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
    ]);
    setShops(shopsData || []);
    setOrders(ordersData || []);
    setProducts(productsData || []);
    setLoading(false);
  };

  // Signup counts live in Supabase Auth, not a client-readable table --
  // fetched via an admin-only edge function using the service-role key.
  const fetchUserStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch('https://onngupovxaequeqplikx.supabase.co/functions/v1/admin-user-stats', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUserStats(data);
    } catch { /* leave userStats null -- section just won't render */ }
  };

  const updateShop = async (shopId, updates) => {
    setSaving(shopId);
    await supabase.from('shops').update(updates).eq('id', shopId);
    await fetchAll();
    setSaving(null);
  };

  const approveShop = (shop) => updateShop(shop.id, { status: 'approved', subscription_active: true });
  const rejectShop = (shop) => updateShop(shop.id, { status: 'rejected', subscription_active: false });
  const toggleActive = (shop) => updateShop(shop.id, { subscription_active: !shop.subscription_active });
  const setPlan = (shop, plan) => {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    updateShop(shop.id, {
      subscription_plan: plan.key,
      subscription_active: true,
      subscription_expires_at: expires.toISOString(),
    });
  };
  const updateOrderStatus = async (orderId, status) => {
    setSaving(orderId);
    await supabase.from('orders').update({ status }).eq('id', orderId);
    await fetchAll();
    setSaving(null);
  };

  const pendingShops = shops.filter(s => s.status === 'pending');
  const approvedShops = shops.filter(s => s.status === 'approved');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const formatPrice = (p) => p?.toLocaleString('sq-AL') + ' L';

  // ---- Analytics ----
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const deliveredRevenue = deliveredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrderValue = orders.length ? Math.round(totalRevenue / orders.length) : 0;
  const inStockProducts = products.filter(p => p.in_stock !== false).length;

  const days14 = lastNDays(14);
  const revenueByDay = days14.map(({ start, end }) => {
    const dayOrders = orders.filter(o => { const c = new Date(o.created_at); return c >= start && c < end; });
    return { label: start.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' }), revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0), count: dayOrders.length };
  });
  const maxDayRevenue = Math.max(1, ...revenueByDay.map(d => d.revenue));

  const ordersThisWeek = orders.filter(o => new Date(o.created_at) >= lastNDays(7)[0].start).length;
  const ordersPrevWeek = orders.filter(o => { const c = new Date(o.created_at); return c >= lastNDays(14)[0].start && c < lastNDays(7)[0].start; }).length;
  const ordersTrend = ordersPrevWeek === 0 ? (ordersThisWeek > 0 ? 100 : 0) : Math.round(((ordersThisWeek - ordersPrevWeek) / ordersPrevWeek) * 100);

  const statusCounts = ORDER_STATUSES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {});
  const maxStatusCount = Math.max(1, ...Object.values(statusCounts));

  const shopRevenueMap = {};
  orders.forEach(o => { if (o.shop_id) shopRevenueMap[o.shop_id] = (shopRevenueMap[o.shop_id] || 0) + (o.total || 0); });
  const topShops = Object.entries(shopRevenueMap)
    .map(([shopId, revenue]) => ({ shop: shops.find(s => s.id === shopId), revenue, orderCount: orders.filter(o => o.shop_id === shopId).length }))
    .filter(x => x.shop)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const maxShopRevenue = Math.max(1, ...topShops.map(s => s.revenue));

  const productStatsMap = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const key = item.id || item.name;
      if (!productStatsMap[key]) productStatsMap[key] = { name: item.name, units: 0, revenue: 0 };
      productStatsMap[key].units += item.qty || 1;
      productStatsMap[key].revenue += (item.price || 0) * (item.qty || 1);
    });
  });
  const topProducts = Object.values(productStatsMap).sort((a, b) => b.units - a.units).slice(0, 5);
  const maxProductUnits = Math.max(1, ...topProducts.map(p => p.units));

  const categoryCounts = {};
  products.forEach(p => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; });
  const categoryList = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = Math.max(1, ...categoryList.map(c => c[1]));

  const weeks8 = lastNWeeks(8);
  const shopsByWeek = weeks8.map(({ start, end }) => ({
    label: start.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' }),
    count: shops.filter(s => { const c = new Date(s.created_at); return c >= start && c < end; }).length,
  }));
  const maxShopsByWeek = Math.max(1, ...shopsByWeek.map(w => w.count));

  const userDates = (userStats?.createdDates || []).map(d => new Date(d));
  const usersByWeek = weeks8.map(({ start, end }) => ({
    label: start.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' }),
    count: userDates.filter(c => c >= start && c < end).length,
  }));
  const maxUsersByWeek = Math.max(1, ...usersByWeek.map(w => w.count));
  const usersThisWeek = usersByWeek[usersByWeek.length - 1]?.count || 0;

  const Bar = ({ pct, color }) => (
    <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', height: 8 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.3s' }} />
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
      Loading admin panel…
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Admin header */}
      <div style={{ background: 'var(--text-1)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'var(--green)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>T</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>Tregu Admin</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>info@tregu.store</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          ← Back to marketplace
        </button>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '14px 18px', fontSize: 14, fontWeight: 500,
              borderBottom: tab === t ? '2px solid var(--text-1)' : '2px solid transparent',
              color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
              background: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap', textTransform: 'capitalize',
              position: 'relative',
            }}
          >
            {t}
            {t === 'pending' && pendingShops.length > 0 && (
              <span style={{ marginLeft: 6, background: 'var(--red)', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 600 }}>
                {pendingShops.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Total shops', value: approvedShops.length, bg: 'var(--green-light)', color: 'var(--green-dark)' },
                { label: 'Pending approval', value: pendingShops.length, bg: 'var(--amber-light)', color: '#854F0B' },
                { label: 'Total orders', value: orders.length, bg: 'var(--blue-light)', color: 'var(--blue)' },
                { label: 'Total revenue', value: formatPrice(totalRevenue), bg: '#F0EEFF', color: '#3C3489' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: 16, padding: '20px 24px' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: stat.color, opacity: 0.8, marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {pendingShops.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 10, fontSize: 11, padding: '2px 8px' }}>{pendingShops.length}</span>
                  Shops waiting for approval
                </div>
                {pendingShops.map(shop => (
                  <div key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: (shop.color || '#1D9E75') + '22', color: shop.color || '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                      {shop.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{shop.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{shop.location} · {shop.phone}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => approveShop(shop)} disabled={saving === shop.id} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => rejectShop(shop)} disabled={saving === shop.id} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--red-light)', color: 'var(--red)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {tab === 'analytics' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Te ardhura (dorezuar)', value: formatPrice(deliveredRevenue), bg: 'var(--green-light)', color: 'var(--green-dark)' },
                { label: 'Te ardhura (te gjitha)', value: formatPrice(totalRevenue), bg: '#F0EEFF', color: '#3C3489' },
                { label: 'Vlera mesatare porosise', value: formatPrice(avgOrderValue), bg: 'var(--blue-light)', color: 'var(--blue)' },
                { label: 'Porosi kete jave', value: ordersThisWeek, sub: ordersPrevWeek > 0 || ordersThisWeek > 0 ? `${ordersTrend >= 0 ? '+' : ''}${ordersTrend}% vs java e kaluar` : null, bg: 'var(--amber-light)', color: '#854F0B' },
                { label: 'Produkte aktive', value: inStockProducts, sub: `${products.length} total`, bg: 'var(--green-light)', color: 'var(--green-dark)' },
                { label: 'Dyqane aktive', value: approvedShops.length, sub: `${shops.length} total`, bg: 'var(--blue-light)', color: 'var(--blue)' },
                { label: 'Perdorues te regjistruar', value: userStats ? userStats.total : '—', sub: userStats ? `+${usersThisWeek} kete jave` : 'Duke ngarkuar...', bg: '#F0EEFF', color: '#3C3489' },
              ].map(stat => (
                <div key={stat.label} style={{ background: stat.bg, borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: stat.color, opacity: 0.8, marginTop: 4 }}>{stat.label}</div>
                  {stat.sub && <div style={{ fontSize: 11, color: stat.color, opacity: 0.65, marginTop: 2 }}>{stat.sub}</div>}
                </div>
              ))}
            </div>

            {/* Revenue last 14 days */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Te ardhurat, 14 ditet e fundit</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
                {revenueByDay.map((d, i) => (
                  <div key={i} title={`${d.label}: ${formatPrice(d.revenue)} (${d.count} porosi)`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
                    <div style={{ width: '100%', height: `${Math.max(2, (d.revenue / maxDayRevenue) * 100)}%`, background: d.revenue > 0 ? 'var(--green)' : 'var(--border)', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {revenueByDay.map((d, i) => (
                  <div key={i} style={{ flex: 1, fontSize: 9, color: 'var(--text-3)', textAlign: 'center' }}>{i % 2 === 0 ? d.label : ''}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* Orders by status */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Porosite sipas statusit</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {ORDER_STATUSES.map(status => (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 90, fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</div>
                      <Bar pct={(statusCounts[status] / maxStatusCount) * 100} color={STATUS_COLORS[status]?.color || 'var(--text-3)'} />
                      <div style={{ width: 24, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{statusCounts[status]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products by category */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Produktet sipas kategorise</div>
                {categoryList.length === 0 ? (
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Ende pa produkte</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {categoryList.map(([cat, count]) => (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 110, fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{CATEGORY_LABELS[cat] || cat}</div>
                        <Bar pct={(count / maxCategoryCount) * 100} color="var(--blue)" />
                        <div style={{ width: 24, fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
              {/* Top shops */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top 5 dyqane sipas te ardhurave</div>
                {topShops.length === 0 ? (
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Ende pa porosi</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topShops.map(({ shop, revenue, orderCount }) => (
                      <div key={shop.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>{shop.name}</span>
                          <span style={{ color: 'var(--text-3)' }}>{formatPrice(revenue)} · {orderCount} porosi</span>
                        </div>
                        <Bar pct={(revenue / maxShopRevenue) * 100} color="var(--green)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top products */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top 5 produkte sipas shitjeve</div>
                {topProducts.length === 0 ? (
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Ende pa shitje</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topProducts.map((p, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{p.name}</span>
                          <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{p.units} njesi · {formatPrice(p.revenue)}</span>
                        </div>
                        <Bar pct={(p.units / maxProductUnits) * 100} color="#3C3489" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {/* Shop growth */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Dyqane te reja, 8 javet e fundit</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
                  {shopsByWeek.map((w, i) => (
                    <div key={i} title={`${w.label}: ${w.count} dyqane te reja`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{w.count > 0 ? w.count : ''}</div>
                      <div style={{ width: '100%', height: `${Math.max(2, (w.count / maxShopsByWeek) * 100)}%`, background: w.count > 0 ? 'var(--blue)' : 'var(--border)', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                      <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{w.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User growth */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Regjistrime te reja, 8 javet e fundit</div>
                {!userStats ? (
                  <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Duke ngarkuar...</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90 }}>
                    {usersByWeek.map((w, i) => (
                      <div key={i} title={`${w.label}: ${w.count} regjistrime`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{w.count > 0 ? w.count : ''}</div>
                        <div style={{ width: '100%', height: `${Math.max(2, (w.count / maxUsersByWeek) * 100)}%`, background: w.count > 0 ? '#3C3489' : 'var(--border)', borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                        <div style={{ fontSize: 9, color: 'var(--text-3)' }}>{w.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PENDING */}
        {tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Pending shops ({pendingShops.length})</h2>
            {pendingShops.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>No pending shops 🎉</div>
            ) : pendingShops.map(shop => (
              <div key={shop.id} style={{ background: 'var(--surface)', border: '1px solid var(--amber)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: (shop.color || '#1D9E75') + '22', color: shop.color || '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                    {shop.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{shop.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{shop.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                      📍 {shop.location} · 📞 {shop.phone} · {shop.category}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      Registered: {new Date(shop.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => approveShop(shop)} disabled={saving === shop.id} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--green)', color: '#fff', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      {saving === shop.id ? '…' : '✓ Approve'}
                    </button>
                    <button onClick={() => rejectShop(shop)} disabled={saving === shop.id} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--red-light)', color: 'var(--red)', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SHOPS */}
        {tab === 'shops' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>All shops ({shops.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {shops.map(shop => (
                <div key={shop.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, opacity: shop.subscription_active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: (shop.color || '#1D9E75') + '22', color: shop.color || '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                      {shop.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{shop.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{shop.location} · {shop.phone}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: shop.status === 'approved' ? 'var(--green-light)' : shop.status === 'pending' ? 'var(--amber-light)' : 'var(--red-light)', color: shop.status === 'approved' ? 'var(--green-dark)' : shop.status === 'pending' ? '#854F0B' : 'var(--red)' }}>
                      {shop.status}
                    </span>
                    <button onClick={() => supabase.from('shops').update({ verified: !shop.verified }).eq('id', shop.id).then(() => fetchAll())}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', background: shop.verified ? 'var(--blue-light)' : 'var(--surface)', color: shop.verified ? 'var(--blue)' : 'var(--text-2)', marginRight: 4 }}>
                      {shop.verified ? '✓ Verified' : 'Verify'}
                    </button>
                    <button onClick={() => toggleActive(shop)} disabled={saving === shop.id} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border-strong)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', background: shop.subscription_active ? 'var(--red-light)' : 'var(--green-light)', color: shop.subscription_active ? 'var(--red)' : 'var(--green-dark)' }}>
                      {saving === shop.id ? '…' : shop.subscription_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 4 }}>Plan:</span>
                    {PLANS.map(plan => (
                      <button key={plan.key} onClick={() => setPlan(shop, plan)} disabled={saving === shop.id} style={{ padding: '3px 10px', borderRadius: 20, border: '1px solid', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', borderColor: shop.subscription_plan === plan.key ? 'var(--text-1)' : 'var(--border-strong)', background: shop.subscription_plan === plan.key ? 'var(--text-1)' : 'transparent', color: shop.subscription_plan === plan.key ? '#fff' : 'var(--text-2)' }}>
                        {plan.label} {plan.price > 0 ? `${plan.price.toLocaleString()} L/mo` : 'Free'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>All orders ({orders.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>No orders yet</div>
              ) : orders.map(order => (
                <div key={order.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>#{order.id.slice(0, 8)}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{order.customer_name} · {order.customer_phone}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{order.customer_address}, {order.customer_city}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{new Date(order.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(order.total)}</div>
                  </div>
                  {order.items && (
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                      {order.items.map((item, i) => (
                        <span key={i}>{item.name} ×{item.qty}{i < order.items.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 4 }}>Status:</span>
                    {ORDER_STATUSES.map(status => (
                      <button key={status} onClick={() => updateOrderStatus(order.id, status)} disabled={saving === order.id} style={{ padding: '3px 10px', borderRadius: 20, border: '1px solid', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', borderColor: order.status === status ? 'var(--text-1)' : 'var(--border-strong)', background: order.status === status ? 'var(--text-1)' : 'transparent', color: order.status === status ? '#fff' : 'var(--text-2)', textTransform: 'capitalize' }}>
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS */}
        {tab === 'subscriptions' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Subscriptions</h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>Manage shop plans. Activate billing when you're ready to charge.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
              {PLANS.map(plan => (
                <div key={plan.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{plan.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                    {plan.price === 0 ? 'Free' : `${plan.price.toLocaleString()} L/mo`}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>
                    {shops.filter(s => s.subscription_plan === plan.key || (!s.subscription_plan && plan.key === 'free')).length} shops on this plan
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#854F0B', marginBottom: 6 }}>💡 Billing not active yet</div>
              <div style={{ fontSize: 13, color: '#854F0B' }}>All shops are currently on free plans. When you're ready to charge, change their plan above and notify them via WhatsApp or email.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {approvedShops.map(shop => (
                <div key={shop.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: (shop.color || '#1D9E75') + '22', color: shop.color || '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {shop.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{shop.location}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {PLANS.map(plan => (
                      <button key={plan.key} onClick={() => setPlan(shop, plan)} disabled={saving === shop.id} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)', borderColor: (shop.subscription_plan || 'free') === plan.key ? 'var(--text-1)' : 'var(--border-strong)', background: (shop.subscription_plan || 'free') === plan.key ? 'var(--text-1)' : 'transparent', color: (shop.subscription_plan || 'free') === plan.key ? '#fff' : 'var(--text-2)' }}>
                        {plan.label}
                      </button>
                    ))}
                  </div>
                  {shop.subscription_expires_at && (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      Exp: {new Date(shop.subscription_expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const PLANS = [
  { key: 'free', label: 'Free', price: 0 },
  { key: 'basic', label: 'Basic', price: 2000 },
  { key: 'premium', label: 'Premium', price: 4000 },
];

const TABS = ['overview', 'pending', 'shops', 'orders', 'subscriptions'];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [shops, setShops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: shopsData }, { data: ordersData }] = await Promise.all([
      supabase.from('shops').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);
    setShops(shopsData || []);
    setOrders(ordersData || []);
    setLoading(false);
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

  const ORDER_STATUSES = ['confirmed', 'packed', 'picked_up', 'on_the_way', 'delivered'];
  const STATUS_COLORS = {
    confirmed: { bg: 'var(--blue-light)', color: 'var(--blue)' },
    packed: { bg: 'var(--amber-light)', color: '#854F0B' },
    picked_up: { bg: 'var(--amber-light)', color: '#854F0B' },
    on_the_way: { bg: 'var(--blue-light)', color: 'var(--blue)' },
    delivered: { bg: 'var(--green-light)', color: 'var(--green-dark)' },
  };

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
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>tregusupport@gmail.com</div>
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
                    <button onClick={() => supabase.from('shops').update({ verified: !shop.verified }).eq('id', shop.id).then(() => fetchData())}
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
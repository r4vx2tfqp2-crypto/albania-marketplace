import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './AddProduct.module.css';

const PLANS = [
  { key: 'free', label: 'Free', price: 0 },
  { key: 'basic', label: 'Basic', price: 2000 },
  { key: 'premium', label: 'Premium', price: 4000 },
];

export default function AdminSubscriptions() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });
    setShops(data || []);
    setLoading(false);
  };

  const updateShop = async (shopId, updates) => {
    setSaving(shopId);
    await supabase.from('shops').update(updates).eq('id', shopId);
    await fetchShops();
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

  const pendingShops = shops.filter(s => s.status === 'pending');
  const approvedShops = shops.filter(s => s.status === 'approved');
  const rejectedShops = shops.filter(s => s.status === 'rejected');

  const currentShops = activeTab === 'pending' ? pendingShops : activeTab === 'approved' ? approvedShops : rejectedShops;

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate('/seller')}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className={styles.title}>Shop management</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 24 }}>
          Approve shops, manage subscriptions and control who sells on Tregu.
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          <div style={{ background: 'var(--amber-light)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#854F0B' }}>{pendingShops.length}</div>
            <div style={{ fontSize: 13, color: '#854F0B' }}>Pending approval</div>
          </div>
          <div style={{ background: 'var(--green-light)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green-dark)' }}>{approvedShops.length}</div>
            <div style={{ fontSize: 13, color: 'var(--green-dark)' }}>Active shops</div>
          </div>
          <div style={{ background: 'var(--red-light)', borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--red)' }}>{rejectedShops.length}</div>
            <div style={{ fontSize: 13, color: 'var(--red)' }}>Rejected</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {['pending', 'approved', 'rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px', fontSize: 14, fontWeight: 500,
                borderBottom: activeTab === tab ? '2px solid var(--text-1)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--text-1)' : 'var(--text-3)',
                marginBottom: -1, background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {tab} ({tab === 'pending' ? pendingShops.length : tab === 'approved' ? approvedShops.length : rejectedShops.length})
            </button>
          ))}
        </div>

        {currentShops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)', fontSize: 14 }}>
            No {activeTab} shops
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {currentShops.map(shop => (
              <div key={shop.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: 20,
                opacity: shop.subscription_active ? 1 : 0.7,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: (shop.color || '#1D9E75') + '22', color: shop.color || '#1D9E75',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, flexShrink: 0
                  }}>
                    {shop.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{shop.location} · {shop.category}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{shop.phone}</div>
                  </div>

                  {/* Action buttons based on status */}
                  {activeTab === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => approveShop(shop)}
                        disabled={saving === shop.id}
                        style={{
                          padding: '8px 16px', borderRadius: 'var(--radius-md)',
                          background: 'var(--green)', color: '#fff',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', border: 'none',
                        }}
                      >
                        {saving === shop.id ? '…' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => rejectShop(shop)}
                        disabled={saving === shop.id}
                        style={{
                          padding: '8px 16px', borderRadius: 'var(--radius-md)',
                          background: 'var(--red-light)', color: 'var(--red)',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', border: 'none',
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {activeTab === 'approved' && (
                    <button
                      onClick={() => toggleActive(shop)}
                      disabled={saving === shop.id}
                      style={{
                        padding: '7px 14px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        background: shop.subscription_active ? 'var(--red-light)' : 'var(--green-light)',
                        color: shop.subscription_active ? 'var(--red)' : 'var(--green-dark)',
                      }}
                    >
                      {saving === shop.id ? '…' : shop.subscription_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}

                  {activeTab === 'rejected' && (
                    <button
                      onClick={() => approveShop(shop)}
                      disabled={saving === shop.id}
                      style={{
                        padding: '7px 14px', borderRadius: 'var(--radius-md)',
                        background: 'var(--green-light)', color: 'var(--green-dark)',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        fontFamily: 'var(--font-body)', border: 'none',
                      }}
                    >
                      Reapprove
                    </button>
                  )}
                </div>

                {/* Plan selector for approved shops */}
                {activeTab === 'approved' && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 4 }}>Plan:</div>
                    {PLANS.map(plan => (
                      <button
                        key={plan.key}
                        onClick={() => setPlan(shop, plan)}
                        disabled={saving === shop.id}
                        style={{
                          padding: '4px 12px', borderRadius: 20,
                          border: '1px solid',
                          fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          borderColor: shop.subscription_plan === plan.key ? 'var(--text-1)' : 'var(--border-strong)',
                          background: shop.subscription_plan === plan.key ? 'var(--text-1)' : 'transparent',
                          color: shop.subscription_plan === plan.key ? '#fff' : 'var(--text-2)',
                        }}
                      >
                        {plan.label} {plan.price > 0 ? `· ${plan.price.toLocaleString()} L/mo` : '· Free'}
                      </button>
                    ))}
                    {shop.subscription_expires_at && (
                      <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>
                        Expires: {new Date(shop.subscription_expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
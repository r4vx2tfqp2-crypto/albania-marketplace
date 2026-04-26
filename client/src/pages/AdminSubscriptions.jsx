import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
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

  const toggleActive = (shop) => {
    updateShop(shop.id, { subscription_active: !shop.subscription_active });
  };

  const setPlan = (shop, plan) => {
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);
    updateShop(shop.id, {
      subscription_plan: plan.key,
      subscription_active: true,
      subscription_expires_at: expires.toISOString(),
    });
  };

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <button className={styles.back} onClick={() => navigate('/seller')}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className={styles.title}>Subscription management</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 28 }}>
          Control which shops are active and what plan they're on. Activate billing when you're ready.
        </p>

        {shops.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-3)' }}>
            No shops yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shops.map(shop => (
              <div key={shop.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: 20,
                opacity: shop.subscription_active ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: shop.color + '22', color: shop.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                    flexShrink: 0
                  }}>
                    {shop.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{shop.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {shop.location} · {shop.category}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, padding: '3px 10px',
                      borderRadius: 20,
                      background: shop.subscription_active ? 'var(--green-light)' : 'var(--red-light)',
                      color: shop.subscription_active ? 'var(--green-dark)' : 'var(--red)',
                    }}>
                      {shop.subscription_active ? '● Active' : '○ Inactive'}
                    </span>
                    <button
                      onClick={() => toggleActive(shop)}
                      disabled={saving === shop.id}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-strong)',
                        fontSize: 13, fontWeight: 500,
                        background: shop.subscription_active ? 'var(--red-light)' : 'var(--green-light)',
                        color: shop.subscription_active ? 'var(--red)' : 'var(--green-dark)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {saving === shop.id ? '…' : shop.subscription_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 4, alignSelf: 'center' }}>Plan:</div>
                  {PLANS.map(plan => (
                    <button
                      key={plan.key}
                      onClick={() => setPlan(shop, plan)}
                      disabled={saving === shop.id}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 20,
                        border: '1px solid',
                        fontSize: 12, fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        borderColor: shop.subscription_plan === plan.key ? 'var(--text-1)' : 'var(--border-strong)',
                        background: shop.subscription_plan === plan.key ? 'var(--text-1)' : 'transparent',
                        color: shop.subscription_plan === plan.key ? '#fff' : 'var(--text-2)',
                      }}
                    >
                      {plan.label} {plan.price > 0 ? `· ${plan.price.toLocaleString()} L/mo` : '· Free'}
                    </button>
                  ))}
                </div>

                {shop.subscription_expires_at && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
                    Expires: {new Date(shop.subscription_expires_at).toLocaleDateString()}
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
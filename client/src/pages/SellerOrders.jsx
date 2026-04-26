import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './Orders.module.css';

const ALL_STEPS = [
  { key: 'confirmed', label_key: 'order_confirmed' },
  { key: 'packed', label_key: 'packed' },
  { key: 'picked_up', label_key: 'picked_up' },
  { key: 'on_the_way', label_key: 'on_the_way' },
  { key: 'delivered', label_key: 'delivered' },
];

const STATUS_COLORS = {
  confirmed: { color: 'var(--blue)', bg: 'var(--blue-light)' },
  packed: { color: 'var(--amber)', bg: 'var(--amber-light)' },
  picked_up: { color: 'var(--amber)', bg: 'var(--amber-light)' },
  on_the_way: { color: 'var(--blue)', bg: 'var(--blue-light)' },
  delivered: { color: 'var(--green)', bg: 'var(--green-light)' },
};

export default function SellerOrders() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', user.id);

    const myProductIds = (productsData || []).map(p => p.id);

    if (myProductIds.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    const myOrders = (data || []).filter(order =>
      order.items?.some(item => myProductIds.includes(item.id))
    );

    setOrders(myOrders);
    setLoading(false);
  };

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    await supabase.from('orders').update({ status }).eq('id', orderId);
    await fetchOrders();
    setUpdating(null);
  };

  const formatPrice = (p) => p?.toLocaleString('sq-AL') + ' L';

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, fontFamily: 'var(--font-body)' }} onClick={() => navigate('/seller')}>
          <ArrowLeft size={16} /> {t('back')}
        </button>

        <h1 className={styles.title}>{t('recent_orders')}</h1>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyTitle}>{t('no_orders_yet')}</div>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map(order => {
              const status = STATUS_COLORS[order.status] || STATUS_COLORS.confirmed;
              const currentIdx = ALL_STEPS.findIndex(s => s.key === order.status);
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <div className={styles.orderId}>#{order.id.slice(0, 8)}</div>
                      <div className={styles.orderMeta}>
                        {order.customer_name} · {order.customer_phone} · {order.customer_city}
                      </div>
                      <div className={styles.orderMeta}>{order.customer_address}</div>
                      {order.notes && (
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                          📝 {order.notes}
                        </div>
                      )}
                    </div>
                    <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                      {t(ALL_STEPS.find(s => s.key === order.status)?.label_key || 'order_confirmed')}
                    </span>
                  </div>

                  {order.items && (
                    <div className={styles.orderItems}>
                      {order.items.map((item, i) => (
                        <div key={i} className={styles.orderItem}>
                          {item.name} {item.size ? `(${item.size})` : ''} ×{item.qty} — {item.price?.toLocaleString()} L
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0', padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', width: '100%', marginBottom: 6 }}>Update status:</div>
                    {ALL_STEPS.map(step => (
                      <button
                        key={step.key}
                        onClick={() => updateStatus(order.id, step.key)}
                        disabled={updating === order.id || order.status === step.key}
                        style={{
                          padding: '6px 12px', borderRadius: 20, border: '1px solid',
                          fontSize: 12, fontWeight: 500,
                          cursor: order.status === step.key ? 'default' : 'pointer',
                          fontFamily: 'var(--font-body)',
                          borderColor: order.status === step.key ? 'var(--text-1)' : 'var(--border-strong)',
                          background: order.status === step.key ? 'var(--text-1)' : 'transparent',
                          color: order.status === step.key ? '#fff' : 'var(--text-2)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {updating === order.id ? '…' : t(step.label_key)}
                      </button>
                    ))}
                  </div>

                  <div className={styles.progress}>
                    {ALL_STEPS.map((step, i) => {
                      const done = i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={step.key} className={styles.progressStep}>
                          <div className={`${styles.dot} ${done ? styles.dotDone : ''} ${active ? styles.dotActive : ''}`} />
                          <div className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''} ${done && !active ? styles.stepLabelDone : ''}`}>
                            {t(step.label_key)}
                          </div>
                          {i < ALL_STEPS.length - 1 && <div className={`${styles.line} ${i < currentIdx ? styles.lineDone : ''}`} />}
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>{t('total')}: {formatPrice(order.total)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(order.created_at).toLocaleString()}</span>
                  </div>

                  {/* PIN for driver */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--amber-light)', borderRadius: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 13, color: '#854F0B' }}>🔑 Driver PIN:</span>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#854F0B', letterSpacing: '0.2em' }}>{order.delivery_pin}</span>
                    <span style={{ fontSize: 12, color: '#854F0B', marginLeft: 'auto' }}>Share with driver</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import styles from './Orders.module.css';

const ALL_STEPS = [
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'on_the_way', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_LABELS = {
  confirmed: { label: 'Confirmed', color: 'var(--blue)', bg: 'var(--blue-light)' },
  packed: { label: 'Packed', color: 'var(--amber)', bg: 'var(--amber-light)' },
  picked_up: { label: 'Picked up', color: 'var(--amber)', bg: 'var(--amber-light)' },
  on_the_way: { label: 'On the way', color: 'var(--blue)', bg: 'var(--blue-light)' },
  delivered: { label: 'Delivered', color: 'var(--green)', bg: 'var(--green-light)' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const formatPrice = (p) => p?.toLocaleString('sq-AL') + ' L';

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>My orders</h1>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyTitle}>No orders yet</div>
            <Link to="/" className="btn-primary" style={{ marginTop: 16 }}>Start shopping</Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map(order => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.confirmed;
              const currentIdx = ALL_STEPS.findIndex(s => s.key === order.status);
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <div className={styles.orderId}>#{order.id.slice(0, 8)}</div>
                      <div className={styles.orderMeta}>
                        {order.customer_name} · {order.customer_city} · {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>

                  {order.items && (
                    <div className={styles.orderItems}>
                      {order.items.map((item, i) => (
                        <div key={i} className={styles.orderItem}>
                          {item.name} {item.size ? `(${item.size})` : ''} ×{item.qty}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.progress}>
                    {ALL_STEPS.map((step, i) => {
                      const done = i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={step.key} className={styles.progressStep}>
                          <div className={`${styles.dot} ${done ? styles.dotDone : ''} ${active ? styles.dotActive : ''}`} />
                          <div className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''} ${done && !active ? styles.stepLabelDone : ''}`}>
                            {step.label}
                          </div>
                          {i < ALL_STEPS.length - 1 && (
                            <div className={`${styles.line} ${i < currentIdx ? styles.lineDone : ''}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>Total: {formatPrice(order.total)}</span>
                    {order.status === 'delivered' && (
                      <button className={styles.reviewBtn}>Leave a review</button>
                    )}
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
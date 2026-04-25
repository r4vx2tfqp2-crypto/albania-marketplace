import { Link } from 'react-router-dom';
import styles from './Orders.module.css';

const mockOrders = [
  {
    id: '#2847',
    date: '2024-03-15',
    items: ['Nike Air Max 270 (Size 42)'],
    shop: 'SportShop Tirana',
    total: 3500,
    status: 'on_the_way',
    steps: ['confirmed', 'packed', 'picked_up', 'on_the_way']
  },
  {
    id: '#2831',
    date: '2024-03-10',
    items: ['Summer Floral Dress (M)', 'Linen Blazer (L)'],
    shop: 'Fashion Zone',
    total: 5000,
    status: 'delivered',
    steps: ['confirmed', 'packed', 'picked_up', 'on_the_way', 'delivered']
  }
];

const ALL_STEPS = [
  { key: 'confirmed', label: 'Order confirmed' },
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
  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>My orders</h1>

        {mockOrders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyTitle}>No orders yet</div>
            <Link to="/" className="btn-primary" style={{ marginTop: 16 }}>Start shopping</Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {mockOrders.map(order => {
              const status = STATUS_LABELS[order.status];
              const currentIdx = ALL_STEPS.findIndex(s => s.key === order.status);
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <div className={styles.orderId}>{order.id}</div>
                      <div className={styles.orderMeta}>{order.shop} · {order.date}</div>
                    </div>
                    <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>

                  <div className={styles.orderItems}>
                    {order.items.map((item, i) => (
                      <div key={i} className={styles.orderItem}>{item}</div>
                    ))}
                  </div>

                  {/* Progress */}
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

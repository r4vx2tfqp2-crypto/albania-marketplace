import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './Orders.module.css';
import jsPDF from 'jspdf';

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
  const generateInvoice = (order) => {
    const doc = new jsPDF();
    
    // Colors
    const BLACK = [26, 25, 22];
    const GREEN = [29, 158, 117];
    const GRAY = [154, 152, 144];
    const LIGHT = [247, 246, 243];

    // Header background
    doc.setFillColor(...BLACK);
    doc.rect(0, 0, 210, 45, 'F');

    // Logo T
    doc.setFillColor(...GREEN);
    doc.roundedRect(15, 10, 20, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('T', 25, 24, { align: 'center' });

    // Brand name
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('tregu', 40, 24);

    // Invoice title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('FATURË / INVOICE', 40, 33);

    // Invoice number and date - right side
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`#${order.id.slice(0, 8).toUpperCase()}`, 195, 18, { align: 'right' });
    doc.setTextColor(...GRAY);
    doc.text(new Date(order.created_at).toLocaleDateString('sq-AL'), 195, 28, { align: 'right' });

    // Customer section
    doc.setFillColor(...LIGHT);
    doc.rect(0, 45, 210, 35, 'F');
    
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('BLERËSI / CUSTOMER', 15, 57);
    
    doc.setTextColor(...BLACK);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(order.customer_name, 15, 66);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`${order.customer_address}, ${order.customer_city}`, 15, 73);
    doc.text(order.customer_phone, 15, 79);

    // Order details header
    doc.setFillColor(...BLACK);
    doc.rect(0, 85, 210, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUKTI', 15, 92);
    doc.text('SASIA', 120, 92);
    doc.text('ÇMIMI', 150, 92);
    doc.text('TOTALI', 185, 92, { align: 'right' });

    // Items
    let y = 105;
    order.items?.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 248);
        doc.rect(0, y - 6, 210, 12, 'F');
      }
      doc.setTextColor(...BLACK);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.name}${item.size ? ` (${item.size})` : ''}`, 15, y);
      doc.text(`x${item.qty}`, 120, y);
      doc.text(`${item.price?.toLocaleString()} L`, 150, y);
      doc.text(`${(item.price * item.qty).toLocaleString()} L`, 185, y, { align: 'right' });
      y += 14;
    });

    // Delivery fee
    doc.setDrawColor(...LIGHT);
    doc.line(15, y, 195, y);
    y += 10;
    doc.setTextColor(...GRAY);
    doc.setFontSize(10);
    doc.text('Tarifa e dorëzimit', 15, y);
    doc.text('300 L', 185, y, { align: 'right' });

    // Total
    y += 10;
    doc.setFillColor(...GREEN);
    doc.rect(0, y - 5, 210, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTALI', 15, y + 6);
    doc.text(`${order.total?.toLocaleString()} L`, 185, y + 6, { align: 'right' });

    // Payment method
    y += 25;
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Mënyra e pagesës: Pagesa me dorëzim (Cash on delivery)', 15, y);

    // Notes
    if (order.notes) {
      y += 10;
      doc.text(`Shënime: ${order.notes}`, 15, y);
    }

    // Footer
    doc.setFillColor(...BLACK);
    doc.rect(0, 270, 210, 27, 'F');
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.text('tregu.store', 105, 280, { align: 'center' });
    doc.text('tregusupport@gmail.com', 105, 287, { align: 'center' });
    doc.setTextColor(...GREEN);
    doc.text('Faleminderit për blerjen tuaj!', 105, 294, { align: 'center' });

    doc.save(`fature-tregu-${order.id.slice(0, 8)}.pdf`);
  };

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
                  {/* Tracking number */}
<div style={{ marginTop: 10, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
  <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>Numri i gjurmimit</div>
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
    {['Albanian Courier', 'DHL', 'Posta Shqiptare', 'Tjeter'].map(c => (
      <button
        key={c}
        onClick={async () => {
          await supabase.from('orders').update({ courier_name: c }).eq('id', order.id);
          await fetchOrders();
        }}
        style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
          fontFamily: 'var(--font-body)', border: '1px solid var(--border-strong)',
          background: order.courier_name === c ? 'var(--text-1)' : 'transparent',
          color: order.courier_name === c ? '#fff' : 'var(--text-2)',
        }}
      >
        {c}
      </button>
    ))}
  </div>
  <div style={{ display: 'flex', gap: 8 }}>
    <input
      defaultValue={order.tracking_number || ''}
      placeholder="Shkruaj numrin e gjurmimit..."
      onBlur={async (e) => {
        if (e.target.value !== order.tracking_number) {
          await supabase.from('orders').update({ tracking_number: e.target.value }).eq('id', order.id);
          await fetchOrders();
        }
      }}
      style={{
        flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-strong)',
        fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--surface)', color: 'var(--text-1)',
      }}
    />
    {order.tracking_number && (
      <a
        href={
          order.courier_name === 'Albanian Courier' ? `https://al.albaniancourier.al/en/track/?code=${order.tracking_number}` :
          order.courier_name === 'DHL' ? `https://www.dhl.com/al-en/home/tracking.html?tracking-id=${order.tracking_number}` :
          order.courier_name === 'Posta Shqiptare' ? `https://www.postashqiptare.al/gjurmo` :
          `https://www.google.com/search?q=${order.tracking_number}+tracking`
        }
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: '8px 12px', borderRadius: 8, background: 'var(--green)', color: '#fff',
          fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        Gjurmo →
      </a>
    )}
  </div>
  {!order.courier_name && (
    <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--blue-light)', borderRadius: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--blue)', marginBottom: 6 }}>Nuk ke korrier?</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="https://al.albaniancourier.al" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--blue)', borderRadius: 20 }}>
          Albanian Courier →
        </a>
        <a href="https://www.dhl.com/al-en" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--blue)', borderRadius: 20 }}>
          DHL Albania →
        </a>
        <a href="tel:+35542259777"
          style={{ fontSize: 12, color: 'var(--blue)', textDecoration: 'none', padding: '4px 10px', border: '1px solid var(--blue)', borderRadius: 20 }}>
          Posta Shqiptare →
        </a>
      </div>
    </div>
  )}
</div>
           {/* Invoice button */}
          <button
  onClick={() => generateInvoice(order)}
  style={{
    width: '100%', marginTop: 10, padding: '10px 14px',
    background: 'var(--surface)', border: '1px solid var(--border-strong)',
    borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'var(--font-body)', color: 'var(--text-1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }}
>
  📄 Gjenero Faturë PDF
</button>

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
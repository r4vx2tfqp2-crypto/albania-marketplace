import { Link } from 'react-router-dom';
import { Plus, TrendingUp, Package, DollarSign, Star, ArrowRight } from 'lucide-react';
import { products, shops } from '../data/mockData';
import styles from './SellerDashboard.module.css';

const shop = shops[0]; // mock: logged in as shop-1

const mockOrders = [
  { id: '#2847', product: 'Nike Air Max 270 (Size 42)', customer: 'Erion B.', total: 3500, status: 'new' },
  { id: '#2831', product: 'Adidas Ultraboost (Size 41)', customer: 'Anisa K.', total: 3800, status: 'processing' },
  { id: '#2819', product: 'Nike Air Max 270 (Size 40)', customer: 'Besnik M.', total: 3500, status: 'completed' },
];

const STATUS = {
  new: { label: 'New', color: 'var(--blue)', bg: 'var(--blue-light)' },
  processing: { label: 'Processing', color: 'var(--amber)', bg: 'var(--amber-light)' },
  completed: { label: 'Completed', color: 'var(--green)', bg: 'var(--green-light)' },
};

export default function SellerDashboard() {
  const shopProducts = products.filter(p => p.shopId === shop.id);
  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{shop.name}</h1>
            <p className={styles.sub}>Seller dashboard</p>
          </div>
          <Link to="/seller/add-product" className={styles.addBtn}>
            <Plus size={16} /> Add product
          </Link>
        </div>

        {/* Metrics */}
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: 'var(--green-light)', color: 'var(--green)' }}>
              <DollarSign size={18} />
            </div>
            <div className={styles.metricVal}>{formatPrice(152400)}</div>
            <div className={styles.metricLabel}>Total revenue</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>
              <Package size={18} />
            </div>
            <div className={styles.metricVal}>47</div>
            <div className={styles.metricLabel}>Total orders</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: 'var(--amber-light)', color: '#854F0B' }}>
              <TrendingUp size={18} />
            </div>
            <div className={styles.metricVal}>{shopProducts.length}</div>
            <div className={styles.metricLabel}>Active products</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricIcon} style={{ background: '#FBEAF0', color: 'var(--pink)' }}>
              <Star size={18} />
            </div>
            <div className={styles.metricVal}>{shop.rating}★</div>
            <div className={styles.metricLabel}>Avg rating</div>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Recent orders */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Recent orders</h2>
              <Link to="/orders" className={styles.seeAll}>View all <ArrowRight size={13} /></Link>
            </div>
            <div className={styles.ordersList}>
              {mockOrders.map(order => (
                <div key={order.id} className={styles.orderRow}>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderId}>{order.id}</div>
                    <div className={styles.orderProduct}>{order.product}</div>
                    <div className={styles.orderCustomer}>{order.customer}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.statusBadge} style={{ background: STATUS[order.status].bg, color: STATUS[order.status].color }}>
                      {STATUS[order.status].label}
                    </span>
                    <div className={styles.orderTotal}>{formatPrice(order.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products */}
          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Your products</h2>
              <Link to="/seller/add-product" className={styles.seeAll}>Add new <ArrowRight size={13} /></Link>
            </div>
            <div className={styles.productsList}>
              {shopProducts.map((p, i) => {
                const COLORS = ['#E1F5EE','#E6F1FB','#FBEAF0','#FAEEDA'];
                return (
                  <div key={p.id} className={styles.productRow}>
                    <div className={styles.productImg} style={{ background: COLORS[i % 4] }}>
                      {p.category === 'shoes' ? '👟' : p.category === 'clothes' ? '👕' : '📦'}
                    </div>
                    <div className={styles.productInfo}>
                      <div className={styles.productName}>{p.name}</div>
                      <div className={styles.productMeta}>{p.inStock ? 'In stock' : 'Out of stock'} · {p.reviewCount} reviews</div>
                    </div>
                    <div className={styles.productPrice}>{p.price.toLocaleString()} L</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

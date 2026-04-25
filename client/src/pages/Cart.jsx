import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './Cart.module.css';

const COLORS = ['#E1F5EE','#E6F1FB','#FBEAF0','#FAEEDA','#EAF3DE','#EEEDFE'];

export default function Cart() {
  const { cartItems, removeFromCart, updateQty, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <ShoppingCart size={48} strokeWidth={1} style={{ color: 'var(--text-3)' }} />
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p className={styles.emptySub}>Add some products and they'll appear here</p>
        <Link to="/" className="btn-primary" style={{ marginTop: 24 }}>Browse products</Link>
      </div>
    );
  }

  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';
  const deliveryFee = 300;

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Cart <span className={styles.count}>({cartItems.length} items)</span></h1>

        <div className={styles.layout}>
          <div className={styles.items}>
            {cartItems.map((item, i) => (
              <div key={`${item.id}-${item.selectedSize}`} className={styles.item}>
                <div className={styles.itemImage} style={{ background: COLORS[i % COLORS.length] }}>
                  <span>
                    {item.category === 'shoes' ? '👟' :
                     item.category === 'clothes' ? '👕' :
                     item.category === 'electronics' ? '📱' :
                     item.category === 'beauty' ? '💄' : '🛍️'}
                  </span>
                </div>
                <div className={styles.itemInfo}>
                  <Link to={`/product/${item.id}`} className={styles.itemName}>{item.name}</Link>
                  {item.selectedSize && <div className={styles.itemSize}>Size: {item.selectedSize}</div>}
                  <div className={styles.itemPrice}>{formatPrice(item.price)}</div>
                </div>
                <div className={styles.qtyControl}>
                  <button onClick={() => updateQty(item.id, item.selectedSize, item.qty - 1)}>
                    <Minus size={13} />
                  </button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.selectedSize, item.qty + 1)}>
                    <Plus size={13} />
                  </button>
                </div>
                <div className={styles.itemTotal}>{formatPrice(item.price * item.qty)}</div>
                <button className={styles.removeBtn} onClick={() => removeFromCart(item.id, item.selectedSize)}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order summary</h2>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{formatPrice(cartTotal + deliveryFee)}</span>
            </div>
            <div className={styles.cod}>
              <span>💵</span> Cash on delivery
            </div>
            <button className={styles.checkoutBtn} onClick={() => navigate('/checkout')}>
              Proceed to checkout <ArrowRight size={16} />
            </button>
            <Link to="/" className={styles.continueLink}>← Continue shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

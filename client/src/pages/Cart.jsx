import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import styles from './Cart.module.css';

const COLORS = ['#E1F5EE','#E6F1FB','#FBEAF0','#FAEEDA','#EAF3DE','#EEEDFE'];

export default function Cart() {
  const { cartItems, removeFromCart, updateQty, cartTotal } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';
  const deliveryFee = 300;

  if (cartItems.length === 0) {
    return (
      <div className={styles.empty}>
        <ShoppingCart size={48} strokeWidth={1} style={{ color: 'var(--text-3)' }} />
        <h2 className={styles.emptyTitle}>{t('cart_empty')}</h2>
        <p className={styles.emptySub}>{t('cart_empty_sub')}</p>
        <Link to="/" className="btn-primary" style={{ marginTop: 24 }}>{t('browse_products')}</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>{t('cart')} <span className={styles.count}>({cartItems.length} {t('items')})</span></h1>

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
                  {item.selectedSize && <div className={styles.itemSize}>{t('size')}: {item.selectedSize}</div>}
                  <div className={styles.itemPrice}>{formatPrice(item.price)}</div>
                </div>
                <div className={styles.qtyControl}>
                  <button onClick={() => updateQty(item.id, item.selectedSize, item.qty - 1)}><Minus size={13} /></button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.selectedSize, item.qty + 1)}><Plus size={13} /></button>
                </div>
                <div className={styles.itemTotal}>{formatPrice(item.price * item.qty)}</div>
                <button className={styles.removeBtn} onClick={() => removeFromCart(item.id, item.selectedSize)}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>{t('subtotal')}</h2>
            <div className={styles.summaryRow}>
              <span>{t('subtotal')}</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>{t('delivery')}</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryTotal}>
              <span>{t('total')}</span>
              <span>{formatPrice(cartTotal + deliveryFee)}</span>
            </div>
            <div className={styles.cod}>
              <span>💵</span> {t('cash_delivery_title')}
            </div>
            <button className={styles.checkoutBtn} onClick={() => navigate('/checkout')}>
              {t('proceed_checkout')} <ArrowRight size={16} />
            </button>
            <Link to="/" className={styles.continueLink}>{t('continue_shopping')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
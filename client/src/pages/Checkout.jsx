import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import styles from './Checkout.module.css';

const CITIES = ['Tirana', 'Durrës', 'Shkodër', 'Vlorë', 'Korçë', 'Fier', 'Berat', 'Lushnjë'];

export default function Checkout() {
  const { cartItems, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: 'Tirana', notes: '' });
  const [errors, setErrors] = useState({});

  const deliveryFee = 300;
  const total = cartTotal + deliveryFee;
  const formatPrice = (p) => p.toLocaleString('sq-AL') + ' L';

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 3) e.name = 'Enter your full name';
    if (!form.phone.trim() || !/^(\+355|0)\d{8,9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid number e.g. +355 69 123 4567';
    if (!form.address.trim() || form.address.trim().length < 5) e.address = 'Enter your full address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setPlaced(true);
    setTimeout(() => navigate('/orders'), 2500);
  };

  if (placed) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}><CheckCircle size={64} strokeWidth={1.5} /></div>
        <h2 className={styles.successTitle}>Order placed!</h2>
        <p className={styles.successSub}>We'll confirm your order shortly. Redirecting to orders…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Checkout</h1>

        <div className={styles.layout}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Delivery information</h2>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Full name *</label>
                  <input
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    placeholder="Erion Brahimi"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                  {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone *</label>
                  <input
                    className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                    placeholder="+355 69 123 4567"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})}
                  />
                  {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Address *</label>
                <input
                  className={`${styles.input} ${errors.address ? styles.inputError : ''}`}
                  placeholder="Rruga Myslym Shyri, Nr. 14"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                />
                {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>City *</label>
                <select className={styles.select} value={form.city} onChange={e => setForm({...form, city: e.target.value})}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Notes (optional)</label>
                <textarea className={styles.textarea} placeholder="Any special instructions…" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Payment method</h2>
              <div className={styles.paymentOption}>
                <div className={styles.paymentIcon}>💵</div>
                <div>
                  <div className={styles.paymentTitle}>Cash on delivery</div>
                  <div className={styles.paymentSub}>Pay when you receive your order</div>
                </div>
                <div className={styles.paymentCheck}>✓</div>
              </div>
              <div className={styles.paymentOptionDisabled}>
                <div className={styles.paymentIcon}>💳</div>
                <div>
                  <div className={styles.paymentTitle}>Card payment</div>
                  <div className={styles.paymentSub}>Coming soon</div>
                </div>
              </div>
            </div>

            <button type="submit" className={styles.placeOrder}>
              Place order — {formatPrice(total)}
            </button>
          </form>

          <div className={styles.orderSummary}>
            <h2 className={styles.sectionTitle}>Order ({cartCount} items)</h2>
            {cartItems.map(item => (
              <div key={`${item.id}-${item.selectedSize}`} className={styles.orderItem}>
                <span className={styles.orderItemName}>{item.name}</span>
                {item.selectedSize && <span className={styles.orderItemSize}>Size {item.selectedSize}</span>}
                <span className={styles.orderItemQty}>×{item.qty}</span>
                <span className={styles.orderItemPrice}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
            <div className={styles.divider} />
            <div className={styles.totalRow}><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
            <div className={styles.totalRow}><span>Delivery</span><span>{formatPrice(deliveryFee)}</span></div>
            <div className={styles.divider} />
            <div className={styles.grandTotal}><span>Total</span><span>{formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
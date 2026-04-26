import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Package } from 'lucide-react';

export default function DeliveryConfirm() {
  const [step, setStep] = useState('form'); // form, success, error
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [pin, setPin] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const handleFind = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_pin', pin.trim())
      .single();

    if (!data) {
      setError('Invalid PIN. Please check and try again.');
      setLoading(false);
      return;
    }

    if (data.status === 'delivered') {
      setError('This order has already been confirmed as delivered.');
      setLoading(false);
      return;
    }

    setOrder(data);
    setStep('confirm');
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);

    await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', order.id);

    // Send confirmation email via edge function
    try {
      await supabase.functions.invoke('order-notification', {
        body: { 
          order: { ...order, status: 'delivered' },
          type: 'delivery_confirmed'
        }
      });
    } catch (err) {
      console.log('Email error:', err);
    }

    setStep('success');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--text-1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 24,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, background: 'var(--text-1)', color: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>T</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>tregu</span>
        </div>

        {step === 'form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Package size={40} strokeWidth={1.5} style={{ color: 'var(--text-3)', marginBottom: 12 }} />
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Delivery Confirmation</h1>
              <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>Enter the 4-digit PIN provided by the seller to confirm delivery</p>
            </div>

            {error && (
              <div style={{ background: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleFind}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                  Delivery PIN
                </label>
                <input
                  required
                  maxLength={4}
                  placeholder="e.g. 4821"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 12,
                    fontSize: 28,
                    fontWeight: 700,
                    textAlign: 'center',
                    letterSpacing: '0.3em',
                    fontFamily: 'var(--font-display)',
                    outline: 'none',
                    background: 'var(--bg)',
                    color: 'var(--text-1)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 4}
                style={{
                  width: '100%',
                  background: pin.length === 4 ? 'var(--text-1)' : 'var(--border)',
                  color: '#fff',
                  padding: 14,
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 500,
                  border: 'none',
                  cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-body)',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? 'Finding order…' : 'Find Order'}
              </button>
            </form>
          </>
        )}

        {step === 'confirm' && order && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Confirm Delivery</h1>
              <p style={{ fontSize: 14, color: 'var(--text-3)' }}>Please verify the order details before confirming</p>
            </div>

            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Order Details</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>#{order.id.slice(0, 8)}</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 2 }}>👤 {order.customer_name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 2 }}>📍 {order.customer_address}, {order.customer_city}</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>📞 {order.customer_phone}</div>
              {order.items && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', padding: '2px 0' }}>
                      • {item.name} ×{item.qty}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8, fontSize: 15, fontWeight: 600 }}>
                Total: {order.total?.toLocaleString()} L
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                width: '100%',
                background: 'var(--green)',
                color: '#fff',
                padding: 14,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                marginBottom: 10,
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Confirming…' : '✓ Confirm Delivery'}
            </button>

            <button
              onClick={() => { setStep('form'); setPin(''); setOrder(null); }}
              style={{
                width: '100%',
                background: 'transparent',
                color: 'var(--text-3)',
                padding: 12,
                borderRadius: 12,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              ← Back
            </button>
          </>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={64} strokeWidth={1.5} style={{ color: 'var(--green)', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Delivery Confirmed!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.6 }}>
              The order has been marked as delivered. The customer will be notified.
            </p>
            <button
              onClick={() => { setStep('form'); setPin(''); setOrder(null); }}
              style={{
                background: 'var(--text-1)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              Confirm another delivery
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
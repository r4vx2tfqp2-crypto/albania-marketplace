import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Navigation } from 'lucide-react';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubmd1cG92eGFlcXVlcXBsaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUzODUsImV4cCI6MjA5MjczMTM4NX0.aTiKdVjl02JenqpQzbg2qcniscHMJyml9LMdmRsqqKg';
const FUNCTION_URL = 'https://onngupovxaequeqplikx.supabase.co/functions/v1/order-notification';

export default function DeliveryConfirm() {
  const [step, setStep] = useState('form');
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const handleFind = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error: dbError } = await supabase
      .from('orders').select('*').eq('delivery_pin', pin.trim()).single();
    if (dbError || !data) { setError('PIN i gabuar. Kontrolloni dhe provoni perseri.'); setLoading(false); return; }
    if (data.status === 'delivered') { setError('Kjo porosi eshte konfirmuar tashmë si e dorezuar.'); setLoading(false); return; }
    setOrder(data);
    setStep('confirm');
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    const { data: updatedOrder } = await supabase
      .from('orders').update({ status: 'delivered' }).eq('id', order.id).select().single();
    try {
      await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: updatedOrder || { ...order, status: 'delivered' }, type: 'delivery_confirmed' }),
      });
    } catch (err) { console.log('Email error:', err); }
    setStep('success');
    setLoading(false);
  };

  const openRoute = () => {
    if (order?.latitude && order?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customer_address + ', ' + order.customer_city + ', Albania')}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  const reset = () => { setStep('form'); setPin(''); setOrder(null); setError(''); };

  const s = {
    page: { minHeight: '100vh', background: 'var(--text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font-body)' },
    card: { background: 'var(--surface)', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420 },
    logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' },
    logoMark: { width: 36, height: 36, background: 'var(--text-1)', color: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 },
    title: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' },
    sub: { fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 28 },
    error: { background: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, textAlign: 'center' },
    btnPrimary: { width: '100%', background: 'var(--text-1)', color: '#fff', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 10 },
    btnGreen: { width: '100%', background: 'var(--green)', color: '#fff', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 10 },
    btnBlue: { width: '100%', background: 'var(--blue)', color: '#fff', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnGhost: { width: '100%', background: 'transparent', color: 'var(--text-3)', padding: 12, borderRadius: 12, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' },
    orderCard: { background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 20 },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoMark}>T</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>tregu</span>
        </div>

        {step === 'form' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h1 style={s.title}>Konfirmim Dorezimi</h1>
              <p style={s.sub}>Shkruani PIN-in 4-shifror te dhene nga shitesi</p>
            </div>
            {error && <div style={s.error}>{error}</div>}
            <form onSubmit={handleFind}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>PIN i Dorezimit</label>
              <input required maxLength={4} placeholder="p.sh. 4821" value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '14px', border: '1px solid var(--border-strong)', borderRadius: 12, fontSize: 28, fontWeight: 700, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'var(--font-display)', outline: 'none', background: 'var(--bg)', color: 'var(--text-1)', marginBottom: 16 }}
                autoFocus />
              <button type="submit" disabled={loading || pin.length !== 4}
                style={{ ...s.btnPrimary, background: pin.length === 4 ? 'var(--text-1)' : 'var(--border)', cursor: pin.length === 4 ? 'pointer' : 'not-allowed' }}>
                {loading ? 'Duke kerkuar...' : 'Gjej Porosine'}
              </button>
            </form>
          </>
        )}

        {step === 'confirm' && order && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={s.title}>Konfirmo Dorezimin</h1>
              <p style={{ ...s.sub, marginBottom: 0 }}>Kontrolloni detajet para konfirmimit</p>
            </div>
            {error && <div style={s.error}>{error}</div>}
            <div style={s.orderCard}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Detajet e Porosise</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>#{order.id.slice(0, 8)}</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', margin: '3px 0' }}>👤 {order.customer_name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', margin: '3px 0' }}>📍 {order.customer_address}, {order.customer_city}</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', margin: '3px 0' }}>📞 {order.customer_phone}</div>
              {order.notes && <div style={{ fontSize: 14, color: 'var(--text-2)', margin: '3px 0' }}>📝 {order.notes}</div>}
              {order.items && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />
                  {order.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'var(--text-2)', padding: '2px 0' }}>
                      • {item.name} x{item.qty}
                    </div>
                  ))}
                </>
              )}
              <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />
              <div style={{ fontSize: 15, fontWeight: 600 }}>Total: {order.total?.toLocaleString()} L</div>
            </div>

            {/* Navigation button */}
            <button onClick={openRoute} style={s.btnBlue}>
              <Navigation size={16} />
              {order.latitude ? 'Hap Rrugën në Hartë' : 'Navigo tek Klienti'}
            </button>

            <button onClick={handleConfirm} disabled={loading} style={s.btnGreen}>
              {loading ? 'Duke konfirmuar...' : 'Konfirmo Dorezimin'}
            </button>
            <button onClick={reset} style={s.btnGhost}>← Kthehu</button>
          </>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={64} strokeWidth={1.5} style={{ color: 'var(--green)', marginBottom: 16 }} />
            <h2 style={s.title}>Dorezimi u Konfirmua!</h2>
            <p style={s.sub}>Porosia u shenua si e dorezuar. Shitesi u njoftua.</p>
            <button onClick={reset} style={s.btnPrimary}>Konfirmo dorezim tjeter</button>
          </div>
        )}
      </div>
    </div>
  );
}

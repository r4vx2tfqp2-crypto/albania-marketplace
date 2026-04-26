import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubmd1cG92eGFlcXVlcXBsaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUzODUsImV4cCI6MjA5MjczMTM4NX0.aTiKdVjl02JenqpQzbg2qcniscHMJyml9LMdmRsqqKg';
const FUNCTION_URL = 'https://onngupovxaequeqplikx.supabase.co/functions/v1/order-notification';

export default function ConfirmDelivery() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const orderId = searchParams.get('order');
  const confirm = searchParams.get('confirm');

  useEffect(() => {
    if (!orderId || !confirm) { setStatus('error'); return; }
    handleConfirmation();
  }, []);

  const handleConfirmation = async () => {
    if (confirm === 'yes') {
      await supabase
        .from('orders')
        .update({ customer_confirmed: true, status: 'delivered' })
        .eq('id', orderId);

      // Notify admin
      try {
        const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
        await fetch(FUNCTION_URL, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ order, type: 'customer_confirmed' }),
        });
      } catch (err) { console.log(err); }

      setStatus('confirmed');
    } else {
      setStatus('problem');
    }
  };

  const s = {
    page: { minHeight: '100vh', background: 'var(--text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font-body)' },
    card: { background: 'var(--surface)', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 420, textAlign: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' },
    logoMark: { width: 36, height: 36, background: 'var(--text-1)', color: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 },
    title: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 12, color: 'var(--text-1)' },
    sub: { fontSize: 15, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 24 },
    btn: { background: 'var(--text-1)', color: '#fff', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'none', display: 'inline-block' },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoMark}>T</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>tregu</span>
        </div>

        {status === 'loading' && (
          <p style={s.sub}>Processing…</p>
        )}

        {status === 'confirmed' && (
          <>
            <CheckCircle size={64} strokeWidth={1.5} style={{ color: 'var(--green)', marginBottom: 16 }} />
            <h2 style={s.title}>Thank you!</h2>
            <p style={s.sub}>You've confirmed receiving your order. We hope you enjoy your purchase!</p>
            <a href="/" style={s.btn}>Continue shopping →</a>
          </>
        )}

        {status === 'problem' && (
          <>
            <XCircle size={64} strokeWidth={1.5} style={{ color: 'var(--red)', marginBottom: 16 }} />
            <h2 style={s.title}>We're sorry to hear that</h2>
            <p style={s.sub}>Please contact us immediately so we can resolve this for you.</p>
            <a href="https://wa.me/355691234567" style={{ ...s.btn, background: '#25D366' }}>Contact us on WhatsApp</a>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={64} strokeWidth={1.5} style={{ color: 'var(--red)', marginBottom: 16 }} />
            <h2 style={s.title}>Invalid link</h2>
            <p style={s.sub}>This confirmation link is invalid or has expired.</p>
            <a href="/" style={s.btn}>Go to homepage</a>
          </>
        )}
      </div>
    </div>
  );
}

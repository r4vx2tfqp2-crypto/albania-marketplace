import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, MapPin, ArrowRight } from 'lucide-react';
import styles from './Onboarding.module.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);

  const handleFinish = () => navigate('/');

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {step === 0 && (
          <div className={styles.card}>
            <div className={styles.logo}>
              <div className={styles.logoMark}>T</div>
              <span className={styles.logoText}>tregu</span>
            </div>
            <h1 className={styles.title}>All Albanian shops<br />in one place</h1>
            <p className={styles.sub}>Discover, compare and buy from verified local shops across Albania.</p>
            <button className={styles.primaryBtn} onClick={() => setStep(1)}>
              Get started <ArrowRight size={16} />
            </button>
            <button className={styles.ghostBtn} onClick={handleFinish}>I already have an account</button>
          </div>
        )}

        {step === 1 && (
          <div className={styles.card}>
            <h2 className={styles.stepTitle}>How will you use Tregu?</h2>
            <div className={styles.roleGrid}>
              <button
                className={`${styles.roleCard} ${role === 'buyer' ? styles.roleSelected : ''}`}
                onClick={() => setRole('buyer')}
              >
                <ShoppingBag size={32} strokeWidth={1.5} style={{ color: role === 'buyer' ? 'var(--green)' : 'var(--text-3)' }} />
                <div className={styles.roleTitle}>I want to buy</div>
                <div className={styles.roleSub}>Browse products, compare prices, order from local shops</div>
              </button>
              <button
                className={`${styles.roleCard} ${role === 'seller' ? styles.roleSelected : ''}`}
                onClick={() => setRole('seller')}
              >
                <Store size={32} strokeWidth={1.5} style={{ color: role === 'seller' ? 'var(--green)' : 'var(--text-3)' }} />
                <div className={styles.roleTitle}>I want to sell</div>
                <div className={styles.roleSub}>List products, manage orders, grow your business</div>
              </button>
            </div>
            <button className={styles.primaryBtn} disabled={!role} onClick={() => setStep(2)}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.card}>
            <MapPin size={48} strokeWidth={1} style={{ color: 'var(--green)', marginBottom: 16 }} />
            <h2 className={styles.stepTitle}>Enable location?</h2>
            <p className={styles.sub}>We'll show you nearby shops and faster delivery options first.</p>
            <button className={styles.primaryBtn} onClick={handleFinish}>
              Allow location
            </button>
            <button className={styles.ghostBtn} onClick={handleFinish}>Skip for now</button>
          </div>
        )}

        <div className={styles.dots}>
          {[0,1,2].map(i => (
            <div key={i} className={`${styles.dot} ${step === i ? styles.dotActive : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

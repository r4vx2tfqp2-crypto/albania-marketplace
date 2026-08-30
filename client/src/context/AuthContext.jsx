import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { disablePush } from '../lib/push';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Must run BEFORE auth.signOut() -- push_subscriptions' RLS delete
    // policy requires an active session matching the row's user_id.
    // Without this, a shared/handed-off device keeps this account's
    // browser-level push subscription alive after sign-out: the next
    // person to sign in on the same device and enable push would either
    // hit an RLS conflict trying to claim the same endpoint, or (if that
    // failed silently) this account would keep quietly receiving push
    // notifications meant for it on what's now someone else's device.
    await disablePush().catch(() => {}); // best-effort -- never block sign-out on this
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
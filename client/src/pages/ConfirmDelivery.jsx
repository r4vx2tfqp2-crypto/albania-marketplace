import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubmd1cG92eGFlcXVlcXBsaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUzODUsImV4cCI6MjA5MjczMTM4NX0.aTiKdVjl02JenqpQzbg2qcniscHMJyml9LMdmRsqqKg";
const FUNCTION_URL = "https://onngupovxaequeqplikx.supabase.co/functions/v1/order-notification";

const PREFERENCES = {
  delivered: { icon: "✅", title: "Dorezim personal", desc: "Dorezone tek une personalisht" },
  neighbour: { icon: "🏠", title: "Tek fqinji", desc: "Mund ta lesh tek fqinji im" },
  door: { icon: "📦", title: "Para deres", desc: "Mund ta lesh para deres sime" },
  reschedule: { icon: "📅", title: "Riplanifico", desc: "Me duhet ta riplanikoj dorezimin" },
};

export default function ConfirmDelivery() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState(null);
  const orderId = searchParams.get("order");
  const confirm = searchParams.get("confirm");
  const preference = searchParams.get("preference");

  useEffect(() => {
    if (!orderId) { setStatus("error"); return; }
    if (preference) {
      handlePreference();
    } else if (confirm) {
      handleConfirmation();
    } else {
      setStatus("error");
    }
  }, []);

  const handlePreference = async () => {
    const { data: orderData } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (!orderData) { setStatus("error"); return; }
    setOrder(orderData);

    const prefLabels = {
      delivered: "Dorezim personal",
      neighbour: "Tek fqinji",
      door: "Para deres",
      reschedule: "Riplanifico dorezimin",
    };

    await supabase.from("orders").update({
      delivery_preference: preference,
      notes: (orderData.notes ? orderData.notes + " | " : "") + "Preference: " + (prefLabels[preference] || preference)
    }).eq("id", orderId);

    setStatus("preference_set");
  };

  const handleConfirmation = async () => {
    if (confirm === "yes") {
      const { data: orderData } = await supabase.from("orders")
        .update({ customer_confirmed: true, status: "delivered" })
        .eq("id", orderId).select().single();
      try {
        await fetch(FUNCTION_URL, {
          method: "POST",
          headers: { "Authorization": "Bearer " + ANON_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderData, type: "customer_confirmed" }),
        });
      } catch (err) { console.log(err); }
      setStatus("confirmed");
    } else {
      setStatus("problem");
    }
  };

  const s = {
    page: { minHeight: "100vh", background: "var(--text-1)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "var(--font-body)" },
    card: { background: "var(--surface)", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 420, textAlign: "center" },
    logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" },
    logoMark: { width: 36, height: 36, background: "var(--text-1)", color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 },
    title: { fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginBottom: 12, color: "var(--text-1)" },
    sub: { fontSize: 15, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 24 },
    btn: { background: "var(--text-1)", color: "#fff", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "var(--font-body)", textDecoration: "none", display: "inline-block" },
  };

  const pref = PREFERENCES[preference];

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoMark}>T</div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700 }}>tregu</span>
        </div>

        {status === "loading" && (
          <p style={s.sub}>Duke procesuar...</p>
        )}

        {status === "preference_set" && pref && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{pref.icon}</div>
            <h2 style={s.title}>Preferenca u regjistrua!</h2>
            <p style={s.sub}>
              Keni zgjedhur: <strong>{pref.title}</strong><br />
              Shoferi do te informohet per preferencen tuaj.
            </p>
            {preference === "reschedule" && (
              <div style={{ background: "var(--amber-light)", borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "left" }}>
                <p style={{ fontSize: 14, color: "#854F0B", margin: 0 }}>
                  📞 Shoferi do te kontaktoje per te riplanifjuar nje kohe te re dorezimi.
                </p>
              </div>
            )}
            <a href="/" style={s.btn}>Kthehu ne faqe →</a>
          </>
        )}

        {status === "confirmed" && (
          <>
            <CheckCircle size={64} strokeWidth={1.5} style={{ color: "var(--green)", marginBottom: 16 }} />
            <h2 style={s.title}>Faleminderit!</h2>
            <p style={s.sub}>Keni konfirmuar marrjen e porosise suaj. Shpresojme ta gezoni blerjen!</p>
            <a href="/" style={s.btn}>Vazhdoni blerjet →</a>
          </>
        )}

        {status === "problem" && (
          <>
            <XCircle size={64} strokeWidth={1.5} style={{ color: "var(--red)", marginBottom: 16 }} />
            <h2 style={s.title}>Na vjen keq!</h2>
            <p style={s.sub}>Ju lutem na kontaktoni menjehere qe ta zgjidhim kete per ju.</p>
            <a href="mailto:info@tregu.store" style={{ ...s.btn, background: "var(--green)" }}>
              Kontaktoni Suportin
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={64} strokeWidth={1.5} style={{ color: "var(--red)", marginBottom: 16 }} />
            <h2 style={s.title}>Link i pavlefshem</h2>
            <p style={s.sub}>Ky link konfirmimi eshte i pavlefshem ose ka skaduar.</p>
            <a href="/" style={s.btn}>Kthehu ne faqe kryesore</a>
          </>
        )}
      </div>
    </div>
  );
}

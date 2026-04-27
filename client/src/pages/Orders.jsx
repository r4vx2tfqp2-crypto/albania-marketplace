import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import styles from "./Orders.module.css";

const ALL_STEPS = [
  { key: "confirmed", label_key: "order_confirmed" },
  { key: "packed", label_key: "packed" },
  { key: "picked_up", label_key: "picked_up" },
  { key: "on_the_way", label_key: "on_the_way" },
  { key: "delivered", label_key: "delivered" },
];

const STATUS_COLORS = {
  confirmed: { color: "var(--blue)", bg: "var(--blue-light)" },
  packed: { color: "var(--amber)", bg: "var(--amber-light)" },
  picked_up: { color: "var(--amber)", bg: "var(--amber-light)" },
  on_the_way: { color: "var(--blue)", bg: "var(--blue-light)" },
  delivered: { color: "var(--green)", bg: "var(--green-light)" },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsGuest(true); setLoading(false); return; }
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const formatPrice = (p) => p?.toLocaleString("sq-AL") + " L";

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--text-3)" }}>Loading...</div>;

  if (isGuest) {
    return (
      <div className={styles.page}>
        <div className="container">
          <h1 className={styles.title}>{t("my_orders")}</h1>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔐</div>
            <div className={styles.emptyTitle}>Kyçuni për të parë porositë</div>
            <Link to="/login" className="btn-primary" style={{ marginTop: 16 }}>Kyçu</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>{t("my_orders")}</h1>

        {orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyTitle}>{t("no_orders")}</div>
            <Link to="/" className="btn-primary" style={{ marginTop: 16 }}>{t("start_shopping")}</Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map(order => {
              const status = STATUS_COLORS[order.status] || STATUS_COLORS.confirmed;
              const currentIdx = ALL_STEPS.findIndex(s => s.key === order.status);
              return (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div>
                      <div className={styles.orderId}>#{order.id.slice(0, 8)}</div>
                      <div className={styles.orderMeta}>
                        {order.customer_name} · {order.customer_city} · {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                      {t(ALL_STEPS.find(s => s.key === order.status)?.label_key || "order_confirmed")}
                    </span>
                  </div>

                  {order.items && (
                    <div className={styles.orderItems}>
                      {order.items.map((item, i) => (
                        <div key={i} className={styles.orderItem}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate("/product/" + item.id)}>
                          {item.name} {item.size ? "(" + item.size + ")" : ""} x{item.qty}
                          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 6 }}>→</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.progress}>
                    {ALL_STEPS.map((step, i) => {
                      const done = i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={step.key} className={styles.progressStep}>
                          <div className={styles.dot + (done ? " " + styles.dotDone : "") + (active ? " " + styles.dotActive : "")} />
                          <div className={styles.stepLabel + (active ? " " + styles.stepLabelActive : "") + (done && !active ? " " + styles.stepLabelDone : "")}>
                            {t(step.label_key)}
                          </div>
                          {i < ALL_STEPS.length - 1 && (
                            <div className={styles.line + (i < currentIdx ? " " + styles.lineDone : "")} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {order.tracking_number && (
                    <div style={{ margin: "12px 0", padding: "12px 14px", background: "var(--surface-2)", borderRadius: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Numri i gjurmimit</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-display)" }}>{order.tracking_number}</span>
                        {order.courier_name && <span style={{ fontSize: 12, color: "var(--text-3)" }}>via {order.courier_name}</span>}
                        <a href={
                            order.courier_name === "Albanian Courier" ? "https://al.albaniancourier.al/en/track/?code=" + order.tracking_number :
                            order.courier_name === "DHL" ? "https://www.dhl.com/al-en/home/tracking.html?tracking-id=" + order.tracking_number :
                            "https://www.google.com/search?q=" + order.tracking_number + "+tracking"}
                          target="_blank" rel="noopener noreferrer"
                          style={{ marginLeft: "auto", fontSize: 12, color: "var(--green)", fontWeight: 500, textDecoration: "none" }}>
                          Gjurmo →
                        </a>
                      </div>
                    </div>
                  )}

                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>{t("total")}: {formatPrice(order.total)}</span>
                    {order.status === "delivered" && (
                      <button className={styles.reviewBtn}>{t("leave_review")}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

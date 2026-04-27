import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import styles from './Orders.module.css';

const ALL_STEPS = [
  { key: 'confirmed', label_key: 'order_confirmed' },
  { key: 'packed', label_key: 'packed' },
  { key: 'picked_up', label_key: 'picked_up' },
  { key: 'on_the_way', label_key: 'on_the_way' },
  { key: 'delivered', label_key: 'delivered' },
];

const STATUS_COLORS = {
  confirmed: { color: 'var(--blue)', bg: 'var(--blue-light)' },
  packed: { color: 'var(--amber)', bg: 'var(--amber-light)' },
  picked_up: { color: 'var(--amber)', bg: 'var(--amber-light)' },
  on_the_way: { color: 'var(--blue)', bg: 'var(--blue-light)' },
  delivered: { color: 'var(--green)', bg: 'var(--green-light)' },
};

export default function SellerOrders() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [shop, setShop] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    const { data: productsData } = await supabase.from("products").select("id").eq("user_id", user.id);
    const myProductIds = (productsData || []).map(p => p.id);
    if (myProductIds.length === 0) { setOrders([]); setLoading(false); return; }
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    const myOrders = (data || []).filter(order => order.items?.some(item => myProductIds.includes(item.id)));
    const { data: shopData } = await supabase.from("shops").select("*").eq("user_id", user.id).single();
    setShop(shopData || null);
    setOrders(myOrders);
    setLoading(false);
  };

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    await supabase.from("orders").update({ status }).eq("id", orderId);
    await fetchOrders();
    setUpdating(null);
  };

  const formatPrice = (p) => p?.toLocaleString("sq-AL") + " L";

  const generateInvoice = async (order) => {
    const doc = new jsPDF({ format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 20;

    const BLACK = [15, 15, 15];
    const GREEN = [29, 158, 117];
    const GRAY = [120, 120, 120];
    const LIGHTGRAY = [240, 240, 240];
    const WHITE = [255, 255, 255];
    const DARKGRAY = [60, 60, 60];

    // Generate QR code for the order
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, "https://tregu.store/shop/" + (shop?.id || ""), {
      width: 80, margin: 1, color: { dark: "#0F0F0F", light: "#FFFFFF" }
    });
    const qrDataUrl = qrCanvas.toDataURL();

    // ── LEFT SIDEBAR ──
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 58, pageH, "F");

    // Sidebar - Shop initials circle
    doc.setFillColor(...GREEN);
    doc.circle(29, 30, 16, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(shop?.initials || "T", 29, 36, { align: "center" });

    // Sidebar - Shop name
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    const shopName = shop?.name || "Dyqani";
    doc.text(shopName, 29, 56, { align: "center", maxWidth: 48 });

    // Sidebar - powered by
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("powered by", 29, 68, { align: "center" });
    doc.setTextColor(...GREEN);
    doc.setFontSize(8);
    doc.text("tregu.store", 29, 74, { align: "center" });

    // Sidebar divider
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.3);
    doc.line(10, 82, 48, 82);

    // Sidebar - Shop details
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("SHITESI", 10, 92);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(7.5);
    let sideY = 100;
    if (shop?.location) { doc.text(shop.location, 10, sideY, { maxWidth: 38 }); sideY += 12; }
    if (shop?.phone) { doc.text(shop.phone, 10, sideY); sideY += 8; }
    doc.text("tregusupport@gmail.com", 10, sideY, { maxWidth: 38 }); sideY += 16;

    doc.setDrawColor(40, 40, 40);
    doc.line(10, sideY, 48, sideY); sideY += 10;

    doc.setTextColor(160, 160, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("NIPT", 10, sideY); sideY += 8;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("_______________", 10, sideY); sideY += 16;

    doc.setDrawColor(40, 40, 40);
    doc.line(10, sideY, 48, sideY); sideY += 10;

    doc.setTextColor(160, 160, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("PAGESA", 10, sideY); sideY += 8;
    doc.setFillColor(...GREEN);
    doc.roundedRect(10, sideY, 38, 10, 2, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("ME DOREZIM", 29, sideY + 6.5, { align: "center" }); sideY += 18;

    // QR Code on sidebar
    doc.addImage(qrDataUrl, "PNG", 9, sideY, 40, 40);
    sideY += 42;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("Skanoni per dyqanin", 29, sideY, { align: "center" });

    // ── MAIN CONTENT ──
    const contentX = 68;
    const contentW = pageW - contentX - margin;

    // Invoice title
    doc.setTextColor(...BLACK);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("FATURE", contentX, 28);

    // Green underline
    doc.setFillColor(...GREEN);
    doc.rect(contentX, 31, 42, 1.5, "F");

    // Invoice meta - right aligned
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text("Nr. Fatures:", pageW - margin - 40, 20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text("#" + order.id.slice(0, 8).toUpperCase(), pageW - margin, 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text("Data:", pageW - margin - 40, 27);
    doc.setTextColor(...BLACK);
    doc.text(new Date(order.created_at).toLocaleDateString("sq-AL"), pageW - margin, 27, { align: "right" });
    doc.text("Statusi:", pageW - margin - 40, 34);
    doc.setFillColor(...GREEN);
    doc.roundedRect(pageW - margin - 22, 29, 22, 8, 2, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.text("KONFIRMUAR", pageW - margin - 11, 34.5, { align: "center" });

    // ── CUSTOMER SECTION ──
    let y = 45;
    doc.setFillColor(...LIGHTGRAY);
    doc.roundedRect(contentX, y, contentW, 36, 3, 3, "F");

    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("BLERESI / DESTINATARI", contentX + 6, y + 8);

    doc.setTextColor(...BLACK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(order.customer_name, contentX + 6, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DARKGRAY);
    doc.text(order.customer_address + ", " + order.customer_city, contentX + 6, y + 24);
    doc.text(order.customer_phone + (order.customer_email ? "  |  " + order.customer_email : ""), contentX + 6, y + 30);

    // ── ITEMS TABLE ──
    y += 44;

    // Table header
    doc.setFillColor(...BLACK);
    doc.roundedRect(contentX, y, contentW, 10, 2, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("NR", contentX + 4, y + 6.5);
    doc.text("PERSHKRIMI", contentX + 14, y + 6.5);
    doc.text("SASIA", contentX + contentW - 62, y + 6.5);
    doc.text("CMIMI UNIT.", contentX + contentW - 44, y + 6.5);
    doc.text("TOTALI", contentX + contentW - 2, y + 6.5, { align: "right" });

    // Table rows
    y += 14;
    let subtotal = 0;
    order.items?.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(contentX, y - 5, contentW, 12, "F");
      }
      const lineTotal = item.price * item.qty;
      subtotal += lineTotal;
      doc.setTextColor(...DARKGRAY);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text((i + 1) + ".", contentX + 4, y + 2);
      const itemName = item.name + (item.size ? " (" + item.size + ")" : "");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BLACK);
      doc.text(itemName.length > 38 ? itemName.slice(0, 38) + "..." : itemName, contentX + 14, y + 2);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...DARKGRAY);
      doc.text("" + item.qty, contentX + contentW - 58, y + 2);
      doc.text(item.price?.toLocaleString() + " L", contentX + contentW - 42, y + 2);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BLACK);
      doc.text(lineTotal.toLocaleString() + " L", contentX + contentW - 2, y + 2, { align: "right" });
      y += 12;
    });

    // ── TOTALS BOX ──
    y += 6;
    doc.setDrawColor(...LIGHTGRAY);
    doc.setLineWidth(0.5);
    doc.line(contentX, y, contentX + contentW, y);
    y += 8;

    const totalsX = contentX + contentW - 70;

    // Subtotal row
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Nentotali:", totalsX, y);
    doc.setTextColor(...BLACK);
    doc.text(subtotal.toLocaleString() + " L", contentX + contentW - 2, y, { align: "right" });
    y += 8;

    // Delivery
    doc.setTextColor(...GRAY);
    doc.text("Tarifa e dorezimit:", totalsX, y);
    doc.setTextColor(...BLACK);
    doc.text("300 L", contentX + contentW - 2, y, { align: "right" });
    y += 8;

    // TVSH
    const tvshBase = subtotal;
    const tvsh = Math.round(tvshBase * 0.20);
    doc.setTextColor(...GRAY);
    doc.text("TVSH 20% (e perfshire):", totalsX, y);
    doc.setTextColor(...BLACK);
    doc.text(tvsh.toLocaleString() + " L", contentX + contentW - 2, y, { align: "right" });
    y += 10;

    // Total box
    doc.setFillColor(...BLACK);
    doc.roundedRect(totalsX - 4, y, contentW - (totalsX - contentX) + 4, 14, 2, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TOTALI PERFUNDIMTAR:", totalsX + 2, y + 9);
    doc.setFillColor(...GREEN);
    doc.roundedRect(contentX + contentW - 38, y + 1, 36, 12, 2, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.text(order.total?.toLocaleString() + " L", contentX + contentW - 20, y + 8.5, { align: "center" });

    // Notes
    if (order.notes) {
      y += 22;
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(contentX, y, contentW, 14, 2, 2, "F");
      doc.setTextColor(133, 79, 11);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("SHENIME:", contentX + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.text(order.notes, contentX + 22, y + 6);
    }

    // ── FOOTER ──
    y = pageH - 28;
    doc.setDrawColor(...LIGHTGRAY);
    doc.setLineWidth(0.3);
    doc.line(contentX, y, pageW - margin, y);
    y += 6;

    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Kjo fature eshte gjeneruar automatikisht nga platforma Tregu.store", contentX, y);
    y += 5;
    doc.text("Per cdo pyetje: tregusupport@gmail.com  |  tregu.store", contentX, y);

    // Signature lines
    doc.setDrawColor(...LIGHTGRAY);
    doc.line(contentX, pageH - 10, contentX + 40, pageH - 10);
    doc.setTextColor(...GRAY);
    doc.setFontSize(6.5);
    doc.text("Nenshkrimi i Shitesit", contentX + 20, pageH - 6, { align: "center" });
    doc.line(pageW - margin - 40, pageH - 10, pageW - margin, pageH - 10);
    doc.text("Nenshkrimi i Bleresit", pageW - margin - 20, pageH - 6, { align: "center" });

    doc.save("fature-" + (shop?.name || "tregu").replace(/\s/g, "-") + "-" + order.id.slice(0, 8) + ".pdf");
  };

  if (loading) return <div style={{ padding: 80, textAlign: "center", color: "var(--text-3)" }}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", marginBottom: 24, fontFamily: "var(--font-body)" }} onClick={() => navigate("/seller")}>
          <ArrowLeft size={16} /> {t("back")}
        </button>
        <h1 className={styles.title}>{t("recent_orders")}</h1>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📦</div>
            <div className={styles.emptyTitle}>{t("no_orders_yet")}</div>
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
                      <div className={styles.orderMeta}>{order.customer_name} · {order.customer_phone} · {order.customer_city}</div>
                      <div className={styles.orderMeta}>{order.customer_address}</div>
                      {order.notes && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>📝 {order.notes}</div>}
                    </div>
                    <span className={styles.statusBadge} style={{ background: status.bg, color: status.color }}>
                      {t(ALL_STEPS.find(s => s.key === order.status)?.label_key || "order_confirmed")}
                    </span>
                  </div>

                  {order.items && (
                    <div className={styles.orderItems}>
                      {order.items.map((item, i) => (
                        <div key={i} className={styles.orderItem}>
                          {item.name} {item.size ? "(" + item.size + ")" : ""} x{item.qty} — {item.price?.toLocaleString()} L
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0", padding: "12px", background: "var(--surface-2)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: 12, color: "var(--text-3)", width: "100%", marginBottom: 6 }}>Update status:</div>
                    {ALL_STEPS.map(step => (
                      <button key={step.key} onClick={() => updateStatus(order.id, step.key)}
                        disabled={updating === order.id || order.status === step.key}
                        style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", fontSize: 12, fontWeight: 500,
                          cursor: order.status === step.key ? "default" : "pointer", fontFamily: "var(--font-body)",
                          borderColor: order.status === step.key ? "var(--text-1)" : "var(--border-strong)",
                          background: order.status === step.key ? "var(--text-1)" : "transparent",
                          color: order.status === step.key ? "#fff" : "var(--text-2)", transition: "all 0.15s" }}>
                        {updating === order.id ? "..." : t(step.label_key)}
                      </button>
                    ))}
                  </div>

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
                          {i < ALL_STEPS.length - 1 && <div className={styles.line + (i < currentIdx ? " " + styles.lineDone : "")} />}
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>{t("total")}: {formatPrice(order.total)}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{new Date(order.created_at).toLocaleString()}</span>
                  </div>

                  <div style={{ marginTop: 10, padding: "12px 14px", background: "var(--surface-2)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>Numri i gjurmimit</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      {["Albanian Courier", "DHL", "Posta Shqiptare", "Tjeter"].map(c => (
                        <button key={c} onClick={async () => { await supabase.from("orders").update({ courier_name: c }).eq("id", order.id); await fetchOrders(); }}
                          style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)",
                            border: "1px solid var(--border-strong)", background: order.courier_name === c ? "var(--text-1)" : "transparent",
                            color: order.courier_name === c ? "#fff" : "var(--text-2)" }}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input defaultValue={order.tracking_number || ""} placeholder="Shkruaj numrin e gjurmimit..."
                        onBlur={async (e) => { if (e.target.value !== order.tracking_number) { await supabase.from("orders").update({ tracking_number: e.target.value }).eq("id", order.id); await fetchOrders(); } }}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-strong)", fontSize: 13, fontFamily: "var(--font-body)", background: "var(--surface)", color: "var(--text-1)" }} />
                      {order.tracking_number && (
                        <a href={order.courier_name === "Albanian Courier" ? "https://al.albaniancourier.al/en/track/?code=" + order.tracking_number :
                            order.courier_name === "DHL" ? "https://www.dhl.com/al-en/home/tracking.html?tracking-id=" + order.tracking_number :
                            order.courier_name === "Posta Shqiptare" ? "https://www.postashqiptare.al/gjurmo" :
                            "https://www.google.com/search?q=" + order.tracking_number + "+tracking"}
                          target="_blank" rel="noopener noreferrer"
                          style={{ padding: "8px 12px", borderRadius: 8, background: "var(--green)", color: "#fff", fontSize: 12, fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
                          Gjurmo
                        </a>
                      )}
                    </div>
                    {!order.courier_name && (
                      <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--blue-light)", borderRadius: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--blue)", marginBottom: 6 }}>Nuk ke korrier?</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <a href="https://al.albaniancourier.al" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--blue)", textDecoration: "none", padding: "4px 10px", border: "1px solid var(--blue)", borderRadius: 20 }}>Albanian Courier</a>
                          <a href="https://www.dhl.com/al-en" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--blue)", textDecoration: "none", padding: "4px 10px", border: "1px solid var(--blue)", borderRadius: 20 }}>DHL Albania</a>
                          <a href="tel:+35542259777" style={{ fontSize: 12, color: "var(--blue)", textDecoration: "none", padding: "4px 10px", border: "1px solid var(--blue)", borderRadius: 20 }}>Posta Shqiptare</a>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => generateInvoice(order)}
                    style={{ width: "100%", marginTop: 10, padding: "10px 14px", background: "var(--text-1)", border: "none",
                      borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    Gjenero Fature Profesionale PDF
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--amber-light)", borderRadius: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 13, color: "#854F0B" }}>Driver PIN:</span>
                    <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)", color: "#854F0B", letterSpacing: "0.2em" }}>{order.delivery_pin}</span>
                    <span style={{ fontSize: 12, color: "#854F0B", marginLeft: "auto" }}>Share with driver</span>
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

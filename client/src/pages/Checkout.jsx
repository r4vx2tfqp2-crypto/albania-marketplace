import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { supabase } from "../lib/supabase";
import styles from "./Checkout.module.css";

const CITIES = ["Tirana", "Durres", "Shkoder", "Vlore", "Korce", "Fier", "Berat", "Lushnje"];
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubmd1cG92eGFlcXVlcXBsaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUzODUsImV4cCI6MjA5MjczMTM4NX0.aTiKdVjl02JenqpQzbg2qcniscHMJyml9LMdmRsqqKg";
const FUNCTION_URL = "https://onngupovxaequeqplikx.supabase.co/functions/v1/order-notification";

export default function Checkout() {
  const { cartItems, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "Tirana", notes: "" });
  const [errors, setErrors] = useState({});
  const [pinLocation, setPinLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [deliveryFee, setDeliveryFee] = useState(300);
  const total = cartTotal + deliveryFee;

  useEffect(() => {
    if (cartItems.length > 0 && cartItems[0].shop_id) {
      supabase.from("shops").select("delivery_fee").eq("id", cartItems[0].shop_id).single()
        .then(({ data }) => { if (data?.delivery_fee) setDeliveryFee(data.delivery_fee); });
    }
  }, [cartItems]);
  const formatPrice = (p) => p.toLocaleString("sq-AL") + " L";

  // Redirect to login if not logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) navigate("/login");
    });
  }, []);

  useEffect(() => {
    if (showMap) setTimeout(initMap, 200);
  }, [showMap]);

  const searchBoxRef = useRef(null);

  const initMap = () => {
    if (!window.google || !mapRef.current || mapInstanceRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 41.3275, lng: 19.8187 },
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeId: "roadmap",
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "on" }] },
        { featureType: "building", elementType: "labels", stylers: [{ visibility: "on" }] },
      ],
    });
    mapInstanceRef.current = map;

    // Add search box
    if (searchBoxRef.current) {
      const searchBox = new window.google.maps.places.SearchBox(searchBoxRef.current);
      map.addListener("bounds_changed", () => searchBox.setBounds(map.getBounds()));
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;
        const place = places[0];
        if (!place.geometry) return;
        map.setCenter(place.geometry.location);
        map.setZoom(18);
        placeMarker({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }, map);
        if (place.formatted_address) setForm(f => ({ ...f, address: place.formatted_address }));
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(loc);
        map.setZoom(18);
        placeMarker(loc, map);
      });
    }

    map.addListener("click", (e) => {
      placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() }, map);
    });
  };

  const placeMarker = (location, map) => {
    if (markerRef.current) markerRef.current.setMap(null);
    const marker = new window.google.maps.Marker({
      position: location, map,
      icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#1D9E75", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
    });
    markerRef.current = marker;
    setPinLocation(location);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results[0]) setForm(f => ({ ...f, address: results[0].formatted_address }));
    });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 3) e.name = t("enter_full_name");
    if (!form.phone.trim() || !/^(\+355|0)\d{8,9}$/.test(form.phone.replace(/\s/g, ""))) e.phone = t("enter_valid_phone");
    if (!form.address.trim() || form.address.trim().length < 5) e.address = t("enter_full_address");
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Shkruani nje email te vlefshme";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) { navigate("/login"); return; }
    const { data: orderData, error } = await supabase.from("orders").insert({
      customer_name: form.name, customer_email: form.email, customer_phone: form.phone,
      customer_address: form.address, customer_city: form.city, notes: form.notes,
      total, status: "confirmed", delivery_pin: pin, buyer_id: currentUser.id,
      latitude: pinLocation?.lat || null, longitude: pinLocation?.lng || null,
      items: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, size: i.selectedSize })),
    }).select().single();
    if (error) { setErrors({ submit: t("something_went_wrong") }); setLoading(false); return; }
    try {
      await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Authorization": "Bearer " + ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderData }),
      });
    } catch (err) { console.log("Email error:", err); }
    setPlaced(true);
    setTimeout(() => navigate("/orders"), 2500);
  };

  if (placed) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}><CheckCircle size={64} strokeWidth={1.5} /></div>
        <h2 className={styles.successTitle}>{t("order_placed")}</h2>
        <p className={styles.successSub}>{t("order_placed_sub")}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>{t("checkout")}</h1>
        <div className={styles.layout}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>{t("delivery_info")}</h2>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>{t("full_name")} *</label>
                  <input className={styles.input + (errors.name ? " " + styles.inputError : "")}
                    placeholder="Erion Brahimi" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})} />
                  {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>{t("phone_number")} *</label>
                  <input className={styles.input + (errors.phone ? " " + styles.inputError : "")}
                    placeholder="+355 69 123 4567" value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                  {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email (per konfirmim porosie) *</label>
                <input required className={styles.input + (errors.email ? " " + styles.inputError : "")} placeholder="you@example.com" type="email"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t("address")} *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className={styles.input + (errors.address ? " " + styles.inputError : "")}
                    placeholder="Rruga Myslym Shyri, Nr. 14" value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                    style={{ flex: 1 }} />
                  <button type="button" onClick={() => { setShowMap(!showMap); mapInstanceRef.current = null; }}
                    style={{ padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)",
                      background: pinLocation ? "var(--green-light)" : "var(--surface)",
                      color: pinLocation ? "var(--green-dark)" : "var(--text-2)",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", fontFamily: "var(--font-body)" }}>
                    <MapPin size={14} />
                    {pinLocation ? "Pin vendosur!" : "Pin vendndodhjen"}
                  </button>
                </div>
                {errors.address && <span className={styles.errorMsg}>{errors.address}</span>}
              </div>

              {showMap && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column" }}>
                  <div style={{ background: "var(--surface)", padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ fontSize: 14, color: "var(--text-1)", margin: 0, fontWeight: 500 }}>
                        📍 Vendosni vendndodhjen tuaj
                      </p>
                      <button onClick={() => setShowMap(false)}
                        style={{ background: pinLocation ? "var(--green)" : "var(--text-1)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                        {pinLocation ? "✓ Konfirmo" : "Mbyll"}
                      </button>
                    </div>
                    <input ref={searchBoxRef} type="text" placeholder="🔍 Kërko adresën tuaj..."
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div ref={mapRef} style={{ flex: 1, width: "100%" }} />
                  {pinLocation && (
                    <div style={{ background: "var(--green)", padding: "12px 16px", textAlign: "center" }}>
                      <p style={{ margin: 0, color: "#fff", fontSize: 13, fontWeight: 500 }}>✓ Vendndodhja u vendos! Klikoni Konfirmo per te vazhduar.</p>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>{t("city")} *</label>
                <select className={styles.select} value={form.city} onChange={e => setForm({...form, city: e.target.value})}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>{t("notes")}</label>
                <textarea className={styles.textarea} placeholder={t("notes_placeholder")} rows={3}
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              {errors.submit && <div style={{ color: "var(--red)", fontSize: 13 }}>{errors.submit}</div>}
            </div>

            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>{t("payment_method")}</h2>
              <div className={styles.paymentOption}>
                <div className={styles.paymentIcon}>💵</div>
                <div>
                  <div className={styles.paymentTitle}>{t("cash_delivery_title")}</div>
                  <div className={styles.paymentSub}>{t("cash_delivery_desc")}</div>
                </div>
                <div className={styles.paymentCheck}>✓</div>
              </div>
              <div className={styles.paymentOptionDisabled}>
                <div className={styles.paymentIcon}>💳</div>
                <div>
                  <div className={styles.paymentTitle}>{t("card_payment")}</div>
                  <div className={styles.paymentSub}>{t("coming_soon")}</div>
                </div>
              </div>
            </div>

            <button type="submit" className={styles.placeOrder} disabled={loading}>
              {loading ? "..." : t("place_order") + " — " + formatPrice(total)}
            </button>
          </form>

          <div className={styles.orderSummary}>
            <h2 className={styles.sectionTitle}>{t("checkout")} ({cartCount} {t("items")})</h2>
            {cartItems.map(item => (
              <div key={item.id + "-" + item.selectedSize} className={styles.orderItem}>
                <span className={styles.orderItemName}>{item.name}</span>
                {item.selectedSize && <span className={styles.orderItemSize}>{t("size")} {item.selectedSize}</span>}
                <span className={styles.orderItemQty}>x{item.qty}</span>
                <span className={styles.orderItemPrice}>{formatPrice(item.price * item.qty)}</span>
              </div>
            ))}
            <div className={styles.divider} />
            <div className={styles.totalRow}><span>{t("subtotal")}</span><span>{formatPrice(cartTotal)}</span></div>
            <div className={styles.totalRow}><span>{t("delivery")}</span><span>{formatPrice(deliveryFee)}</span></div>
            <div className={styles.divider} />
            <div className={styles.grandTotal}><span>{t("total")}</span><span>{formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

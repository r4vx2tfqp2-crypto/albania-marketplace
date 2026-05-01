import { NavLink } from "react-router-dom";
import { Home, Search, Heart, ShoppingCart, User, Play } from "lucide-react";
import { useCart } from "../context/CartContext";
import styles from "./BottomNav.module.css";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/search", icon: Search, label: "Kerko" },
  { to: "/feed", icon: Play, label: "Feed" },
  { to: "/favorites", icon: Heart, label: "Ruajtur" },
  { to: "/cart", icon: ShoppingCart, label: "Shporta", badge: true },
  { to: "/profile", icon: User, label: "Profili" },
];

export default function BottomNav() {
  const { cartCount } = useCart();

  return (
    <nav className={styles.nav}>
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink key={to} to={to} end={to === "/"}
          className={({ isActive }) => styles.item + (isActive ? " " + styles.active : "")}>
          <span className={styles.iconWrap}>
            <Icon size={20} strokeWidth={1.8} />
            {badge && cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

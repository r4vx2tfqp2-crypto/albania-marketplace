import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Search from './pages/Search';
import Product from './pages/Product';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import SellerDashboard from './pages/SellerDashboard';
import AddProduct from './pages/AddProduct';
import AddShop from './pages/AddShop';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Loading…</div>;
  if (!user || user.email !== 'julsina76@gmail.com') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function MainLayout() {
  return (
    <div style={{ paddingBottom: '72px' }}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/shop/:id" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/seller" element={
          <ProtectedRoute><SellerDashboard /></ProtectedRoute>
        } />
        <Route path="/seller/add-product" element={
          <ProtectedRoute><AddProduct /></ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
        <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/seller/add-shop" element={
          <ProtectedRoute><AddShop /></ProtectedRoute>
        } />
      </Routes>
      <BottomNav />
    </div>
  );
}

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary, lazyImport } from './components/ErrorBoundary';
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
import DeliveryConfirm from './pages/DeliveryConfirm';
import ConfirmDelivery from './pages/ConfirmDelivery';
import Feed from './pages/Feed';
import Legal from './pages/Legal';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';

// Seller/admin pages pull in heavy dependencies (jspdf, html2canvas, qrcode)
// and are only ever reached by a signed-in seller or the single admin
// account -- code-split them instead of shipping them in the bundle every
// visitor downloads to just browse products.
const SellerDashboard = lazy(lazyImport(() => import('./pages/SellerDashboard')));
const SellerOrders = lazy(lazyImport(() => import('./pages/SellerOrders')));
const EditProduct = lazy(lazyImport(() => import('./pages/EditProduct')));
const AddProduct = lazy(lazyImport(() => import('./pages/AddProduct')));
const AddShop = lazy(lazyImport(() => import('./pages/AddShop')));
const AdminSubscriptions = lazy(lazyImport(() => import('./pages/AdminSubscriptions')));
const AdminPanel = lazy(lazyImport(() => import('./pages/AdminPanel')));

function RouteFallback() {
  return <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-3)' }}>Duke ngarkuar…</div>;
}

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

// index.html's gtag snippet only fires a page_view on the initial full
// page load -- this is a client-side-routed SPA, so every in-app
// navigation (Home -> Product, Search, Shop, etc.) was invisible to
// Analytics. Fires a page_view event manually on every route change.
function GAListener() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <GAListener />
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/feed" element={<Feed />} />
        <Route path="/confirm-delivery" element={<ConfirmDelivery />} />
            <Route path="/delivery" element={<DeliveryConfirm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<Login />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

function MainLayout() {
  return (
    <div style={{ paddingBottom: '72px' }}>
      <Navbar />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/shop/:id" element={<Shop />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/seller" element={
            <ProtectedRoute><SellerDashboard /></ProtectedRoute>
          } />
          <Route path="/seller/add-product" element={
            <ProtectedRoute><AddProduct /></ProtectedRoute>
          } />
          <Route path="/legal" element={<Legal />} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/seller/edit-product/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/seller/orders" element={<ProtectedRoute><SellerOrders /></ProtectedRoute>} />
          <Route path="/seller/add-shop" element={
            <ProtectedRoute><AddShop /></ProtectedRoute>
          } />
        </Routes>
      </Suspense>
      <BottomNav />
    </div>
  );
}

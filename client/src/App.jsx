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
import Login from './pages/Login';
import { ADMIN_EMAIL } from './lib/constants';

// Everything below is code-split: none of it is needed for the core
// browse-and-buy path (Home/Search/Product/Shop/Cart/Login, imported
// eagerly above), so there's no reason a first-time visitor's initial
// bundle should include checkout, settings, legal pages, password reset,
// the delivery-confirmation flows, or the seller/admin tools (which also
// pull in jspdf/qrcode). Loaded on demand instead.
const Checkout = lazy(lazyImport(() => import('./pages/Checkout')));
const Orders = lazy(lazyImport(() => import('./pages/Orders')));
const Favorites = lazy(lazyImport(() => import('./pages/Favorites')));
const Profile = lazy(lazyImport(() => import('./pages/Profile')));
const Feed = lazy(lazyImport(() => import('./pages/Feed')));
const Legal = lazy(lazyImport(() => import('./pages/Legal')));
const Settings = lazy(lazyImport(() => import('./pages/Settings')));
const ForgotPassword = lazy(lazyImport(() => import('./pages/ForgotPassword')));
const ResetPassword = lazy(lazyImport(() => import('./pages/ResetPassword')));
const ConfirmDelivery = lazy(lazyImport(() => import('./pages/ConfirmDelivery')));
const DeliveryConfirm = lazy(lazyImport(() => import('./pages/DeliveryConfirm')));
const SellerDashboard = lazy(lazyImport(() => import('./pages/SellerDashboard')));
const SellerOrders = lazy(lazyImport(() => import('./pages/SellerOrders')));
const EditProduct = lazy(lazyImport(() => import('./pages/EditProduct')));
const AddProduct = lazy(lazyImport(() => import('./pages/AddProduct')));
const AddShop = lazy(lazyImport(() => import('./pages/AddShop')));
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
  if (!user || user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />;
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
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/feed" element={<Feed />} />
              <Route path="/confirm-delivery" element={<ConfirmDelivery />} />
              <Route path="/delivery" element={<DeliveryConfirm />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<MainLayout />} />
            </Routes>
          </Suspense>
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

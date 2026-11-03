import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import StoreProducts from './pages/StoreProducts';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import OrderConfirmation from './pages/OrderConfirmation';
import News from './pages/News';
import Services from './pages/Services';
import SavedProducts from './pages/SavedProducts';
import AdminDashboard from './pages/admin/AdminDashboard';
import DeliveryDashboard from './pages/admin/DeliveryDashboard';
import CategoryProducts from './pages/CategoryProducts';
import ProductGroupProducts from './pages/ProductGroupProducts';
import MyStore from './pages/MyStore';


import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MyService from './pages/MyService';
import Categories from './pages/Categories';
import EditAddress from './pages/EditAddress';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteAccount from './pages/DeleteAccount';
import Games from './pages/Games'; // Added for Mind Match

import MobileFooter from './components/MobileFooter';
import InstallPrompt from './components/InstallPrompt';
import IntroAnimation from './components/IntroAnimation';
import NotificationOverlay from './components/NotificationOverlay';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import { Bike } from 'lucide-react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useData } from './context/DataContext';
import { useAuth } from './context/AuthContext';
import MaintenanceScreen from './components/MaintenanceScreen';
import useBackButton from './utils/useBackButton';
import { setOverlayAuthToken } from './utils/floatingOverlay';
import PrivateRoute from './components/PrivateRoute';
import OfflineScreen from './components/OfflineScreen';
import ConnectionStatus from './components/ConnectionStatus';
import { useState } from 'react';

import ScrollToTop from './components/ScrollToTop';


const HomeWithRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return null;

    // Guests are auto-created on app launch, so !user is only a rare fallback.
    // Don't redirect to /login — just show Home for all users (including guests).
    const roles = Array.isArray(user?.role) ? user.role : [user?.role || 'customer'];
    const isAdmin = roles.some(r => String(r || '').toLowerCase().trim() === 'admin');
    const isDeliveryBoy = roles.some(r => {
        const normalized = String(r || '').toLowerCase().trim();
        return normalized === 'delivery_boy' || normalized === 'deliveryboy';
    });

    if (isDeliveryBoy && !isAdmin) {
        return <Navigate to="/admin" replace />;
    }
    return <Home />;
};

const AdminOrDeliveryDashboard = () => {
    const { user, loading } = useAuth();
    if (loading) return null;

    const roles = Array.isArray(user?.role) ? user.role : [user?.role || 'customer'];
    const isDeliveryBoy = roles.some(r => {
        const normalized = String(r || '').toLowerCase().trim();
        return normalized === 'delivery_boy' || normalized === 'deliveryboy';
    });

    if (isDeliveryBoy) {
        return <DeliveryDashboard />;
    }
    return <AdminDashboard />;
};

const RoleRedirectHandler = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Wait for auth to finish loading
        if (loading) return;
        if (!user) return;

        const roles = Array.isArray(user.role) ? user.role : [user.role || 'customer'];
        const isAdmin = roles.some(r => String(r || '').toLowerCase().trim() === 'admin');
        const isDeliveryBoy = roles.some(r => {
            const normalized = String(r || '').toLowerCase().trim();
            return normalized === 'delivery_boy' || normalized === 'deliveryboy';
        });
        
        console.log('RoleRedirectHandler: Checking role', { roles, pathname: location.pathname });

        // Force delivery_boy to /admin, but allow them to see specific order details
        if (isDeliveryBoy && !isAdmin) {
            const isAllowedPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/orders');
            if (!isAllowedPath) {
                console.log('RoleRedirectHandler: Redirecting delivery_boy to /admin');
                navigate('/admin', { replace: true });
            }
        }
        // No longer forcing admin to /admin automatically here, so they can "see all pages"
    }, [user, loading, location.pathname, navigate]);

    return null;
};



const Layout = ({ children, onRefresh }) => {
    const location = useLocation();
    const { user } = useAuth();
    // Use back button handler for Android navigation
    useBackButton();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setOverlayAuthToken(token);
        }
    }, [user]);
    // Only hide footer on order confirmation and auth pages
    const isAuthPage = location.pathname === '/forgot-password' ||
        location.pathname.startsWith('/reset-password');

    const isAdminRoute = location.pathname.startsWith('/admin');

    const { settings, isFooterHidden, updateMaintenanceMode } = useData();
    const [showAdminPreview, setShowAdminPreview] = useState(false);

    const { isMaintenance: isLiveMaintenance } = useSocket();
    const isMaintenanceMode = settings?.maintenanceMode === true || isLiveMaintenance;
    const isAdmin = Array.isArray(user?.role) ? user?.role.includes('admin') : user?.role === 'admin'; // Specific check for 'admin' role

    const isExemptRoute =
        location.pathname === '/forgot-password' ||
        location.pathname.startsWith('/reset-password') ||
        location.pathname.startsWith('/admin');
    const shouldBlock = isMaintenanceMode && !isAdmin && !isExemptRoute;

    if (shouldBlock) {
        return <MaintenanceScreen />;
    }

    // Footer Visibility: Only show on top-level navigation pages
    const allowedFooterRoutes = ['/', '/store', '/orders', '/profile', '/categories'];
    const showMobileFooter = allowedFooterRoutes.includes(location.pathname) && !isFooterHidden;

    const { cartItems, deliveryCharge } = useCart();
    const { t } = useLanguage();

    const showFloatingDeliveryBadge = false;

    return (
        <div className="flex flex-col min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200">
            <ScrollToTop />
            {/* Admin Maintenance Mode Active Banner */}
            {isMaintenanceMode && isAdmin && (
                <div className="sticky top-0 z-[9990] bg-amber-500 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 flex items-center justify-between shadow-md flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
                        <span>
                            <strong>Maintenance Mode is ACTIVE for customers.</strong> {settings?.maintenanceMessage ? `Message: "${settings.maintenanceMessage}"` : 'Standard message displayed.'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAdminPreview(true)}
                            className="px-2.5 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors shadow-sm"
                        >
                            Preview Screen
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                await updateMaintenanceMode(false);
                            }}
                            className="px-2.5 py-1 bg-amber-800 text-white rounded-lg text-xs font-bold hover:bg-amber-900 transition-colors shadow-sm"
                        >
                            Turn Online
                        </button>
                    </div>
                </div>
            )}
            {showAdminPreview && (
                <MaintenanceScreen
                    isPreview={true}
                    previewMessage={settings?.maintenanceMessage}
                    onClose={() => setShowAdminPreview(false)}
                />
            )}
            {/* {showNavbar && <Navbar />} */}
            {/* <PullToRefresh onRefresh={onRefresh} resistance={2.5} className="flex-grow flex flex-col"> */}
            <main className={`flex-grow flex flex-col ${showMobileFooter ? 'pb-32 md:pb-0 md:pr-28' : ''}`}>
                {children}
            </main>
            {/* </PullToRefresh> */}

            {/* Floating Delivery Charge Card - right side (Solid Red - Showcase only, not clickable) */}
            {showFloatingDeliveryBadge && (
                <div
                    className="fixed right-0 top-[25%] -translate-y-1/2 z-[90] select-none pointer-events-none"
                    aria-hidden="true"
                >
                    <div
                        className="rounded-l-2xl py-2 px-3 flex flex-col items-center shadow-lg border-2 border-r-0 border-white text-center bg-red-600"
                    >
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider mb-0.5 select-none leading-none">
                            {t('Delivery')}
                        </span>
                        <span className="text-[14px] font-black text-white select-none leading-none">
                            {deliveryCharge === 0 ? t('Free') : `₹${deliveryCharge}`}
                        </span>
                    </div>
                </div>
            )}

            {showMobileFooter && <MobileFooter />}
            {!isAuthPage && <InstallPrompt />}
        </div>
    );
};



function App() {
    const { initialLoading, refreshData } = useData();
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Global listener for Android/iOS deep links (handles OAuth callback cold starts)
    useEffect(() => {
        const setupAppListener = async () => {
            try {
                // Only import on native platforms
                const { Capacitor } = await import('@capacitor/core');
                if (!Capacitor.isNativePlatform()) return;

                const { App: CapApp } = await import('@capacitor/app');
                const { Browser } = await import('@capacitor/browser');

                CapApp.addListener('appUrlOpen', async (data) => {
                    console.log('App received deep link URL:', data.url);
                    const urlString = data.url || '';
                    
                    // Safe string-based token extraction
                    if (urlString.includes('access_token=')) {
                        const tokenMatch = urlString.match(/access_token=([^&#\s?]+)/);
                        if (tokenMatch && tokenMatch[1]) {
                            const accessToken = tokenMatch[1];
                            localStorage.setItem('pending_google_access_token', accessToken);
                            
                            // Close the secure Chrome tab
                            await Browser.close().catch(() => {});
                            
                            // Dispatch event to notify active Login component
                            window.dispatchEvent(new Event('pendingTokenReceived'));
                        }
                    }
                });
            } catch (err) {
                console.error('Failed to setup global deep link listener:', err);
            }
        };

        setupAppListener();
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleRefresh = async () => {
        if (refreshData) {
            await refreshData();
        }
    };

    return (
        <AuthProvider>
            <SocketProvider>
                <Router>
                    <RoleRedirectHandler />
                    <NotificationOverlay />

                    
                    {/* Show offline screen first if no internet */}
                    {isOffline && <OfflineScreen />}

                    {/* Show intro animation during initial load if online */}
                    {!isOffline && initialLoading && <IntroAnimation />}

                    {/* Main app content - hidden during intro or offline */}
                    <div style={{ display: (initialLoading || isOffline) ? 'none' : 'block' }}>
                        <CartProvider>
                            <Layout onRefresh={handleRefresh}>
                                <Routes>
                                    <Route path="/" element={
                                        <HomeWithRedirect />
                                    } />
                                    <Route path="/store" element={<Shop />} />
                                    <Route path="/shop" element={<Navigate to="/store" replace />} />
                                    <Route path="/store/:id" element={<StoreProducts />} />
                                    <Route path="/product/:id" element={<ProductDetails />} />
                                    <Route path="/news" element={<News />} />
                                    <Route path="/services" element={<Services />} />
                                    <Route path="/login" element={<Navigate to="/" replace />} />
                                    <Route path="/signup" element={<Navigate to="/" replace />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/reset-password/:token" element={<ResetPassword />} />

                                    {/* Protected Routes */}
                                    <Route
                                        path="/profile"
                                        element={
                                            <PrivateRoute>
                                                <Profile />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/edit-address"
                                        element={
                                            <PrivateRoute>
                                                <EditAddress />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/cart"
                                        element={
                                            <PrivateRoute>
                                                <Cart />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/checkout"
                                        element={
                                            <PrivateRoute>
                                                <Checkout />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/orders"
                                        element={
                                            <PrivateRoute>
                                                <Orders />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/orders/:id"
                                        element={
                                            <PrivateRoute>
                                                <OrderDetails />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/order-confirmation"
                                        element={
                                            <PrivateRoute>
                                                <OrderConfirmation />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/saved-products"
                                        element={
                                            <PrivateRoute>
                                                <SavedProducts />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/my-store"
                                        element={
                                            <PrivateRoute>
                                                <MyStore />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/my-service"
                                        element={
                                            <PrivateRoute>
                                                <MyService />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route
                                        path="/games"
                                        element={
                                            <PrivateRoute>
                                                <Games />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                    <Route path="/delete-account" element={<DeleteAccount />} />
                                    <Route path="/categories" element={<Categories />} />
                                    <Route path="/category/:categoryName" element={<CategoryProducts />} />
                                    <Route path="/product-group/:productName" element={<ProductGroupProducts />} />
                                    <Route
                                        path="/admin"
                                        element={
                                            <PrivateRoute adminOnly={true}>
                                                <AdminOrDeliveryDashboard />
                                            </PrivateRoute>
                                        }
                                    />
                                    <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                            </Layout>
                        </CartProvider>
                    </div>
                </Router>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;

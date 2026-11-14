import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useAuth } from '../context/AuthContext';
import { getUserRoles } from './userHelpers';

// Global stack for modal dismissal on Android hardware back button
const modalBackStack = [];

// Track navigation history manually so back always works in Capacitor WebView
const navHistory = ['/'];

const isOrderFlowRoute = (p) => {
    if (!p) return false;
    return p === '/order-confirmation' ||
           p.startsWith('/checkout') ||
           p === '/cart' ||
           p.startsWith('/product/') ||
           p.startsWith('/product-group/');
};

/**
 * Universal safe back navigation for UI back arrow buttons and headers.
 * Navigates back through history, closes open modals first, or falls back safely to Home/specified route.
 */
export const safeNavigateBack = (navigate, fallback = '/') => {
    if (typeof navigate !== 'function') return;

    const currentPath = (window.location.pathname || '/') + (window.location.search || '');
    // Back navigation disabled on both Admin and Delivery Boy panels
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/delivery-dashboard')) {
        return;
    }

    // 1. If any modal / popup is open, close the top modal first
    if (modalBackStack.length > 0) {
        const closeTopModal = modalBackStack.pop();
        if (typeof closeTopModal === 'function') {
            try {
                closeTopModal();
                return;
            } catch (e) {
                console.warn('Error closing modal on safeNavigateBack:', e);
            }
        }
    }

    // 2. If order was just placed, go to Home
    const orderJustPlaced = (() => {
        try {
            return sessionStorage.getItem('orderJustPlaced') === 'true';
        } catch (e) {
            return false;
        }
    })();
    if (orderJustPlaced) {
        markOrderPlaced();
        navigate('/', { replace: true });
        return;
    }

    // 3. Navigate back through tracked history stack
    while (navHistory.length > 1) {
        navHistory.pop(); // remove current page
        const previous = navHistory[navHistory.length - 1];
        if (orderJustPlaced && isOrderFlowRoute(previous)) {
            continue;
        }
        if (previous && previous !== currentPath) {
            navigate(previous);
            return;
        }
    }

    // 4. Try browser history if idx > 0
    if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
        return;
    }

    // 5. Fallback safely to specified fallback route (default Home '/')
    navigate(fallback);
};

/**
 * Call this when an order is submitted/confirmed so back navigation
 * purges the cart, checkout, order-confirmation, and product details from history
 * and routes directly to the Home page.
 */
export const markOrderPlaced = () => {
    try {
        sessionStorage.setItem('orderJustPlaced', 'true');
    } catch (e) {}
    for (let i = navHistory.length - 1; i >= 0; i--) {
        if (isOrderFlowRoute(navHistory[i])) {
            navHistory.splice(i, 1);
        }
    }
    if (navHistory.length === 0) {
        navHistory.push('/');
    }
};

/**
 * Register a modal or popup to be closed when Android back button is clicked.
 * Returns an unregister function to be called on cleanup.
 */
export const registerModalBackHandler = (fn) => {
    if (typeof fn !== 'function') return () => {};
    modalBackStack.push(fn);
    return () => {
        const index = modalBackStack.lastIndexOf(fn);
        if (index > -1) {
            modalBackStack.splice(index, 1);
        }
    };
};

/**
 * Custom hook to handle Android hardware/gesture back button navigation.
 * Prevents app from unexpectedly closing, navigates back through history,
 * closes active modals first, and safely minimizes to background only at root.
 */
export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = useRef(location);
    const { user } = useAuth();
    const userRef = useRef(user);
    useEffect(() => { userRef.current = user; }, [user]);

    useEffect(() => {
        locationRef.current = location;
        const path = location.pathname + (location.search || '');

        // If user reaches home, reset orderJustPlaced flag so future shopping navigation is unaffected
        if (path === '/' || path === '/home') {
            try {
                sessionStorage.removeItem('orderJustPlaced');
            } catch (e) {}
        }

        const roles = getUserRoles(userRef.current);
        const isDeliveryBoy = roles.includes('delivery_boy') && !roles.includes('admin');
        const isDeliveryBoyLoggedOut = localStorage.getItem('delivery_boy_logged_out') === 'true';
        const isDeliveryMode = isDeliveryBoy && !isDeliveryBoyLoggedOut;

        // Only skip tracking when actually on delivery boy specific screens
        if (isDeliveryMode && (path === '/admin' || path.startsWith('/admin/delivery'))) {
            return;
        }

        const last = navHistory[navHistory.length - 1];
        if (path !== last) {
            navHistory.push(path);
        }
    }, [location]);

    useEffect(() => {
        // Core back button handler logic
        const handleBack = () => {
            const currentPath = locationRef.current?.pathname || window.location.pathname || '/';

            // STRICT LOCK FOR ADMIN AND DELIVERY PANELS:
            // Back button on phone nav does NOT escape to user/customer screens on both Admin and Delivery panels
            const isAdminRoute = currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/delivery');
            const isDeliveryRoute = currentPath === '/delivery-dashboard' || currentPath.startsWith('/delivery-dashboard') || currentPath.startsWith('/admin/delivery');

            if (isAdminRoute || isDeliveryRoute) {
                // If a modal is open in panel (like Logout modal or orders feed), close the modal
                if (modalBackStack.length > 0) {
                    const closeTopModal = modalBackStack.pop();
                    if (typeof closeTopModal === 'function') {
                        try {
                            closeTopModal();
                            return true;
                        } catch (e) {
                            console.warn('Error closing modal on back:', e);
                        }
                    }
                }
                // Completely block back button from leaving the panel
                return true;
            }

            // --- REGULAR USER BACK NAVIGATION (Always works on all customer/user pages!) ---
            // 1. If any modal / popup / feed is open, close the top modal first
            if (modalBackStack.length > 0) {
                const closeTopModal = modalBackStack.pop();
                if (typeof closeTopModal === 'function') {
                    try {
                        closeTopModal();
                        return true;
                    } catch (e) {
                        console.warn('Error closing modal on back:', e);
                    }
                }
            }

            const orderJustPlaced = (() => {
                try {
                    return sessionStorage.getItem('orderJustPlaced') === 'true';
                } catch (e) {
                    return false;
                }
            })();

            // 2. Order Confirmation: ALWAYS go directly to Home
            if (currentPath === '/order-confirmation' || (orderJustPlaced && isOrderFlowRoute(currentPath))) {
                markOrderPlaced();
                navigate('/', { replace: true });
                return true;
            }

            // 3. Already at root — return false so Android minimizes the app
            if (currentPath === '/' || currentPath === '/home') {
                return false;
            }

            // If order was just placed, clean order flow routes out of navHistory
            if (orderJustPlaced) {
                for (let i = navHistory.length - 1; i >= 0; i--) {
                    if (isOrderFlowRoute(navHistory[i])) {
                        navHistory.splice(i, 1);
                    }
                }
                if (navHistory.length === 0) {
                    navHistory.push('/');
                }
            }

            // 4. Use our tracked history stack to go back
            while (navHistory.length > 1) {
                navHistory.pop(); // remove current
                const previous = navHistory[navHistory.length - 1];
                if (orderJustPlaced && isOrderFlowRoute(previous)) {
                    continue;
                }
                if (previous && previous !== currentPath) {
                    navigate(previous);
                    return true;
                }
            }

            // 5. Fallback: only use browser history if order was not just placed
            if (!orderJustPlaced && window.history.state && window.history.state.idx > 0) {
                navigate(-1);
                return true;
            }

            // 6. Last resort: go Home rather than close the app
            navigate('/');
            return true;
        };

        // Expose to window so MainActivity.onBackPressed() evaluateJavascript can call it directly
        window.__handleBackButton = handleBack;

        let listenerHandle = null;
        let isMounted = true;

        if (Capacitor.isNativePlatform()) {
            CapacitorApp.addListener('backButton', () => {
                const handled = handleBack();
                if (!handled) {
                    CapacitorApp.minimizeApp();
                }
            }).then(h => {
                if (isMounted) {
                    listenerHandle = h;
                } else {
                    h.remove();
                }
            }).catch(err => {
                console.warn('CapacitorApp backButton listener setup error:', err);
            });
        }

        return () => {
            isMounted = false;
            window.__handleBackButton = null;
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [navigate]);
};

export default useBackButton;

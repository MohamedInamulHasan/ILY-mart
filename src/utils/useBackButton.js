import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Global stack for modal dismissal on Android hardware back button
const modalBackStack = [];

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

// Track navigation history manually so back always works in Capacitor WebView
const navHistory = ['/'];

/**
 * Custom hook to handle Android hardware/gesture back button navigation.
 * Prevents app from unexpectedly closing, navigates back through history,
 * closes active modals first, and safely minimizes to background only at root.
 */
export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = useRef(location);

    useEffect(() => {
        locationRef.current = location;
        // Track every pathname change in our own stack
        const path = location.pathname;
        const last = navHistory[navHistory.length - 1];
        if (path !== last) {
            navHistory.push(path);
        }
    }, [location]);

    useEffect(() => {
        // Core back button handler logic
        const handleBack = () => {
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

            const currentPath = locationRef.current?.pathname || window.location.pathname || '/';

            // 2. Order Confirmation: always go to Home (can't go back to checkout)
            if (currentPath === '/order-confirmation') {
                navHistory.length = 1;
                navigate('/', { replace: true });
                return true;
            }

            // 3. Already at root — minimize the app
            if (currentPath === '/' || currentPath === '/home' || currentPath === '/admin') {
                return false;
            }

            // 4. Use our tracked history stack to go back
            if (navHistory.length > 1) {
                navHistory.pop(); // remove current
                const previous = navHistory[navHistory.length - 1];
                navigate(previous, { replace: true });
                return true;
            }

            // 5. Use browser history index as fallback
            if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
                return true;
            }

            // 6. Last resort: go Home rather than close the app
            navigate('/', { replace: true });
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

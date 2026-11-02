import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Custom hook to handle Android hardware/gesture back button navigation
 * Prevents app from unexpectedly closing when navigating between pages,
 * and ensures placing an order navigates back to Home rather than Confirmation.
 */
export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = useRef(location);

    // Update location ref whenever location changes
    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        // Only active on native Android / iOS
        if (!Capacitor.isNativePlatform()) return;

        let listenerHandle = null;
        let isMounted = true;

        const setupListener = async () => {
            try {
                const handle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                    const currentPath = locationRef.current?.pathname || '/';

                    // 1. Root / Home screen: minimize app to background (do not destroy process)
                    if (currentPath === '/' || currentPath === '/home') {
                        CapacitorApp.minimizeApp();
                        return;
                    }

                    // 2. Order Confirmation page: always go back to Home
                    if (currentPath === '/order-confirmation') {
                        navigate('/', { replace: true });
                        return;
                    }

                    // 3. Orders page: return to Home screen instead of going back to Checkout/Confirmation
                    if (currentPath === '/orders') {
                        navigate('/', { replace: true });
                        return;
                    }

                    // 4. Other top-level tabs (Cart, Profile, Categories, Store)
                    if (
                        currentPath === '/cart' ||
                        currentPath === '/profile' ||
                        currentPath === '/categories' ||
                        currentPath === '/store' ||
                        currentPath === '/shop'
                    ) {
                        navigate('/', { replace: true });
                        return;
                    }

                    // 5. Nested / sub-pages (e.g. OrderDetails /orders/:id, ProductDetails, etc.)
                    // Use history back if possible, fallback to Home
                    if (window.history.length > 1) {
                        navigate(-1);
                    } else {
                        navigate('/', { replace: true });
                    }
                });

                if (isMounted) {
                    listenerHandle = handle;
                } else {
                    handle.remove();
                }
            } catch (error) {
                console.error('Failed to setup back button listener:', error);
            }
        };

        setupListener();

        return () => {
            isMounted = false;
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [navigate]);
};

export default useBackButton;

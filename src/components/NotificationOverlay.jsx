import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Bell, CheckCircle, Truck, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders } from '../hooks/queries/useOrders';
import { useStores } from '../hooks/queries/useStores';
import IncomingOrderModal from './IncomingOrderModal';
import { playSuccessSound, playOrderPlacedSound, playOrderAcceptedSound, playOrderDeliveredSound, playOrderCancelledSound, stopIncomingOrderAlertSound } from '../utils/soundHelper';
import { 
    isNativeAndroid, 
    setOverlayOrdersState, 
    triggerIncomingOrderAlert, 
    showPorterOrderCard, 
    dismissPorterOrderCard,
    checkOverlayPermission 
} from '../utils/floatingOverlay';
import { apiService } from '../utils/api';
import { registerModalBackHandler } from '../utils/useBackButton';
import { getUserRoles } from '../utils/userHelpers';

const NotificationOverlay = () => {
    const { socket } = useSocket();
    const { t } = useLanguage();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState([]);
    const [incomingOrder, setIncomingOrder] = useState(null);
    const [startWithAcceptView, setStartWithAcceptView] = useState(false);
    const [skippedOrderIds, setSkippedOrderIds] = useState(() => new Set());
    const sessionStartRef = useRef(Date.now());
    const initialOrdersLoadedRef = useRef(false);
    const knownOrderIdsRef = useRef(new Set());
    const navigate = useNavigate();
    const location = useLocation();

    const isDeliveryPage = useMemo(() => {
        return location.pathname.startsWith('/admin') || location.pathname.startsWith('/my-store') || location.pathname.startsWith('/delivery-dashboard');
    }, [location.pathname]);

    const [hasOverlayPermission, setHasOverlayPermission] = useState(true);
    useEffect(() => {
        if (isNativeAndroid()) {
            checkOverlayPermission().then(res => setHasOverlayPermission(!!res));
        }
        const handleFocus = () => {
            if (isNativeAndroid()) {
                checkOverlayPermission().then(res => setHasOverlayPermission(!!res));
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const roles = useMemo(() => getUserRoles(user), [user]);
    const { data: stores = [] } = useStores();

    let savedMobile = '';
    try {
        const saved = JSON.parse(localStorage.getItem('user_saved_address') || 'null');
        savedMobile = (saved?.mobile || saved?.phone || '').toString().replace(/\D/g, '').slice(-10);
    } catch {}
    const activeMobile = (savedMobile || user?.mobile || user?.phone || '').toString().replace(/\D/g, '').slice(-10);
    const explicitStoreId = localStorage.getItem('my_store_id');

    const isStoreAdmin = useMemo(() => {
        return roles.includes('store_admin') || (roles.includes('admin') && location.pathname.startsWith('/my-store')) || Boolean(user?.storeId) || Boolean(explicitStoreId) || activeMobile === '9876543211' || activeMobile === '8474958585';
    }, [roles, user, explicitStoreId, activeMobile, location.pathname]);

    const myStore = useMemo(() => {
        if (!isStoreAdmin) return null;
        const targetStoreId = String(explicitStoreId || user?.storeId?._id || user?.storeId || '');
        return stores.find(s => {
            const sId = String(s._id || s.id || '');
            if (targetStoreId && sId === targetStoreId) return true;
            const sMobile = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
            if (activeMobile && sMobile && sMobile === activeMobile) return true;
            if (activeMobile === '9876543211' && s.name?.toLowerCase().includes('arabian')) return true;
            return false;
        }) || (stores.length > 0 ? (targetStoreId ? (stores.find(s => String(s._id || s.id) === targetStoreId) || stores[0]) : stores[0]) : null);
    }, [isStoreAdmin, user, stores, explicitStoreId, activeMobile]);

    const myStoreId = String(myStore?._id || myStore?.id || explicitStoreId || user?.storeId?._id || user?.storeId || '');
    const myStoreName = (myStore?.name || '').trim().toLowerCase();

    const isOrderForMyStore = (order) => {
        if (!isStoreAdmin || (!myStoreId && !myStoreName)) return false;
        const oStoreId = String(order?.storeId?._id || order?.storeId || '').trim();
        if (myStoreId && oStoreId && oStoreId === myStoreId) return true;

        if (Array.isArray(order?.items)) {
            return order.items.some(item => {
                const itemStoreId = String(item.storeId?._id || item.storeId || item.store?._id || item.store?.id || '').trim();
                if (myStoreId && itemStoreId && itemStoreId === myStoreId) return true;
                if (myStoreName && (item.storeName || item.storeId?.name || '').trim().toLowerCase() === myStoreName) return true;
                return false;
            });
        }
        return false;
    };
    const isDeliveryBoy = useMemo(() => {
        const hasDeliveryRole = roles.includes('delivery_boy') || roles.includes('deliveryboy') || roles.includes('admin');
        const isDeliverySessionActive = localStorage.getItem('delivery_session_active') === 'true' && localStorage.getItem('delivery_boy_logged_out') !== 'true';
        return hasDeliveryRole && isDeliverySessionActive;
    }, [roles, user]);
    const isAdmin = useMemo(() => roles.includes('admin'), [roles]);

    const { data: rawOrders = [] } = useOrders();
    const allOrders = useMemo(() => {
        return Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
    }, [rawOrders]);

    // Reset session and known orders when user changes or logs in/out
    useEffect(() => {
        sessionStartRef.current = Date.now();
        initialOrdersLoadedRef.current = false;
        knownOrderIdsRef.current.clear();
        setSkippedOrderIds(new Set());
        setIncomingOrder(null);
    }, [user?.id || user?._id]);

    // Check if delivery boy has an active accepted order currently in progress
    const hasActiveAcceptedOrder = useMemo(() => {
        if (!isDeliveryBoy) return false;
        return allOrders.some(o => {
            const s = String(o.status || '').toLowerCase().trim();
            return s === 'accepted' || s === 'out for delivery' || s === 'shipped';
        });
    }, [allOrders, isDeliveryBoy]);

    // Helper to check if order is processing
    const isProcessingStatus = (status) => {
        const s = String(status || '').toLowerCase().trim();
        return s === 'pending' || s === 'processing' || s === 'order placed' || s === 'confirmed';
    };

    // Filter processing orders for delivery boy
    const processingOrders = useMemo(() => {
        if (!isDeliveryBoy) return [];
        return allOrders.filter(o => isProcessingStatus(o.status));
    }, [allOrders, isDeliveryBoy]);

    // Helper to check if order is undelivered (active until delivered)
    const isUndeliveredStatus = (status) => {
        const s = String(status || '').toLowerCase().trim();
        return ['pending', 'processing', 'order placed', 'confirmed', 'accepted', 'out for delivery', 'shipped'].includes(s);
    };

    // Filter processing orders for store admin
    const storeProcessingOrders = useMemo(() => {
        if (!isStoreAdmin || (!myStoreId && !myStoreName)) return [];
        return allOrders.filter(o => isProcessingStatus(o.status) && isOrderForMyStore(o));
    }, [allOrders, isStoreAdmin, myStoreId, myStoreName]);

    // Filter undelivered orders for store admin (keeps floating icon active until delivered)
    const storeUndeliveredOrders = useMemo(() => {
        if (!isStoreAdmin || (!myStoreId && !myStoreName)) return [];
        return allOrders.filter(o => isUndeliveredStatus(o.status) && isOrderForMyStore(o));
    }, [allOrders, isStoreAdmin, myStoreId, myStoreName]);

    // Check if store admin has an active accepted order currently in progress
    const storeHasActiveAcceptedOrder = useMemo(() => {
        if (!isStoreAdmin || (!myStoreId && !myStoreName)) return false;
        return allOrders.some(o => {
            const s = String(o.status || '').toLowerCase().trim();
            return (s === 'accepted' || s === 'out for delivery' || s === 'shipped') && isOrderForMyStore(o);
        });
    }, [allOrders, isStoreAdmin, myStoreId, myStoreName]);

    // Sync order state (active/pending) with native floating overlay
    useEffect(() => {
        if (!isNativeAndroid()) return;
        if (isDeliveryBoy) {
            const hasActive = hasActiveAcceptedOrder;
            const hasPending = processingOrders.length > 0;
            setOverlayOrdersState({ hasActive, hasPending });
        } else if (isStoreAdmin && myStore) {
            const hasActive = storeHasActiveAcceptedOrder;
            const hasPending = storeProcessingOrders.length > 0;
            setOverlayOrdersState({ hasActive, hasPending });
        }
    }, [hasActiveAcceptedOrder, processingOrders.length, storeHasActiveAcceptedOrder, storeProcessingOrders.length, isDeliveryBoy, isStoreAdmin, myStore]);

    const [isFloatingEnabled, setIsFloatingEnabled] = useState(() => {
        return localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
    });

    useEffect(() => {
        const handleFloatingToggle = () => {
            const enabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
            setIsFloatingEnabled(enabled);
            if (!enabled) {
                setIncomingOrder(null);
                setStartWithAcceptView(false);
            }
        };
        window.addEventListener('delivery:floating-toggle', handleFloatingToggle);
        return () => window.removeEventListener('delivery:floating-toggle', handleFloatingToggle);
    }, []);

    // Dismiss incoming order popup immediately if user leaves delivery routes
    useEffect(() => {
        if (!isDeliveryPage && incomingOrder) {
            setIncomingOrder(null);
            setStartWithAcceptView(false);
        }
    }, [isDeliveryPage, incomingOrder]);

    const incomingOrderRef = useRef(incomingOrder);
    useEffect(() => {
        incomingOrderRef.current = incomingOrder;
    }, [incomingOrder]);

    const isGapPauseRef = useRef(false);
    const pendingIndexRef = useRef(0);
    const [repeatTick, setRepeatTick] = useState(0);

    // Repeating popup alert for pending/processing orders (for both Store Admin and Delivery Boy)
    // 1. If Display Over Other Apps is turned OFF (or floating disabled): DO NOT show popup alert or repeating notifications!
    // 2. If there is an accepted order in progress (delivery boy has accepted, or store has accepted): DO NOT show repeat popup alerts!
    // 3. When there is NO accepted order, and there ARE pending/processing cards:
    //    Show ONE order at a time with alarm/sound and 12s timer.
    //    If skipped or timed out: wait 5s breather, then cycle to the next pending order (repeating alerts until accepted)!
    useEffect(() => {
        // If native Android and overlay permission is missing: DO NOT show popup alert
        if (isNativeAndroid() && !hasOverlayPermission) {
            if (incomingOrder) {
                stopIncomingOrderAlertSound();
                setIncomingOrder(null);
                dismissPorterOrderCard();
            }
            return;
        }

        const isFloatingEnabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
        if (!isFloatingEnabled) {
            if (incomingOrder) {
                stopIncomingOrderAlertSound();
                setIncomingOrder(null);
                dismissPorterOrderCard();
            }
            return;
        }

        const isDeliverySessionActive = localStorage.getItem('delivery_session_active') === 'true' && localStorage.getItem('delivery_boy_logged_out') !== 'true';
        const isDeliveryRole = isDeliveryBoy && isDeliverySessionActive && isDeliveryPage;
        const isStoreRole = isStoreAdmin && myStore;

        if (!isDeliveryRole && !isStoreRole) return;

        // If delivery boy has accepted order, or store has accepted order -> suppress repeat popup alerts
        const hasAccepted = isDeliveryRole ? hasActiveAcceptedOrder : storeHasActiveAcceptedOrder;
        if (hasAccepted) {
            if (incomingOrder) {
                stopIncomingOrderAlertSound();
                setIncomingOrder(null);
                dismissPorterOrderCard();
            }
            return;
        }

        if (allOrders.length === 0) return;

        // If an incoming modal is currently showing or we are in the 5s gap pause, wait
        if (incomingOrder || isGapPauseRef.current) return;

        const activePageOrderId = location.pathname.startsWith('/admin/delivery-order/')
            ? location.pathname.split('/admin/delivery-order/')[1]?.split('/')[0]?.split('?')[0]
            : null;

        // Get the relevant pending orders (one order at a time)
        const pendingList = isDeliveryRole
            ? processingOrders.filter(o => {
                const oId = String(o._id || o.id || '');
                return oId && oId !== activePageOrderId;
            })
            : storeProcessingOrders.filter(o => {
                const oId = String(o._id || o.id || '');
                return oId && oId !== activePageOrderId;
            });

        if (pendingList.length > 0) {
            const targetOrder = pendingList[pendingIndexRef.current % pendingList.length];
            setStartWithAcceptView(false);
            setIncomingOrder(targetOrder);
            triggerIncomingOrderAlert();
            try {
                playSuccessSound();
            } catch (_) {}
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
            if (isNativeAndroid()) {
                showPorterOrderCard(targetOrder);
            }
        }
    }, [
        isDeliveryBoy, 
        isStoreAdmin, 
        myStore, 
        myStoreId, 
        myStoreName, 
        isDeliveryPage,
        incomingOrder, 
        allOrders, 
        repeatTick, 
        hasActiveAcceptedOrder, 
        storeHasActiveAcceptedOrder, 
        processingOrders, 
        storeProcessingOrders, 
        hasOverlayPermission, 
        location.pathname
    ]);

    // Auto-dismiss popup immediately if the current order is accepted or cancelled
    useEffect(() => {
        if (incomingOrder) {
            const id = String(incomingOrder._id || incomingOrder.id || '');
            const currentInDb = allOrders.find(o => String(o._id || o.id || '') === id);
            if (currentInDb && !isProcessingStatus(currentInDb.status)) {
                stopIncomingOrderAlertSound();
                setIncomingOrder(null);
                dismissPorterOrderCard();
            }
        }
    }, [allOrders, incomingOrder]);

    // Also listen for real-time order status update to dismiss alert immediately
    useEffect(() => {
        const handleStatusUpdated = (e) => {
            const updated = e.detail;
            if (updated && ['accepted', 'out for delivery', 'delivered', 'cancelled'].includes(String(updated.status || '').toLowerCase())) {
                dismissPorterOrderCard();
                if (incomingOrder && (String(incomingOrder._id || incomingOrder.id) === String(updated.id))) {
                    stopIncomingOrderAlertSound();
                    setIncomingOrder(null);
                }
            }
        };
        window.addEventListener('orders:status_updated', handleStatusUpdated);
        return () => window.removeEventListener('orders:status_updated', handleStatusUpdated);
    }, [incomingOrder]);

    const handleOrderSkip = (orderToSkip) => {
        stopIncomingOrderAlertSound();
        setIncomingOrder(null);
        dismissPorterOrderCard();
        // 5s breather, then repeat alert until order is accepted or cancelled
        isGapPauseRef.current = true;
        pendingIndexRef.current += 1;
        setTimeout(() => {
            isGapPauseRef.current = false;
            setRepeatTick(prev => prev + 1);
        }, 5000);
    };

    const handleModalClose = () => {
        stopIncomingOrderAlertSound();
        setIncomingOrder(null);
        dismissPorterOrderCard();
        isGapPauseRef.current = true;
        pendingIndexRef.current += 1;
        setTimeout(() => {
            isGapPauseRef.current = false;
            setRepeatTick(prev => prev + 1);
        }, 5000);
    };

    const handleAcceptViewOpened = () => {
        // Keeps the accept view open without interruption
    };


    useEffect(() => {
        if (!incomingOrder) return;
        return registerModalBackHandler(() => {
            // Keep incoming order modal locked until user explicitly accepts or skips
        });
    }, [incomingOrder]);

    useEffect(() => {
        // Request system notification permission for delivery boys
        if (isDeliveryBoy && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
        }
    }, [isDeliveryBoy]);

    // Listen to custom orders:refresh event dispatched by SocketContext
    useEffect(() => {
        const handleOrdersRefresh = (e) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            const newOrder = e.detail;
            const isDeliverySessionActive = localStorage.getItem('delivery_session_active') === 'true' && localStorage.getItem('delivery_boy_logged_out') !== 'true';
            const isFloatingEnabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';

            const canDeliveryAlert = isDeliveryBoy && isDeliveryPage && isDeliverySessionActive && isFloatingEnabled;
            const canStoreAlert = isStoreAdmin && myStore && isFloatingEnabled;

            if (newOrder && (canDeliveryAlert || canStoreAlert)) {
                // For store admin: strictly check if this new order belongs to their store!
                if (!canDeliveryAlert && canStoreAlert && !isOrderForMyStore(newOrder)) {
                    return;
                }

                const oId = String(newOrder._id || newOrder.id || '');
                const activePageOrderId = location.pathname.startsWith('/admin/delivery-order/')
                    ? location.pathname.split('/admin/delivery-order/')[1]?.split('/')[0]?.split('?')[0]
                    : null;
                if (activePageOrderId && oId === activePageOrderId) {
                    return;
                }
                const hasAccepted = canDeliveryAlert ? hasActiveAcceptedOrder : storeHasActiveAcceptedOrder;
                const isPermissionOk = !isNativeAndroid() || hasOverlayPermission;

                if (oId && !skippedOrderIds.has(oId) && isProcessingStatus(newOrder.status)) {
                    knownOrderIdsRef.current.add(oId);
                    if (!hasAccepted && isPermissionOk && !incomingOrder && !isGapPauseRef.current) {
                        setStartWithAcceptView(false);
                        setIncomingOrder(newOrder);
                        triggerIncomingOrderAlert();
                        try {
                            playSuccessSound();
                        } catch (_) {}
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([200, 100, 200]);
                        }
                        if (isNativeAndroid()) {
                            showPorterOrderCard(newOrder);
                        }
                    } else {
                        try {
                            playSuccessSound();
                        } catch (_) {}
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([100, 50, 100]);
                        }
                    }
                }
            }
        };

        window.addEventListener('orders:refresh', handleOrdersRefresh);
        return () => window.removeEventListener('orders:refresh', handleOrdersRefresh);
    }, [isDeliveryBoy, isStoreAdmin, myStore, myStoreId, myStoreName, isDeliveryPage, skippedOrderIds, hasActiveAcceptedOrder, storeHasActiveAcceptedOrder, hasOverlayPermission, incomingOrder, queryClient, location.pathname]);

    // Listen for native intent/card clicks when app was closed/backgrounded
    useEffect(() => {
        const openOrderById = async (orderId) => {
            if (!orderId) return;
            const isDeliverySessionActive = localStorage.getItem('delivery_session_active') === 'true' && localStorage.getItem('delivery_boy_logged_out') !== 'true';
            const isStoreOnly = isStoreAdmin && !isDeliveryBoy;
            if (!isDeliverySessionActive && !isStoreOnly) {
                // User did not go to delivery panel; strictly prevent auto-opening delivery order page
                return;
            }
            try {
                // Navigate directly to the new DeliveryActiveOrder page
                setIncomingOrder(null);
                setStartWithAcceptView(false);
                let orderData = allOrders.find(o => (o._id || o.id) === orderId);
                if (!orderData) {
                    const res = await apiService.getOrder(orderId);
                    if (res?.success && res?.data) {
                        orderData = res.data;
                    }
                }
                localStorage.setItem('active_delivery_order_id', orderId);
                localStorage.setItem('active_delivery_stay', 'true');
                if (isStoreOnly) {
                    navigate(`/my-store?tab=orders&orderId=${orderId}`, { state: { order: orderData } });
                } else {
                    navigate(`/admin/delivery-order/${orderId}`, { state: { order: orderData } });
                }
            } catch (err) {
                console.warn('Failed to fetch order from native event:', err);
                setIncomingOrder(null);
                setStartWithAcceptView(false);
                navigate(`/admin/delivery-order/${orderId}`);
            }
        };

        const handleNativeOpenOrder = (e) => {
            const orderId = e.detail?.id || window.__pendingNativeOrderId;
            if (orderId) {
                openOrderById(orderId);
            }
        };

        window.addEventListener('native:open-order', handleNativeOpenOrder);

        // Process immediately if native intent set pending order before React mounted
        if (window.__pendingNativeOrderId) {
            openOrderById(window.__pendingNativeOrderId);
            window.__pendingNativeOrderId = null;
        }

        return () => window.removeEventListener('native:open-order', handleNativeOpenOrder);
    }, [allOrders]);

    useEffect(() => {
        // Allows testing the Porter-style incoming order modal
        const handleTestIncomingOrder = (e) => {
            if (!isDeliveryBoy) return;
            const testOrder = e.detail || {
                _id: '672000000000000000a0e25d',
                shippingAddress: {
                    name: 'Hasan',
                    mobile: '9500171980',
                    street: 'Vijayan Street',
                    city: 'Ilayangudi',
                    location: '9.6456,78.6321',
                    deliveryTime: '10 AM - 11 AM'
                },
                items: [
                    { 
                        name: 'Aachi Pepper Powder (ஆச்சி மிளகுத் தூள் 50g)', 
                        quantity: 1, 
                        price: 35,
                        storeName: 'Ilayangudi Maligai Store',
                        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=120'
                    },
                    { 
                        name: 'Aavin Fresh Milk (500ml)', 
                        quantity: 2, 
                        price: 30,
                        storeName: 'A1 Milk Depot',
                        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=120'
                    },
                    { 
                        name: 'Aashirvaad Whole Wheat Atta (5kg)', 
                        quantity: 1, 
                        price: 260,
                        storeName: 'City Supermarket',
                        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=120'
                    },
                    { 
                        name: 'Pure White Sugar (1kg)', 
                        quantity: 1, 
                        price: 60,
                        storeName: 'City Supermarket',
                        image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=120'
                    }
                ],
                total: 415,
                subtotal: 385,
                shipping: 30,
                paymentMethod: { type: 'Cash on Delivery' },
                deliveryTime: '10 AM - 11 AM',
                createdAt: new Date().toISOString()
            };
            setIncomingOrder(testOrder);
            triggerIncomingOrderAlert();

            // Show native OS notification test
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    const notif = new Notification('🚨 New Order Alert! #A0BC8A - ₹320', {
                        body: 'Mohamed placed an order. Tap to Accept!',
                        icon: '/favicon.ico',
                        tag: 'test-order'
                    });
                    notif.onclick = () => {
                        window.focus();
                        setIncomingOrder(testOrder);
            triggerIncomingOrderAlert();
                    };
                } catch (err) {}
            }
        };

        window.addEventListener('test-incoming-order', handleTestIncomingOrder);
        return () => window.removeEventListener('test-incoming-order', handleTestIncomingOrder);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdated = (order) => {
            // Only show notification to the user who owns the order
            if (user && order.user === user._id) {
                // Play distinct sound based on order status
                const st = String(order.status || '').toLowerCase();
                if (st === 'out for delivery' || st === 'shipped' || st.includes('accept') || st.includes('processing') || st.includes('confirmed')) {
                    playOrderAcceptedSound();
                } else if (st.includes('deliver') || st.includes('completed')) {
                    playOrderDeliveredSound();
                } else if (st.includes('cancel')) {
                    playOrderCancelledSound();
                } else {
                    playSuccessSound();
                }

                addNotification({
                    id: Date.now(),
                    type: 'order_status',
                    title: t('Order Status Update'),
                    message: `${t('Order')} #${order._id.slice(-6)} ${t('is now')} ${t(order.status)}`,
                    icon: order.status === 'Out for Delivery' ? <Truck className="text-blue-500" /> : <Package className="text-green-500" />,
                    onClick: () => navigate(`/orders/${order._id}`)
                });
            }
        };

        const handleOrderCreated = (order) => {
            // Strictly only for Delivery Boys, NOT for customers or other roles
            if (!isDeliveryBoy) return;
            const oId = String(order?._id || order?.id || '');
            if (!oId || skippedOrderIds.has(oId) || knownOrderIdsRef.current.has(oId)) return;

            const activePageOrderId = location.pathname.startsWith('/admin/delivery-order/')
                ? location.pathname.split('/admin/delivery-order/')[1]?.split('/')[0]?.split('?')[0]
                : null;
            if (activePageOrderId && oId === activePageOrderId) return;

            knownOrderIdsRef.current.add(oId);

            // Invalidate orders cache so new order list card immediately appears in the Delivery Panel screen
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            // Inside the app, do NOT show popup alert over the screen for delivery boy
            // Soft chime sound so delivery boy knows a card appeared in the panel
            playSuccessSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            // Only show OS desktop/mobile push notification if the app is minimized/hidden in background
            if (typeof document !== 'undefined' && document.hidden && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    const orderIdShort = String(order._id || order.id || '000').slice(-6).toUpperCase();
                    const notif = new Notification(`🚨 New Delivery Order #${orderIdShort} - ₹${order.total || order.subtotal || 0}`, {
                        body: `Pickup: ${order.items?.[0]?.storeName || 'Store'} → Drop: ${order.shippingAddress?.street || 'Customer'}`,
                        icon: '/floating-logo.jpg',
                        tag: `delivery-${order._id}`
                    });
                    notif.onclick = () => {
                        window.focus();
                        navigate('/admin');
                    };
                } catch (err) {
                    console.warn('System notification error:', err);
                }
            }
        };

        socket.on('order:updated', handleOrderUpdated);
        socket.on('order:created', handleOrderCreated);

        return () => {
            socket.off('order:updated', handleOrderUpdated);
            socket.off('order:created', handleOrderCreated);
        };
    }, [socket, user, isDeliveryBoy, isDeliveryPage, skippedOrderIds, t, navigate, queryClient, location.pathname]);

    const addNotification = (notif) => {
        setNotifications(prev => [...prev, notif]);
        setTimeout(() => {
            removeNotification(notif.id);
        }, 2500);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <>
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4 pointer-events-none">
                <AnimatePresence>
                    {notifications.map((notif) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => {
                                notif.onClick();
                                removeNotification(notif.id);
                            }}
                            className="mb-3 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 pointer-events-auto cursor-pointer flex items-center gap-4 relative overflow-hidden group active:scale-[0.98] transition-transform"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                {notif.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{notif.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{notif.message}</p>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notif.id);
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <div className="absolute bottom-0 left-0 h-1 bg-[#2E5A2E] dark:bg-[#CBF9B2] animate-progress" style={{ animationDuration: '5000ms' }} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
};

export default NotificationOverlay;

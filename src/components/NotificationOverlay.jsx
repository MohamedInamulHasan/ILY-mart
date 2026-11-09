import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Bell, CheckCircle, Truck, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders } from '../hooks/queries/useOrders';
import IncomingOrderModal from './IncomingOrderModal';
import { playSuccessSound, playOrderPlacedSound, playOrderAcceptedSound, playOrderDeliveredSound, playOrderCancelledSound } from '../utils/soundHelper';
import { triggerIncomingOrderAlert, showPorterOrderCard, dismissPorterOrderCard } from '../utils/floatingOverlay';
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
        return location.pathname.startsWith('/admin');
    }, [location.pathname]);

    const roles = useMemo(() => getUserRoles(user), [user]);
    const isDeliveryBoy = useMemo(() => {
        return roles.includes('delivery_boy') || roles.includes('deliveryboy');
    }, [roles]);
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

    // Dismiss incoming order popup immediately if user leaves delivery routes (e.g. goes to home or orders)
    useEffect(() => {
        if (!isDeliveryPage && incomingOrder) {
            setIncomingOrder(null);
            setStartWithAcceptView(false);
        }
    }, [isDeliveryPage, incomingOrder]);

    // Only alert for NEW orders placed in real-time while in the app!
    // Do NOT alert for existing/old processing orders when opening the panel.
    useEffect(() => {
        if (!isDeliveryBoy || !isDeliveryPage) return;
        if (allOrders.length === 0) return;

        // On first load of orders, record all existing order IDs as known so we never alert old past orders
        if (!initialOrdersLoadedRef.current) {
            allOrders.forEach(o => {
                const oId = String(o._id || o.id || '');
                if (oId) knownOrderIdsRef.current.add(oId);
            });
            initialOrdersLoadedRef.current = true;
            return;
        }

        // If an incoming order modal is currently showing, wait until user explicitly accepts or skips
        if (incomingOrder) return;

        // Check if any brand new processing order was placed during this active session
        const newRealtimeOrder = allOrders.find(o => {
            const oId = String(o._id || o.id || '');
            if (!oId) return false;
            if (knownOrderIdsRef.current.has(oId)) return false;
            if (skippedOrderIds.has(oId)) return false;
            if (!isProcessingStatus(o.status)) return false;

            const orderTime = new Date(o.createdAt || o.date || o.timestamp || 0).getTime();
            // Must have been created around or after this session mounted (not an old order)
            return orderTime >= (sessionStartRef.current - 30000);
        });

        if (newRealtimeOrder) {
            const oId = String(newRealtimeOrder._id || newRealtimeOrder.id || '');
            knownOrderIdsRef.current.add(oId);
            setStartWithAcceptView(false);
            setIncomingOrder(newRealtimeOrder);
            triggerIncomingOrderAlert();
        }
    }, [isDeliveryBoy, isDeliveryPage, incomingOrder, allOrders, skippedOrderIds]);

    // Auto-dismiss popup if the current order is accepted or cancelled
    useEffect(() => {
        if (incomingOrder) {
            const id = String(incomingOrder._id || incomingOrder.id || '');
            const currentInDb = allOrders.find(o => String(o._id || o.id || '') === id);
            if (currentInDb && !isProcessingStatus(currentInDb.status)) {
                setIncomingOrder(null);
            }
        }
    }, [allOrders, incomingOrder]);

    const handleOrderSkip = (orderToSkip) => {
        const currentId = String((orderToSkip?._id || orderToSkip?.id) || (incomingOrder ? (incomingOrder._id || incomingOrder.id) : ''));
        if (currentId) {
            setSkippedOrderIds(prev => new Set([...prev, currentId]));
            knownOrderIdsRef.current.add(currentId);
        }
        // Mark all currently present orders as known so skipping NEVER cascades to older orders
        allOrders.forEach(o => {
            const oId = String(o._id || o.id || '');
            if (oId) knownOrderIdsRef.current.add(oId);
        });
        setIncomingOrder(null);
    };

    const handleModalClose = () => {
        const currentId = incomingOrder ? String(incomingOrder._id || incomingOrder.id || '') : '';
        if (currentId) {
            setSkippedOrderIds(prev => new Set([...prev, currentId]));
            knownOrderIdsRef.current.add(currentId);
        }
        allOrders.forEach(o => {
            const oId = String(o._id || o.id || '');
            if (oId) knownOrderIdsRef.current.add(oId);
        });
        setIncomingOrder(null);
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
            if (newOrder && isDeliveryBoy) {
                const oId = String(newOrder._id || newOrder.id || '');
                if (oId && !skippedOrderIds.has(oId) && !knownOrderIdsRef.current.has(oId) && isProcessingStatus(newOrder.status)) {
                    knownOrderIdsRef.current.add(oId);
                    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/delivery-order')) {
                        return;
                    }
                    setStartWithAcceptView(false);
                    setIncomingOrder(newOrder);
                    triggerIncomingOrderAlert();
                }
            }
        };

        window.addEventListener('orders:refresh', handleOrdersRefresh);
        return () => window.removeEventListener('orders:refresh', handleOrdersRefresh);
    }, [isDeliveryBoy, skippedOrderIds, queryClient]);

    // Listen for native intent/card clicks when app was closed/backgrounded
    useEffect(() => {
        const openOrderById = async (orderId) => {
            if (!orderId) return;
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
                navigate(`/admin/delivery-order/${orderId}`, { state: { order: orderData } });
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
            knownOrderIdsRef.current.add(oId);

            // Invalidate orders cache so new order list card immediately appears in the Delivery Panel screen
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            // Strictly ONLY show popup in delivery panel, orders list, and accept / delivery order page
            // Do NOT show in home, orders, profile, or other customer pages
            if (!isDeliveryPage) {
                return;
            }

            // Pop up the new incoming order card modal for the delivery boy and trigger alert
            setStartWithAcceptView(false);
            setIncomingOrder(order);
            triggerIncomingOrderAlert();

            // Play notification chime and vibrate to notify the delivery boy without disrupting their screen
            playSuccessSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
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
    }, [socket, user, isDeliveryBoy, isDeliveryPage, hasActiveAcceptedOrder, skippedOrderIds, t, navigate, queryClient]);

    const addNotification = (notif) => {
        setNotifications(prev => [...prev, notif]);
        setTimeout(() => {
            removeNotification(notif.id);
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <>
            {isDeliveryBoy && isDeliveryPage && incomingOrder && (
                <IncomingOrderModal
                    key={incomingOrder._id || incomingOrder.id}
                    order={incomingOrder}
                    startWithViewCard={!startWithAcceptView}
                    onAccepted={(acceptedOrder) => {
                        const currentId = String((acceptedOrder?._id || acceptedOrder?.id) || '');
                        if (currentId) {
                            knownOrderIdsRef.current.add(currentId);
                        }
                        allOrders.forEach(o => {
                            const oId = String(o._id || o.id || '');
                            if (oId) knownOrderIdsRef.current.add(oId);
                        });
                        setStartWithAcceptView(false);
                        setIncomingOrder(null);
                        queryClient.invalidateQueries({ queryKey: ['orders'] });
                    }}
                    onClose={() => {
                        setStartWithAcceptView(false);
                        handleModalClose();
                    }}
                    onSkip={(skippedOrder) => {
                        setStartWithAcceptView(false);
                        handleOrderSkip(skippedOrder);
                    }}
                    onAcceptViewOpened={handleAcceptViewOpened}
                />
            )}

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

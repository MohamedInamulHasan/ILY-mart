import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Bell, CheckCircle, Truck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders } from '../hooks/queries/useOrders';
import IncomingOrderModal from './IncomingOrderModal';
import { playSuccessSound, playOrderPlacedSound, playOrderAcceptedSound, playOrderDeliveredSound, playOrderCancelledSound } from '../utils/soundHelper';
import { triggerIncomingOrderAlert, showPorterOrderCard, dismissPorterOrderCard } from '../utils/floatingOverlay';
import { apiService } from '../utils/api';
import { registerModalBackHandler } from '../utils/useBackButton';

const NotificationOverlay = () => {
    const { socket } = useSocket();
    const { t } = useLanguage();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState([]);
    const [incomingOrder, setIncomingOrder] = useState(null);
    const [startWithAcceptView, setStartWithAcceptView] = useState(false);
    const navigate = useNavigate();

    const roles = Array.isArray(user?.role) ? user.role : [user?.role];
    const isDeliveryBoy = roles.some(r => {
        const normalized = String(r || '').toLowerCase().trim();
        return normalized === 'delivery_boy' || normalized === 'deliveryboy';
    });
    const isAdmin = roles.some(r => String(r || '').toLowerCase().trim() === 'admin');

    const { data: rawOrders = [] } = useOrders();
    const allOrders = useMemo(() => {
        return Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
    }, [rawOrders]);

    // Auto-dismiss in-app modal if the order is no longer pending/processing (e.g. taken by another driver or cancelled)
    useEffect(() => {
        if (!incomingOrder) return;
        const currentInList = allOrders.find(o => (o._id || o.id) === (incomingOrder._id || incomingOrder.id));
        if (currentInList) {
            const s = String(currentInList.status || '').toLowerCase().trim();
            if (s !== 'pending' && s !== 'processing' && s !== 'order placed' && s !== 'confirmed') {
                setIncomingOrder(null);
            }
        }
    }, [allOrders, incomingOrder]);

    const handleOrderSkip = () => {
        setIncomingOrder(null);
    };

    const handleModalClose = () => {
        setIncomingOrder(null);
    };

    const handleAcceptViewOpened = () => {
        // Keeps the accept view open without interruption
    };


    useEffect(() => {
        if (!incomingOrder) return;
        return registerModalBackHandler(() => setIncomingOrder(null));
    }, [incomingOrder]);

    useEffect(() => {
        // Request system notification permission for delivery boys
        if (isDeliveryBoy && typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
        }
    }, [isDeliveryBoy]);

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

            // Invalidate orders cache so new order list card immediately appears in the Delivery Panel screen
            queryClient.invalidateQueries({ queryKey: ['orders'] });

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
    }, [socket, user, isDeliveryBoy, t, navigate, queryClient]);

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
            {isDeliveryBoy && incomingOrder && (
                <IncomingOrderModal
                    key={incomingOrder._id || incomingOrder.id}
                    order={incomingOrder}
                    startWithViewCard={!startWithAcceptView}
                    onClose={() => {
                        setStartWithAcceptView(false);
                        handleModalClose();
                    }}
                    onSkip={() => {
                        setStartWithAcceptView(false);
                        handleOrderSkip();
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

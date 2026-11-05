import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Clock, 
    MapPin, 
    Phone, 
    Navigation, 
    Package, 
    CreditCard, 
    CheckCircle, 
    LogOut, 
    ArrowLeft,
    AlertCircle,
    XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders, useUpdateOrderStatus } from '../../hooks/queries/useOrders';
import { useStores } from '../../hooks/queries/useStores';
import { apiService, API_BASE_URL } from '../../utils/api';
import { renderBilingualTitle } from '../../utils/titleHelpers';
import { getStoreName } from '../../utils/storeHelpers';
import { formatOrderBannerTime, formatOrderDateTime } from '../../utils/dateUtils';
import { CartoonCoin } from '../../components/CartoonCoin';
import SwipeActionButton from '../../components/SwipeActionButton';
import DeliveryStatusPopup from '../../components/DeliveryStatusPopup';
import { useDriverLocation, optimizeDeliveryRoute } from '../../utils/deliveryRouteHelper';
import DeliveryRouteTimeline from '../../components/DeliveryRouteTimeline';
import { playSuccessSound } from '../../utils/soundHelper';
import { isNativeAndroid, setOverlayHasAcceptedOrder, hideFloatingOverlay } from '../../utils/floatingOverlay';


const DeliveryActiveOrder = () => {
    const { id: paramId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { driverCoords, isDetecting: isDetectingGps, refreshLocation } = useDriverLocation();

    const { data: orders = [], isLoading: ordersLoading } = useOrders();
    const { data: stores = [] } = useStores();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();

    const stateOrder = location.state?.order;
    const initialStatus = location.state?.status || stateOrder?.status || null;

    const [singleOrder, setSingleOrder] = useState(stateOrder || null);
    const [localStatus, setLocalStatus] = useState(initialStatus);
    const [fetchingSingle, setFetchingSingle] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

    // Popup state: 'accepted' | 'delivered' | 'cancelled' | null
    
    const isAcceptedOrder = useMemo(() => {
        const curStatus = localStatus || singleOrder?.status;
        return ['Accepted', 'Out for Delivery', 'Shipped'].includes(curStatus);
    }, [localStatus, singleOrder?.status]);

    useEffect(() => {
        if (!isNativeAndroid()) return;
        setOverlayHasAcceptedOrder(isAcceptedOrder);
        if (!isAcceptedOrder) {
            hideFloatingOverlay();
        }
    }, [isAcceptedOrder]);

    const [popupState, setPopupState] = useState({
        isOpen: false,
        type: 'accepted',
        title: '',
        subtitle: '',
        duration: 900
    });

    // Resolve order ID: from URL params, state, or from localStorage
    const activeOrderId = paramId || stateOrder?._id || stateOrder?.id || localStorage.getItem('active_delivery_order_id');

    // Find order in React Query cache
    const cachedOrder = useMemo(() => {
        if (!activeOrderId) return null;
        return orders.find(o => String(o._id || o.id) === String(activeOrderId));
    }, [orders, activeOrderId]);

    // Active order priority: singleOrder (has fresh state) || stateOrder || cachedOrder
    const order = singleOrder || stateOrder || cachedOrder;

    // Persist this active order ID and stay flag in localStorage while here
    useEffect(() => {
        if (activeOrderId) {
            localStorage.setItem('active_delivery_order_id', activeOrderId);
            localStorage.setItem('active_delivery_stay', 'true');
        }
    }, [activeOrderId]);

    // Fetch order directly if not present in cache
    useEffect(() => {
        if (!order && activeOrderId && !ordersLoading) {
            setFetchingSingle(true);
            apiService.getOrder(activeOrderId)
                .then(res => {
                    if (res && res.success && res.data) {
                        setSingleOrder(res.data);
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch active delivery order:', err);
                })
                .finally(() => {
                    setFetchingSingle(false);
                });
        }
    }, [order, activeOrderId, ordersLoading]);

    // Format fields
    const orderIdShort = String(order?._id || order?.id || activeOrderId || '000000').slice(-6).toUpperCase();
    const orderDateFormatted = formatOrderBannerTime(order?.createdAt || order?.date) || formatOrderDateTime(order?.createdAt) || t('Active Order');

    const status = localStatus || order?.status || 'Processing';
    const isOutForDelivery = ['Out for Delivery', 'Shipped'].includes(status);
    const isProcessing = ['Processing', 'Pending', 'Order Placed'].includes(status);
    const isDelivered = ['Delivered', 'Completed'].includes(status);
    const isCancelled = status === 'Cancelled';

    const customerName = order?.shippingAddress?.name || order?.customerName || order?.user?.name || t('Customer');
    const customerPhone = order?.shippingAddress?.mobile || order?.customerPhone || order?.user?.phone || '';
    const street = order?.shippingAddress?.street || order?.shippingAddress?.address || '';
    const city = order?.shippingAddress?.city || '';
    const zip = order?.shippingAddress?.zip || '';

    const dropMapsUrl = useMemo(() => {
        const location = order?.shippingAddress?.location;
        if (!location) {
            if (!street && !city) return null;
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${street}, ${city}`)}`;
        }
        const trimmed = String(location).trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmed)}`;
    }, [order?.shippingAddress]);

    const scheduledTimeDisplay = useMemo(() => {
        if (order?.deliverySlot?.time) {
            const dateStr = order.deliverySlot.date ? `${order.deliverySlot.date} ` : '';
            return `${dateStr}${order.deliverySlot.time}`;
        }
        if (order?.scheduledDelivery) return String(order.scheduledDelivery);
        return null;
    }, [order?.deliverySlot, order?.scheduledDelivery]);

    const items = order?.items || [];

    // Calculate shortest path route from Driver -> Stores -> Customer
    const optimizedRoute = useMemo(() => {
        return optimizeDeliveryRoute(driverCoords, order, stores);
    }, [driverCoords, order, stores]);

    // Sort items according to optimal store sequence
    const sortedItems = useMemo(() => {
        if (!optimizedRoute?.sortedStores?.length) return items;
        const storeOrderMap = new Map();
        optimizedRoute.sortedStores.forEach((s, idx) => storeOrderMap.set(String(s.id), idx));
        return [...items].sort((a, b) => {
            const sidA = String(a.storeId?._id || a.storeId || '');
            const sidB = String(b.storeId?._id || b.storeId || '');
            const orderA = storeOrderMap.has(sidA) ? storeOrderMap.get(sidA) : 999;
            const orderB = storeOrderMap.has(sidB) ? storeOrderMap.get(sidB) : 999;
            return orderA - orderB;
        });
    }, [items, optimizedRoute?.sortedStores]);
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const deliveryCharge = Number(order?.deliveryCharge ?? 30);
    const totalAmount = order?.totalAmount ?? (subtotal + (deliveryCharge > 0 ? deliveryCharge : 0));

    const getItemImage = (item) => {
        const img = item.image || item.product?.image;
        if (img) {
            if (img.startsWith('http') || img.startsWith('blob:') || img.startsWith('data:')) return img;
            const cleanPath = img.startsWith('/') ? img : `/${img}`;
            return `${API_BASE_URL}${cleanPath}`;
        }
        return 'https://via.placeholder.com/150?text=Product';
    };

    const getItemStoreName = (item) => {
        if (item.storeName) return item.storeName;
        if (item.storeId) {
            const found = getStoreName(item.storeId, stores);
            if (found && found !== 'Unknown Store') return found;
        }
        if (item.storeId?.name) return item.storeId.name;
        if (order?.storeName) return order.storeName;
        return t('Ilayangudi Store');
    };

    const getItemStoreLocation = (item) => {
        if (item.storeLocation) return item.storeLocation;
        const sid = String(item.storeId?._id || item.storeId || item.store?._id || item.store?.id || '');
        const sName = (item.storeName || item.storeId?.name || '').trim().toLowerCase();
        const found = stores.find(s => 
            (sid && String(s._id || s.id) === sid) ||
            (sName && s.name && s.name.trim().toLowerCase() === sName)
        );
        if (found?.location) return found.location;
        if (item.storeId?.location) return item.storeId.location;
        const name = found?.name || item.storeName || item.storeId?.name;
        if (name) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', Ilayangudi')}`;
        }
        return null;
    };

    // When Leave button is clicked: set stay to false and go to delivery dashboard
    const handleLeave = () => {
        localStorage.setItem('active_delivery_stay', 'false');
        navigate('/admin');
    };

    // 1. Accept order: saves to backend first, then updates card to Out for Delivery mode + celebratory popup
    const handleAccept = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        const id = order?._id || order?.id || activeOrderId;
        if (!id) {
            setIsActionLoading(false);
            return;
        }

        try {
            // Persist to backend MongoDB via API
            const res = await updateOrderStatus({
                id,
                status: 'Out for Delivery',
                deliveredBy: user?._id
            });

            const updatedOrder = res?.data || res || { ...order, status: 'Out for Delivery' };

            localStorage.setItem('active_delivery_order_id', id);
            localStorage.setItem('active_delivery_stay', 'true');

            // Update local states with confirmed backend status
            setLocalStatus('Out for Delivery');
            setSingleOrder(prev => ({ ...(prev || {}), ...updatedOrder, status: 'Out for Delivery' }));

            // Trigger blue flower celebration popup
            setPopupState({
                isOpen: true,
                type: 'accepted',
                title: t('Order Accepted!'),
                subtitle: t('Order is ready for delivery'),
                duration: 900
            });
        } catch (error) {
            console.error('Failed to accept order:', error);
            const errMsg = error?.response?.data?.message || error?.message || t('Failed to accept order. Please try again.');
            alert(errMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    // 2. Deliver order: saves to backend first, plays sound, triggers green flower popup, then safely returns to /admin
    const handleDeliver = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        const id = order?._id || order?.id || activeOrderId;
        if (!id) {
            setIsActionLoading(false);
            return;
        }

        try {
            // Persist to backend MongoDB via API
            const res = await updateOrderStatus({
                id,
                status: 'Delivered',
                deliveredBy: user?._id
            });

            const updatedOrder = res?.data || res || { ...order, status: 'Delivered' };

            playSuccessSound();
            setLocalStatus('Delivered');
            setSingleOrder(prev => ({ ...(prev || {}), ...updatedOrder, status: 'Delivered' }));

            // Clean active order from storage immediately
            localStorage.removeItem('active_delivery_order_id');
            localStorage.removeItem('active_delivery_stay');

            // Trigger real green flower popup
            setPopupState({
                isOpen: true,
                type: 'delivered',
                title: t('Delivered Successfully!'),
                subtitle: t('Order has been delivered'),
                duration: 1200
            });
        } catch (error) {
            console.error('Failed to mark order as delivered:', error);
            const errMsg = error?.response?.data?.message || error?.message || t('Failed to complete delivery. Please try again.');
            alert(errMsg);
        } finally {
            setIsActionLoading(false);
        }
    };

    // 3. Cancel order: saves to backend first, triggers red flower popup, then returns to /admin
    const handleCancelOrder = async () => {
        if (isCancelling) return;
        setIsCancelling(true);
        const id = order?._id || order?.id || activeOrderId;
        setShowCancelConfirmModal(false);
        if (!id) {
            setIsCancelling(false);
            return;
        }

        try {
            // Persist to backend MongoDB via API
            const res = await updateOrderStatus({ id, status: 'Cancelled' });
            const updatedOrder = res?.data || res || { ...order, status: 'Cancelled' };

            setLocalStatus('Cancelled');
            setSingleOrder(prev => ({ ...(prev || {}), ...updatedOrder, status: 'Cancelled' }));

            localStorage.removeItem('active_delivery_order_id');
            localStorage.removeItem('active_delivery_stay');

            // Trigger red flower popup
            setPopupState({
                isOpen: true,
                type: 'cancelled',
                title: t('Order Cancelled'),
                subtitle: t('Order has been cancelled'),
                duration: 1200
            });
        } catch (error) {
            console.error('Failed to cancel order:', error);
            const errMsg = error?.response?.data?.message || error?.message || t('Failed to cancel order. Please try again.');
            alert(errMsg);
        } finally {
            setIsCancelling(false);
        }
    };

    // Handle popup completion
    const handlePopupComplete = () => {
        const completedType = popupState.type;
        setPopupState(prev => ({ ...prev, isOpen: false }));
        if (completedType === 'delivered' || completedType === 'cancelled') {
            localStorage.removeItem('active_delivery_order_id');
            localStorage.removeItem('active_delivery_stay');
            navigate('/admin', { replace: true });
        }
    };

    // Loading Skeleton
    if (!order && (ordersLoading || fetchingSingle)) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-12">
                {/* Header Skeleton */}
                <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3 shadow-xs">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div className="h-6 w-36 rounded-md blinkit-shimmer" />
                        <div className="h-9 w-20 rounded-xl blinkit-shimmer" />
                    </div>
                </div>
                <div className="pt-20 px-4 max-w-3xl mx-auto space-y-3">
                    <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl blinkit-shimmer" />
                    <div className="h-48 bg-white dark:bg-gray-800 rounded-2xl blinkit-shimmer" />
                    <div className="h-36 bg-white dark:bg-gray-800 rounded-2xl blinkit-shimmer" />
                </div>
            </div>
        );
    }

    // Not found state
    if (!order) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 flex flex-col items-center justify-center p-4">
                <AlertCircle size={48} className="text-gray-400 mb-3" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('No Active Order Found')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-xs">
                    {t('There is no active delivery order selected.')}
                </p>
                <button
                    onClick={handleLeave}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white font-bold text-sm shadow-md active:scale-95 transition-transform"
                >
                    <ArrowLeft size={16} />
                    <span>{t('Back to Delivery Panel')}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative select-none">
            {/* Popups (Blue flower on accept, Green flower on delivered, Red flower on cancel) */}
            <DeliveryStatusPopup
                isOpen={popupState.isOpen}
                type={popupState.type}
                title={popupState.title}
                subtitle={popupState.subtitle}
                onComplete={handlePopupComplete}
                duration={popupState.duration || 800}
            />

            {/* POPUP: Swipe to Cancel Confirmation */}
            <AnimatePresence>
                {showCancelConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCancelConfirmModal(false)}
                        className="fixed inset-0 z-[110000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-[2.2rem] max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-3"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('Cancel Order')} #{orderIdShort}?
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {t('Are you sure you want to cancel this order?')}
                                </p>
                            </div>

                            {/* Customer snippet in confirmation */}
                            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3 text-xs text-gray-700 dark:text-gray-200 text-left">
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                    {customerName}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {street}{city ? `, ${city}` : ''}
                                </p>
                            </div>

                            {/* RED Swipe to Cancel Confirmation Button */}
                            <div className="pt-2">
                                <SwipeActionButton
                                    variant="red"
                                    label={t('Swipe to Cancel')}
                                    loadingLabel={t('Cancelling...')}
                                    isLoading={isCancelling}
                                    heightClass="h-[60px] sm:h-[64px]"
                                    knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                    onSuccess={handleCancelOrder}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCancelConfirmModal(false)}
                                className="w-full mt-2 py-1 text-center text-xs font-bold text-gray-400 hover:text-gray-600 dark:text-gray-500 uppercase tracking-wider"
                            >
                                {t('Keep Order')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER: Big & Bold Date/Time on left, Red LEAVE button on right (NO Delivery Panel title) */}
            <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3 shadow-xs shrink-0">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 min-h-[42px]">
                    {/* Left: Big & Bold Date and Time */}
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white min-w-0">
                        <Clock size={20} className="text-gray-700 dark:text-gray-200 stroke-[2.5] shrink-0" />
                        <span className="text-[17px] sm:text-[19px] font-black text-gray-900 dark:text-white tracking-tight truncate">
                            {orderDateFormatted}
                        </span>
                    </div>

                    {/* Right: Red LEAVE button without shine */}
                    <button
                        type="button"
                        onClick={handleLeave}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-transform shadow-md select-none border border-red-700 shrink-0"
                    >
                        <LogOut size={14} className="stroke-[2.5] text-white" />
                        <span>{t('Leave')}</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area: (Order ID banner & Accepted tag REMOVED completely) */}
            <main className={`pt-[84px] sm:pt-[90px] px-3.5 sm:px-4 max-w-3xl mx-auto space-y-3 sm:space-y-3.5 ${isProcessing ? 'pb-52 sm:pb-56' : 'pb-36 sm:pb-40'}`}>
                {/* CARD 1: Shipping Details Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                <MapPin size={18} />
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Shipping details')}</h3>
                        </div>
                        {customerPhone && (
                            <a
                                href={`tel:${customerPhone}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-black text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-transform shadow-md select-none border border-black/80"
                            >
                                <Phone size={14} className="stroke-[2.5] text-white" />
                                <span>{t('Call')}</span>
                            </a>
                        )}
                    </div>
                    <div className="p-3.5 sm:p-4">
                        <div className="pl-2 sm:pl-3 space-y-1">
                            {/* 1. Name */}
                            <p className="font-bold text-[16px] text-gray-900 dark:text-white">
                                {customerName}
                            </p>

                            {/* 2. Number */}
                            {customerPhone && (
                                <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                                    {customerPhone}
                                </p>
                            )}

                            {/* 3. Address */}
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                {street}{city ? `, ${city}` : ''}{zip ? ` - ${zip}` : ''}
                            </p>

                            {/* 4. Pin / View on Map - Shining Card with Map SVG */}
                            {dropMapsUrl && (
                                <div className="pt-2">
                                    <a
                                        href={dropMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative overflow-hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2E5A2E] hover:bg-[#234623] text-white text-[12px] font-bold active:scale-95 transition-transform shadow-sm select-none border border-[#234623]"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
                                            animate={{ x: ['-100%', '150%'] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                        />
                                        <svg 
                                            viewBox="0 0 24 24" 
                                            width="16" 
                                            height="16" 
                                            fill="currentColor" 
                                            className="relative z-10 text-white shrink-0"
                                        >
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                        <span className="relative z-10 font-bold">{t('View on Map')}</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* 5. Scheduled Delivery Time */}
                        {scheduledTimeDisplay && !String(scheduledTimeDisplay).toLowerCase().includes('instant') && (
                            <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700 pl-2 sm:pl-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t('Scheduled Delivery')}</p>
                                <p className="font-bold text-gray-900 dark:text-white text-[15px] mt-0.5">
                                    {scheduledTimeDisplay}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* CARD 2: Items Ordered Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                <Package size={18} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('Items Ordered')} ({items.length})</h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-400">
                            #{orderIdShort}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {sortedItems.map((item, index) => (
                            <div key={index} className="p-3 sm:p-3.5 flex gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-3">
                                <div className="w-14 h-14 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden flex-shrink-0 relative">
                                    <img
                                        src={getItemImage(item)}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Product"; }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="mb-0.5 leading-tight" title={item.name}>
                                        {renderBilingualTitle(item.name || item.title, language, {
                                            hideTag: true,
                                            mainClassName: 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
                                            subClassName: 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
                                        })}
                                    </div>
                                    {(item.storeId || item.storeName) && (() => {
                                        const sName = getItemStoreName(item);
                                        const sLoc = getItemStoreLocation(item);
                                        return (
                                            <div className="mt-0.5">
                                                <a
                                                    href={sLoc || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sName + ', Ilayangudi')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline active:scale-95 transition-all truncate max-w-full group"
                                                    title={t('Open Store Location in Google Maps')}
                                                >
                                                    <MapPin size={11} className="shrink-0 text-red-500 group-hover:scale-110 transition-transform" />
                                                    <span className="truncate">{sName}</span>
                                                </a>
                                            </div>
                                        );
                                    })()}
                                    <div className="flex items-center justify-between mt-1">
                                        <div>
                                            <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-none">
                                                ₹{Number(item.price * item.quantity).toFixed(0)}
                                            </p>
                                            {(item.unit || item.product?.unit) && (
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">
                                                    {item.unit || item.product?.unit}
                                                </p>
                                            )}
                                        </div>
                                        <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded-md text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                                            x{item.quantity}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CARD 3: Payment Summary Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4 text-[14px]">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-400" />
                        {t('Payment Summary')}
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>{t('Item Total')}</span>
                            <span className="font-medium text-gray-900 dark:text-white">₹{Number(subtotal).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>{t('Delivery Fee')}</span>
                            {Number(deliveryCharge) <= 0 ? (
                                <div className="text-right">
                                    <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">{t('FREE')}</span>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center justify-end gap-1.5">
                                        <CartoonCoin size={17} /> <span>{t('Coin Applied')}</span>
                                    </p>
                                </div>
                            ) : (
                                <span className="font-medium text-gray-900 dark:text-white">₹{Number(deliveryCharge).toFixed(0)}</span>
                            )}
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>{t('Discount')}</span>
                                <span>-₹{Number(order.discount).toFixed(0)}</span>
                            </div>
                        )}
                        <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700 mt-2.5 flex justify-between items-end">
                            <span className="font-bold text-gray-900 dark:text-white">{t('Total to Collect')}</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">
                                ₹{Number(totalAmount).toFixed(0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Porter-style Delivery Route Map */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#2E5A2E]/10 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                <Navigation size={16} />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                {t('Delivery Route')} {optimizedRoute?.hasMultipleStores ? `(${optimizedRoute.sortedStores.length} Stores)` : ''}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={refreshLocation}
                            className="text-[11px] font-semibold text-[#2E5A2E] dark:text-[#CBF9B2] hover:underline flex items-center gap-1 active:scale-95"
                        >
                            {isDetectingGps ? (
                                <span className="animate-pulse">{t('Updating GPS...')}</span>
                            ) : (
                                <span>{t('Refresh GPS')}</span>
                            )}
                        </button>
                    </div>

                    <DeliveryRouteTimeline
                        order={order}
                        stores={stores}
                        driverCoords={driverCoords}
                        compact={false}
                        showMapButtons={true}
                        t={t}
                    />
                </div>

            </main>

            {/* Bottom Fixed Action Footer */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(1.2rem + env(safe-area-inset-bottom, 16px))', paddingTop: '0.85rem' }}
            >
                <div className="max-w-md mx-auto px-4 space-y-2">
                    {isOutForDelivery ? (
                        /* OUT FOR DELIVERY MODE: DELIVERED Swipe Button (Cancel removed) */
                        <SwipeActionButton
                            variant="green"
                            label={t('DELIVERED')}
                            loadingLabel={t('Delivering...')}
                            isLoading={isActionLoading}
                            heightClass="h-[68px] sm:h-[72px]"
                            knobSizeClass="w-[56px] h-[56px] sm:w-[60px] sm:h-[60px]"
                            onSuccess={handleDeliver}
                        />
                    ) : isProcessing ? (
                        /* ACCEPT & CANCEL FOOTER LIKE BEFORE */
                        <div className="space-y-2.5 w-full">
                            <SwipeActionButton
                                variant="yellow"
                                label={t('ACCEPT')}
                                loadingLabel={t('Accepting...')}
                                isLoading={isActionLoading}
                                heightClass="h-[60px] sm:h-[64px]"
                                knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                onSuccess={handleAccept}
                            />
                            {/* Cancel Button styled like Accept button in Grey */}
                            <SwipeActionButton
                                variant="gray"
                                label={t('CANCEL')}
                                loadingLabel={t('Cancelling...')}
                                isLoading={isCancelling}
                                heightClass="h-[60px] sm:h-[64px]"
                                knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                autoReset={true}
                                onSuccess={() => setShowCancelConfirmModal(true)}
                            />
                        </div>
                    ) : isDelivered ? (
                        <div className="relative overflow-hidden w-full py-4 rounded-full bg-[#00C988] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md select-none">
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: 'easeInOut',
                                    repeatDelay: 0.5
                                }}
                            />
                            <CheckCircle size={20} className="text-white stroke-[2.8] relative z-10" />
                            <span className="relative z-10">{t('Delivered Successfully')}</span>
                        </div>
                    ) : (
                        <div className="w-full py-3.5 rounded-full text-center text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {t(status)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryActiveOrder;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Phone, MapPin, Package, ChevronsRight, Volume2, VolumeX, Navigation, Clock, CreditCard, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useUpdateOrderStatus } from '../hooks/queries/useOrders';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { getStoreName, formatDeliveryRangeFromDate } from '../utils/storeHelpers';
import { API_BASE_URL } from '../utils/api';
import { startIncomingOrderAlertSound, stopIncomingOrderAlertSound, playSuccessSound } from '../utils/soundHelper';
import { CartoonCoin } from './CartoonCoin';
import { formatOrderBannerTime } from '../utils/dateUtils';
import SwipeActionButton from './SwipeActionButton';
import DeliveryStatusPopup from './DeliveryStatusPopup';
import { registerModalBackHandler } from '../utils/useBackButton';

const IncomingOrderModal = ({
    order,
    onClose,
    onAccepted,
    onDelivered,
    onCancelled,
    onSkip,
    onAcceptViewOpened,
    startWithViewCard = false
}) => {
    const { t, language } = useLanguage();
    const { stores } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
    const dragControls = useDragControls();

    const [isMuted, setIsMuted] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [popupState, setPopupState] = useState({
        isOpen: false,
        type: 'accepted',
        title: '',
        subtitle: ''
    });

    const isOutForDelivery = order?.status === 'Out for Delivery' || order?.status === 'Shipped';
    const isProcessing = order?.status === 'Processing' || order?.status === 'Pending' || order?.status === 'Order Placed' || order?.status === 'Confirmed';
    const isDelivered = order?.status === 'Delivered';
    const isCancelled = order?.status === 'Cancelled';

    // Mobile alert card shows the compact incoming view and navigates directly to the Accept Page
    const [viewMode, setViewMode] = useState('view');

    useEffect(() => {
        setViewMode('view');
    }, [order?._id, order?.status]);

    // Only play alert sound for fresh pending/processing orders
    useEffect(() => {
        if (!order || !onClose) return;
        return registerModalBackHandler(onClose);
    }, [order, onClose]);

// In-app alert shows until skipped or viewed (no 8s auto-countdown)


    useEffect(() => {
        if (!order || !isProcessing) return;

        // Sound effect ONLY in the view order card, NOT in the accept card
        if (!isMuted && viewMode === 'view') {
            startIncomingOrderAlertSound();
        } else {
            stopIncomingOrderAlertSound();
        }

        return () => {
            stopIncomingOrderAlertSound();
        };
    }, [order, isMuted, isProcessing, viewMode]);

    if (!order) return null;

    const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
    const customerName = order.shippingAddress?.name || t('Customer');
    const customerPhone = order.shippingAddress?.mobile || '';
    const street = order.shippingAddress?.street || '';
    const city = order.shippingAddress?.city || 'Ilayangudi';
    const zip = order.shippingAddress?.zip || '';
    const location = order.shippingAddress?.location;
    const deliveryTime = order.deliveryTime || order.shippingAddress?.deliveryTime;
    const rawScheduleTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
    const scheduledTimeDisplay = formatDeliveryRangeFromDate(rawScheduleTime) || rawScheduleTime;
    const items = order.items || [];
    const totalAmount = order.total || order.subtotal || 0;
    const deliveryCharge = order.shipping !== undefined && order.shipping !== null
        ? order.shipping
        : (order.deliveryCharge !== undefined ? order.deliveryCharge : 20);
    const subtotal = order.subtotal || Math.max(totalAmount - deliveryCharge, 0);
    const paymentType = order.paymentMethod?.type || 'Cash on Delivery';

    // Helper to format user ordered time
    const formattedOrderTime = (() => {
        const raw = order.createdAt || order.date || order.timestamp;
        if (!raw) return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        try {
            const d = new Date(raw);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return '';
        }
    })();

    // Helper to resolve product image
    const getItemImage = (item) => {
        if (item.image && typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('/') || item.image.startsWith('data:'))) {
            return item.image;
        }
        const id = item.product?._id || item.product || item._id || item.id;
        if (id) {
            return `${API_BASE_URL}/products/${id}/image`;
        }
        return 'https://via.placeholder.com/150?text=Product';
    };

    // Helper to resolve store name
    const getItemStoreName = (item) => {
        if (item.storeName) return item.storeName;
        if (item.storeId) {
            const found = getStoreName(item.storeId, stores);
            if (found && found !== 'Unknown Store') return found;
        }
        if (item.storeId?.name) return item.storeId.name;
        if (order.storeName) return order.storeName;
        return t('Ilayangudi Store');
    };

    // Handle popup complete
    const handlePopupComplete = () => {
        const completedType = popupState.type;
        setPopupState(prev => ({ ...prev, isOpen: false }));
        const id = order._id || order.id;

        if (completedType === 'accepted') {
            const acceptedOrder = { ...order, status: 'Out for Delivery' };
            if (onAccepted) onAccepted(acceptedOrder);
            navigate(`/admin/delivery-order/${id}`, {
                state: { order: acceptedOrder, status: 'Out for Delivery' }
            });
        } else if (completedType === 'delivered') {
            localStorage.removeItem('active_delivery_order_id');
            localStorage.removeItem('active_delivery_stay');
            if (onDelivered) {
                onDelivered(order);
            } else {
                onClose();
            }
            navigate('/admin', { replace: true });
        } else if (completedType === 'cancelled') {
            localStorage.removeItem('active_delivery_order_id');
            localStorage.removeItem('active_delivery_stay');
            if (onCancelled) {
                onCancelled(order);
            } else {
                onClose();
            }
            navigate('/admin', { replace: true });
        }
    };

    // Main action: Deliver (if Out for Delivery) OR Accept (if Processing)
    const handleMainSwipeAction = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        stopIncomingOrderAlertSound();

        try {
            const id = order._id || order.id;
            if (isOutForDelivery) {
                // Out for Delivery -> Delivered
                await updateOrderStatus({
                    id,
                    status: 'Delivered',
                    deliveredBy: user?._id
                });
                playSuccessSound();
                setPopupState({
                    isOpen: true,
                    type: 'delivered',
                    title: t('Delivered Successfully!'),
                    subtitle: t('Order has been delivered')
                });
            } else {
                // Processing -> Out for Delivery
                await updateOrderStatus({
                    id,
                    status: 'Out for Delivery',
                    deliveredBy: user?._id
                });
                playSuccessSound();
                localStorage.setItem('active_delivery_order_id', id);
                localStorage.setItem('active_delivery_stay', 'true');
                setPopupState({
                    isOpen: true,
                    type: 'accepted',
                    title: t('Order Accepted!'),
                    subtitle: t('Order is ready for delivery')
                });
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            const errMsg = error?.response?.data?.message || error?.message || t('Failed to update order status. Please try again.');
            alert(errMsg);
            setIsActionLoading(false);
        }
    };

    // Cancel Order action from Red Swipe Button
    const handleConfirmCancel = async () => {
        if (isCancelling) return;
        setIsCancelling(true);
        stopIncomingOrderAlertSound();

        try {
            const id = order._id || order.id;
            await updateOrderStatus({ id, status: 'Cancelled' });
            setShowCancelPopup(false);
            setPopupState({
                isOpen: true,
                type: 'cancelled',
                title: t('Order Cancelled'),
                subtitle: t('Order has been cancelled')
            });
        } catch (error) {
            console.error('Error cancelling order:', error);
            const errMsg = error?.response?.data?.message || error?.message || t('Failed to cancel order. Please try again.');
            alert(errMsg);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleDismissView = () => {
        stopIncomingOrderAlertSound();
        onClose();
    };

    const toggleMute = () => {
        setIsMuted((prev) => !prev);
    };

    // Google Maps Navigation URL
    const dropMapsUrl = (() => {
        if (!location) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${street}, ${city}`)}`;
        }
        const trimmed = String(location).trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return trimmed;
        }
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trimmed)}`;
    })();

    // 1. Initial Step: Compact "VIEW ORDER" card (shown when delivery boy receives order outside or app opened)
    if (viewMode === 'view' && isProcessing) {
        return (
            <>
                <DeliveryStatusPopup
                    isOpen={popupState.isOpen}
                    type={popupState.type}
                    title={popupState.title}
                    subtitle={popupState.subtitle}
                    onComplete={handlePopupComplete}
                    duration={1800}
                />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) handleDismissView();
                }}
                onPointerDown={(e) => {
                    if (e.target === e.currentTarget) handleDismissView();
                }}
                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 select-none cursor-pointer"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-xl border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col justify-between"
                >
                    {/* Top Header Row: Time Left & ID Right in grey same thickness (matching Order List card, no X icon) */}
                    <div className="px-4 pt-3 pb-2 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                        {/* Left: 🕒 Nov 3, 1.47 PM */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                        </div>

                        {/* Right: #Order ID (same font-bold thickness and grey color) */}
                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                            #{orderIdShort}
                        </span>
                    </div>

                    {/* Light grey line matching green dot line */}
                    <div className="mx-5 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />

                    {/* Card Content: EXACT Orders List Card Structure */}
                    <div className="pt-2.5 pb-2.5 px-3.5 sm:px-4">
                        {/* Delivery Charge and Price in Center Thick */}
                        <div className="text-center py-1 mb-1.5 border-b border-gray-100 dark:border-gray-700/60">
                            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">
                                {t('Delivery Charge')}
                            </span>
                            {deliveryCharge <= 0 ? (
                                <div className="flex items-center justify-center gap-2 py-0.5">
                                    <span className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight uppercase">
                                        {t('Free Delivery')}
                                    </span>
                                    <CartoonCoin size={28} />
                                </div>
                            ) : (
                                <div className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tight font-sans">
                                    ₹{deliveryCharge}
                                </div>
                            )}
                        </div>

                        {/* Left-Aligned Details with Route Timeline: Green dot before Name -> Grey line -> Green dot before Time */}
                        <div className="flex gap-3 text-left mt-3">
                            {/* Timeline Track: Green Dot -> Vertical Grey Line -> Green Dot */}
                            <div className="flex flex-col items-center pt-1.5 shrink-0">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[36px]" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                            </div>

                            {/* Content: Customer details on top, Delivery time on bottom */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                {/* Customer Details */}
                                <div className="space-y-0.5">
                                    {customerName && (
                                        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                                            {customerName}
                                        </h3>
                                    )}
                                    {street && (
                                        <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                            {street}
                                        </p>
                                    )}
                                    {city && (
                                        <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                            {city}
                                        </p>
                                    )}
                                    {items?.length > 0 && (
                                        <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                                            <Package size={13} className="text-gray-400 shrink-0" />
                                            <span>{items.length} {items.length === 1 ? t('item') : t('items')}</span>
                                        </p>
                                    )}
                                </div>

                                {/* Scheduled Delivery Time aligned with bottom green dot */}
                                {(() => {
                                    const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                    const isScheduled = rawTime && !String(rawTime).toLowerCase().includes('instant');
                                    const timeLabel = isScheduled ? t('Scheduled Delivery') : t('Delivery Time');
                                    const timeRange = isScheduled ? formatDeliveryRangeFromDate(rawTime) : (formattedOrderTime || t('Standard Delivery'));

                                    return (
                                        <div className="mt-2.5 pt-1">
                                            <p className="text-xs sm:text-[13px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                                                {timeLabel}
                                            </p>
                                            <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight mt-0.5">
                                                {timeRange}
                                            </p>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Swipe to ACCEPT with SKIP button below */}
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                        <SwipeActionButton
                            variant="yellow"
                            label={t('VIEW ORDER')}
                            autoReset={true}
                            heightClass="h-[50px] sm:h-[52px]"
                            knobSizeClass="w-[38px] h-[38px]"
                            iconSize={18}
                            onSuccess={() => {
                                stopIncomingOrderAlertSound();
                                setViewMode('details');
                                onAcceptViewOpened?.();
                            }}
                        />

                        {/* Skip Button like Porter App */}
                        <button
                            type="button"
                            onClick={() => {
                                stopIncomingOrderAlertSound();
                                if (onSkip) {
                                    onSkip(order);
                                } else {
                                    handleDismissView();
                                }
                            }}
                            className="w-full mt-2.5 py-1 text-center text-xs sm:text-[13px] font-bold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 tracking-widest uppercase active:scale-95 transition-all cursor-pointer"
                        >
                            {t('SKIP')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
            </>
        );
    }

    // 2. Full "ACCEPT ORDER" / Order Details View
    return (
        <>
            <DeliveryStatusPopup
                isOpen={popupState.isOpen}
                type={popupState.type}
                title={popupState.title}
                subtitle={popupState.subtitle}
                onComplete={handlePopupComplete}
                duration={1800}
            />
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) handleDismissView();
            }}
            onPointerDown={(e) => {
                if (e.target === e.currentTarget) handleDismissView();
            }}
            className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 select-none cursor-pointer"
        >
            <motion.div
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(e, info) => {
                    if (info.offset.y > 80 || info.velocity.y > 350) {
                        handleDismissView();
                    }
                }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-[#E8EAEF] dark:bg-gray-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[94vh] relative cursor-default"
            >
                {/* Full Accept View: Drag Handle Bar & Header (drag down from here to close) */}
                <div 
                    onPointerDown={(e) => dragControls.start(e)}
                    className="bg-white dark:bg-gray-800 shrink-0 cursor-grab active:cursor-grabbing select-none touch-none pt-2.5 pb-2"
                >
                    {/* Thin Drag Handle Line */}
                    <div className="w-10 sm:w-12 h-[2.5px] bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-2.5" />

                    <div className="px-4 flex items-center justify-between text-gray-500 dark:text-gray-400">
                        {/* Left: 🕒 Nov 6, 8.00 PM */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                {formatOrderBannerTime(order.createdAt || order.date) || formattedOrderTime || t('New Order')}
                            </span>
                        </div>

                        {/* Right: #Order ID (same font-bold thickness and grey color) */}
                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                            #{orderIdShort}
                        </span>
                    </div>

                </div>

                {/* Scrollable Order Details Section matching OrderDetails.jsx exactly */}
                <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 sm:space-y-3.5 flex-1">
                    {/* CARD 1: Shipping Details Card - Matching Order Details Design */}
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

                                {/* 4. Pin / View on Map */}
                                {dropMapsUrl && (
                                    <div className="pt-1">
                                        <a
                                            href={dropMapsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-[#2E5A2E] dark:text-[#CBF9B2] text-[11px] font-bold bg-green-50 dark:bg-[#CBF9B2]/10 px-3 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-[#CBF9B2]/20 transition-all border border-[#2E5A2E]/10 dark:border-[#CBF9B2]/20 shadow-xs"
                                        >
                                            <Navigation size={13} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                            <span>{t('View on Map')}</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* 5. Scheduled Delivery Time */}
                            {scheduledTimeDisplay && !String(scheduledTimeDisplay).toLowerCase().includes('instant') && (
                                <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 text-[#2E5A2E] dark:text-[#CBF9B2]">
                                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center shrink-0">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Scheduled Delivery')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {scheduledTimeDisplay}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARD 2: Items Ordered Card - Matching Order Details Design */}
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
                            {items.map((item, index) => (
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
                                        {(item.storeId || item.storeName) && (
                                            <p className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {getItemStoreName(item)}
                                            </p>
                                        )}
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

                    {/* CARD 3: Payment Summary Card - Matching Order Details Design */}
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
                </div>
                {/* Bottom Action Area with safe mobile footer padding */}
                <div className="p-4 pb-14 sm:pb-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-2">
                    {isOutForDelivery ? (
                        <SwipeActionButton
                            variant="green"
                            label={t('DELIVERED')}
                            loadingLabel={t('Delivering...')}
                            isLoading={isActionLoading}
                            heightClass="h-[68px] sm:h-[72px]"
                            knobSizeClass="w-[56px] h-[56px] sm:w-[60px] sm:h-[60px]"
                            onSuccess={handleMainSwipeAction}
                        />
                    ) : isProcessing ? (
                        <div className="space-y-2.5 w-full">
                            <SwipeActionButton
                                variant="yellow"
                                label={t('ACCEPT')}
                                loadingLabel={t('Accepting...')}
                                isLoading={isActionLoading}
                                heightClass="h-[60px] sm:h-[64px]"
                                knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                onSuccess={handleMainSwipeAction}
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
                                onSuccess={handleConfirmCancel}
                            />
                        </div>
                    ) : isDelivered ? (
                        <div className="relative overflow-hidden w-full py-4 rounded-full bg-[#00C988] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md select-none">
                            {/* Animated sheen shine effect */}
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
                            {t(order.status)}
                        </div>
                    )}
                </div>


            </motion.div>
        </motion.div>
        </>
    );
};

export default IncomingOrderModal;

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
import { startIncomingOrderAlertSound, stopIncomingOrderAlertSound, playSuccessSound, playOrderAcceptedSound, playOrderDeliveredSound, playOrderCancelledSound } from '../utils/soundHelper';
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
        // Alert card stays active until delivery boy accepts or skips; not dismissed by back button
    }, []);

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
                playOrderDeliveredSound();
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
                    deliveredBy: user?._id || user?.id
                });
                playOrderAcceptedSound();
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

    // Compact "VIEW ORDER" card (shown when delivery boy receives order outside or in delivery panel)
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
                    // Alert card stays locked in front of delivery boy until Accept or Skip
                    e.stopPropagation();
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                }}
                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 select-none"
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
                                    const isValidTime = rawTime && String(rawTime).trim().toLowerCase() !== 'null' && String(rawTime).trim().toLowerCase() !== 'undefined' && String(rawTime).trim() !== '';
                                    const isScheduled = isValidTime && !String(rawTime).toLowerCase().includes('instant');
                                    const timeLabel = isScheduled ? t('Scheduled Delivery') : t('Delivery Time');
                                    const formatted = isValidTime ? formatDeliveryRangeFromDate(rawTime) : null;
                                    const timeRange = isValidTime ? (formatted || rawTime) : t('Not Mentioned');

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

                    {/* Bottom: View Order button with SKIP below */}
                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                        <SwipeActionButton
                            variant="yellow"
                            label={t('VIEW ORDER')}
                            loadingLabel={t('Opening...')}
                            allowTap={true}
                            heightClass="h-[56px] sm:h-[60px]"
                            knobSizeClass="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px]"
                            onSuccess={() => {
                                stopIncomingOrderAlertSound();
                                if (onAcceptViewOpened) onAcceptViewOpened(order);
                                if (onClose) onClose();
                                navigate(`/admin/delivery-order/${order._id || order.id}`, { state: { order, status: order.status } });
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
                            className="w-full mt-2 py-1 text-center text-xs sm:text-[13px] font-bold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 tracking-widest uppercase active:scale-95 transition-all cursor-pointer select-none"
                        >
                            {t('SKIP')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
            </>
        );
    };

export default IncomingOrderModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Package, ChevronsRight, X, Volume2, VolumeX, Navigation, Clock, CreditCard, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useUpdateOrderStatus } from '../hooks/queries/useOrders';
import { getStoreName, formatDeliveryRangeFromDate } from '../utils/storeHelpers';
import { API_BASE_URL } from '../utils/api';
import { startIncomingOrderAlertSound, stopIncomingOrderAlertSound, playSuccessSound } from '../utils/soundHelper';
import { CartoonCoin } from './CartoonCoin';
import { formatOrderBannerTime } from '../utils/dateUtils';
import SwipeActionButton from './SwipeActionButton';
import { registerModalBackHandler } from '../utils/useBackButton';

const IncomingOrderModal = ({
    order,
    onClose,
    onAccepted,
    onDelivered,
    onCancelled,
    startWithViewCard = false
}) => {
    const { t, language } = useLanguage();
    const { stores } = useData();
    const navigate = useNavigate();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();

    const [isMuted, setIsMuted] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const isOutForDelivery = order?.status === 'Out for Delivery' || order?.status === 'Shipped';
    const isProcessing = order?.status === 'Processing' || order?.status === 'Pending' || order?.status === 'Order Placed' || order?.status === 'Confirmed';
    const isDelivered = order?.status === 'Delivered';
    const isCancelled = order?.status === 'Cancelled';

    // Step state: 'view' shows the compact View Order card; 'accept' shows the full Accept Order view
    const [viewMode, setViewMode] = useState(startWithViewCard && isProcessing ? 'view' : 'accept');

    useEffect(() => {
        if (order && isProcessing && startWithViewCard) {
            setViewMode('view');
        } else {
            setViewMode('accept');
        }
    }, [order?._id, order?.status, startWithViewCard, isProcessing]);

    // Only play alert sound for fresh pending/processing orders
    useEffect(() => {
        if (!order || !onClose) return;
        return registerModalBackHandler(onClose);
    }, [order, onClose]);

    useEffect(() => {
        if (!order || !isProcessing) return;

        if (!isMuted) {
            startIncomingOrderAlertSound();
        } else {
            stopIncomingOrderAlertSound();
        }

        return () => {
            stopIncomingOrderAlertSound();
        };
    }, [order, isMuted, isProcessing]);

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

    // Main action: Deliver (if Out for Delivery) OR Accept (if Processing)
    const handleMainSwipeAction = async () => {
        if (isActionLoading) return;
        setIsActionLoading(true);
        stopIncomingOrderAlertSound();
        playSuccessSound();

        try {
            const id = order._id || order.id;
            if (isOutForDelivery) {
                // Out for Delivery -> Delivered
                await updateOrderStatus({ id, status: 'Delivered' });
                if (onDelivered) {
                    onDelivered(order);
                } else {
                    onClose();
                }
            } else {
                // Processing -> Out for Delivery
                await updateOrderStatus({ id, status: 'Out for Delivery' });
                if (onAccepted) {
                    onAccepted(order);
                } else {
                    onClose();
                }
            }
        } catch (error) {
            console.error('Error updating order status:', error);
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
            if (onCancelled) {
                onCancelled(order);
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
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

    // 1. Initial Step: Compact "VIEW ORDER" card (shown when app closed/minimized upon order receipt)
    if (viewMode === 'view' && isProcessing) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={handleDismissView}
                className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 select-none"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-700 shadow-2xl relative text-center flex flex-col"
                >
                    {/* Compact View when app closed: ID Left, X Right, grey line not touching edges */}
                    <div className="px-5 pt-3 pb-2.5 flex items-center justify-between text-black dark:text-white -mx-6 -mt-6 rounded-t-[2.5rem] bg-white dark:bg-gray-800">
                        {/* Left: #Order ID */}
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                #{orderIdShort}
                            </span>
                            {formattedOrderTime && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
                                    • {formattedOrderTime}
                                </span>
                            )}
                        </div>

                        {/* Right: X Button */}
                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 -mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-full text-gray-900 dark:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 ml-2"
                        >
                            <X size={18} className="text-gray-900 dark:text-white stroke-[2.5]" />
                        </button>
                    </div>
                    {/* Grey line not touching left and right edges */}
                    <div className="mx-2 h-[1px] bg-gray-300 dark:bg-gray-600 mb-3 shrink-0" />

                    {/* Delivery Charge Header */}
                    <div className="pt-1 pb-1 text-center">
                        <span className="text-[11px] font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">
                            {t('Delivery Charge')}
                        </span>
                        {deliveryCharge > 0 ? (
                            <div className="text-5xl font-black text-black dark:text-white tracking-tight font-sans">
                                ₹{deliveryCharge}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <span className="text-4xl font-black text-black dark:text-white tracking-tight uppercase">
                                    {t('Free Delivery')}
                                </span>
                                <CartoonCoin size={32} />
                            </div>
                        )}

                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-1">
                            {t(paymentType || 'Cash on Delivery')}
                        </p>

                        {formattedOrderTime && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center justify-center gap-1 font-semibold">
                                <Clock size={12} className="text-gray-400" />
                                <span>{t('Ordered at')} {formattedOrderTime}</span>
                            </p>
                        )}
                    </div>

                    {/* Customer & Location */}
                    <div className="my-3 py-3 border-y border-gray-100 dark:border-gray-700/60 text-center">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {customerName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {[street, city].filter(Boolean).join(', ')} {items.length > 0 ? `(${items.length} items)` : ''}
                        </p>

                        {scheduledTimeDisplay && !String(scheduledTimeDisplay).toLowerCase().includes('instant') && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-full text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                                <Clock size={12} />
                                <span>{t('Scheduled')}: {scheduledTimeDisplay}</span>
                            </div>
                        )}
                    </div>

                    {/* Bottom: Swipe to VIEW ORDER (moves to the full Accept Order card) */}
                    <div className="pt-1">
                        <SwipeActionButton
                            variant="yellow"
                            label={t('VIEW ORDER')}
                            autoReset={true}
                            heightClass="h-[58px] sm:h-[62px]"
                            knobSizeClass="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px]"
                            onSuccess={() => {
                                setViewMode('accept');
                            }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    // 2. Full "ACCEPT ORDER" / Order Details View
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDismissView}
            className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 select-none"
        >
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#E8EAEF] dark:bg-gray-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[94vh] relative"
            >
                {/* Full Accept View: Time Left & ID Right in grey same thickness, light grey line like green dot line */}
                <div className="bg-white dark:bg-gray-800 shrink-0">
                    <div className="px-5 pt-4 pb-2.5 flex items-center justify-between text-gray-500 dark:text-gray-400">
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
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {/* CARD 1: Shipping Details Card - Matching Order Details Design */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <MapPin size={18} />
                                </div>
                                <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Shipping details')}</h3>
                            </div>
                            {customerPhone && (
                                <a
                                    href={`tel:${customerPhone}`}
                                    className="relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-black text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-transform shadow-md select-none border border-black/80"
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
                                        animate={{ x: ['-100%', '150%'] }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                    />
                                    <Phone size={14} className="stroke-[2.5] relative z-10 text-white" />
                                    <span className="relative z-10">{t('Call')}</span>
                                </a>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="pl-2 sm:pl-4 space-y-1.5">
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
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
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
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
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
                                <div key={index} className="p-5 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-5">
                                    <div className="h-16 w-16 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden flex-shrink-0 relative">
                                        <img
                                            src={getItemImage(item)}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=Product"; }}
                                        />
                                        {/* Status Tags */}
                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                            {((item.isGold) || (item.product && item.product.isGold)) && (
                                                <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                                    {t('Free Delivery')}
                                                </span>
                                            )}
                                            {item.isFromAd && !item.isGold && !(item.product && item.product.isGold) && (
                                                <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                                    {t('Special Offer')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-0.5" title={item.name}>
                                            {item.name}
                                        </h4>
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
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-[15px]">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-gray-400" />
                            {t('Payment Summary')}
                        </h3>
                        <div className="space-y-3 text-sm">
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
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex justify-between items-end">
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
    );
};

export default IncomingOrderModal;

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
import SwipeActionButton from './SwipeActionButton';

const IncomingOrderModal = ({ order, onClose, onAccepted, onDelivered, onCancelled }) => {
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

    // Only play alert sound for fresh pending/processing orders
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleDismissView}
            className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm select-none"
        >
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#E8EAEF] dark:bg-gray-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[94vh] relative"
            >
                {/* Top Header Section - Clean Solid Background, Grey Texts & Green Price */}
                <div className="bg-white dark:bg-gray-800 pt-7 pb-4 px-6 relative text-center shrink-0 border-b border-gray-100 dark:border-gray-750">
                    {/* Top right controls: Black X (no round background) */}
                    <div className="absolute top-4 right-4 flex items-center">
                        <button
                            type="button"
                            onClick={handleDismissView}
                            title={t('Close')}
                            className="p-1 text-black dark:text-white hover:opacity-70 transition-opacity active:scale-90"
                        >
                            <X size={22} className="stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Top Label: Delivery Charge in Dark Grey */}
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">
                        {t('Delivery Charge')}
                    </span>

                    {/* Delivery Charge Price in BLACK */}
                    {deliveryCharge > 0 ? (
                        <div className="text-5xl sm:text-6xl font-black text-black dark:text-white tracking-tight font-sans">
                            ₹{deliveryCharge}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2.5 py-1">
                            <span className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tight uppercase">
                                {t('Free Delivery')}
                            </span>
                            <CartoonCoin size={36} />
                        </div>
                    )}

                    {/* Plain text: Cash on Delivery in Dark Grey */}
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-1">
                        {t(paymentType || 'Cash on Delivery')}
                    </p>

                    {/* User Ordered Time in Dark Grey */}
                    {formattedOrderTime && (
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5 flex items-center justify-center gap-1 font-semibold">
                            <Clock size={12} className="text-gray-600 dark:text-gray-400" />
                            <span>{t('Ordered at')} {formattedOrderTime}</span>
                        </p>
                    )}
                </div>

                {/* Scrollable Order Details Section */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {/* CARD 1: Shipping Details Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <MapPin size={18} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {t('Shipping details')}
                                </h3>
                            </div>
                            {customerPhone && (
                                <a
                                    href={`tel:${customerPhone}`}
                                    className="relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-black dark:bg-black text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-transform shadow-md select-none border border-black/80"
                                >
                                    {/* Continuous sliding light sheen shine effect */}
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

                        <div className="p-5 space-y-2">
                            <p className="font-bold text-[15px] text-gray-900 dark:text-white">
                                {customerName}
                            </p>
                            {customerPhone && (
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    +91 {customerPhone}
                                </p>
                            )}
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                                {street}{city ? `, ${city}` : ''}{zip ? ` - ${zip}` : ''}
                            </p>

                            <div className="pt-1 flex items-center gap-2 flex-wrap">
                                <a
                                    href={dropMapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[#2E5A2E] dark:text-[#CBF9B2] text-[12px] font-bold bg-green-50 dark:bg-[#CBF9B2]/10 px-3.5 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-[#CBF9B2]/20 transition-all border border-[#2E5A2E]/10 dark:border-[#CBF9B2]/20 shadow-xs"
                                >
                                    <Navigation size={13} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                    <span>{t('View on Map')}</span>
                                </a>
                            </div>

                            {/* Scheduled Delivery Time like in OrderDetails.jsx in Dark Grey */}
                            {(() => {
                                const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                if (!rawTime) return null;
                                const strTime = String(rawTime).toLowerCase();
                                if (strTime.includes('instant')) return null;

                                const formattedRange = formatDeliveryRangeFromDate(rawTime);
                                if (!formattedRange || formattedRange.toLowerCase().includes('instant')) return null;

                                return (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2.5 text-[#2E5A2E] dark:text-[#CBF9B2]">
                                            <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center shrink-0">
                                                <Clock size={16} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-tight">
                                                    {t('Scheduled Delivery')}
                                                </p>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {formattedRange}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* CARD 2: Items Ordered Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <Package size={18} />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                                    {t('Items Ordered')} ({items.length})
                                </h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-gray-400">
                                #{orderIdShort}
                            </span>
                        </div>

                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {items.map((item, index) => {
                                const itemImage = getItemImage(item);
                                const itemStore = getItemStoreName(item);
                                return (
                                    <div key={index} className="p-4 flex gap-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors">
                                        {/* Product Image Thumbnail */}
                                        <div className="h-16 w-16 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden shrink-0 relative">
                                            <img
                                                src={itemImage}
                                                alt={item.name}
                                                className="h-full w-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Product'; }}
                                            />
                                        </div>

                                        {/* Product Title and Store Name */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-xs leading-snug line-clamp-2">
                                                {item.name}
                                            </h4>

                                            {itemStore && (
                                                <p className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {itemStore}
                                                </p>
                                            )}

                                            <div className="flex items-center justify-between mt-1.5">
                                                <div>
                                                    <p className="text-[14px] font-black text-gray-900 dark:text-white leading-none">
                                                        ₹{Number(item.price * item.quantity).toFixed(0)}
                                                    </p>
                                                    {item.unit && (
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                            {item.unit}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700/60 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">
                                                    x{item.quantity}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* CARD 3: Payment Summary Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-5 text-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3.5 flex items-center gap-2">
                            <CreditCard size={17} className="text-gray-400" />
                            {t('Payment Summary')}
                        </h3>
                        <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between text-gray-700 dark:text-gray-300 font-semibold">
                                <span>{t('Item Total')}</span>
                                <span className="font-mono text-gray-800 dark:text-gray-200 font-bold">₹{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-gray-700 dark:text-gray-300 font-semibold items-center">
                                <span>{t('Delivery Fee')}</span>
                                {deliveryCharge > 0 ? (
                                    <span className="font-mono text-black dark:text-white font-black">₹{deliveryCharge}</span>
                                ) : (
                                    <span className="flex items-center gap-1 font-bold text-black dark:text-white">
                                        <span>{t('Free Delivery')}</span>
                                        <CartoonCoin size={15} />
                                    </span>
                                )}
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between font-black text-sm text-gray-900 dark:text-white">
                                <span>{t('Total Bill to Collect')}</span>
                                <span className="font-mono text-base text-black dark:text-white">₹{totalAmount}</span>
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
                        <SwipeActionButton
                            variant="yellow"
                            label={t('ACCEPT')}
                            loadingLabel={t('Accepting...')}
                            isLoading={isActionLoading}
                            heightClass="h-[68px] sm:h-[72px]"
                            knobSizeClass="w-[56px] h-[56px] sm:w-[60px] sm:h-[60px]"
                            onSuccess={handleMainSwipeAction}
                        />
                    ) : isDelivered ? (
                        <div className="w-full py-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-black text-sm flex items-center justify-center gap-2 shadow-xs">
                            <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                            <span>{t('Delivered Successfully')}</span>
                        </div>
                    ) : (
                        <div className="w-full py-3.5 rounded-full text-center text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {t(order.status)}
                        </div>
                    )}
                </div>

                {/* POPUP: Cancel Order with RED Swipe Button */}
                <AnimatePresence>
                    {showCancelPopup && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCancelPopup(false)}
                            className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-gray-900 rounded-[2.2rem] max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4"
                            >
                                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                                    <AlertTriangle size={32} />
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {t('Cancel Order')} #{orderIdShort}?
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                        {t('Are you sure you want to cancel this order?')}
                                    </p>
                                </div>

                                {/* Customer snippet */}
                                <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3 text-xs text-gray-600 dark:text-gray-300">
                                    <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{customerName}</p>
                                    <p className="text-[11px] text-gray-400 truncate">{street}, {city}</p>
                                </div>

                                {/* RED Swipe to Cancel Button */}
                                <div className="pt-2">
                                    <SwipeActionButton
                                        variant="red"
                                        label={t('Swipe to Cancel')}
                                        loadingLabel={t('Cancelling...')}
                                        isLoading={isCancelling}
                                        heightClass="h-[60px] sm:h-[64px]"
                                        knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                        onSuccess={handleConfirmCancel}
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowCancelPopup(false)}
                                    disabled={isCancelling}
                                    className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-wider"
                                >
                                    {t('Keep Order')}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

export default IncomingOrderModal;

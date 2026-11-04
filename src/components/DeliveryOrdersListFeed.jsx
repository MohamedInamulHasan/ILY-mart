import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Package, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useUpdateOrderStatus, useDeleteOrder } from '../hooks/queries/useOrders';
import { playSuccessSound } from '../utils/soundHelper';
import { CartoonCoin } from './CartoonCoin';
import SwipeActionButton from './SwipeActionButton';
import { formatOrderBannerTime } from '../utils/dateUtils';
import { formatDeliveryRangeFromDate } from '../utils/storeHelpers';

const DeliveryOrdersListFeed = ({
    orders = [],
    onSelectOrder,
    searchQuery = '',
    paddingBottomClass = 'pb-36'
}) => {
    const { t } = useLanguage();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
    const { mutateAsync: deleteOrder } = useDeleteOrder();

    const [orderToCancel, setOrderToCancel] = useState(null);
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const [orderToDelete, setOrderToDelete] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Helper to get reliable timestamp
    const getOrderTimeMs = (order) => {
        if (!order) return 0;
        if (order.createdAt) {
            const time = new Date(order.createdAt).getTime();
            if (!isNaN(time) && time > 0) return time;
        }
        if (order.date) {
            const time = new Date(order.date).getTime();
            if (!isNaN(time) && time > 0) return time;
        }
        if (order.timestamp) {
            const time = new Date(order.timestamp).getTime();
            if (!isNaN(time) && time > 0) return time;
        }
        if (order._id && typeof order._id === 'string' && order._id.length >= 8) {
            try {
                const ts = parseInt(order._id.substring(0, 8), 16) * 1000;
                if (!isNaN(ts) && ts > 0) return ts;
            } catch {}
        }
        return 0;
    };

    // Unified Orders List sorted: Processing at top, Delivered in middle (above cancelled), Cancelled at bottom
    const getFeedCategoryRank = (status) => {
        if (['Processing', 'Pending', 'Order Placed'].includes(status)) return 1; // Top
        if (['Delivered', 'Completed'].includes(status)) return 2; // Middle
        if (status === 'Cancelled') return 3; // Bottom
        return 4;
    };

    const feedOrders = orders
        .filter((o) => {
            if (!['Processing', 'Pending', 'Order Placed', 'Delivered', 'Completed', 'Cancelled'].includes(o.status)) return false;
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase().trim();
            const orderId = String(o._id || o.id).toLowerCase();
            const customerName = (o.shippingAddress?.name || o.user || '').toLowerCase();
            const customerMobile = (o.shippingAddress?.mobile || '').toLowerCase();
            const status = (o.status || '').toLowerCase();

            const matchesProcess = (q.includes('process') || q.includes('pend')) && ['processing', 'pending', 'order placed'].includes(status);
            const matchesCancelled = (q.includes('cancel')) && status === 'cancelled';
            const matchesDelivered = (q.includes('deliver') || q.includes('complete')) && ['delivered', 'completed'].includes(status);
            const matchesStatusDirect = status.includes(q);

            return (
                orderId.includes(q) ||
                customerName.includes(q) ||
                customerMobile.includes(q) ||
                matchesStatusDirect ||
                matchesProcess ||
                matchesCancelled ||
                matchesDelivered ||
                o.items?.some(item => (item.name || '').toLowerCase().includes(q))
            );
        })
        .slice()
        .sort((a, b) => {
            const rankA = getFeedCategoryRank(a.status);
            const rankB = getFeedCategoryRank(b.status);
            if (rankA !== rankB) return rankA - rankB;
            return getOrderTimeMs(b) - getOrderTimeMs(a);
        });

    const formatOrderTime = (order) => {
        const ms = getOrderTimeMs(order);
        if (!ms) return '';
        try {
            const d = new Date(ms);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' +
                d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch {
            return '';
        }
    };

    // Cancel order action
    const handleConfirmCancel = async () => {
        if (!orderToCancel || isCancelling) return;
        setIsCancelling(true);
        try {
            const id = orderToCancel._id || orderToCancel.id;
            await updateOrderStatus({ id, status: 'Cancelled' });
            playSuccessSound();
            setShowCancelPopup(false);
            setOrderToCancel(null);
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert(t('Failed to cancel order'));
        } finally {
            setIsCancelling(false);
        }
    };

    // Delete cancelled order action
    const handleConfirmDelete = async () => {
        if (!orderToDelete || isDeleting) return;
        setIsDeleting(true);
        try {
            const id = orderToDelete._id || orderToDelete.id;
            await deleteOrder(id);
            playSuccessSound();
            setShowDeletePopup(false);
            setOrderToDelete(null);
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert(t('Failed to delete order'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={`space-y-2.5 sm:space-y-3 w-full ${paddingBottomClass}`}>
            {feedOrders.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                        <Package size={30} />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">
                        {t('No orders right now')}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {t('New customer orders will automatically appear here.')}
                    </p>
                </div>
            ) : (
                feedOrders.map((order) => {
                    const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
                    const deliveryCharge = order.shipping !== undefined && order.shipping !== null
                        ? order.shipping
                        : (order.deliveryCharge !== undefined ? order.deliveryCharge : 20);
                    const isFreeDelivery = Number(deliveryCharge) <= 0;
                    const orderTimeStr = formatOrderTime(order);
                    const customerName = order.shippingAddress?.name || '';
                    const street = order.shippingAddress?.street || '';
                    const city = order.shippingAddress?.city || 'Ilayangudi';
                    const isCancelled = order.status === 'Cancelled';
                    const isProcessing = order.status === 'Processing' || order.status === 'Pending' || order.status === 'Order Placed';
                    const isDelivered = order.status === 'Delivered' || order.status === 'Completed';

                    return (
                        <div
                            key={order._id || order.id}
                            className={`${
                                isCancelled
                                    ? 'bg-gray-100/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                            } rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-sm`}
                        >
                            {/* Top Header Row: Time Left & ID Right in grey same thickness */}
                            <div className="px-4 pt-3 pb-2 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                                {/* Left: 🕒 Nov 6, 8.00 PM */}
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                    <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                        {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                    </span>
                                </div>

                                {/* Right: #Order ID */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                        #{orderIdShort}
                                    </span>
                                    {isCancelled && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOrderToDelete(order);
                                                setShowDeletePopup(true);
                                            }}
                                            title={t('Delete Cancelled Order')}
                                            className="p-1 -mr-1 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-90 rounded-full text-red-500 transition-all flex items-center justify-center cursor-pointer"
                                        >
                                            <Trash2 size={16} className="stroke-[2.2]" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Grey line not touching left and right edges */}
                            <div className="mx-4 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />

                            {/* Card Content: Delivery Charge in center thick, Customer & address on left */}
                            <div className="pt-2.5 pb-2.5 px-3.5 sm:px-4">
                                {/* Delivery Charge and Price in Center Thick */}
                                <div className="text-center py-1 mb-1.5 border-b border-gray-100 dark:border-gray-700/60">
                                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">
                                        {t('Delivery Charge')}
                                    </span>
                                    {isFreeDelivery ? (
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

                                {/* Left-Aligned Details with Route Timeline: Green dot before Name -> Light Grey line -> Green dot before Time */}
                                <div className="flex gap-3 text-left mt-3">
                                    {/* Timeline Track */}
                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                        <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[36px]" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                    </div>

                                    {/* Content: Customer details on top, Delivery time on bottom */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
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
                                            {order.items?.length > 0 && (
                                                <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                                                    <Package size={13} className="text-gray-400 shrink-0" />
                                                    <span>{order.items.length} {order.items.length === 1 ? t('item') : t('items')}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Scheduled Delivery Time (or Delivery Time) */}
                                        {(() => {
                                            const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                            const isScheduled = rawTime && !String(rawTime).toLowerCase().includes('instant');
                                            const timeLabel = isScheduled ? t('Scheduled Delivery') : t('Delivery Time');
                                            const timeRange = isScheduled ? formatDeliveryRangeFromDate(rawTime) : (orderTimeStr || t('Standard Delivery'));

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

                            {/* Action Button */}
                            <div className="p-3 sm:p-3.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                                {isDelivered ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSelectOrder?.(order);
                                        }}
                                        className="relative overflow-hidden w-full py-3.5 rounded-full bg-[#00C988] hover:bg-[#00b57a] active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all select-none"
                                    >
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
                                        <CheckCircle size={17} className="text-white stroke-[2.8] relative z-10" />
                                        <span className="relative z-10">{t('Delivered Successfully')}</span>
                                    </button>
                                ) : isCancelled ? (
                                    <div className="w-full py-3.5 text-center text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                                        {t('Cancelled')}
                                    </div>
                                ) : (
                                    <SwipeActionButton
                                        variant="yellow"
                                        label={t('VIEW ORDER')}
                                        autoReset={true}
                                        heightClass="h-[50px]"
                                        knobSizeClass="w-[38px] h-[38px]"
                                        onSuccess={() => {
                                            onSelectOrder?.(order);
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })
            )}

            {/* POPUP: Cancel Order Confirmation with Red Swipe Button */}
            <AnimatePresence>
                {showCancelPopup && orderToCancel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCancelPopup(false)}
                        className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-black/75"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-2.5 sm:space-y-3"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                                <AlertTriangle size={32} />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('Cancel Order')} #{String(orderToCancel._id || orderToCancel.id || '000000').slice(-6).toUpperCase()}?
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                                    {t('Are you sure you want to cancel this order?')}
                                </p>
                            </div>

                            {/* Customer snippet */}
                            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3 text-xs text-gray-700 dark:text-gray-200">
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                    {orderToCancel.shippingAddress?.name || t('Customer')}
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                                    {orderToCancel.shippingAddress?.street || ''}, {orderToCancel.shippingAddress?.city || 'Ilayangudi'}
                                </p>
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
                                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors uppercase tracking-wider"
                            >
                                {t('Keep Order')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* POPUP: Delete Cancelled Order Confirmation with Red Swipe Button */}
            <AnimatePresence>
                {showDeletePopup && orderToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeletePopup(false)}
                        className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-black/75"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-2.5 sm:space-y-3"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                                <Trash2 size={32} />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('Delete Order')} #{String(orderToDelete._id || orderToDelete.id || '000000').slice(-6).toUpperCase()}?
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                                    {t('Are you sure you want to delete this cancelled order?')}
                                </p>
                            </div>

                            {/* Customer snippet */}
                            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3 text-xs text-gray-700 dark:text-gray-200">
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                    {orderToDelete.shippingAddress?.name || t('Customer')}
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">
                                    {orderToDelete.shippingAddress?.street || ''}, {orderToDelete.shippingAddress?.city || 'Ilayangudi'}
                                </p>
                            </div>

                            {/* RED Swipe to Delete Button */}
                            <div className="pt-2">
                                <SwipeActionButton
                                    variant="red"
                                    label={t('Swipe to Delete')}
                                    loadingLabel={t('Deleting...')}
                                    isLoading={isDeleting}
                                    heightClass="h-[60px] sm:h-[64px]"
                                    knobSizeClass="w-[48px] h-[48px] sm:w-[52px] sm:h-[52px]"
                                    onSuccess={handleConfirmDelete}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowDeletePopup(false)}
                                disabled={isDeleting}
                                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors uppercase tracking-wider"
                            >
                                {t('Cancel')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryOrdersListFeed;


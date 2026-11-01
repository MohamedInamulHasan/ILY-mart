import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Package, ArrowUpDown, Trash2, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useUpdateOrderStatus } from '../hooks/queries/useOrders';
import { playSuccessSound } from '../utils/soundHelper';
import { CartoonCoin } from './CartoonCoin';
import ShineActionButton from './ShineActionButton';
import SwipeActionButton from './SwipeActionButton';
import { formatDeliveryRangeFromDate } from '../utils/storeHelpers';

const DeliveryOrdersFeedModal = ({ isOpen, onClose, orders = [], onSelectOrder }) => {
    const { t } = useLanguage();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();

    const [orderToCancel, setOrderToCancel] = useState(null);
    const [showCancelPopup, setShowCancelPopup] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    if (!isOpen) return null;

    // Helper to get reliable timestamp (createdAt, date, timestamp, or MongoDB _id hex timestamp)
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

    const getStatusRank = (status) => {
        switch (status) {
            case 'Processing':
            case 'Pending':
                return 1;
            case 'Cancelled':
                return 2;
            default:
                return 3;
        }
    };

    // "processing and cancelled are put in the bell"
    const feedOrders = orders
        .filter((o) => ['Processing', 'Pending', 'Cancelled'].includes(o.status))
        .slice()
        .sort((a, b) => {
            const rankA = getStatusRank(a.status);
            const rankB = getStatusRank(b.status);
            if (rankA !== rankB) return rankA - rankB;
            return getOrderTimeMs(a) - getOrderTimeMs(b);
        });

    const pendingOrdersCount = orders.filter((o) => ['Processing', 'Pending'].includes(o.status)).length;

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

    return (
        <AnimatePresence>
            {/* FULL PAGE view with grey background matching Delivery Panel */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[99998] bg-[#E8EAEF] dark:bg-gray-900 w-full h-full min-h-screen flex flex-col overflow-hidden"
            >
                {/* Header: Rectangle and White */}
                <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3.5 shadow-xs shrink-0 relative">
                    <div className="w-full flex items-center justify-between min-h-[42px]">
                        {/* Back button (black, no round) */}
                        <button
                            type="button"
                            onClick={onClose}
                            title={t('Back')}
                            className="p-1.5 text-black dark:text-white hover:opacity-70 transition-opacity active:scale-95"
                        >
                            <ArrowLeft size={22} className="stroke-[2.5]" />
                        </button>

                        {/* Centered Title & Subtitle */}
                        <div className="flex flex-col items-center text-center">
                            <div className="flex items-center gap-2">
                                <h1 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                                    {t('Orders List')}
                                </h1>
                                {pendingOrdersCount > 0 && (
                                    <span className="w-5 h-5 min-w-[20px] bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-xs">
                                        {pendingOrdersCount}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                <ArrowUpDown size={11} className="text-gray-600 dark:text-gray-400" />
                                <span>{t('Oldest First')} ({t('Old to New')})</span>
                            </p>
                        </div>

                        {/* Close button: Black X, no round */}
                        <button
                            type="button"
                            onClick={onClose}
                            title={t('Close')}
                            className="p-1.5 text-black dark:text-white hover:opacity-70 transition-opacity active:scale-95"
                        >
                            <X size={22} className="stroke-[2.5]" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Order Cards List filling full page */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 max-w-2xl mx-auto w-full">
                    {feedOrders.length === 0 ? (
                        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                <Package size={30} />
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                {t('No orders right now')}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                New customer orders will automatically appear here.
                            </p>
                        </div>
                    ) : (
                        feedOrders.map((order) => {
                            const deliveryCharge = order.shipping !== undefined && order.shipping !== null
                                ? order.shipping
                                : (order.deliveryCharge !== undefined ? order.deliveryCharge : 20);
                            const isFreeDelivery = Number(deliveryCharge) <= 0;
                            const orderTimeStr = formatOrderTime(order);
                            const customerName = order.shippingAddress?.name || '';
                            const city = order.shippingAddress?.city || 'Ilayangudi';
                            const isCancelled = order.status === 'Cancelled';
                            const isProcessing = order.status === 'Processing' || order.status === 'Pending';

                            return (
                                <div
                                    key={order._id || order.id}
                                    className={`${
                                        isCancelled
                                            ? 'bg-gray-100/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                    } rounded-[2rem] border overflow-hidden flex flex-col justify-between transition-transform shadow-xs hover:shadow-sm relative`}
                                >
                                    {/* Black X symbol (no round) instead of delete icon */}
                                    {isProcessing && (
                                        <div className="absolute right-4 top-4 z-10">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOrderToCancel(order);
                                                    setShowCancelPopup(true);
                                                }}
                                                title={t('Cancel Order')}
                                                className="p-1 text-black dark:text-white hover:opacity-70 transition-opacity active:scale-90"
                                            >
                                                <X size={20} className="stroke-[2.5]" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Card Body: Solid Clean Header with Centered Content */}
                                    <div className="pt-5 pb-3 px-5 text-center">
                                        {/* Delivery Charge in Dark Grey */}
                                        <div className="text-center py-1">
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 block mb-0.5">
                                                {t('Delivery Charge')}
                                            </span>
                                            {isFreeDelivery ? (
                                                <div className="flex items-center justify-center gap-2 py-1">
                                                    <span className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight uppercase">
                                                        {t('Free Delivery')}
                                                    </span>
                                                    <CartoonCoin size={30} />
                                                </div>
                                            ) : (
                                                <div className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tight font-sans">
                                                    ₹{deliveryCharge}
                                                </div>
                                            )}
                                        </div>

                                        {/* User Ordered Time in Dark Grey */}
                                        {orderTimeStr && (
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                                                <Clock size={13} className="text-gray-600 dark:text-gray-400" />
                                                <span>{orderTimeStr}</span>
                                            </div>
                                        )}

                                        {/* Customer & Location snippet in Dark Grey */}
                                        {customerName && (
                                            <p className="text-center text-xs text-gray-800 dark:text-gray-100 mt-2 truncate font-bold">
                                                {customerName} • {city} {order.items?.length > 0 ? `(${order.items.length} items)` : ''}
                                            </p>
                                        )}

                                        {/* Scheduled Delivery Time like in OrderDetails.jsx in Dark Grey */}
                                        {(() => {
                                            const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                                            if (!rawTime) return null;
                                            const strTime = String(rawTime).toLowerCase();
                                            if (strTime.includes('instant')) return null;

                                            const formattedRange = formatDeliveryRangeFromDate(rawTime);
                                            if (!formattedRange || formattedRange.toLowerCase().includes('instant')) return null;

                                            return (
                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center shrink-0">
                                                        <Clock size={15} className="text-gray-600 dark:text-gray-300" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 leading-tight">
                                                            {t('Scheduled Delivery')}
                                                        </p>
                                                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                            {formattedRange}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Action Button: Yellow for Processing, Grey for Cancelled */}
                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                                        <ShineActionButton
                                            variant={isCancelled ? 'cancelled' : isProcessing ? 'yellow' : 'green'}
                                            label={t('View Order')}
                                            onClick={() => {
                                                onClose();
                                                onSelectOrder(order);
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* POPUP: Cancel Order Confirmation with Red Swipe Button */}
                <AnimatePresence>
                    {showCancelPopup && orderToCancel && (
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
            </motion.div>
        </AnimatePresence>
    );
};

export default DeliveryOrdersFeedModal;

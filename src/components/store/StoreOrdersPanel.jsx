import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Package, 
    Search, 
    Truck, 
    CheckCircle, 
    Clock, 
    RotateCcw, 
    Phone, 
    MapPin, 
    Calendar, 
    CreditCard, 
    Trash2, 
    AlertTriangle, 
    X, 
    Store,
    RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '../../hooks/queries/useOrders';
import { useStores } from '../../hooks/queries/useStores';
import { useQueryClient } from '@tanstack/react-query';
import { formatOrderBannerTime, formatOrderDateTime } from '../../utils/dateUtils';
import { formatDeliveryRangeFromDate } from '../../utils/storeHelpers';
import { renderBilingualTitle } from '../../utils/titleHelpers';
import { openExternalLink } from '../../utils/linkHelper';
import { playSuccessSound } from '../../utils/soundHelper';
import SwipeActionButton from '../SwipeActionButton';

const StoreOrdersPanel = ({ selectedOrderId = null }) => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: rawOrders = [], isLoading: loadingOrders, refetch } = useOrders();
    const { data: stores = [] } = useStores();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
    const { mutateAsync: deleteOrder } = useDeleteOrder();

    const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
    const [searchQuery, setSearchQuery] = useState('');
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);

    // Identify this store admin's store
    const myStore = useMemo(() => {
        const targetStoreId = String(user?.storeId?._id || user?.storeId || '');
        const cleanMobile = (user?.mobile || user?.phone || '').toString().replace(/\D/g, '').slice(-10);
        return stores.find(s => {
            const sId = String(s._id || s.id || '');
            if (targetStoreId && sId === targetStoreId) return true;
            const sMobile = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
            if (cleanMobile && sMobile && sMobile === cleanMobile) return true;
            return false;
        }) || null;
    }, [user, stores]);

    const myStoreId = String(myStore?._id || myStore?.id || user?.storeId?._id || user?.storeId || '');
    const myStoreName = (myStore?.name || '').trim().toLowerCase();

    // Check if an order item belongs to this store
    const isItemFromMyStore = (item) => {
        if (!item) return false;
        const itemStoreId = String(item.storeId?._id || item.storeId || item.store?._id || item.store?.id || '').trim();
        if (myStoreId && itemStoreId && itemStoreId === myStoreId) return true;
        if (myStoreName) {
            const itemStoreName = (item.storeName || item.storeId?.name || '').trim().toLowerCase();
            if (itemStoreName && itemStoreName === myStoreName) return true;
        }
        return false;
    };

    // Filter orders to ONLY those belonging to this store
    const allOrders = useMemo(() => {
        const list = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
        if (!myStoreId && !myStoreName) return [];

        return list.filter(order => {
            const oStoreId = String(order.storeId?._id || order.storeId || '').trim();
            if (myStoreId && oStoreId && oStoreId === myStoreId) return true;

            if (Array.isArray(order.items)) {
                return order.items.some(isItemFromMyStore);
            }
            return false;
        });
    }, [rawOrders, myStoreId, myStoreName]);

    // Handle order selection / swipe to accept & delivery page
    const handleSelectOrder = (order) => {
        const oId = order._id || order.id;
        localStorage.setItem('active_delivery_order_id', oId);
        localStorage.setItem('active_delivery_stay', 'true');
        navigate(`/admin/delivery-order/${oId}`, {
            state: { order, status: order.status, fromStore: true }
        });
    };

    // Status helpers
    const isProcessing = (status) => ['processing', 'pending', 'order placed', 'confirmed'].includes((status || '').toLowerCase());
    const isOut = (status) => ['out for delivery', 'shipped'].includes((status || '').toLowerCase());
    const isDone = (status) => ['delivered', 'completed'].includes((status || '').toLowerCase());
    const isCancelled = (status) => (status || '').toLowerCase() === 'cancelled';

    // Status tab counts
    const tabCounts = useMemo(() => {
        let pending = 0;
        let outForDelivery = 0;
        let delivered = 0;
        let cancelled = 0;

        allOrders.forEach(o => {
            const s = (o.status || '').toLowerCase();
            if (isProcessing(s)) pending++;
            else if (isOut(s)) outForDelivery++;
            else if (isDone(s)) delivered++;
            else if (isCancelled(s)) cancelled++;
        });

        return {
            total: allOrders.length,
            pending,
            outForDelivery,
            delivered,
            cancelled
        };
    }, [allOrders]);

    // Filter by activeTab and search query
    const filteredOrders = useMemo(() => {
        let list = [...allOrders];

        // Status tab filter
        if (activeTab === 'Processing') {
            list = list.filter(o => isProcessing(o.status));
        } else if (activeTab === 'Out for Delivery') {
            list = list.filter(o => isOut(o.status));
        } else if (activeTab === 'Delivered') {
            list = list.filter(o => isDone(o.status));
        } else if (activeTab === 'Cancelled') {
            list = list.filter(o => isCancelled(o.status));
        }

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase().replace(/^#+/, '');
            list = list.filter(o => {
                const oId = String(o._id || o.id || '').toLowerCase();
                const shortId = oId.slice(-6);
                const name = (o.shippingAddress?.name || o.user || '').toLowerCase();
                const mobile = (o.shippingAddress?.mobile || '').toLowerCase();
                const hasItemMatch = o.items?.some(it => (it.title || it.name || '').toLowerCase().includes(q));

                return oId.includes(q) || shortId.includes(q) || name.includes(q) || mobile.includes(q) || hasItemMatch;
            });
        }

        // Sort: Processing first, then recent
        return list.sort((a, b) => {
            const aProc = isProcessing(a.status) ? 0 : 1;
            const bProc = isProcessing(b.status) ? 0 : 1;
            if (aProc !== bProc) return aProc - bProc;

            const timeA = new Date(a.createdAt || a.date || 0).getTime();
            const timeB = new Date(b.createdAt || b.date || 0).getTime();
            return timeB - timeA;
        });
    }, [allOrders, activeTab, searchQuery]);

    // Handle order cancellation
    const handleConfirmCancel = async () => {
        if (!orderToCancel || isCancelling) return;
        setIsCancelling(true);
        try {
            const id = orderToCancel._id || orderToCancel.id;
            await updateOrderStatus({ id, status: 'Cancelled' });
            playSuccessSound();
            setOrderToCancel(null);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (err) {
            console.error('Failed to cancel order:', err);
            alert(t('Failed to cancel order.'));
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div className="w-full space-y-3.5 pb-20">
            {/* Search Bar - Exactly like Delivery Boy Page */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('Search by Order ID, customer, phone, or product...')}
                    className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#2E5A2E] shadow-xs"
                />
                <Search size={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Filter Tabs - Delivery Boy Styling */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                {[
                    { id: 'All', label: t('All Orders'), count: tabCounts.total },
                    { id: 'Processing', label: t('Pending'), count: tabCounts.pending },
                    { id: 'Out for Delivery', label: t('On Delivery'), count: tabCounts.outForDelivery },
                    { id: 'Delivered', label: t('Delivered'), count: tabCounts.delivered },
                    { id: 'Cancelled', label: t('Cancelled'), count: tabCounts.cancelled }
                ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                                isActive
                                    ? 'bg-[#2E5A2E] text-white shadow-sm'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 border border-gray-200/80 dark:border-gray-700'
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                isActive
                                    ? 'bg-white/25 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Orders Feed List */}
            {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-8 h-8 border-3 border-[#2E5A2E] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-semibold">{t('Loading orders...')}</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-xs">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <Package size={28} />
                    </div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white">
                        {searchQuery ? t('No matching store orders') : t('No orders in this section')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                        {t('Incoming orders from your store will appear here in real-time.')}
                    </p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {filteredOrders.map(order => {
                        const orderId = String(order._id || order.id || '');
                        const shortId = orderId.slice(-6).toUpperCase();
                        const customerName = typeof order.shippingAddress?.name === 'string' ? order.shippingAddress.name : (typeof order.user === 'string' ? order.user : t('Customer'));
                        const customerPhone = typeof order.shippingAddress?.mobile === 'string' ? order.shippingAddress.mobile : '';
                        const street = typeof order.shippingAddress?.street === 'string' ? order.shippingAddress.street : '';
                        const city = typeof order.shippingAddress?.city === 'string' ? order.shippingAddress.city : 'Ilayangudi';
                        const addressText = [street, city].filter(s => typeof s === 'string' && s.trim()).join(', ');
                        const rawScheduleTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                        const scheduleBanner = formatDeliveryRangeFromDate(rawScheduleTime) || rawScheduleTime;

                        // Items belonging strictly to this store
                        const storeItems = (order.items || []).filter(isItemFromMyStore);
                        const storeSubtotal = storeItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);

                        const isCancelledOrder = isCancelled(order.status);
                        const isDeliveredOrder = isDone(order.status);

                        return (
                            <div
                                key={orderId}
                                className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-sm ${
                                    isCancelledOrder
                                        ? 'bg-gray-100/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                }`}
                            >
                                {/* Top Header Row: Time Left & ID Right (matches Delivery boy card header) */}
                                <div className="px-4 pt-3 pb-2 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                            {formatOrderBannerTime(order.createdAt || order.date) || t('New Order')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                            #{shortId}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider line */}
                                <div className="mx-4 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />

                                {/* Card Content */}
                                <div className="pt-2.5 pb-2.5 px-3.5 sm:px-4">
                                    {/* Store Subtotal Header */}
                                    <div className="text-center py-1 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-0.5">
                                            {t('Store Subtotal')} ({storeItems.length} {storeItems.length === 1 ? t('item') : t('items')})
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight font-sans">
                                            ₹{storeSubtotal}
                                        </div>
                                    </div>

                                    {/* Scheduled Delivery Banner */}
                                    {scheduleBanner && (
                                        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-3 py-2 flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
                                                <span>{t('Scheduled')}:</span>
                                            </div>
                                            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                                                {scheduleBanner}
                                            </span>
                                        </div>
                                    )}

                                    {/* Route Timeline Track & Details */}
                                    <div className="flex gap-3 text-left mt-2">
                                        {/* Timeline dots */}
                                        <div className="flex flex-col items-center pt-1.5 shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                            <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[32px]" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                                                    {customerName}
                                                </h3>
                                                {customerPhone && (
                                                    <a
                                                        href={`tel:${customerPhone}`}
                                                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1 border border-emerald-200/80 shrink-0"
                                                    >
                                                        <Phone size={12} />
                                                        <span>{t('Call')}</span>
                                                    </a>
                                                )}
                                            </div>
                                            {addressText && (
                                                <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                                    {addressText}
                                                </p>
                                            )}

                                            {/* Store products items preview */}
                                            <div className="space-y-1 pt-1.5 border-t border-gray-100 dark:border-gray-700/60">
                                                {storeItems.map((item, idx) => {
                                                    const itemTitle = renderBilingualTitle(item.name || item.title || item.adTitle || '', language) || item.title || item.name || '';
                                                    return (
                                                        <div key={idx} className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                                                            <span className="truncate pr-2 font-medium">
                                                                {item.quantity} × {itemTitle}
                                                            </span>
                                                            <span className="font-bold shrink-0">
                                                                ₹{Number(item.price || 0) * Number(item.quantity || 1)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Action: Swipe Action Button (matches delivery boy view) */}
                                <div className="p-3 sm:p-3.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                                    {isDeliveredOrder ? (
                                        <div className="relative overflow-hidden w-full py-3.5 rounded-full bg-[#00C988] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md select-none">
                                            <CheckCircle size={17} className="text-white stroke-[2.8]" />
                                            <span>{t('Delivered Successfully')}</span>
                                        </div>
                                    ) : isCancelledOrder ? (
                                        <div className="w-full py-3.5 text-center text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-full select-none">
                                            {t('Cancelled')}
                                        </div>
                                    ) : (
                                        <SwipeActionButton
                                            variant="yellow"
                                            label={t('VIEW ORDER')}
                                            autoReset={true}
                                            heightClass="h-[50px]"
                                            knobSizeClass="w-[38px] h-[38px]"
                                            onSuccess={() => handleSelectOrder(order)}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cancel Order Popup if invoked */}
            <AnimatePresence>
                {orderToCancel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100010] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-gray-100 dark:border-gray-800 space-y-3"
                        >
                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-xs">
                                <AlertTriangle size={32} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {t('Cancel Order')} #{String(orderToCancel._id || orderToCancel.id || '000000').slice(-6).toUpperCase()}?
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                {t('Are you sure you want to cancel this order?')}
                            </p>

                            <div className="pt-2">
                                <SwipeActionButton
                                    variant="red"
                                    label={t('Swipe to Cancel')}
                                    loadingLabel={t('Cancelling...')}
                                    isLoading={isCancelling}
                                    heightClass="h-[56px]"
                                    knobSizeClass="w-[44px] h-[44px]"
                                    onSuccess={handleConfirmCancel}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setOrderToCancel(null)}
                                disabled={isCancelling}
                                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors uppercase tracking-wider"
                            >
                                {t('Keep Order')}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StoreOrdersPanel;

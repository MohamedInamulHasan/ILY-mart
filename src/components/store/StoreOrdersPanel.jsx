import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    RefreshCw,
    ChevronDown,
    ExternalLink
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

const StoreOrdersPanel = ({ selectedOrderId = null }) => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: rawOrders = [], isLoading: loadingOrders, refetch } = useOrders();
    const { data: stores = [] } = useStores();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
    const { mutateAsync: deleteOrder } = useDeleteOrder();

    const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
            // Direct storeId on order
            const oStoreId = String(order.storeId?._id || order.storeId || '').trim();
            if (myStoreId && oStoreId && oStoreId === myStoreId) return true;

            // Check if any item belongs to this store
            if (Array.isArray(order.items)) {
                return order.items.some(isItemFromMyStore);
            }
            return false;
        });
    }, [rawOrders, myStoreId, myStoreName]);

    // Auto-select order if query param/prop passed
    React.useEffect(() => {
        if (selectedOrderId && allOrders.length > 0) {
            const target = allOrders.find(o => String(o._id || o.id) === String(selectedOrderId));
            if (target) setSelectedOrder(target);
        }
    }, [selectedOrderId, allOrders]);

    // Manual refresh handler
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Calculate count by status for this store
    const stats = useMemo(() => {
        let pending = 0;
        let outForDelivery = 0;
        let delivered = 0;
        let cancelled = 0;
        let totalRevenue = 0;

        allOrders.forEach(o => {
            const s = (o.status || '').toLowerCase();
            if (['processing', 'pending', 'order placed', 'confirmed'].includes(s)) pending++;
            else if (['out for delivery', 'shipped'].includes(s)) outForDelivery++;
            else if (['delivered', 'completed'].includes(s)) delivered++;
            else if (s === 'cancelled') cancelled++;

            if (s !== 'cancelled') {
                const storeItems = (o.items || []).filter(isItemFromMyStore);
                const orderStoreSum = storeItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
                totalRevenue += orderStoreSum;
            }
        });

        return {
            total: allOrders.length,
            pending,
            outForDelivery,
            delivered,
            cancelled,
            totalRevenue
        };
    }, [allOrders]);

    // Status helpers
    const isProcessing = (status) => ['processing', 'pending', 'order placed', 'confirmed'].includes((status || '').toLowerCase());
    const isOut = (status) => ['out for delivery', 'shipped'].includes((status || '').toLowerCase());
    const isDone = (status) => ['delivered', 'completed'].includes((status || '').toLowerCase());
    const isCancelled = (status) => (status || '').toLowerCase() === 'cancelled';

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

    // Handle status change
    const handleUpdateStatus = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus({ id: orderId, status: newStatus });
            playSuccessSound();
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (err) {
            console.error('Failed to update order status:', err);
            alert(t('Failed to update status. Please try again.'));
        } finally {
            setUpdatingOrderId(null);
        }
    };

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

    // Helper to get status badge styling
    const getStatusBadge = (status) => {
        if (isProcessing(status)) {
            return {
                text: t('Processing'),
                bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60',
                dot: 'bg-amber-500 animate-pulse'
            };
        }
        if (isOut(status)) {
            return {
                text: t('Out for Delivery'),
                bg: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60',
                dot: 'bg-sky-500'
            };
        }
        if (isDone(status)) {
            return {
                text: t('Delivered'),
                bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
                dot: 'bg-emerald-500'
            };
        }
        return {
            text: t('Cancelled'),
            bg: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60',
            dot: 'bg-rose-500'
        };
    };

    return (
        <div className="w-full space-y-4 pb-16">
            {/* Top Store Overview Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#CBF9B2]/40 dark:bg-[#2E5A2E]/30 flex items-center justify-center text-[#2E5A2E] dark:text-[#CBF9B2]">
                        <Store size={24} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                            {myStore?.name || t('My Store Delivery Panel')}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            {t('Store Orders & Live Dispatch')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                        <span>{t('Refresh')}</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-3.5 border border-gray-100 dark:border-gray-700 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('Total Orders')}</p>
                    <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-3.5 border border-amber-200/80 dark:border-amber-800/40 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">{t('Pending')}</p>
                    <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1.5">
                        <span>{stats.pending}</span>
                        {stats.pending > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-3.5 border border-sky-200/80 dark:border-sky-800/40 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">{t('On Delivery')}</p>
                    <p className="text-xl sm:text-2xl font-black text-sky-700 dark:text-sky-300 mt-1">{stats.outForDelivery}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-3.5 border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t('Completed')}</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.delivered}</p>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('Search by Order ID, customer, phone, or product...')}
                        className="w-full pl-11 pr-10 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#2E5A2E] shadow-xs"
                    />
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
                    {[
                        { id: 'All', label: t('All Orders'), count: stats.total },
                        { id: 'Processing', label: t('Pending'), count: stats.pending, badgeColor: 'bg-amber-500' },
                        { id: 'Out for Delivery', label: t('On Delivery'), count: stats.outForDelivery, badgeColor: 'bg-sky-500' },
                        { id: 'Delivered', label: t('Delivered'), count: stats.delivered, badgeColor: 'bg-emerald-500' },
                        { id: 'Cancelled', label: t('Cancelled'), count: stats.cancelled, badgeColor: 'bg-rose-500' }
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
            </div>

            {/* Orders Feed List */}
            {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-8 h-8 border-3 border-[#2E5A2E] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-semibold">{t('Loading store orders...')}</p>
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
                        {t('Incoming orders from your store will automatically appear here in real-time.')}
                    </p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {filteredOrders.map(order => {
                        const orderId = String(order._id || order.id || '');
                        const shortId = orderId.slice(-6).toUpperCase();
                        const customerName = order.shippingAddress?.name || t('Customer');
                        const customerPhone = order.shippingAddress?.mobile || '';
                        const street = order.shippingAddress?.street || '';
                        const city = order.shippingAddress?.city || 'Ilayangudi';
                        const addressText = [street, city].filter(Boolean).join(', ');
                        const rawScheduleTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                        const scheduleBanner = formatDeliveryRangeFromDate(rawScheduleTime) || rawScheduleTime;

                        // Items belonging strictly to this store
                        const storeItems = (order.items || []).filter(isItemFromMyStore);
                        const storeSubtotal = storeItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
                        const statusBadge = getStatusBadge(order.status);
                        const isUpdating = updatingOrderId === orderId;

                        return (
                            <motion.div
                                key={orderId}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-sm ${
                                    isCancelled(order.status)
                                        ? 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                }`}
                            >
                                {/* Header Row */}
                                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/40">
                                    <div className="flex items-center gap-2">
                                        <Clock size={15} className="text-gray-400" />
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                            {formatOrderBannerTime(order.createdAt || order.date) || t('New Order')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-black text-gray-700 dark:text-gray-200">
                                            #{shortId}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${statusBadge.bg}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                                            <span>{statusBadge.text}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Order Content */}
                                <div className="p-4 space-y-3.5">
                                    {/* Scheduled Delivery Banner if present */}
                                    {scheduleBanner && (
                                        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-3 py-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                                <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                <span>{t('Scheduled Delivery')}:</span>
                                            </div>
                                            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                                                {scheduleBanner}
                                            </span>
                                        </div>
                                    )}

                                    {/* Customer & Location Box */}
                                    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-3 flex items-start justify-between gap-3">
                                        <div className="space-y-0.5 min-w-0 flex-1">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {customerName}
                                            </h4>
                                            {addressText && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate flex items-center gap-1">
                                                    <MapPin size={12} className="shrink-0 text-gray-400" />
                                                    <span className="truncate">{addressText}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Contact & Map Buttons */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {customerPhone && (
                                                <button
                                                    type="button"
                                                    onClick={() => openExternalLink(`tel:${customerPhone}`)}
                                                    className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                                                    title={t('Call Customer')}
                                                >
                                                    <Phone size={14} />
                                                </button>
                                            )}
                                            {addressText && (
                                                <button
                                                    type="button"
                                                    onClick={() => openExternalLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress?.location || addressText)}`)}
                                                    className="w-8 h-8 rounded-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center shadow-xs active:scale-90 transition-transform"
                                                    title={t('View Location on Map')}
                                                >
                                                    <MapPin size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Store Products List */}
                                    <div className="space-y-2 border-t border-b border-gray-100 dark:border-gray-700/60 py-2.5">
                                        <div className="flex items-center justify-between text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                            <span>{t('Store Items')} ({storeItems.length})</span>
                                            <span>{t('Store Subtotal')}: <strong className="text-gray-900 dark:text-white font-black text-sm">₹{storeSubtotal}</strong></span>
                                        </div>

                                        <div className="space-y-2">
                                            {storeItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        {item.image && (
                                                            <img
                                                                src={item.image}
                                                                alt=""
                                                                className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200 dark:border-gray-700"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold text-gray-900 dark:text-white truncate">
                                                                {renderBilingualTitle(item, language) || item.title || item.name}
                                                            </p>
                                                            {(item.unit || item.size) && (
                                                                <span className="text-[11px] text-gray-500 font-medium">
                                                                    {item.unit || item.size}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                                            {item.quantity} × ₹{item.price}
                                                        </span>
                                                        <p className="font-black text-[#2E5A2E] dark:text-[#CBF9B2]">
                                                            ₹{Number(item.price || 0) * Number(item.quantity || 1)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom Action Footer */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            <CreditCard size={14} className="text-gray-400" />
                                            <span>{order.paymentMethod?.type || t('Cash on Delivery')}</span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 ml-auto">
                                            {/* Details button */}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors"
                                            >
                                                {t('Details')}
                                            </button>

                                            {/* Status transitions */}
                                            {isProcessing(order.status) && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setOrderToCancel(order)}
                                                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                                                    >
                                                        {t('Cancel')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isUpdating}
                                                        onClick={() => handleUpdateStatus(orderId, 'Out for Delivery')}
                                                        className="px-4 py-2 bg-[#2E5A2E] hover:bg-[#245024] text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <Truck size={14} />
                                                        <span>{t('Dispatch Order')}</span>
                                                    </button>
                                                </>
                                            )}

                                            {isOut(order.status) && (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(orderId, 'Delivered')}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
                                                >
                                                    <CheckCircle size={14} />
                                                    <span>{t('Mark Delivered')}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800"
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h3 className="text-base font-black text-gray-900 dark:text-white">
                                    #{String(selectedOrder._id || selectedOrder.id || '').slice(-6).toUpperCase()}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium">
                                    {formatOrderDateTime(selectedOrder.createdAt || selectedOrder.date)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-800"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3.5 space-y-1">
                            <p className="text-xs font-extrabold uppercase text-gray-400">{t('Customer Details')}</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {selectedOrder.shippingAddress?.name || t('Customer')}
                            </p>
                            {selectedOrder.shippingAddress?.mobile && (
                                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                    📞 {selectedOrder.shippingAddress.mobile}
                                </p>
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                📍 {[selectedOrder.shippingAddress?.street, selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.zip].filter(Boolean).join(', ')}
                            </p>
                        </div>

                        {/* Store Items */}
                        <div className="space-y-2">
                            <p className="text-xs font-extrabold uppercase text-gray-400">{t('Items from your store')}</p>
                            {selectedOrder.items?.filter(isItemFromMyStore).map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 text-xs">
                                    <div className="flex items-center gap-2">
                                        {it.image && <img src={it.image} alt="" className="w-9 h-9 rounded-lg object-cover" />}
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{renderBilingualTitle(it, language) || it.title || it.name}</p>
                                            <p className="text-[11px] text-gray-400">{it.unit || it.size}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{it.quantity} × ₹{it.price}</p>
                                        <p className="font-black text-[#2E5A2E] dark:text-[#CBF9B2]">₹{Number(it.price || 0) * Number(it.quantity || 1)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-full py-3 bg-[#2E5A2E] text-white rounded-xl font-bold text-xs active:scale-98 transition-all"
                            >
                                {t('Close')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {orderToCancel && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <motion.div
                        initial={{ scale: 0.94, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800 text-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white">
                                {t('Cancel this order?')}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {t('Are you sure you want to cancel order')} #{String(orderToCancel._id || orderToCancel.id).slice(-6).toUpperCase()}?
                            </p>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                            <button
                                onClick={() => setOrderToCancel(null)}
                                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs"
                            >
                                {t('No, Keep Order')}
                            </button>
                            <button
                                onClick={handleConfirmCancel}
                                disabled={isCancelling}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
                            >
                                {isCancelling ? t('Cancelling...') : t('Yes, Cancel')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default StoreOrdersPanel;

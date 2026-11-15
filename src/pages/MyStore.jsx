import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Package,
    Search,
    Truck,
    CheckCircle,
    Clock,
    RotateCcw,
    X,
    ArrowLeft,
    Bell,
    Store,
    Home
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders } from '../hooks/queries/useOrders';
import { useStores } from '../hooks/queries/useStores';
import { formatOrderDateTime, formatOrderBannerTime } from '../utils/dateUtils';
import { formatDeliveryRangeFromDate } from '../utils/storeHelpers';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import SwipeActionButton from '../components/SwipeActionButton';
import DeliveryOrdersFeedModal from '../components/DeliveryOrdersFeedModal';
import DeliveryOrdersListFeed from '../components/DeliveryOrdersListFeed';
import { registerModalBackHandler, safeNavigateBack } from '../utils/useBackButton';
import { 
    setOverlayStoreSessionActive, 
    setOverlayAuthToken, 
    setOverlayOrdersState, 
    showFloatingOverlay, 
    checkOverlayPermission,
    requestOverlayPermission,
    isNativeAndroid 
} from '../utils/floatingOverlay';
import StoreManagement from './admin/StoreManagement';

const MyStore = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();
    const { t, language } = useLanguage();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    const { data: rawOrders = [], isLoading: loadingOrders } = useOrders();
    const { data: stores = [] } = useStores();

    // Query params for deep-linking (e.g. ?tab=management or ?orderId=...)
    const searchParams = new URLSearchParams(location.search);
    const initialManagement = searchParams.get('tab') === 'management';
    const [showStoreManagement, setShowStoreManagement] = useState(initialManagement);
    const [searchQuery, setSearchQuery] = useState('');
    const [showOrdersFeed, setShowOrdersFeed] = useState(false);
    const [hasOverlayPermission, setHasOverlayPermission] = useState(true);

    // Check overlay permission on mount
    useEffect(() => {
        let isMounted = true;
        const initOverlay = async () => {
            if (!isNativeAndroid()) return;
            const granted = await checkOverlayPermission();
            if (isMounted) setHasOverlayPermission(granted);
        };
        initOverlay();
        return () => { isMounted = false; };
    }, []);

    // Identify this store admin's store
    const myStore = useMemo(() => {
        let savedMobile = '';
        try {
            const saved = JSON.parse(localStorage.getItem('user_saved_address') || 'null');
            savedMobile = (saved?.mobile || saved?.phone || '').toString().replace(/\D/g, '').slice(-10);
        } catch {}
        const explicitStoreId = localStorage.getItem('my_store_id');
        const targetStoreId = String(explicitStoreId || user?.storeId?._id || user?.storeId || '');
        const cleanMobile = (savedMobile || user?.mobile || user?.phone || '').toString().replace(/\D/g, '').slice(-10);
        return stores.find(s => {
            const sId = String(s._id || s.id || '');
            if (targetStoreId && sId === targetStoreId) return true;
            const sMobile = String(s.mobile || s.phone || '').replace(/\D/g, '').slice(-10);
            if (cleanMobile && sMobile && sMobile === cleanMobile) return true;
            if (cleanMobile === '9876543211' && s.name?.toLowerCase().includes('arabian')) return true;
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

    // Filter all orders strictly for this store admin
    const storeOrders = useMemo(() => {
        const list = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
        if (!myStoreId && !myStoreName) return [];

        return list.filter(order => {
            const oStoreId = String(order.storeId?._id || order.storeId || '').trim();
            if (myStoreId && oStoreId && oStoreId === myStoreId) return true;

            if (Array.isArray(order.items)) {
                return order.items.some(isItemFromMyStore);
            }
            return false;
        }).map(order => {
            const itemsFromStore = (order.items || []).filter(isItemFromMyStore);
            const subtotal = itemsFromStore.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
            return {
                ...order,
                storeItems: itemsFromStore,
                storeSubtotal: subtotal
            };
        });
    }, [rawOrders, myStoreId, myStoreName]);

    // Sync store session active with native floating overlay
    useEffect(() => {
        if (!isNativeAndroid() || !myStore) return;
        const sId = String(myStore._id || myStore.id || myStoreId || '');
        const sName = myStore.name || '';
        const enabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
        if (enabled) {
            setOverlayStoreSessionActive(true, sId, sName);
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) setOverlayAuthToken(currentToken);
            const hasActive = storeOrders.some(o => ['accepted', 'out for delivery', 'shipped'].includes(String(o.status || '').toLowerCase().trim()));
            const hasPending = storeOrders.some(o => ['pending', 'processing', 'order placed', 'confirmed'].includes(String(o.status || '').toLowerCase().trim()));
            const hasAnyStoreOrder = hasActive || hasPending;
            setOverlayOrdersState({ hasActive, hasPending });
            checkOverlayPermission().then(granted => {
                setHasOverlayPermission(granted);
                if (granted && hasAnyStoreOrder) showFloatingOverlay();
            });
        }
    }, [myStore, myStoreId, storeOrders]);

    // Check if store admin has an active order they should stay on
    useEffect(() => {
        const activeOrderId = localStorage.getItem('active_delivery_order_id');
        const activeStay = localStorage.getItem('active_delivery_stay');
        if (activeOrderId && activeStay !== 'false') {
            localStorage.setItem('delivery_order_from_store', 'true');
            navigate(`/admin/delivery-order/${activeOrderId}`, { replace: true, state: { fromStore: true } });
        }
    }, [navigate]);

    // Listen for incoming orders in real-time to alert store admin and refresh list
    useEffect(() => {
        if (!socket) return;
        const handleNewOrder = () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        };
        socket.on('order:created', handleNewOrder);
        return () => socket.off('order:created', handleNewOrder);
    }, [socket, queryClient]);

    // Android back button handlers for modals / subviews
    useEffect(() => {
        if (!showStoreManagement) return;
        return registerModalBackHandler(() => setShowStoreManagement(false));
    }, [showStoreManagement]);

    useEffect(() => {
        if (!showOrdersFeed) return;
        return registerModalBackHandler(() => setShowOrdersFeed(false));
    }, [showOrdersFeed]);

    // Helper for reliable order time
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

    // Filter to active delivery order cards in delivery panel
    const displayOrders = useMemo(() => {
        return storeOrders
            .filter(order => {
                const isSearching = Boolean(searchQuery && searchQuery.trim());

                // If not searching, show active delivery cards (Out for Delivery / Shipped)
                if (!isSearching) {
                    const allowedStatuses = ['Out for Delivery', 'Shipped'];
                    return allowedStatuses.includes(order.status);
                }

                // When searching: allow ANY status so typing an ID or customer always reveals the card
                const rawQ = searchQuery.toLowerCase().trim();
                const cleanQ = rawQ.replace(/^#+/, '').replace(/^order\s*(id)?\s*[:#-]?\s*/i, '').trim();

                if (!cleanQ) return true;

                const orderId = String(order._id || order.id || '').toLowerCase();
                const orderIdShort = orderId.slice(-6);
                const fullDisplayId = `#${orderIdShort}`;
                const customOrderNum = String(order.orderNumber || order.orderId || '').toLowerCase();

                const customerName = (order.shippingAddress?.name || order.user || '').toLowerCase();
                const customerMobile = (order.shippingAddress?.mobile || '').toLowerCase();
                const status = (order.status || '').toLowerCase();

                const matchesId = (
                    orderId.includes(cleanQ) ||
                    orderIdShort.includes(cleanQ) ||
                    customOrderNum.includes(cleanQ) ||
                    fullDisplayId.includes(rawQ) ||
                    cleanQ.includes(orderIdShort) ||
                    rawQ.includes(orderIdShort)
                );

                const matchesCustomer = customerName.includes(rawQ) || customerMobile.includes(cleanQ);
                const matchesItems = order.items?.some(item => (item.name || '').toLowerCase().includes(rawQ));

                const matchesProcess = (rawQ.includes('process') || rawQ.includes('pend')) && ['processing', 'pending', 'order placed'].includes(status);
                const matchesCancelled = (rawQ.includes('cancel')) && status === 'cancelled';
                const matchesDelivered = (rawQ.includes('deliver') || rawQ.includes('complete')) && ['delivered', 'completed'].includes(status);
                const matchesAccepted = (rawQ.includes('accept') || rawQ.includes('ship')) && ['accepted', 'shipped', 'out for delivery'].includes(status);
                const matchesStatusDirect = status.includes(rawQ);

                return (
                    matchesId ||
                    matchesCustomer ||
                    matchesItems ||
                    matchesStatusDirect ||
                    matchesProcess ||
                    matchesCancelled ||
                    matchesDelivered ||
                    matchesAccepted
                );
            })
            .slice()
            .sort((a, b) => {
                const aIsPending = ['Pending', 'Processing', 'Order Placed'].includes(a.status);
                const bIsPending = ['Pending', 'Processing', 'Order Placed'].includes(b.status);
                if (aIsPending && !bIsPending) return -1;
                if (!aIsPending && bIsPending) return 1;
                return getOrderTimeMs(b) - getOrderTimeMs(a);
            });
    }, [storeOrders, searchQuery]);

    const displayData = displayOrders;
    const hasActiveCards = displayOrders.length > 0;
    const isLoading = loadingOrders;

    const pendingOrdersCount = useMemo(() => {
        return storeOrders.filter(o => 
            ['Processing', 'Pending', 'Order Placed', 'Confirmed'].includes(o.status)
        ).length;
    }, [storeOrders]);

    // Handle order swipe to active accept & delivery page
    const handleSelectOrder = (order) => {
        const oId = order._id || order.id;
        localStorage.setItem('active_delivery_order_id', oId);
        localStorage.setItem('active_delivery_stay', 'true');
        localStorage.setItem('delivery_order_from_store', 'true');
        navigate(`/admin/delivery-order/${oId}`, {
            state: { order, status: order.status, fromStore: true }
        });
    };

    // Role protection
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#E8EAEF] dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5A2E]"></div>
            </div>
        );
    }

    const roles = Array.isArray(user?.role) ? user.role : [user?.role || 'customer'];
    const isStoreAdmin = roles.includes('store_admin') || roles.includes('admin') || Boolean(user?.storeId);

    if (!user || !isStoreAdmin) {
        setTimeout(() => navigate('/'), 0);
        return null;
    }

    // SUBVIEW: Store & Products Management
    if (showStoreManagement) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-36">
                {/* Clean Header with Back to Delivery Panel */}
                <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3.5 shadow-xs shrink-0">
                    <div className="w-full flex items-center justify-between min-h-[40px]">
                        <button
                            type="button"
                            onClick={() => setShowStoreManagement(false)}
                            title={t('Back to Delivery Panel')}
                            className="p-1.5 text-gray-900 dark:text-white hover:opacity-70 transition-opacity active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft size={22} className="stroke-[2.5]" />
                        </button>

                        <h1 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-center truncate max-w-[220px]">
                            {myStore?.name || t('My Store')}
                        </h1>

                        <div className="w-[30px]" />
                    </div>
                </div>

                <div className="pt-[72px] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <StoreManagement 
                        onBackToOrders={() => setShowStoreManagement(false)} 
                        hideHeader={true}
                    />
                </div>
            </div>
        );
    }

    // MAIN VIEW: Exact Copy of Delivery Panel & Orders List
    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-44">
            {/* Header: Clean White Header with "My Store" Button on Right */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3.5 shadow-xs shrink-0">
                <div className="w-full flex items-center justify-between min-h-[40px]">
                    {/* Left: Bell button if active delivery cards exist, else back button */}
                    {hasActiveCards ? (
                        <button
                            type="button"
                            onClick={() => setShowOrdersFeed(true)}
                            title={t('Orders List')}
                            className="relative p-1.5 text-gray-900 dark:text-white hover:opacity-70 transition-opacity active:scale-95 cursor-pointer"
                        >
                            <Bell size={22} className="stroke-[2.5]" />
                            {pendingOrdersCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 min-w-[20px] bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-xs">
                                    {pendingOrdersCount}
                                </span>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => safeNavigateBack(navigate, '/profile')}
                            title={t('Back')}
                            className="p-1.5 text-gray-900 dark:text-white hover:opacity-70 transition-opacity active:scale-95 cursor-pointer"
                        >
                            <ArrowLeft size={22} className="stroke-[2.5]" />
                        </button>
                    )}

                    {/* Center: Title (Delivery Panel when cards exist, Orders List when no cards) */}
                    <h1 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-center">
                        {hasActiveCards ? t('Delivery Panel') : t('Orders List')}
                    </h1>

                    {/* Right: Home button with shining sheen wave in dark blue like call button */}
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        title={t('Home')}
                        className="relative overflow-hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer select-none"
                    >
                        {/* Animated gleam/sheen wave like call button */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{
                                repeat: Infinity,
                                duration: 2.2,
                                ease: 'easeInOut',
                                repeatDelay: 0.5
                            }}
                        />
                        <Home size={15} className="relative z-10 text-white" />
                        <span className="relative z-10">{t('Home')}</span>
                    </button>
                </div>
            </div>

            <PullToRefreshLayout>
                <div className="pt-[72px]">
                    <div className="px-5 mt-2 max-w-3xl mx-auto pb-40">
                        {/* Permission Warning Banner if Display Over Other Apps is missing */}
                        {!hasOverlayPermission && (
                            <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">⚠️</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">{t('Display Over Other Apps Required')}</p>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-300">{t('Enable permission so floating screen image and order alerts appear')}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={requestOverlayPermission}
                                    className="shrink-0 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                    {t('Allow')}
                                </button>
                            </div>
                        )}

                        {/* Search Bar: Exact style as delivery boy page */}
                        <div className="relative mb-3.5">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('Search by Order ID, Customer, Phone, or Item...')}
                                className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-750 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-[#2E5A2E] shadow-xs"
                            />
                            <Search size={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                    title={t('Clear')}
                                >
                                    <X size={18} className="stroke-[2.5]" />
                                </button>
                            )}
                        </div>

                        {/* Orders List Content */}
                        <div className="space-y-2.5 sm:space-y-3">
                            {isLoading ? (
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/60 overflow-hidden flex flex-col justify-between shadow-xs"
                                        >
                                            <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full blinkit-shimmer shrink-0" />
                                                    <div className="h-4 w-28 rounded-md blinkit-shimmer" />
                                                </div>
                                                <div className="h-4 w-16 rounded-md blinkit-shimmer shrink-0" />
                                            </div>
                                            <div className="mx-4 h-px bg-gray-100 dark:bg-gray-700/50 shrink-0" />
                                            <div className="pt-3 pb-3 px-4">
                                                <div className="flex flex-col items-center py-1.5 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                                                    <div className="h-3 w-28 rounded-full blinkit-shimmer mb-2" />
                                                    <div className="h-10 w-24 rounded-xl blinkit-shimmer" />
                                                </div>
                                                <div className="flex gap-3 text-left mt-3">
                                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 ring-2 ring-emerald-100 shrink-0" />
                                                        <div className="w-[2px] flex-1 bg-gray-200 dark:bg-gray-700 my-1 min-h-[44px]" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 ring-2 ring-emerald-100 shrink-0" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 space-y-2 py-0.5">
                                                        <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                                                        <div className="h-3 w-48 rounded-md blinkit-shimmer" />
                                                        <div className="h-3 w-24 rounded-md blinkit-shimmer" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-3 sm:p-3.5 border-t border-gray-100 dark:border-gray-700/60">
                                                <div className="h-[50px] w-full rounded-full blinkit-shimmer" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : displayData.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {displayData.map(order => {
                                        const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
                                        const customerName = order.shippingAddress?.name || order.user || '';
                                        const street = order.shippingAddress?.street || '';
                                        const city = order.shippingAddress?.city || 'Ilayangudi';
                                        const orderTimeStr = formatOrderDateTime(order.createdAt || order.date);
                                        const isCancelled = order.status === 'Cancelled';
                                        const isDelivered = order.status === 'Delivered' || order.status === 'Completed';
                                        const isOutForDelivery = order.status === 'Out for Delivery' || order.status === 'Shipped';
                                        const isAccepted = order.status === 'Accepted';

                                        const storeSubtotal = order.storeSubtotal !== undefined ? order.storeSubtotal : (order.items || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
                                        const itemsCount = order.storeItems?.length || order.items?.length || 0;

                                        return (
                                            <div
                                                key={order._id || order.id}
                                                className={`${
                                                    isCancelled
                                                        ? 'bg-gray-100/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80'
                                                        : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                                } rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-sm`}
                                            >
                                                {/* Top Header Row: Time Left & ID Right */}
                                                <div className="px-4 pt-3 pb-2 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                                        <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                                            {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                                        </span>
                                                    </div>

                                                    <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                                        #{orderIdShort}
                                                    </span>
                                                </div>

                                                <div className="mx-4 h-px bg-gray-200 dark:bg-gray-700 shrink-0" />

                                                {/* Card Content: Store Subtotal in Center Thick */}
                                                <div className="pt-2.5 pb-2.5 px-3.5 sm:px-4">
                                                    <div className="text-center py-1 mb-1.5 border-b border-gray-100 dark:border-gray-700/60">
                                                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white block mb-0.5">
                                                            {t('Store Subtotal')}
                                                        </span>
                                                        <div className="text-4xl sm:text-5xl font-black text-black dark:text-white tracking-tight font-sans">
                                                            ₹{storeSubtotal}
                                                        </div>
                                                    </div>

                                                    {/* Left-Aligned Details with Route Timeline */}
                                                    <div className="flex gap-3 text-left mt-3">
                                                        <div className="flex flex-col items-center pt-1.5 shrink-0">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                                            <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[36px]" />
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                                        </div>

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

                                                                {itemsCount > 0 && (
                                                                    <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                                                                        <Package size={13} className="text-gray-400 shrink-0" />
                                                                        <span>{itemsCount} {itemsCount === 1 ? t('item') : t('items')}</span>
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Scheduled Delivery Time */}
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

                                                {/* Action Button: Swipe to View Order */}
                                                <div className="p-3 sm:p-3.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                                                    {isDelivered ? (
                                                        <div className="relative overflow-hidden w-full py-3.5 rounded-full bg-[#00C988] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md select-none">
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
                                                        </div>
                                                    ) : isCancelled ? (
                                                        <div className="w-full py-3.5 text-center text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-full">
                                                            {t('Cancelled')}
                                                        </div>
                                                    ) : (
                                                        <SwipeActionButton
                                                            variant={(isOutForDelivery || isAccepted) ? 'blue' : 'yellow'}
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
                            ) : searchQuery.trim() ? (
                                <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-750 shadow-xs p-6">
                                    <Package size={40} className="mx-auto text-gray-400 mb-2.5 opacity-60" />
                                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('No order cards found')}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('No order matching')} "{searchQuery}"</p>
                                </div>
                            ) : (
                                /* When no active cards in delivery panel, show full orders list feed */
                                <DeliveryOrdersListFeed
                                    orders={storeOrders}
                                    searchQuery={searchQuery}
                                    paddingBottomClass="pb-28 sm:pb-32"
                                    isStore={true}
                                    onSelectOrder={handleSelectOrder}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </PullToRefreshLayout>

            {/* Attached Bottom Rectangle Footer - Swipe to Edit Store */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 16px))', paddingTop: '0.85rem' }}
            >
                <div className="max-w-md mx-auto px-4">
                    <SwipeActionButton
                        variant="dark-blue"
                        label={t('Swipe to Edit Store')}
                        loadingLabel={t('Opening Store...')}
                        onSuccess={() => setShowStoreManagement(true)}
                        autoReset={true}
                        heightClass="h-[58px] sm:h-[62px]"
                        knobSizeClass="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px]"
                        textSizeClass="text-sm sm:text-base font-black"
                        iconSize={22}
                    />
                </div>
            </div>

            {/* Store Orders Feed Modal */}
            <DeliveryOrdersFeedModal
                isOpen={showOrdersFeed}
                onClose={() => setShowOrdersFeed(false)}
                orders={storeOrders}
                isStore={true}
                onOpenStore={() => setShowStoreManagement(true)}
                onSelectOrder={(order) => {
                    setShowOrdersFeed(false);
                    handleSelectOrder(order);
                }}
            />
        </div>
    );
};

export default MyStore;
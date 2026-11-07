import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Package,
    Search,
    Truck,
    CheckCircle,
    Clock,
    RotateCcw,
    MapPin,
    RefreshCw,
    LogOut,
    Menu,
    X,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
    ShoppingBag,
    ShoppingCart,
    Wrench,
    ClipboardList,
    Bell,
    Phone,
    Navigation,
    Store,
    CreditCard,
    Check,
    Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import { useQueryClient } from '@tanstack/react-query';
import { useOrders, useUpdateOrderStatus } from '../../hooks/queries/useOrders';
import { useServiceRequests, useUpdateServiceRequestStatus } from '../../hooks/queries/useServiceRequests';
import { useStores } from '../../hooks/queries/useStores';
import { getStoreName, formatDeliveryRangeFromDate } from '../../utils/storeHelpers';
import { formatOrderDateTime, formatOrderBannerTime, formatDeliveryTime } from '../../utils/dateUtils';
import { openExternalLink } from '../../utils/linkHelper';
import { API_BASE_URL } from '../../utils/api';
import LogoutModal from '../../components/LogoutModal';
import { CartoonCoin } from '../../components/CartoonCoin';
import ShineActionButton from '../../components/ShineActionButton';
import SwipeActionButton from '../../components/SwipeActionButton';
import { playSuccessSound } from '../../utils/soundHelper';
import { motion, AnimatePresence } from 'framer-motion';
import PullToRefreshLayout from '../../components/PullToRefreshLayout';
import DeliveryOrdersFeedModal from '../../components/DeliveryOrdersFeedModal';
import DeliveryOrdersListFeed from '../../components/DeliveryOrdersListFeed';
import { 
    isNativeAndroid, 
    checkOverlayPermission, 
    requestOverlayPermission, 
    showFloatingOverlay, 
    hideFloatingOverlay,
    setOverlayAuthToken,
    setOverlayHasAcceptedOrder
} from '../../utils/floatingOverlay';
import { registerModalBackHandler } from '../../utils/useBackButton';

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { t, language } = useLanguage();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const { data: orders = [], isLoading: loadingOrders } = useOrders();
    const { data: serviceRequests = [], isLoading: loadingServices } = useServiceRequests();
    const { data: stores = [] } = useStores();
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
    const { mutateAsync: updateServiceRequestStatus } = useUpdateServiceRequestStatus();

    const [dashboardType, setDashboardType] = useState('Orders'); // 'Orders' | 'Services'
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('delivery_dashboard_tab') || 'Out for Delivery';
    });

    useEffect(() => {
        localStorage.setItem('delivery_dashboard_tab', activeTab);
    }, [activeTab]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showOrdersFeed, setShowOrdersFeed] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [hasOverlayPermission, setHasOverlayPermission] = useState(true);

    // Check if delivery boy has an active order they should stay on
    useEffect(() => {
        const activeOrderId = localStorage.getItem('active_delivery_order_id');
        const activeStay = localStorage.getItem('active_delivery_stay');
        if (activeOrderId && activeStay !== 'false') {
            navigate(`/admin/delivery-order/${activeOrderId}`, { replace: true });
        }
    }, [navigate]);


    // Listen for incoming orders in real-time to alert delivery boy and refresh list
    useEffect(() => {
        if (!socket) return;
        const handleNewOrder = () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            playSuccessSound();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        };
        socket.on('order:created', handleNewOrder);
        return () => socket.off('order:created', handleNewOrder);
    }, [socket, queryClient]);

    const [isFloatingEnabled, setIsFloatingEnabled] = useState(() => {
        const saved = localStorage.getItem('delivery_floating_overlay_enabled');
        return saved !== null ? saved === 'true' : true;
    });

    useEffect(() => {
        if (!showOrdersFeed) return;
        return registerModalBackHandler(() => setShowOrdersFeed(false));
    }, [showOrdersFeed]);

    useEffect(() => {
        if (!showLogoutModal) return;
        return registerModalBackHandler(() => setShowLogoutModal(false));
    }, [showLogoutModal]);

    const toggleFloatingOverlay = async () => {
        const nextState = !isFloatingEnabled;
        setIsFloatingEnabled(nextState);
        localStorage.setItem('delivery_floating_overlay_enabled', String(nextState));
        if (!nextState) {
            await hideFloatingOverlay();
        } else {
            const granted = await checkOverlayPermission();
            setHasOverlayPermission(granted);
            if (!granted) {
                await requestOverlayPermission();
            } else {
                await showFloatingOverlay();
            }
        }
    };

    // Check if there is an accepted delivery card in the panel (Out for Delivery, Shipped, Accepted)
    // Active delivery cards include Processing/Pending/Accepted/Out for Delivery
    // Show alert on mobile screen when app is closed as long as any processing or delivery card is present
    const hasAcceptedCard = useMemo(() => {
        return orders.some(o => ['Processing', 'Pending', 'Order Placed', 'Accepted', 'Out for Delivery', 'Shipped'].includes(o.status));
    }, [orders]);

    // Keep native overlay accepted order state synced whenever orders change
    useEffect(() => {
        if (!isNativeAndroid()) return;
        setOverlayHasAcceptedOrder(hasAcceptedCard);
        if (!hasAcceptedCard) {
            hideFloatingOverlay();
        }
    }, [hasAcceptedCard]);

    // Porter Partner Style Floating Logo: check permission & listen to app state change
    useEffect(() => {
        let isMounted = true;
        let appStateListener = null;

        const initOverlay = async () => {
            if (!isNativeAndroid()) return;

            const granted = await checkOverlayPermission();
            if (isMounted) {
                setHasOverlayPermission(granted);
            }

            // Sync auth token with native background service so orders poll when closed
            const currentToken = localStorage.getItem('authToken');
            if (currentToken) {
                setOverlayAuthToken(currentToken);
            }

            // Only show floating overlay if enabled AND there is an accepted order
            if (isFloatingEnabled && granted && hasAcceptedCard) {
                showFloatingOverlay();
            } else {
                hideFloatingOverlay();
            }

            try {
                const { App } = await import('@capacitor/app');
                appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    const enabled = localStorage.getItem('delivery_floating_overlay_enabled') !== 'false';
                    if (!isActive) {
                        // When app is closed/minimized -> show floating logo ONLY if enabled AND there is an accepted card
                        if (enabled && hasAcceptedCard) {
                            showFloatingOverlay();
                        } else {
                            hideFloatingOverlay();
                        }
                    } else {
                        // When app is reopened -> hide floating logo
                        hideFloatingOverlay();
                    }
                });
            } catch (err) {
                console.warn('Error setting up overlay appStateListener:', err);
            }
        };

        initOverlay();

        return () => {
            isMounted = false;
            if (appStateListener && appStateListener.remove) {
                appStateListener.remove();
            }
            hideFloatingOverlay();
        };
    }, [hasAcceptedCard, isFloatingEnabled]);

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

    const getItemStoreName = (item, order) => {
        if (item.storeName) return item.storeName;
        if (item.storeId) {
            const found = getStoreName(item.storeId, stores);
            if (found && found !== 'Unknown Store') return found;
        }
        if (item.storeId?.name) return item.storeId.name;
        if (order?.storeName) return order.storeName;
        return t('Ilayangudi Store');
    };
    const pendingOrdersCount = orders.filter(o => ['Processing', 'Pending', 'Order Placed'].includes(o.status)).length;

    // Helper to get reliable order timestamp
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
            } catch { }
        }
        return 0;
    };

    const getStatusRank = (status) => {
        switch (status) {
            case 'Accepted':
            case 'Out for Delivery':
            case 'Shipped':
                return 1;
            case 'Processing':
            case 'Pending':
                return 2;
            case 'Delivered':
            case 'Completed':
                return 3;
            case 'Cancelled':
                return 4;
            default:
                return 5;
        }
    };

    // Filter to delivery order cards in delivery panel
    const displayOrders = orders
        .filter(order => {
            const isSearching = Boolean(searchQuery && searchQuery.trim());

            // If searching, show Accepted orders in addition to Out for Delivery / Shipped
            const allowedStatuses = isSearching
                ? ['Out for Delivery', 'Shipped', 'Accepted']
                : ['Out for Delivery', 'Shipped'];

            if (!allowedStatuses.includes(order.status)) return false;

            if (!isSearching) return true;
            const q = searchQuery.toLowerCase().trim();
            const orderId = String(order._id || order.id).toLowerCase();
            const customerName = (order.shippingAddress?.name || order.user || '').toLowerCase();
            const customerMobile = (order.shippingAddress?.mobile || '').toLowerCase();
            const status = (order.status || '').toLowerCase();

            const matchesProcess = (q.includes('process') || q.includes('pend')) && ['processing', 'pending', 'order placed'].includes(status);
            const matchesCancelled = (q.includes('cancel')) && status === 'cancelled';
            const matchesDelivered = (q.includes('deliver') || q.includes('complete')) && ['delivered', 'completed'].includes(status);
            const matchesAccepted = (q.includes('accept')) && status === 'accepted';
            const matchesStatusDirect = status.includes(q);

            return (
                orderId.includes(q) ||
                customerName.includes(q) ||
                customerMobile.includes(q) ||
                matchesStatusDirect ||
                matchesProcess ||
                matchesCancelled ||
                matchesDelivered ||
                matchesAccepted ||
                order.items?.some(item => (item.name || '').toLowerCase().includes(q))
            );
        })
        .slice()
        .sort((a, b) => {
            // New orders (Pending/Processing) prioritized at the top of the list!
            const aIsPending = ['Pending', 'Processing', 'Order Placed'].includes(a.status);
            const bIsPending = ['Pending', 'Processing', 'Order Placed'].includes(b.status);
            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;

            // Within same status group, sort newest first so latest orders are at the top
            return getOrderTimeMs(b) - getOrderTimeMs(a);
        });

    const displayData = displayOrders;
    const hasActiveCards = displayOrders.length > 0;
    const isLoading = loadingOrders;


    const getCardTheme = (status) => {
        switch (status) {
            case 'Processing':
            case 'Pending':
                return {
                    gradient: 'bg-gradient-to-b from-amber-400/25 via-amber-300/10 to-transparent dark:from-amber-600/20 dark:to-transparent',
                    textColor: 'text-amber-600 dark:text-amber-400',
                    labelColor: 'text-amber-700/70 dark:text-amber-300/70',
                    iconColor: 'text-amber-500 dark:text-amber-400',
                    buttonVariant: 'yellow'
                };
            case 'Out for Delivery':
            case 'Shipped':
                return {
                    gradient: 'bg-gradient-to-b from-sky-400/25 via-sky-300/10 to-transparent dark:from-sky-600/20 dark:to-transparent',
                    textColor: 'text-sky-600 dark:text-sky-400',
                    labelColor: 'text-sky-700/70 dark:text-sky-300/70',
                    iconColor: 'text-sky-500 dark:text-sky-400',
                    buttonVariant: 'blue'
                };
            case 'Delivered':
            case 'Completed':
                return {
                    gradient: 'bg-gradient-to-b from-emerald-400/25 via-emerald-300/10 to-transparent dark:from-emerald-600/20 dark:to-transparent',
                    textColor: 'text-[#2E5A2E] dark:text-[#CBF9B2]',
                    labelColor: 'text-[#2E5A2E]/70 dark:text-[#CBF9B2]/70',
                    iconColor: 'text-[#2E5A2E] dark:text-[#CBF9B2]',
                    buttonVariant: 'green'
                };
            case 'Cancelled':
            default:
                return {
                    gradient: 'bg-gradient-to-b from-rose-400/25 via-rose-300/10 to-transparent dark:from-rose-600/20 dark:to-transparent',
                    textColor: 'text-rose-600 dark:text-rose-400',
                    labelColor: 'text-rose-700/70 dark:text-rose-300/70',
                    iconColor: 'text-rose-500 dark:text-rose-400',
                    buttonVariant: 'red'
                };
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed': return 'text-[#2E5A2E] dark:text-[#8bc910] bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800';
            case 'Shipped':
            case 'Out for Delivery':
            case 'In Progress': return 'text-[#0284c7] dark:text-[#38bdf8] bg-[#f0f9ff] dark:bg-blue-900/20 border-[#bae6fd] dark:border-blue-800';
            case 'Processing':
            case 'Pending': return 'text-[#b45309] dark:text-[#fbbf24] bg-[#fffbeb] dark:bg-amber-900/20 border-[#fde68a] dark:border-amber-800';
            case 'Cancelled': return 'text-[#dc2626] dark:text-[#f87171] bg-[#fef2f2] dark:bg-red-900/20 border-[#fecaca] dark:border-red-800';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed': return <CheckCircle size={14} className="mr-1" />;
            case 'Shipped':
            case 'Out for Delivery':
            case 'In Progress': return <Truck size={14} className="mr-1" />;
            case 'Processing':
            case 'Pending': return <Clock size={14} className="mr-1" />;
            case 'Cancelled': return <RotateCcw size={14} className="mr-1" />;
            default: return null;
        }
    };

    const handleCancelOrderClick = async (order) => {
        const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
        const confirmed = window.confirm(`${t('Are you sure you want to cancel order')} #${orderIdShort}?`);
        if (!confirmed) return;

        try {
            await updateOrderStatus({ id: order._id || order.id, status: 'Cancelled' });
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert(t('Failed to cancel order'));
        }
    };

    const updateStatus = async (id, newStatus) => {
        const confirmed = window.confirm(`${t('Are you sure you want to change status to')} ${t(newStatus)}?`);
        if (!confirmed) return;

        try {
            await updateOrderStatus({ id, status: newStatus });
        } catch (error) {
            console.error('Error updating status:', error);
            alert(t('Failed to update status'));
        }
    };

    const handleUpdateServiceStatus = async (id, newStatus) => {
        const confirmed = window.confirm(`${t('Are you sure you want to change status to')} ${t(newStatus)}?`);
        if (!confirmed) return;

        try {
            await updateServiceRequestStatus({ id, status: newStatus });
        } catch (error) {
            console.error('Error updating service status:', error);
            alert(t('Failed to update status'));
        }
    };

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-44">
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    logout();
                    navigate('/login');
                }}
            />

            {/* Header: Clean White Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200/80 dark:border-gray-700 px-4 py-3.5 shadow-xs shrink-0">
                <div className="w-full flex items-center justify-between min-h-[40px]">
                    {/* Left: Bell button if active delivery cards exist, else spacer */}
                    {hasActiveCards ? (
                        <button
                            type="button"
                            onClick={() => setShowOrdersFeed(true)}
                            title={t('Orders List')}
                            className="relative p-1.5 text-gray-900 dark:text-white hover:opacity-70 transition-opacity active:scale-95"
                        >
                            <Bell size={22} className="stroke-[2.5]" />
                            {pendingOrdersCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 min-w-[20px] bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-xs">
                                    {pendingOrdersCount}
                                </span>
                            )}
                        </button>
                    ) : (
                        <div className="w-[34px] shrink-0" />
                    )}

                    {/* Center: Title (Delivery Panel when cards exist, Orders List when no cards) */}
                    <h1 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight text-center">
                        {hasActiveCards ? t('Delivery Panel') : t('Orders List')}
                    </h1>

                    {/* Right: Logout button */}
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        title={t('Logout')}
                        className="p-1.5 text-red-500 hover:opacity-70 transition-opacity active:scale-95"
                    >
                        <LogOut size={22} className="stroke-[2.5]" />
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

                        {/* Zepto-style Search Bar like Order page */}
                        <div className="relative mb-4 sm:mb-5">
                            <input
                                type="text"
                                placeholder={t('Search ID, customer, item, status...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-colors duration-200"
                            />
                            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.2]" size={20} />
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

                        {/* Orders List */}
                        <div className="space-y-2.5 sm:space-y-3">
                            {isLoading ? (
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/60 overflow-hidden flex flex-col justify-between shadow-xs"
                                        >
                                            {/* Top Header Row Skeleton: Time Left & ID Right */}
                                            <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full blinkit-shimmer shrink-0" />
                                                    <div className="h-4 w-28 rounded-md blinkit-shimmer" />
                                                </div>
                                                <div className="h-4 w-16 rounded-md blinkit-shimmer shrink-0" />
                                            </div>

                                            {/* Divider Line */}
                                            <div className="mx-4 h-px bg-gray-100 dark:bg-gray-700/50 shrink-0" />

                                            {/* Card Content Skeleton */}
                                            <div className="pt-3 pb-3 px-4">
                                                {/* Delivery Charge in Center */}
                                                <div className="flex flex-col items-center py-1.5 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                                                    <div className="h-3 w-28 rounded-full blinkit-shimmer mb-2" />
                                                    <div className="h-10 w-24 rounded-xl blinkit-shimmer" />
                                                </div>

                                                {/* Left-Aligned Details with Route Timeline */}
                                                <div className="flex gap-3 text-left mt-3">
                                                    {/* Timeline Track with dots and line */}
                                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 dark:bg-emerald-400/20 ring-2 ring-emerald-100 dark:ring-emerald-950/40 shrink-0" />
                                                        <div className="w-[2px] flex-1 bg-gray-200 dark:bg-gray-700 my-1 min-h-[44px]" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 dark:bg-emerald-400/20 ring-2 ring-emerald-100 dark:ring-emerald-950/40 shrink-0" />
                                                    </div>

                                                    {/* Customer & Address lines */}
                                                    <div className="flex-1 min-w-0 space-y-2 py-0.5">
                                                        {/* Customer Name */}
                                                        <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                                                        {/* Address Street */}
                                                        <div className="h-3 w-48 rounded-md blinkit-shimmer" />
                                                        {/* City */}
                                                        <div className="h-3 w-24 rounded-md blinkit-shimmer" />
                                                        {/* Items count */}
                                                        <div className="h-3 w-20 rounded-md blinkit-shimmer pt-0.5" />

                                                        {/* Scheduled Delivery Time block */}
                                                        <div className="pt-2 space-y-1.5">
                                                            <div className="h-2.5 w-24 rounded-full blinkit-shimmer" />
                                                            <div className="h-4 w-32 rounded-md blinkit-shimmer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom action button skeleton (Swipe button) */}
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
                                        const locationSnippet = street ? `${street}, ${city}` : city;
                                        const deliveryCharge = order.shipping !== undefined && order.shipping !== null
                                            ? order.shipping
                                            : (order.deliveryCharge !== undefined ? order.deliveryCharge : 20);
                                        const isFreeDelivery = Number(deliveryCharge) <= 0;
                                        const orderTimeStr = formatOrderDateTime(order.createdAt || order.date);
                                        const isCancelled = order.status === 'Cancelled';
                                        const isDelivered = order.status === 'Delivered' || order.status === 'Completed';
                                        const isOutForDelivery = order.status === 'Out for Delivery' || order.status === 'Shipped';
                                        const isAccepted = order.status === 'Accepted';

                                        const shineVariant = isCancelled
                                            ? 'cancelled'
                                            : (isOutForDelivery || isAccepted)
                                                ? 'blue'
                                                : isDelivered
                                                    ? 'green'
                                                    : 'yellow';

                                    return (
                                        <div
                                            key={order._id || order.id}
                                            className={`${
                                                isCancelled
                                                    ? 'bg-gray-100/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/80'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                            } rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-sm`}
                                        >
                                            {/* Top Header Row: Time Left & ID Right in grey same thickness, light grey line like green dot line */}
                                            <div className="px-4 pt-3 pb-2 flex items-center justify-between text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 shrink-0">
                                                {/* Left: 🕒 Nov 6, 8.00 PM */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Clock size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                                                    <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 tracking-wide truncate">
                                                        {formatOrderBannerTime(order.createdAt || order.date) || orderTimeStr || t('New Order')}
                                                    </span>
                                                </div>

                                                {/* Right: #Order ID (same font-bold thickness and grey color) */}
                                                <span className="text-sm sm:text-[15px] font-bold text-gray-500 dark:text-gray-400 font-mono shrink-0">
                                                    #{orderIdShort}
                                                </span>
                                            </div>
                                            {/* Light grey line matching green dot line */}
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

                                                {/* Left-Aligned Details with Route Timeline: Green dot before Name -> Black line -> Green dot before Time */}
                                                <div className="flex gap-3 text-left mt-3">
                                                    {/* Timeline Track: Green Dot -> Vertical Black Line -> Green Dot */}
                                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                                        {/* Green dot before Name */}
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />

                                                        {/* Light grey line joining the two dots */}
                                                        <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[36px]" />

                                                        {/* Green dot before Time */}
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950/80 shrink-0" />
                                                    </div>

                                                    {/* Content: Customer details on top, Delivery time on bottom */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                        {/* Customer Details */}
                                                        <div className="space-y-0.5">
                                                            {/* Customer Name */}
                                                            {customerName && (
                                                                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
                                                                    {customerName}
                                                                </h3>
                                                            )}

                                                            {/* Address (Street) below Name */}
                                                            {street && (
                                                                <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                                                    {street}
                                                                </p>
                                                            )}

                                                            {/* City below Address */}
                                                            {city && (
                                                                <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate">
                                                                    {city}
                                                                </p>
                                                            )}

                                                            {/* Items below City */}
                                                            {order.items?.length > 0 && (
                                                                <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-0.5">
                                                                    <Package size={13} className="text-gray-400 shrink-0" />
                                                                    <span>{order.items.length} {order.items.length === 1 ? t('item') : t('items')}</span>
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Scheduled Delivery Time (or Delivery Time) aligned with bottom green dot */}
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

                                            {/* Action Button: Swipe to View Order with related status color */}
                                            <div className="p-3 sm:p-3.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                                                {isDelivered ? (
                                                    <div className="relative overflow-hidden w-full py-3.5 rounded-full bg-[#00C988] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md select-none">
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
                                                        onSuccess={() => {
                                                            const oId = order._id || order.id;
                                                            localStorage.setItem('active_delivery_order_id', oId);
                                                            localStorage.setItem('active_delivery_stay', 'true');
                                                            navigate(`/admin/delivery-order/${oId}`);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                    })}
                                </div>
                            ) : (
                                /* When there is no card in the delivery panel, only show the orders list page */
                                <DeliveryOrdersListFeed
                                    orders={orders}
                                    searchQuery={searchQuery}
                                    paddingBottomClass="pb-12"
                                    onSelectOrder={(order) => {
                                        const oId = order._id || order.id;
                                        localStorage.setItem('active_delivery_order_id', oId);
                                        localStorage.setItem('active_delivery_stay', 'true');
                                        navigate(`/admin/delivery-order/${oId}`, {
                                            state: { order, status: order.status }
                                        });
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </PullToRefreshLayout>

            {/* Attached Bottom Rectangle Footer - Matches Accept & Delivered Footer Size */}
            <div 
                className="fixed bottom-0 inset-x-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pointer-events-auto select-none"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 16px))', paddingTop: '0.85rem' }}
            >
                <div className="max-w-md mx-auto px-4">
                    <SwipeActionButton
                        key={isFloatingEnabled ? 'disable-floating' : 'enable-floating'}
                        variant={isFloatingEnabled ? 'black-shine' : 'outline-white'}
                        label={isFloatingEnabled ? t('Swipe to Disable') : t('Swipe to Enable')}
                        loadingLabel={isFloatingEnabled ? t('Disabling...') : t('Enabling...')}
                        onSuccess={toggleFloatingOverlay}
                        autoReset={true}
                        heightClass="h-[58px] sm:h-[62px]"
                        knobSizeClass="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px]"
                        textSizeClass="text-sm sm:text-base font-black"
                        iconSize={22}
                    />
                </div>
            </div>

            {/* Available Orders Feed Modal (placed outside PullToRefreshLayout to prevent CSS transform conflicts) */}
            <DeliveryOrdersFeedModal
                isOpen={showOrdersFeed}
                onClose={() => setShowOrdersFeed(false)}
                orders={orders}
                onSelectOrder={(order) => {
                    setShowOrdersFeed(false);
                    const oId = order._id || order.id;
                    localStorage.setItem('active_delivery_order_id', oId);
                    localStorage.setItem('active_delivery_stay', 'true');
                    navigate(`/admin/delivery-order/${oId}`, {
                        state: { order, status: order.status }
                    });
                }}
            />
        </div>
    );
};

export default DeliveryDashboard;

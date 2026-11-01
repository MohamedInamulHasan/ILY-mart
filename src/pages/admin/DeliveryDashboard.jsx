import { useState, useEffect } from 'react';
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
    CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOrders, useUpdateOrderStatus } from '../../hooks/queries/useOrders';
import { useServiceRequests, useUpdateServiceRequestStatus } from '../../hooks/queries/useServiceRequests';
import { useStores } from '../../hooks/queries/useStores';
import { getStoreName, formatDeliveryRangeFromDate } from '../../utils/storeHelpers';
import { formatOrderDateTime, formatDeliveryTime } from '../../utils/dateUtils';
import { openExternalLink } from '../../utils/linkHelper';
import { API_BASE_URL } from '../../utils/api';
import LogoutModal from '../../components/LogoutModal';
import { CartoonCoin } from '../../components/CartoonCoin';
import ShineActionButton from '../../components/ShineActionButton';
import { playSuccessSound } from '../../utils/soundHelper';
import { motion, AnimatePresence } from 'framer-motion';
import PullToRefreshLayout from '../../components/PullToRefreshLayout';
import DeliveryOrdersFeedModal from '../../components/DeliveryOrdersFeedModal';
import IncomingOrderModal from '../../components/IncomingOrderModal';
import { 
    isNativeAndroid, 
    checkOverlayPermission, 
    requestOverlayPermission, 
    showFloatingOverlay, 
    hideFloatingOverlay 
} from '../../utils/floatingOverlay';

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const { t, language } = useLanguage();
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
    const [selectedOrderForAccept, setSelectedOrderForAccept] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [hasOverlayPermission, setHasOverlayPermission] = useState(true);

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

            try {
                const { App } = await import('@capacitor/app');
                appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (!isActive) {
                        // When app is closed/minimized -> show floating Porter-style logo on screen
                        showFloatingOverlay();
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
    }, []);

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
    const pendingOrdersCount = orders.filter(o => ['Processing', 'Pending'].includes(o.status)).length;

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

    // Filter to Out for Delivery order cards in delivery panel
    const displayOrders = orders
        .filter(order => {
            // "only put the out for delivery order cards in the delivery panel"
            if (!['Out for Delivery', 'Shipped'].includes(order.status)) return false;

            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const orderId = String(order._id || order.id).toLowerCase();
            const customerName = (order.shippingAddress?.name || order.user || '').toLowerCase();
            const customerMobile = (order.shippingAddress?.mobile || '').toLowerCase();
            return orderId.includes(q) || customerName.includes(q) || customerMobile.includes(q) ||
                order.items?.some(item => (item.name || '').toLowerCase().includes(q));
        })
        .slice()
        .sort((a, b) => getOrderTimeMs(a) - getOrderTimeMs(b));

    const displayData = displayOrders;
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
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-48">
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    logout();
                    navigate('/login');
                }}
            />

            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#2E5A2E]/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button
                                type="button"
                                onClick={() => setShowOrdersFeed(true)}
                                title={t('Orders List')}
                                className="relative w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/90 rounded-full text-black transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50"
                            >
                                <Bell size={20} className="text-black stroke-[2.2]" />
                                {pendingOrdersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 min-w-[20px] bg-red-500 text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                                        {pendingOrdersCount}
                                    </span>
                                )}
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-900 tracking-tight leading-tight">
                                {t('Delivery Panel')}
                            </h1>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-600 mt-0.5">
                                {t('Manage Deliveries')}
                            </p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-red-600 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <PullToRefreshLayout>
                <div className="pt-[95px]">
                    <div className="px-5 mt-2 max-w-3xl mx-auto">
                        {/* Porter-style Floating Logo Banner (when permission not yet granted on Android) */}
                        {isNativeAndroid() && !hasOverlayPermission && (
                            <div className="mb-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-xs">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xl">🔘</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                            {t('Enable Floating Screen Logo')}
                                        </p>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                            {t('Show app logo on screen when closed, like Porter Partner')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await requestOverlayPermission();
                                        setTimeout(async () => {
                                            const g = await checkOverlayPermission();
                                            setHasOverlayPermission(g);
                                        }, 1000);
                                    }}
                                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-transform"
                                >
                                    {t('Enable')}
                                </button>
                            </div>
                        )}

                        {/* Search Pill */}
                        <div className="relative mb-6">
                            <input
                                type="text"
                                placeholder={t('Search ID, customer, item...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-10 py-3.5 rounded-full border border-gray-100/50 dark:border-gray-700 bg-white dark:bg-gray-800 text-[14px] text-gray-900 dark:text-white focus:outline-none shadow-sm dark:placeholder-gray-500 transition-all duration-300"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Orders List */}
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 animate-pulse border border-gray-100 dark:border-gray-700 h-48" />
                                    ))}
                                </div>
                            ) : displayData.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {displayData.map(order => {
                                        const orderIdShort = String(order._id || order.id || '000000').slice(-6).toUpperCase();
                                        const customerName = order.shippingAddress?.name || order.user || '';
                                        const city = order.shippingAddress?.city || 'Ilayangudi';
                                        const deliveryCharge = order.shipping !== undefined && order.shipping !== null
                                            ? order.shipping
                                            : (order.deliveryCharge !== undefined ? order.deliveryCharge : 20);
                                        const isFreeDelivery = Number(deliveryCharge) <= 0;
                                        const orderTimeStr = formatOrderDateTime(order.createdAt || order.date);
                                        const isCancelled = order.status === 'Cancelled';
                                        const isDelivered = order.status === 'Delivered' || order.status === 'Completed';
                                        const isOutForDelivery = order.status === 'Out for Delivery' || order.status === 'Shipped';

                                        const shineVariant = isCancelled
                                            ? 'cancelled'
                                            : isOutForDelivery
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
                                            } rounded-[2rem] border overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-sm`}
                                        >
                                            {/* Card Top: Solid Clean Header with Centered Content */}
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

                                                {/* Ordered Time with Clock in Dark Grey */}
                                                {orderTimeStr && (
                                                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
                                                        <Clock size={13} className="text-gray-600 dark:text-gray-400" />
                                                        <span>{orderTimeStr}</span>
                                                    </div>
                                                )}

                                                {/* Customer Name • City (items count) in Dark Grey */}
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

                                                {/* View Order: Green Shine Button without arrow */}
                                                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-750">
                                                    <ShineActionButton
                                                        variant="green"
                                                        label={t('View Order')}
                                                        onClick={() => setSelectedOrderForAccept(order)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <ShoppingBag size={24} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                        {t("No orders found")}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('No tasks in this category.')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Available Orders Feed Modal (triggered by Bell icon, sorted Oldest to Newest) */}
                <DeliveryOrdersFeedModal
                    isOpen={showOrdersFeed}
                    onClose={() => setShowOrdersFeed(false)}
                    orders={orders}
                    onSelectOrder={(order) => {
                        setSelectedOrderForAccept(order);
                    }}
                />

                {/* Incoming Order Accept Modal (opened when clicking View on any card) */}
                <AnimatePresence>
                    {selectedOrderForAccept && (
                        <IncomingOrderModal
                            key={selectedOrderForAccept._id || selectedOrderForAccept.id}
                            order={selectedOrderForAccept}
                            onClose={() => setSelectedOrderForAccept(null)}
                            onAccepted={(order) => {
                                setSelectedOrderForAccept(null);
                                setActiveTab('Out for Delivery');
                            }}
                            onDelivered={(order) => {
                                setSelectedOrderForAccept(null);
                                setActiveTab('Delivered');
                            }}
                            onCancelled={(order) => {
                                setSelectedOrderForAccept(null);
                                setActiveTab('Cancelled');
                            }}
                        />
                    )}
                </AnimatePresence>

            </PullToRefreshLayout>
        </div>
    );
};

export default DeliveryDashboard;

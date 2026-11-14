import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Search, Truck, CheckCircle, Clock, RotateCcw, ShoppingCart, Trash2, AlertTriangle, X, Store, ArrowLeft, MoreHorizontal, ShoppingBag } from 'lucide-react';
import { useOrders, useDeleteOrder } from '../hooks/queries/useOrders';
import { useStores } from '../hooks/queries/useStores';
import { useData } from '../context/DataContext';
import { renderBilingualTitle, getSelectedUnitDisplay } from '../utils/titleHelpers';
import { getStoreName } from '../utils/storeHelpers';
import { useLanguage } from '../context/LanguageContext';
import { safeNavigateBack } from '../utils/useBackButton';
import { formatOrderDateTime, formatDeliveryTime } from '../utils/dateUtils';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Orders = () => {
    const isItemFree = (item) => Boolean(
    item && (item.isGold === true || (item.product && item.product.isGold === true) || item.deliveryCharge === 0 || item.isFreeDelivery === true || item.freeDelivery === true)
);
    const navigate = useNavigate();
    const { user } = useAuth();
    const roles = Array.isArray(user?.role) ? user.role : [user?.role || 'customer'];
    const isAdmin = roles.includes('admin');
    
    let fallbackSavedMobile = '';
    try {
        const saved = JSON.parse(localStorage.getItem('user_saved_address') || 'null');
        fallbackSavedMobile = saved?.mobile || saved?.phone || '';
    } catch {}

    let userInfoMobile = '';
    try {
        const u = JSON.parse(localStorage.getItem('userInfo') || 'null');
        userInfoMobile = u?.mobile || u?.phone || u?.address?.mobile || '';
    } catch {}

    const currentMobile = (
        user?.mobile || 
        user?.phone || 
        user?.address?.mobile || 
        user?.address?.phone || 
        user?.shippingAddress?.mobile || 
        fallbackSavedMobile || 
        userInfoMobile || 
        ''
    ).toString();

    const active10DigitMobile = currentMobile ? currentMobile.replace(/\D/g, '').slice(-10) : '';
    const { data: orders = [], isLoading: loadingOrders } = useOrders({ myOrders: true, mobile: active10DigitMobile });
    const { cartCount } = useCart();
    const { data: stores = [] } = useStores();
    const { mutate: deleteOrder } = useDeleteOrder();

    // const { orders, deleteOrder, stores } = useData(); // Refactored
    const { t, language } = useLanguage();
    const { setIsFooterHidden } = useData();
    
    const [searchQuery, setSearchQuery] = useState('');

    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, orderId: null });

    useEffect(() => {
        setIsFooterHidden(deleteConfirmation.isOpen);
        return () => setIsFooterHidden(false);
    }, [deleteConfirmation.isOpen, setIsFooterHidden]);

    // Strictly enforce showing orders for this user's mobile number only
    const userOrdersOnly = orders.filter(order => {
        const orderPhone = (
            order.shippingAddress?.mobile || 
            order.shippingAddress?.phone || 
            order.phone || 
            order.user?.mobile || 
            order.user?.phone || 
            ''
        ).toString().replace(/\D/g, '').slice(-10);

        if (active10DigitMobile) {
            return orderPhone === active10DigitMobile;
        }

        // If no mobile number is known yet, match user ID if available
        if (user?._id) {
            const orderUserId = typeof order.user === 'object' ? order.user?._id : order.user;
            return String(orderUserId) === String(user._id);
        }

        return false;
    });

    const filteredOrders = userOrdersOnly.filter(order => {
        const rawTrimmed = (searchQuery || '').trim();
        if (!rawTrimmed) return true;

        const query = rawTrimmed.toLowerCase();
        // Remove leading '#' or 'order' prefix if present
        const cleanQ = query.replace(/^#+/, '').replace(/^order\s*(id)?\s*[:#-]?\s*/i, '').trim();

        // If user typed only '#', keep all orders visible so typing an ID doesn't show "No orders found"
        if (!cleanQ) return true;

        const orderId = String(order._id || order.id || '').toLowerCase();
        const orderIdShort = orderId.slice(-6);
        const fullDisplayId = `#${orderIdShort}`;
        const customOrderNum = String(order.orderNumber || order.orderId || '').toLowerCase();
        const customerName = (order.shippingAddress?.name || order.user?.name || '').toLowerCase();
        const customerMobile = (order.shippingAddress?.mobile || order.shippingAddress?.phone || '').toLowerCase();
        const status = (order.status || '').toLowerCase();

        const matchesId = (
            orderId.includes(cleanQ) ||
            orderIdShort.includes(cleanQ) ||
            customOrderNum.includes(cleanQ) ||
            fullDisplayId.includes(query) ||
            cleanQ.includes(orderIdShort) ||
            query.includes(orderIdShort) ||
            customerName.includes(cleanQ) ||
            customerMobile.includes(cleanQ)
        );

        const matchesProcess = (query.includes('process') || query.includes('pend')) && ['processing', 'pending', 'order placed'].includes(status);
        const matchesCancelled = (query.includes('cancel')) && status === 'cancelled';
        const matchesDelivered = (query.includes('deliver') || query.includes('complete')) && ['delivered', 'completed'].includes(status);
        const matchesAccepted = (query.includes('accept') || query.includes('ship')) && ['accepted', 'shipped', 'out for delivery'].includes(status);
        const matchesStatusDirect = status.includes(query) || status.includes(cleanQ);

        return (
            matchesId ||
            matchesStatusDirect ||
            matchesProcess ||
            matchesCancelled ||
            matchesDelivered ||
            matchesAccepted ||
            order.items?.some(item => {
                const itemName = (item.name || item.adTitle || '').toLowerCase();
                const storeName = (item.storeName || item.storeId?.name || getStoreName(item.storeId, stores) || '').toLowerCase();
                return itemName.includes(query) || itemName.includes(cleanQ) || storeName.includes(query) || storeName.includes(cleanQ);
            })
        );
    });

    const getStatusText = (status) => {
        return t(status);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed':
                return 'bg-emerald-600/80 text-white';
            case 'Shipped':
            case 'Out for Delivery':
            case 'Accepted':
                return 'bg-sky-600/80 text-white';
            case 'Processing':
            case 'Pending':
                return 'bg-amber-500/80 text-white';
            case 'Cancelled':
                return 'bg-rose-600/80 text-white';
            default:
                return 'bg-gray-600/80 text-white';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered':
            case 'Completed':
                return <CheckCircle size={13} className="mr-1 stroke-[2.5] text-white" />;
            case 'Shipped':
            case 'Out for Delivery':
            case 'Accepted':
                return <Truck size={13} className="mr-1 stroke-[2.5] text-white" />;
            case 'Processing':
            case 'Pending':
                return <Clock size={13} className="mr-1 stroke-[2.5] text-white" />;
            case 'Cancelled':
                return <RotateCcw size={13} className="mr-1 stroke-[2.5] text-white" />;
            default:
                return null;
        }
    };

    const getCardBorderColor = (status) => {
        switch (status) {
            case 'Delivered': return 'border-l-[#2E5A2E] dark:border-l-[#CBF9B2] shadow-green-100 dark:shadow-green-900/20';
            case 'Shipped':
            case 'Out for Delivery': return 'border-l-blue-500 dark:border-l-blue-400 shadow-blue-100 dark:shadow-blue-900/20';
            case 'Processing': return 'border-l-amber-500 dark:border-l-amber-400 shadow-amber-100 dark:shadow-amber-900/20';
            case 'Cancelled': return 'border-l-red-500 dark:border-l-red-400 shadow-red-100 dark:shadow-red-900/20';
            default: return 'border-l-gray-300 dark:border-l-gray-600 shadow-gray-100 dark:shadow-gray-900/20';
        }
    };




    // Helper for emergency logout
    const handleEmergencyLogout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
    };

    // NO BLOCKING LOADER: Allow the page structure to render immediately
    // We handle 'loadingOrders' state inside the return block by showing a beautiful skeleton loader.

    return (
        <div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-20 sm:pb-24 transition-colors duration-200 w-full relative">
            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={() => safeNavigateBack(navigate, '/')} className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50">
                                <ArrowLeft size={19} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight">{t('My Orders')}</h1>
                            <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{t('Track packages')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => navigate('/cart')}
                                className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                            >
                                <ShoppingCart size={19} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-[18px] w-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="pt-[88px]">
                <div className="px-4 mt-0 max-w-3xl mx-auto pb-10 sm:pb-14">
                    {/* Zepto-style Search Bar */}
                    <div className="relative mb-4 sm:mb-5">
                        <input
                            type="text"
                            placeholder={t('Search orders, items...')}
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
                    <div className="space-y-3 sm:space-y-3.5">
                        {loadingOrders ? (
                            // Blinkit-style Orders Skeleton Loader
                            <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 sm:p-5 shadow-sm"
                                    >
                                        {/* Top Header: Package icon box + Order ID/Date + Status Badge */}
                                        <div className="flex justify-between items-start gap-2 mb-3 pb-2.5 border-b border-gray-100/80 dark:border-gray-700/40">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-lg blinkit-shimmer flex-shrink-0" />
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="h-4 w-24 rounded-md blinkit-shimmer" />
                                                    <div className="h-3 w-32 rounded-md blinkit-shimmer" />
                                                </div>
                                            </div>
                                            <div className="h-6 w-20 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>

                                        {/* Items Section: 2 item rows matching real card */}
                                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {[1, 2].map((itemIdx) => (
                                                <div key={itemIdx} className="py-2.5 flex items-center gap-3 first:pt-0">
                                                    {/* 14x14 (56px) rounded product image skeleton */}
                                                    <div className="h-14 w-14 rounded-xl blinkit-shimmer flex-shrink-0" />
                                                    <div className="flex-1 space-y-1.5 min-w-0">
                                                        {/* Product title */}
                                                        <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                                        {/* Store name */}
                                                        <div className="h-3 w-2/5 rounded-md blinkit-shimmer" />
                                                        {/* Price & Quantity badge */}
                                                        <div className="flex items-center justify-between pt-0.5">
                                                            <div className="h-4 w-16 rounded-md blinkit-shimmer" />
                                                            <div className="h-5 w-8 rounded-md blinkit-shimmer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Bottom Footer: Total Amount + Details */}
                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/80 flex justify-between items-center">
                                            <div className="space-y-1">
                                                <div className="h-2.5 w-16 rounded-full blinkit-shimmer" />
                                                <div className="h-5 w-20 rounded-md blinkit-shimmer" />
                                            </div>
                                            <div className="h-4 w-14 rounded-md blinkit-shimmer" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredOrders.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                            {filteredOrders.map(order => (
                                <div
                                    key={order._id || order.id}
                                    onClick={() => navigate(`/orders/${order._id || order.id}`)}
                                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 cursor-pointer group relative"
                                >

                                    <div className="p-4 sm:p-5">
                                        <div className="flex justify-between items-center gap-2 mb-3 pb-2.5 border-b border-gray-100/60 dark:border-gray-700/40">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <div className="p-1.5 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2] flex-shrink-0">
                                                    <Package size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate">#{String(order._id || order.id).slice(-6).toUpperCase()}</p>
                                                    <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {formatOrderDateTime(order.createdAt || order.date)}
                                                    </p>
                                                    {isAdmin && (order.shippingAddress?.name || order.shippingAddress?.mobile) && (
                                                        <p className="text-[11px] font-semibold text-[#2E5A2E] dark:text-[#CBF9B2] truncate mt-0.5">
                                                            {order.shippingAddress?.name || t('Customer')}{order.shippingAddress?.mobile ? ` • ${order.shippingAddress.mobile}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] md:text-xs font-bold text-white shadow-xs select-none ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="font-bold text-white">{getStatusText(order.status)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {order.items?.slice(0, 2).map((item, idx) => (
                                                <div key={idx} className="py-2.5 flex items-center gap-3 first:pt-0">
                                                    <div className="h-14 w-14 rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">
                                                        {isItemFree(item) && (
                                                            <div className="absolute top-0 left-0 right-0 z-[10] bg-[#E11D48] text-white text-[5.5px] font-bold uppercase tracking-tight py-0.5 text-center leading-none shadow-xs select-none pointer-events-none whitespace-nowrap overflow-hidden">
                                                                {t('Free Delivery')}
                                                            </div>
                                                        )}
                                                        <img
                                                            src={item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))
                                                                ? item.image
                                                                : ((item.product?._id || item.product)
                                                                    ? `${API_BASE_URL}/products/${item.product._id || item.product}/image`
                                                                    : "https://via.placeholder.com/150?text=No+Image")}
                                                            alt={item.adTitle || item.name}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=No+Image"; }}
                                                        />

                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <h4 className="mb-0.5 leading-tight">
                                                            {renderBilingualTitle(t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title, language, {
                                                                hideTag: true,
                                                                mainClassName: 'text-sm font-semibold text-gray-900 dark:text-white',
                                                                subClassName: 'text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight'
                                                            })}
                                                        </h4>
                                                        {(item.storeId || item.storeName) && (
                                                            <p className="text-[11px] font-normal text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                                                {getStoreName(item.storeId, stores) || item.storeName}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between mt-0.5">
                                                            <div className="flex items-baseline gap-1.5">
                                                                <span className="text-sm font-bold text-gray-900 dark:text-white">₹{((item.price * item.quantity) || 0).toFixed(0)}</span>
                                                                {(() => {
    const unitDisplay = getSelectedUnitDisplay(item);
    if (!unitDisplay) return null;
    return (
        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            ({unitDisplay})
        </span>
    );
})()}
                                                            </div>
                                                            <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded-md text-xs font-bold text-gray-500 dark:text-gray-400">
                                                                x{item.quantity}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {order.items.length > 2 && (
                                                <div className="py-2 text-sm text-gray-500 dark:text-gray-400">
                                                    +{order.items.length - 2} {t('more items')}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/80 flex justify-between items-center">
                                            <div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-none mb-1">{t('Total Amount')}</p>
                                                <p className="font-bold text-[15px] sm:text-[16px] text-gray-900 dark:text-white leading-tight">₹{order.total.toFixed(0)}</p>
                                            </div>
                                            <div className="text-[#2E5A2E] dark:text-[#CBF9B2] text-xs font-semibold hover:opacity-80 transition-opacity">
                                                {t('Details')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag size={24} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('No orders found')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">{active10DigitMobile ? `${t('No orders placed yet for')} +91 ${active10DigitMobile}` : t('Try adjusting your search or filter to find what you\'re looking for.')}</p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center px-4 py-2 bg-[#2E5A2E] dark:bg-[#CBF9B2] hover:bg-[#1E3A1E] dark:hover:bg-[#a6d98e] text-white dark:text-gray-900 rounded-xl transition-all duration-300 text-sm font-bold active:scale-95"
                                >
                                    {t('Start Shopping')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('Delete Order')}</h3>
                                </div>
                                <button
                                    onClick={() => setDeleteConfirmation({ isOpen: false, orderId: null })}
                                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {t('Are you sure you want to delete this order? This action cannot be undone.')}
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteConfirmation({ isOpen: false, orderId: null })}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors"
                                >
                                    {t('Cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        if (deleteConfirmation.orderId) {
                                            deleteOrder(deleteConfirmation.orderId);
                                            setDeleteConfirmation({ isOpen: false, orderId: null });
                                        }
                                    }}
                                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors"
                                >
                                    {t('Delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
};

export default Orders;

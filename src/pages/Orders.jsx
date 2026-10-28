import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Search, Truck, CheckCircle, Clock, RotateCcw, ShoppingCart, Trash2, AlertTriangle, X, Store, ArrowLeft, MoreHorizontal, ShoppingBag } from 'lucide-react';
import { useOrders, useDeleteOrder } from '../hooks/queries/useOrders';
import { useStores } from '../hooks/queries/useStores';
import { useData } from '../context/DataContext';
import { getStoreName } from '../utils/storeHelpers';
import { useLanguage } from '../context/LanguageContext';
import { formatOrderDateTime, formatDeliveryTime } from '../utils/dateUtils';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { useCart } from '../context/CartContext';
import { API_BASE_URL } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Orders = () => {
    const navigate = useNavigate();
    const { data: orders = [], isLoading: loadingOrders } = useOrders();
    const { cartCount } = useCart();
    const { data: stores = [] } = useStores();
    const { mutate: deleteOrder } = useDeleteOrder();

    // const { orders, deleteOrder, stores } = useData(); // Refactored
    const { t, language } = useLanguage();
    const { setIsFooterHidden } = useData();
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const activeTabElement = document.getElementById('active-order-tab');
        if (activeTabElement) {
            activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }, [activeTab]);

    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, orderId: null });

    useEffect(() => {
        setIsFooterHidden(deleteConfirmation.isOpen);
        return () => setIsFooterHidden(false);
    }, [deleteConfirmation.isOpen, setIsFooterHidden]);



    const tabs = ['All', 'Active', 'Completed', 'Cancelled'];

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            searchQuery === '' ||
            String(order._id || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items?.some(item => {
                const itemName = (item.name || item.adTitle || '').toLowerCase();
                const storeName = (item.storeName || item.storeId?.name || getStoreName(item.storeId, stores) || '').toLowerCase();
                const query = searchQuery.toLowerCase();
                return itemName.includes(query) || storeName.includes(query);
            });

        // If searching, ignore tab filter to find orders everywhere
        if (searchQuery !== '') return matchesSearch;

        const matchesTab =
            activeTab === 'All' ? true :
                activeTab === 'Active' ? ['Processing', 'Shipped', 'Out for Delivery'].includes(order.status) :
                    activeTab === 'Completed' ? order.status === 'Delivered' :
                        activeTab === 'Cancelled' ? order.status === 'Cancelled' : true;

        return matchesTab;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'text-[#2E5A2E] dark:text-[#CBF9B2] bg-green-50 dark:bg-[#CBF9B2]/10 border-green-100 dark:border-[#CBF9B2]/20';
            case 'Shipped':
            case 'Out for Delivery': return 'text-[#0284c7] dark:text-[#38bdf8] bg-[#f0f9ff] dark:bg-blue-900/20 border-[#bae6fd] dark:border-blue-800';
            case 'Processing': return 'text-[#b45309] dark:text-[#fbbf24] bg-[#fffbeb] dark:bg-amber-900/20 border-[#fde68a] dark:border-amber-800';
            case 'Cancelled': return 'text-[#dc2626] dark:text-[#f87171] bg-[#fef2f2] dark:bg-red-900/20 border-[#fecaca] dark:border-red-800';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered': return <CheckCircle size={16} className="mr-1.5" />;
            case 'Shipped':
            case 'Out for Delivery': return <Truck size={16} className="mr-1.5" />;
            case 'Processing': return <Clock size={16} className="mr-1.5" />;
            case 'Cancelled': return <RotateCcw size={16} className="mr-1.5" />;
            default: return null;
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
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-48">
            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={() => navigate(-1)} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50">
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('My Orders')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Track packages')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => navigate('/cart')}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                            >
                                <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <PullToRefreshLayout>
                <div className="pt-[95px]">
                <div className="px-5 mt-2 max-w-3xl mx-auto">
                    {/* Search Pill */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder={t('Search orders, items...')}
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

                    {/* Tabs */}
                    <div className="flex overflow-x-auto pb-4 mb-4 scrollbar-hide gap-3 w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                id={activeTab === tab ? "active-order-tab" : undefined}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors duration-300 ${
                                    activeTab === tab
                                    ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-transparent'
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                        {loadingOrders ? (
                            // Blinkit-style Orders Skeleton Loader
                            <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700/60 p-6 shadow-sm space-y-5"
                                    >
                                        {/* Top Header: Package Icon + Order ID/Date + Status Pill */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-xl blinkit-shimmer flex-shrink-0" />
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="h-4 w-28 rounded-md blinkit-shimmer" />
                                                    <div className="h-3 w-36 rounded-md blinkit-shimmer" />
                                                </div>
                                            </div>
                                            <div className="h-6 w-24 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>

                                        {/* Items Section: Product image + Details */}
                                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {[1, 2].map((itemIdx) => (
                                                <div key={itemIdx} className="py-3 flex items-center gap-4 first:pt-0">
                                                    <div className="h-16 w-16 rounded-2xl blinkit-shimmer flex-shrink-0" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                                        <div className="h-3 w-1/3 rounded-md blinkit-shimmer" />
                                                        <div className="h-3.5 w-20 rounded-md blinkit-shimmer" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Bottom Footer: Total Amount + View Details */}
                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                                            <div className="space-y-1">
                                                <div className="h-2.5 w-16 rounded-full blinkit-shimmer" />
                                                <div className="h-5 w-20 rounded-md blinkit-shimmer" />
                                            </div>
                                            <div className="h-9 w-28 rounded-full blinkit-shimmer" />
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
                                    className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 cursor-pointer group relative"
                                >

                                    <div className="p-6">
                                        <div className="flex justify-between items-start gap-2 mb-4">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2] flex-shrink-0">
                                                    <Package size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate">#{String(order._id || order.id).slice(-6).toUpperCase()}</p>
                                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {formatOrderDateTime(order.createdAt || order.date)}
                                                        {order.scheduledDeliveryTime && (
                                                            <span className="text-[#2E5A2E] dark:text-[#CBF9B2] ml-1">
                                                                • {formatDeliveryTime(order.scheduledDeliveryTime)}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="ml-1">{t(order.status)}</span>
                                                </div>
                                                {!['Processing', 'Shipped', 'Out for Delivery', 'Delivered'].includes(order.status) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteConfirmation({ isOpen: true, orderId: order._id || order.id });
                                                        }}
                                                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title={t("Delete Order")}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {order.items?.slice(0, 2).map((item, idx) => (
                                                <div key={idx} className="py-4 flex items-center gap-4 first:pt-0">
                                                    <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">
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
                                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                                            {((item.isGold) || (item.product && item.product.isGold)) && (
                                                                <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg mb-[1px]">
                                                                    {t('Free Delivery')}
                                                                </span>
                                                            )}
                                                            {item.isFromAd && !item.isGold && !(item.product && item.product.isGold) && (
                                                                <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg">
                                                                    {t('Special Offer')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <p className={`text-sm font-medium text-gray-900 dark:text-white ${item.isFromAd ? '' : 'truncate'}`}>
                                                            {(() => {
                                                                const fullTitle = t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title;
                                                                if (language !== 'ta') return fullTitle;
                                                                
                                                                const bracketIndex = fullTitle.indexOf('(');
                                                                if (bracketIndex === -1) return fullTitle;

                                                                const part1 = fullTitle.substring(0, bracketIndex).trim();
                                                                const part2 = fullTitle.substring(bracketIndex + 1, fullTitle.length - 1).trim();
                                                                
                                                                const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                                                const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);
                                                                
                                                                if (isPart1Tamil && !isPart2Tamil) return `${part1} (${part2})`;
                                                                if (isPart2Tamil && !isPart1Tamil) return `${part2} (${part1})`;
                                                                return fullTitle;
                                                            })()}
                                                        </p>
                                                        {(item.storeId || item.storeName) && (
                                                            <p className="text-xs font-normal text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                                                {getStoreName(item.storeId, stores) || item.storeName}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between mt-1">
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 dark:text-white">₹{((item.price * item.quantity) || 0).toFixed(0)}</p>
                                                                {(item.unit || item.product?.unit) && (
                                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                                        {item.unit || item.product?.unit}
                                                                    </p>
                                                                )}
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

                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end mb-1">
                                            <div>
                                                <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">{t('Total Amount')}</p>
                                                <p className="font-bold text-[16px] text-gray-900 dark:text-white leading-none">₹{order.total.toFixed(0)}</p>
                                            </div>
                                            <div className="text-[#2E5A2E] dark:text-[#CBF9B2] text-[13px] font-bold underline decoration-[#2E5A2E] dark:decoration-[#CBF9B2] decoration-2 underline-offset-2 hover:opacity-80 transition-opacity">
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
                                <p className="text-gray-500 dark:text-gray-400 mb-6">{t('Try adjusting your search or filter to find what you\'re looking for.')}</p>
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
            </PullToRefreshLayout>
        </div>
    );
};

export default Orders;

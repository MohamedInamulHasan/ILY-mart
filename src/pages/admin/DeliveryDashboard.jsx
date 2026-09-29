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
    ClipboardList
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
import PullToRefreshLayout from '../../components/PullToRefreshLayout';

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
        return localStorage.getItem('delivery_dashboard_tab') || 'Active';
    });

    useEffect(() => {
        localStorage.setItem('delivery_dashboard_tab', activeTab);
    }, [activeTab]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const tabs = ['All', 'Active', 'Completed', 'Cancelled'];

    const filteredOrders = orders.filter(order => {
        const matchesTab =
            activeTab === 'All' ? true :
                activeTab === 'Active' ? ['Processing', 'Shipped', 'Out for Delivery'].includes(order.status) :
                    activeTab === 'Completed' ? order.status === 'Delivered' :
                        activeTab === 'Cancelled' ? order.status === 'Cancelled' : 
                            order.status === activeTab;

        if (!matchesTab) return false;

        if (searchQuery === '') return true;

        const q = searchQuery.toLowerCase();
        const orderId = String(order._id || order.id).toLowerCase();
        const customerName = (order.shippingAddress?.name || order.user || '').toLowerCase();
        const customerMobile = (order.shippingAddress?.mobile || '').toLowerCase();
        
        return orderId.includes(q) || customerName.includes(q) || customerMobile.includes(q) ||
               order.items?.some(item => (item.name || '').toLowerCase().includes(q));
    });

    const filteredServices = serviceRequests.filter(request => {
        const matchesTab = 
            activeTab === 'All' ? true :
                activeTab === 'Active' ? ['Pending', 'In Progress'].includes(request.status) :
                    activeTab === 'Completed' ? request.status === 'Completed' :
                        activeTab === 'Cancelled' ? request.status === 'Cancelled' :
                            request.status === activeTab;

        if (!matchesTab) return false;

        if (searchQuery === '') return true;

        const q = searchQuery.toLowerCase();
        const serviceName = (request.service?.name || '').toLowerCase();
        const customerName = (request.user?.name || request.address?.name || '').toLowerCase();
        const customerMobile = (request.user?.mobile || '').toLowerCase();
        const address = (request.address?.street || '').toLowerCase();

        return serviceName.includes(q) || customerName.includes(q) || customerMobile.includes(q) || address.includes(q);
    });

    const displayData = dashboardType === 'Orders' ? filteredOrders : filteredServices;
    const isLoading = dashboardType === 'Orders' ? loadingOrders : loadingServices;

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
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-900 tracking-tight leading-tight">
                                {dashboardType === 'Orders' ? t('Delivery Panel') : t('Service Requests')}
                            </h1>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-600 mt-0.5">
                                {dashboardType === 'Orders' ? t('Manage Deliveries') : t('Manage Service Bookings')}
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
                    {/* Mode Switcher - Full Width Big */}
                    <div className="flex items-center mb-8 border-b-2 border-gray-100 dark:border-gray-700/50">
                        <button 
                            onClick={() => { setDashboardType('Orders'); setActiveTab('Active'); }}
                            className={`flex-1 pb-4 text-[18px] font-black transition-all relative ${dashboardType === 'Orders' ? 'text-gray-900 dark:text-white' : 'text-gray-400 opacity-60'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {t('Orders')}
                                {orders.filter(o => o.status === 'Processing').length > 0 && (
                                    <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] bg-rose-500 text-white rounded-full font-black">
                                        {orders.filter(o => o.status === 'Processing').length}
                                    </span>
                                )}
                            </span>
                            {dashboardType === 'Orders' && (
                                <div className="absolute bottom-[-2px] left-0 right-0 h-[4px] bg-[#2E5A2E] dark:bg-[#8bc910] rounded-full" />
                            )}
                        </button>
                        <button 
                            onClick={() => { setDashboardType('Services'); setActiveTab('Active'); }}
                            className={`flex-1 pb-4 text-[18px] font-black transition-all relative ${dashboardType === 'Services' ? 'text-gray-900 dark:text-white' : 'text-gray-400 opacity-60'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {t('Services')}
                                {serviceRequests.filter(s => s.status === 'Pending').length > 0 && (
                                    <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[11px] bg-rose-500 text-white rounded-full font-black">
                                        {serviceRequests.filter(s => s.status === 'Pending').length}
                                    </span>
                                )}
                            </span>
                            {dashboardType === 'Services' && (
                                <div className="absolute bottom-[-2px] left-0 right-0 h-[4px] bg-[#2E5A2E] dark:bg-[#8bc910] rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Dashboard Stats - Clickable Filters */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {(dashboardType === 'Orders' ? [
                            { id: 'Processing', label: 'Processing', count: orders.filter(o => o.status === 'Processing').length, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
                            { id: 'Out for Delivery', label: 'Out for Delivery', count: orders.filter(o => o.status === 'Out for Delivery').length, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/20' },
                            { id: 'Delivered', label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                            { id: 'Cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' }
                        ] : [
                            { id: 'Pending', label: 'Requested', count: serviceRequests.filter(s => s.status === 'Pending').length, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
                            { id: 'In Progress', label: 'Accepted', count: serviceRequests.filter(s => s.status === 'In Progress').length, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-950/20' }
                        ]).map((stat) => (
                            <button 
                                key={stat.id} 
                                onClick={() => setActiveTab(stat.id)}
                                className={`flex-1 min-w-[140px] ${stat.bg} p-5 rounded-2xl transition-all duration-300 active:scale-95 flex flex-col items-center justify-center border-[3px]
                                    ${String(activeTab).toLowerCase() === String(stat.id).toLowerCase()
                                        ? `bg-white dark:bg-gray-800 ${stat.color.replace('text', 'border')}` 
                                        : 'border-transparent opacity-40'}`}
                            >
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${String(activeTab).toLowerCase() === String(stat.id).toLowerCase() ? stat.color : 'text-gray-400'}`}>{t(stat.label)}</p>
                                <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
                            </button>
                        ))}
                    </div>

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

                    <div className="mb-6"></div>

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
                                {dashboardType === 'Orders' ? (
                                    displayData.map(order => (
                                        <div
                                            key={order._id || order.id}
                                            className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 group relative shadow-sm hover:shadow-md"
                                        >
                                            <div className="p-6">
                                                {/* Order ID & Date Header */}
                                                <div 
                                                    className="flex justify-between items-start gap-2 mb-4 cursor-pointer group/header"
                                                    onClick={() => navigate(`/orders/${order._id || order.id}`)}
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-[#2E5A2E] dark:text-[#8bc910] flex-shrink-0 group-hover/header:scale-110 transition-transform">
                                                            <Package size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate group-hover/header:text-[#2E5A2E] transition-colors">
                                                                #{String(order._id || order.id).slice(-6).toUpperCase()}
                                                            </p>
                                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {formatOrderDateTime(order.createdAt || order.date)}
                                                                {(order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime) && (
                                                                    <span className="text-[#2E5A2E] dark:text-[#8bc910] ml-1 font-bold">
                                                                        • ⏰ {formatDeliveryRangeFromDate(order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime)}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-shrink-0 min-w-[130px] flex justify-end" onClick={(e) => e.stopPropagation()}>
                                                        {['Delivered', 'Completed', 'Cancelled'].includes(order.status) ? (
                                                            <div className={`inline-flex items-center justify-center w-full px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-all shadow-sm ${getStatusColor(order.status)}`}>
                                                                {getStatusIcon(order.status)}
                                                                <span className="uppercase tracking-wider">{t(order.status)}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="relative w-full">
                                                                <select
                                                                    value={order.status}
                                                                    onChange={(e) => updateStatus(order._id || order.id, e.target.value)}
                                                                    className={`w-full px-3 py-1.5 pr-8 rounded-full border text-[10px] md:text-xs font-bold transition-all outline-none shadow-sm cursor-pointer text-center appearance-none ${getStatusColor(order.status)}`}
                                                                >
                                                                    <option value="Processing" disabled={order.status === 'Out for Delivery'}>{t('Processing')}</option>
                                                                    <option value="Out for Delivery">{t('Out for Delivery')}</option>
                                                                    <option value="Delivered">{t('Delivered')}</option>
                                                                    <option value="Cancelled" disabled={order.status !== 'Processing'}>{t('Cancelled')}</option>
                                                                </select>
                                                                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${getStatusColor(order.status).split(' ')[0]}`}>
                                                                    <ChevronDown size={12} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Customer & Location */}
                                                <div className="mb-4">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {order.shippingAddress?.name || order.user}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {order.shippingAddress?.mobile || 'N/A'}
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-4">
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2">
                                                        {order.shippingAddress ? `${order.shippingAddress.street}, ${order.shippingAddress.city}` : t('No address provided')}
                                                    </p>
                                                    {order.shippingAddress?.location && (
                                                        <button
                                                            onClick={() => openExternalLink(order.shippingAddress.location)}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2E5A2E] dark:text-[#7CA90E] hover:underline"
                                                        >
                                                            <MapPin size={12} />
                                                            {t('View Map')}
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/orders/${order._id || order.id}`)}
                                                    className="w-full py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[13px] font-bold text-[#2E5A2E] dark:text-[#7CA90E] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
                                                >
                                                    {t('View Details')}
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    displayData.map(request => (
                                        <div
                                            key={request._id || request.id}
                                            className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 group relative shadow-sm hover:shadow-md"
                                        >
                                            <div className="p-6">
                                                <div className="flex justify-between items-start gap-2 mb-4">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <div className="p-2 bg-[#2E5A2E]/10 dark:bg-[#2E5A2E]/20 rounded-lg text-[#2E5A2E] dark:text-[#8bc910] flex-shrink-0 transition-transform">
                                                            <Wrench size={18} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                                                                {request.items?.length === 1 
                                                                    ? request.items[0].name 
                                                                    : request.service?.name || t('Service')}
                                                            </p>
                                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {formatOrderDateTime(request.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex-shrink-0 min-w-[130px] flex justify-end" onClick={(e) => e.stopPropagation()}>
                                                        {['Completed', 'Cancelled'].includes(request.status) ? (
                                                            <div className={`inline-flex items-center justify-center w-full px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold border transition-all shadow-sm ${getStatusColor(request.status)}`}>
                                                                {getStatusIcon(request.status)}
                                                                <span className="uppercase tracking-wider">
                                                                    {request.status === 'Pending' ? t('Requested') : 
                                                                     request.status === 'In Progress' ? t('Accepted') : 
                                                                     t(request.status)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="relative w-full">
                                                                <select
                                                                    value={request.status}
                                                                    onChange={(e) => handleUpdateServiceStatus(request._id || request.id, e.target.value)}
                                                                    className={`w-full px-3 py-1.5 pr-8 rounded-full border text-[10px] md:text-xs font-bold transition-all outline-none shadow-sm cursor-pointer text-center appearance-none ${getStatusColor(request.status)}`}
                                                                >
                                                                    <option value="Pending" disabled={request.status === 'In Progress'}>{t('Requested')}</option>
                                                                    <option value="In Progress">{t('Accepted')}</option>
                                                                </select>
                                                                <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${getStatusColor(request.status).split(' ')[0]}`}>
                                                                    <ChevronDown size={12} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {request.user?.name || request.address?.name || t('Customer')}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {request.user?.mobile || request.address?.mobile || 'N/A'}
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-4">
                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('Address')}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2 font-medium">
                                                        {request.user?.address?.street 
                                                            ? `${request.user.address.street}, ${request.user.address.city}` 
                                                            : request.location || t('No address provided')}
                                                    </p>
                                                    {(request.coordinates || request.user?.location) && (
                                                        <button
                                                            onClick={() => openExternalLink(request.coordinates || request.user?.location)}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2E5A2E] dark:text-[#7CA90E] hover:underline"
                                                        >
                                                            <MapPin size={12} />
                                                            {t('View Map')}
                                                        </button>
                                                    )}

                                                    {/* Service Type - Centered below map */}
                                                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50 text-center">
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('Work Type')}</p>
                                                        <p className="text-[15px] font-black text-[#2E5A2E] dark:text-[#8bc910] uppercase tracking-wide">
                                                            {request.items?.length === 1 
                                                                ? `${request.items[0].name}${request.items[0].quantity > 1 ? ` x${request.items[0].quantity}` : ''}`
                                                                : `${!request.items?.length ? t('General') : t('Specific Tasks')}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {request.items && request.items.length > 0 && (
                                                    <div className="mt-4">
                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('Items Requested')}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {request.items.map((item, idx) => (
                                                                <span key={idx} className="px-2.5 py-1 bg-[#2E5A2E]/5 dark:bg-[#2E5A2E]/20 text-[#2E5A2E] dark:text-[#8bc910] rounded-lg text-[10px] font-bold border border-[#2E5A2E]/10">
                                                                    {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    {dashboardType === 'Orders' ? <ShoppingBag size={24} className="text-gray-300" /> : <ClipboardList size={24} className="text-gray-300" />}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {dashboardType === 'Orders' ? t('No orders found') : t('No service requests found')}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('No tasks in this category.')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </PullToRefreshLayout>
        </div>
    );
};

export default DeliveryDashboard;

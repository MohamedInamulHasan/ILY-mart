import { CartoonCoin } from '../components/CartoonCoin';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, RotateCcw, Store, ChevronLeft } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiService, API_BASE_URL } from '../utils/api';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { getStoreName, formatDeliveryRangeFromDate } from '../utils/storeHelpers';
import LoadingSpinner from '../components/LoadingSpinner';
import CancelOrderModal from '../components/CancelOrderModal';
import { openExternalLink } from '../utils/linkHelper';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { orders, loading, stores, cancelOrder, setIsFooterHidden } = useData();
    const { user, refreshUser } = useAuth();
    const [cancelConfirmation, setCancelConfirmation] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Hide footer when cancel confirmation modal is open
    useEffect(() => {
        setIsFooterHidden(cancelConfirmation);
        return () => setIsFooterHidden(false); // Cleanup on unmount
    }, [cancelConfirmation, setIsFooterHidden]);

    const [singleOrder, setSingleOrder] = useState(null);
    const [loadingSingle, setLoadingSingle] = useState(true);

    // Try to find fresh single order first, fallback to context
    const contextOrder = orders.find(o => (o._id || o.id) === id);
    const order = singleOrder || contextOrder;

    // Fetch fresh order from server on mount to ensure status is 100% up-to-date
    useEffect(() => {
        if (!id) return;
        let isMounted = true;

        apiService.getOrder(id)
            .then(res => {
                if (isMounted && res.success && res.data) {
                    setSingleOrder(res.data);
                }
            })
            .catch(err => {
                console.error('Failed to fetch fresh order details:', err);
            })
            .finally(() => {
                if (isMounted) setLoadingSingle(false);
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    // Live sync with real-time status updates
    useEffect(() => {
        const handleStatusUpdate = (e) => {
            const { id: updatedId, status, order: updatedOrder } = e.detail || {};
            if (String(updatedId) === String(id)) {
                if (updatedOrder) {
                    setSingleOrder(prev => ({ ...(prev || {}), ...updatedOrder }));
                } else if (status) {
                    setSingleOrder(prev => ({ ...(prev || {}), status }));
                }
            }
        };
        window.addEventListener('orders:status_updated', handleStatusUpdate);
        return () => window.removeEventListener('orders:status_updated', handleStatusUpdate);
    }, [id]);

    // Show skeleton ONLY if we don't have the order AND we are loading.
    if (!order && (loading.orders || loadingSingle)) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 mx-auto max-w-3xl w-full relative pb-12">
                <div className="px-5 pt-4">
                    {/* Header Skeleton matching real header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-[42px] h-[42px] rounded-full blinkit-shimmer shrink-0" />
                        <div className="h-5 w-32 rounded-lg blinkit-shimmer" />
                        <div className="w-[42px] h-[42px]" />
                    </div>

                    <div className="space-y-3 sm:space-y-3.5">
                        {/* Status Card Skeleton: Top Banner + 3-Node Timeline */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {/* Status Banner */}
                            <div className="p-5 sm:p-6 bg-gray-50/70 dark:bg-gray-750 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-3.5 w-28 rounded-md blinkit-shimmer" />
                                    <div className="h-7 w-36 rounded-xl blinkit-shimmer" />
                                    <div className="h-3 w-44 rounded-md blinkit-shimmer" />
                                </div>
                                <div className="w-12 h-12 rounded-full blinkit-shimmer shrink-0" />
                            </div>

                            {/* 3-Step Timeline Skeleton */}
                            <div className="px-3 sm:px-4 py-3.5">
                                <div className="relative flex justify-between items-start">
                                    {[1, 2, 3].map((step, idx) => (
                                        <div key={step} className="flex-1 flex flex-col items-center relative space-y-2">
                                            {idx < 2 && (
                                                <div className="absolute top-[18px] -translate-y-1/2 left-[50%] right-[-50%] h-1 bg-gray-100 dark:bg-gray-700 z-0" />
                                            )}
                                            <div className="w-9 h-9 rounded-full blinkit-shimmer border-4 border-white dark:border-gray-800 z-10 relative" />
                                            <div className="h-3 w-16 rounded-md blinkit-shimmer" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Items Ordered Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg blinkit-shimmer shrink-0" />
                                <div className="h-4 w-32 rounded-md blinkit-shimmer" />
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                {[1, 2].map((i) => (
                                    <div key={i} className="p-3 sm:p-3.5 flex gap-3">
                                        <div className="w-14 h-14 rounded-xl blinkit-shimmer shrink-0" />
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                            <div className="h-3 w-1/3 rounded-md blinkit-shimmer" />
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="h-4 w-16 rounded-md blinkit-shimmer" />
                                                <div className="h-5 w-8 rounded-md blinkit-shimmer" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Address Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg blinkit-shimmer shrink-0" />
                                <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                            </div>
                            <div className="space-y-1.5 pl-1">
                                <div className="h-4 w-40 rounded-md blinkit-shimmer" />
                                <div className="h-3.5 w-60 rounded-md blinkit-shimmer" />
                                <div className="h-3.5 w-32 rounded-md blinkit-shimmer" />
                            </div>
                        </div>

                        {/* Payment Summary Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg blinkit-shimmer shrink-0" />
                                <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center"><div className="h-3.5 w-20 rounded blinkit-shimmer" /><div className="h-3.5 w-16 rounded blinkit-shimmer" /></div>
                                <div className="flex justify-between items-center"><div className="h-3.5 w-24 rounded blinkit-shimmer" /><div className="h-3.5 w-12 rounded blinkit-shimmer" /></div>
                                <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 dark:border-gray-700/60"><div className="h-5 w-24 rounded blinkit-shimmer" /><div className="h-5 w-20 rounded blinkit-shimmer" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate subtotal dynamically from items to ensure accuracy
    const calculatedSubtotal = order?.items?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0) || 0;

    if (!order) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 mx-auto max-w-md w-full relative pb-12 flex flex-col items-center justify-center p-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('Order not found')}</h2>
                <button
                    onClick={() => navigate('/orders')}
                    className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-full shadow-sm"
                >
                    <ArrowLeft size={20} />
                    {t('Back to Orders')}
                </button>
            </div>
        );
    }

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
            case 'Delivered': return <CheckCircle size={20} />;
            case 'Shipped':
            case 'Out for Delivery': return <Truck size={20} />;
            case 'Processing': return <Clock size={20} />;
            case 'Cancelled': return <RotateCcw size={20} />;
            default: return null;
        }
    };

    const confirmCancelOrder = async () => {
        if (isCancelling) return;
        setIsCancelling(true);
        try {
            const targetOrderId = order?._id || order?.id || id;
            const updatedOrder = await cancelOrder(targetOrderId);

            if (updatedOrder) {
                if (singleOrder) {
                    setSingleOrder({ ...singleOrder, status: 'Cancelled' });
                }
                // Refresh user to update coin balance
                if (refreshUser) refreshUser();
                setCancelConfirmation(false);
                // Redirect to orders page
                navigate('/orders');
            }
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert(t('Failed to cancel order. Please try again.'));
            setCancelConfirmation(false);
        } finally {
            setIsCancelling(false);
        }
    };

    // Timeline Helper
    const getTimelineSteps = (status) => {
        const steps = [
            { id: 'Processing', label: 'Order Placed', icon: Package },
            { id: 'Out for Delivery', id2: 'Shipped', label: 'Accepted', icon: Truck },
            { id: 'Delivered', label: 'Delivered', icon: CheckCircle },
        ];

        const statusOrder = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
        const currentIdx = statusOrder.indexOf(status === 'Cancelled' ? 'Processing' : status);

        return steps.map((step, idx) => ({
            ...step,
            completed: idx <= (currentIdx === 2 ? 1 : currentIdx >= 3 ? 2 : currentIdx) && status !== 'Cancelled',
            current: step.id === status || step.id2 === status
        }));
    };

    const timelineSteps = getTimelineSteps(order.status);

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 mx-auto max-w-3xl w-full relative pb-12">
            <div className="px-5 pt-4">
                {/* Header matching Profile & Cart */}
                <div className="flex items-center justify-between mb-4">
                     <button 
                         onClick={() => navigate(-1)}
                         className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-700/50"
                     >
                         <ArrowLeft size={22} />
                     </button>
                     <h1 className="text-[16px] font-bold text-gray-900 dark:text-white tracking-tight">{t('Order Details')}</h1>
                     <div className="w-[42px] h-[42px]" /> {/* Spacer */}
                </div>

                <div className="space-y-3 sm:space-y-3.5">

                {/* Status Card & Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Status Banner */}
                    <div className={`p-6 ${
                        order.status === 'Cancelled' ? 'bg-[#fef2f2] dark:bg-red-900/10' :
                        order.status === 'Delivered' ? 'bg-[#f0fdf4] dark:bg-[#CBF9B2]/5' :
                        order.status === 'Processing' ? 'bg-[#fffbeb] dark:bg-amber-900/10' :
                        'bg-[#f0f9ff] dark:bg-blue-900/10'
                        } flex items-center justify-between`}>

                        <div>
                            <p className="text-sm font-medium opacity-80 mb-1 dark:text-gray-300">
                                {t('Order ID')}: #{String(order._id || order.id).slice(-6).toUpperCase()}
                            </p>
                            <h2 className={`text-xl sm:text-2xl font-bold ${
                                order.status === 'Cancelled' ? 'text-[#dc2626] dark:text-[#f87171]' :
                                order.status === 'Delivered' ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' :
                                order.status === 'Processing' ? 'text-[#b45309] dark:text-[#fbbf24]' :
                                'text-[#0284c7] dark:text-[#38bdf8]'
                                }`}>
                                {t(order.status)}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            order.status === 'Cancelled' ? 'bg-[#fecaca] text-[#dc2626] dark:bg-red-900/30' :
                            order.status === 'Delivered' ? 'bg-green-100 text-[#2E5A2E] dark:bg-[#CBF9B2]/20' :
                            order.status === 'Processing' ? 'bg-[#fde68a] text-[#b45309] dark:bg-amber-900/30' :
                            'bg-[#bae6fd] text-[#0284c7] dark:bg-blue-900/30'
                            }`}>
                            {getStatusIcon(order.status)}
                        </div>
                    </div>

                    {/* Visual Timeline (Hidden for Cancelled) */}
                    {order.status !== 'Cancelled' && (
                        <div className="px-3 sm:px-4 py-3.5">
                            <div className="relative flex justify-between items-start">
                                {timelineSteps.map((step, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center relative">
                                        {/* Connector line to next step (centered at round's vertical middle: 18px, perfectly between circles) */}
                                        {idx < timelineSteps.length - 1 && (
                                            <div className="absolute top-[18px] -translate-y-1/2 left-[50%] right-[-50%] h-1 bg-gray-100 dark:bg-gray-700 overflow-hidden z-0">
                                                <div
                                                    className="h-full bg-[#2E5A2E] dark:bg-[#CBF9B2] transition-all duration-700 ease-out"
                                                    style={{
                                                        width: timelineSteps[idx + 1]?.completed ? '100%' : '0%'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Step Circle Icon */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10 relative ${step.completed
                                            ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] border-white dark:border-gray-800 text-white dark:text-gray-900 shadow-sm'
                                            : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-300'
                                            }`}>
                                            <step.icon size={14} strokeWidth={3} />
                                        </div>

                                        {/* Step Label */}
                                        <p className={`text-xs mt-2 font-bold text-center leading-tight px-1 max-w-[90px] ${step.completed
                                            ? 'text-gray-900 dark:text-white'
                                            : 'text-gray-400 dark:text-gray-600'
                                            }`}>
                                            {t(step.label)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Items Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <Package size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('Items Ordered')}</h3>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {order.items?.map((item, index) => (
                            <div key={index} className="p-3 sm:p-3.5 flex gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-3">
                                <div className="w-14 h-14 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden flex-shrink-0 relative">
                                    <img
                                        src={item.image && (item.image.startsWith('http') || item.image.startsWith('data:'))
                                            ? item.image
                                            : ((item.product?._id || item.product)
                                                ? `${API_BASE_URL}/products/${item.product?._id || item.product}/image`
                                                : "https://via.placeholder.com/150?text=No+Image")}
                                        alt={item.adTitle || item.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Product"; }}
                                    />

                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="mb-0.5 leading-tight">
                                                    {renderBilingualTitle(t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title, language, {
                                                        hideTag: true,
                                                        mainClassName: 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
                                                        subClassName: 'text-[13px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5'
                                                    })}
                                                </h4>

                                    {(item.storeId || item.storeName) && (
                                        <p className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                            {getStoreName(item.storeId, stores) || item.storeName}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-1">
                                        <div>
                                            <p className="text-[15px] font-bold text-gray-900 dark:text-white leading-none">₹{Number(item.price * item.quantity).toFixed(0)}</p>
                                            {(item.unit || item.product?.unit) && (
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">
                                                    {item.unit || item.product?.unit}
                                                </p>
                                            )}
                                        </div>
                                        <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700/50 rounded-md text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                                            x{item.quantity}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shipping Details Card - Matching Order Confirmation Design */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2.5">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <MapPin size={18} />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Shipping details')}</h3>
                    </div>
                    <div className="p-3.5 sm:p-4">
                        <div className="pl-3 sm:pl-4 space-y-1">
                            {/* 1. Name */}
                            <p className="font-bold text-[16px] text-gray-900 dark:text-white">
                                {order.shippingAddress?.name || 'User'}
                            </p>

                            {/* 2. Number */}
                            {order.shippingAddress?.mobile && (
                                <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                                    {order.shippingAddress?.mobile}
                                </p>
                            )}

                            {/* 3. Address */}
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                {order.shippingAddress?.street}{order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : ''}{order.shippingAddress?.zip ? ` - ${order.shippingAddress.zip}` : ''}
                            </p>

                            {/* 4. Pin / View on Map - Shining Card with Map SVG */}
                            {order.shippingAddress?.location && (
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => openExternalLink(order.shippingAddress.location)}
                                        className="relative overflow-hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2E5A2E] hover:bg-[#234623] text-white text-[12px] font-bold active:scale-95 transition-transform shadow-sm select-none border border-[#234623]"
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
                                            animate={{ x: ['-100%', '150%'] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                        />
                                        <svg 
                                            viewBox="0 0 24 24" 
                                            width="16" 
                                            height="16" 
                                            fill="currentColor" 
                                            className="relative z-10 text-white shrink-0"
                                        >
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                        <span className="relative z-10 font-bold">{t('View on Map')}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 5. Scheduled Delivery Time (Time logo removed) */}
                        {(() => {
                            const rawTime = order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime;
                            if (!rawTime) return null;
                            const strTime = String(rawTime).toLowerCase();
                            if (strTime.includes('instant')) return null;

                            const formattedRange = formatDeliveryRangeFromDate(rawTime);
                            if (!formattedRange || formattedRange.toLowerCase().includes('instant')) return null;

                            return (
                                <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700 pl-2 sm:pl-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{t('Scheduled Delivery')}</p>
                                    <p className="font-bold text-gray-900 dark:text-white text-[15px] mt-0.5">
                                        {formattedRange}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4 text-[14px]">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2.5 flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-400" />
                        {t('Payment Summary')}
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>{t('Item Total')}</span>
                            <span className="font-medium text-gray-900 dark:text-white">₹{calculatedSubtotal.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>{t('Delivery Fee')}</span>
                            {Number(order.shipping) === 0 ? (
                                order?.items?.some(item => item.isGold || (item.product && item.product.isGold)) ? (
                                    <div className="text-right">
                                        <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">{t('FREE')}</span>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <span className="text-[#2E5A2E] dark:text-[#CBF9B2] font-bold">{t('FREE')}</span>
                                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center justify-end gap-1.5">
                                            <CartoonCoin size={17} /> <span>{t('Coin Applied')}</span>
                                        </p>
                                    </div>
                                )
                            ) : (
                                <span className="font-medium text-gray-900 dark:text-white">₹{Number(order.shipping || 20).toFixed(0)}</span>
                            )}
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>{t('Discount')}</span>
                                <span>-₹{Number(order.discount).toFixed(0)}</span>
                            </div>
                        )}
                        <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700 mt-2.5 flex justify-between items-end">
                            <span className="font-bold text-gray-900 dark:text-white">{t('Grand Total')}</span>
                            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                ₹{(
                                    calculatedSubtotal +
                                    (order.shipping !== undefined && order.shipping !== null ? Number(order.shipping) : 20) -
                                    (Number(order.discount) || 0)
                                ).toFixed(0)}
                            </span>
                        </div>
                    </div>
                </div>


                </div>

                {/* Footer Buttons */}
                {order.status === 'Processing' && (
                    <div className="pt-4">
                        <button
                            onClick={() => setCancelConfirmation(true)}
                            className="w-full py-3 sm:py-3.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={18} />
                            {t('Cancel Order')}
                        </button>
                    </div>
                )}
            </div>

            <CancelOrderModal 
                order={order}
                isOpen={cancelConfirmation} 
                onClose={() => !isCancelling && setCancelConfirmation(false)} 
                onConfirmCancel={confirmCancelOrder}
                onConfirm={confirmCancelOrder}
                isLoading={isCancelling}
                isCancelling={isCancelling}
            />
        </div>
    );
};

export default OrderDetails;

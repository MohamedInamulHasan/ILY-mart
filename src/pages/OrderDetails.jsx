import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, CreditCard, RotateCcw, Store, ChevronLeft } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiService, API_BASE_URL } from '../utils/api';
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

    // Hide footer when cancel confirmation modal is open
    useEffect(() => {
        setIsFooterHidden(cancelConfirmation);
        return () => setIsFooterHidden(false); // Cleanup on unmount
    }, [cancelConfirmation, setIsFooterHidden]);

    const [singleOrder, setSingleOrder] = useState(null);
    const [loadingSingle, setLoadingSingle] = useState(true);

    // Try to find in context first, fallback to fetched single order
    const order = orders.find(o => (o._id || o.id) === id) || singleOrder;

    useEffect(() => {
        const foundInContext = orders.find(o => (o._id || o.id) === id);

        if (foundInContext) {
            setLoadingSingle(false);
            return;
        }

        // If context is still loading, wait
        if (loading.orders) {
            return;
        }

        // Not in context, fetch explicitly
        setLoadingSingle(true);
        apiService.getOrder(id)
            .then(res => {
                if (res.success && res.data) {
                    setSingleOrder(res.data);
                }
            })
            .catch(err => {
                console.error('Failed to fetch single order:', err);
            })
            .finally(() => {
                console.log('Order fetch attempt finished'); // Debug log
                setLoadingSingle(false);
            });
    }, [id, orders, loading.orders]);

    // Show skeleton ONLY if we don't have the order AND we are loading.
    if (!order && (loading.orders || loadingSingle)) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 mx-auto max-w-3xl w-full relative pb-12 animate-pulse">
                <div className="px-5 pt-8">
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between mb-8 mt-2">
                        <div className="w-[46px] h-[46px] bg-white dark:bg-gray-800 rounded-full"></div>
                        <div className="h-6 w-32 bg-white dark:bg-gray-800 rounded-xl"></div>
                        <div className="w-[46px] h-[46px]"></div>
                    </div>

                    <div className="space-y-5">
                        {/* Status Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] h-48 shadow-sm"></div>

                        {/* Items Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-50 dark:border-gray-700">
                                <div className="h-6 w-40 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                            <div className="p-5 space-y-6">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex-shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                                            <div className="h-3 w-1/2 bg-gray-50 dark:bg-gray-700/50 rounded-lg"></div>
                                            <div className="flex justify-between items-center pt-1">
                                                <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                                                <div className="h-5 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Address Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] h-32 shadow-sm"></div>

                        {/* Payment Summary Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] h-48 shadow-sm"></div>
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
        try {
            // Use context method to update global state without reload
            const updatedOrder = await cancelOrder(order._id || order.id);

            if (updatedOrder) {
                if (singleOrder) {
                    setSingleOrder({ ...singleOrder, status: 'Cancelled' });
                }
                // Refresh user to update coin balance
                refreshUser();
                setCancelConfirmation(false);
                // Redirect to orders page as requested
                navigate('/orders');
            }
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert(t('Failed to cancel order. Please try again.'));
            setCancelConfirmation(false);
        }
    };

    // Timeline Helper
    const getTimelineSteps = (status) => {
        const steps = [
            { id: 'Processing', label: 'Order Placed', icon: Package },
            { id: 'Out for Delivery', id2: 'Shipped', label: 'Out for Delivery', icon: Truck },
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
                         className="w-[46px] h-[46px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-700/50"
                     >
                         <ArrowLeft size={22} />
                     </button>
                     <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">{t('Order Details')}</h1>
                     <div className="w-[46px] h-[46px]" /> {/* Spacer */}
                </div>

                <div className="space-y-5">

                {/* Status Card & Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                            <h2 className={`text-2xl font-black ${
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
                        <div className="p-6 relative">
                            {/* Connecting Line */}
                            <div className="absolute top-[42px] left-6 right-6 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#2E5A2E] dark:bg-[#CBF9B2] transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${timelineSteps.filter(s => s.completed).length === 1 ? '0%' :
                                            timelineSteps.filter(s => s.completed).length === 2 ? '50%' : '100%'}`
                                    }}
                                />
                            </div>

                            <div className="relative flex justify-between">
                                {timelineSteps.map((step, idx) => (
                                    <div key={idx} className="flex flex-col items-center z-10">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${step.completed
                                            ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] border-white dark:border-gray-800 text-white dark:text-gray-900'
                                            : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-300'
                                            }`}>
                                            <step.icon size={14} strokeWidth={3} />
                                        </div>
                                        <p className={`text-xs mt-2 font-bold text-center w-20 leading-tight ${step.completed
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
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <Package size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('Items Ordered')}</h3>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {order.items?.map((item, index) => (
                            <div key={index} className="p-5 flex gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors first:pt-5">
                                <div className="h-16 w-16 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden flex-shrink-0 relative">
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
                                    {/* Status Tags */}
                                    <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                        {((item.isGold) || (item.product && item.product.isGold)) && (
                                            <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                                {t('Free Delivery')}
                                            </span>
                                        )}
                                        {item.isFromAd && !item.isGold && !(item.product && item.product.isGold) && (
                                            <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                                {t('Special Offer')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className={`font-medium text-gray-900 dark:text-white text-sm ${item.isFromAd ? '' : 'truncate'} mb-0.5`} title={item.adTitle || item.name}>
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

                {/* Address Card - Now Full Width */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/10 rounded-full text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <MapPin size={18} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{t('Delivery To')}</h3>
                    </div>
                    <div className="pl-11 space-y-1.5">
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

                        {/* 4. Pin / View on Map */}
                        {order.shippingAddress?.location && (
                            <div className="pt-1">
                                <button
                                    onClick={() => openExternalLink(order.shippingAddress.location)}
                                    className="inline-flex items-center gap-1.5 text-[#2E5A2E] dark:text-[#CBF9B2] text-[11px] font-bold bg-green-50 dark:bg-[#CBF9B2]/10 px-3 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-[#CBF9B2]/20 transition-all border border-[#2E5A2E]/10 dark:border-[#CBF9B2]/20"
                                >
                                    <MapPin size={13} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                    <span>{t('View on Map')}</span>
                                </button>
                            </div>
                        )}

                        {/* 5. Scheduled Delivery Time */}
                        {(order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime) && (
                            <div className="pt-2">
                                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#1b5e20] dark:text-[#CBF9B2] bg-[#e6f7ed] dark:bg-[#CBF9B2]/15 px-4 py-2 rounded-full border border-[#bce8ce] dark:border-[#CBF9B2]/30 shadow-xs">
                                    <Clock size={15} className="text-[#1b5e20] dark:text-[#CBF9B2]" />
                                    <span>{t('Scheduled Time')}: {formatDeliveryRangeFromDate(order.scheduledDeliveryTime || order.deliveryTime || order.shippingAddress?.deliveryTime)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-[15px]">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-400" />
                        {t('Payment Summary')}
                    </h3>
                    <div className="space-y-3 text-sm">
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
                                        <p className="text-[10px] text-yellow-600 dark:text-yellow-500 font-medium flex items-center justify-end gap-1">
                                            <span>🪙</span> {t('Coin Applied')}
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
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 flex justify-between items-end">
                            <span className="font-bold text-gray-900 dark:text-white">{t('Grand Total')}</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">
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
                            className="w-full py-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={18} />
                            {t('Cancel Order')}
                        </button>
                    </div>
                )}
            </div>

            <CancelOrderModal 
                isOpen={cancelConfirmation} 
                onClose={() => setCancelConfirmation(false)} 
                onConfirm={confirmCancelOrder} 
            />
        </div>
    );
};

export default OrderDetails;

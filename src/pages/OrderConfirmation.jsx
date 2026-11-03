import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { getStoreName, formatDeliveryRange, formatDeliveryRangeFromDate, calculateDeliveryCharge } from '../utils/storeHelpers';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../utils/api';
import { openExternalLink } from '../utils/linkHelper';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { playSuccessSound, unlockAudio } from '../utils/soundHelper';
import { CheckCircle, ArrowLeft, ShoppingCart, ClipboardList, ShoppingBag, MapPin, Store, ChevronLeft, MoreHorizontal, Package, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart, cartCount } = useCart();
    const { addOrder, stores, setIsFooterHidden } = useData();
    const { t, language } = useLanguage();
    const { setUser } = useAuth();
    const queryClient = useQueryClient();

    const { formData, cartItems, cartTotal, deliveryCharge, isDirectPurchase } = location.state || {};
    const finalTotal = (cartTotal || 0) + (deliveryCharge || 0);

    if (!location.state) {
        return <Navigate to="/" replace />;
    }

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hide navbar when modals are open
    useEffect(() => {
        setIsFooterHidden(showSuccessModal);
        return () => setIsFooterHidden(false);
    }, [showSuccessModal, setIsFooterHidden]);

    const handleConfirmOrder = () => {
        unlockAudio();
        confirmOrderAction();
    };

    const confirmOrderAction = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Pre-generate instant Order ID so it displays immediately without `#000` lag
        const instantOrderId = (() => {
            const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
            const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            return (timestamp + random).toLowerCase();
        })();
        setCreatedOrderId(instantOrderId);

        // Use provided delivery charge or default to 20
        const finalDeliveryCharge = deliveryCharge !== undefined ? deliveryCharge : 20;

        // NEW: Use dynamic delivery charge calculation
        const baseDeliveryCharge = calculateDeliveryCharge(cartItems);

        // Create order object matching backend schema
        const newOrder = {
            _id: instantOrderId,
            items: cartItems.map(item => ({
                product: item._id || item.id,
                name: item.title || item.name || 'Product', // Fallback for safety
                quantity: item.quantity,
                price: item.price,
                // SECURITY/PERFORMANCE: Strip base64 images to prevent "Request Entity Too Large" (413) errors on Vercel
                // Only send the image if it is a URL (Cloudinary/HTTP). 
                image: (item.image && item.image.length < 1000) ? item.image : null,
                storeId: item.storeId?._id || item.storeId || null,
                storeName: item.storeName || null, // Pass storeName for Ads
                unit: item.unit, // Pass unit to backend
                // Ad-related fields for special offer tracking
                isFromAd: item.isFromAd || false,
                adTitle: item.adTitle || null
            })),

            subtotal: cartTotal,

            // FIX: If delivery is free (0) because of coins, we MUST send the underlying shipping cost
            // to the backend so it detects "Shipping > 0" and triggers the coin deduction logic.
            // The backend will then waive the shipping (set to 0) and deduct the coin.
            // If we send 0, the backend assumes it's already free and skips coin deduction.
            shipping: finalDeliveryCharge === 0 ? baseDeliveryCharge : finalDeliveryCharge,
            tax: 0,
            discount: 0,
            // If we send shipping, we must also send the total as if shipping was included, so backend validation passes
            total: finalDeliveryCharge === 0 ? ((cartTotal || 0) + baseDeliveryCharge) : (finalTotal || ((cartTotal || 0) + finalDeliveryCharge)),
            shippingAddress: {
                name: formData.name,
                street: formData.address,
                city: formData.city,
                state: '',
                zip: formData.pincode || formData.zip || '',
                country: 'India',
                mobile: formData.mobile,
                location: formData.location, // Add GPS Location
                deliveryTime: formData.deliveryTime
            },
            paymentMethod: {
                type: 'Cash on Delivery',
                last4: ''
            },
            deliveryTime: formData.deliveryTime,
            scheduledDeliveryTime: formData.deliveryTime ? (() => {
                const deliveryDate = new Date();

                // Handle "period|time" format (e.g., "today|10:00" or "tomorrow|10:00")
                let timeStr = formData.deliveryTime;
                if (formData.deliveryTime.includes('|')) {
                    const [period, time] = formData.deliveryTime.split('|');
                    timeStr = time;
                    if (period === 'tomorrow') {
                        deliveryDate.setDate(deliveryDate.getDate() + 1);
                    }
                }

                const [hours, minutes] = timeStr.split(':');
                deliveryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                return deliveryDate.toISOString();
            })() : null
        };

        console.log('📦 Creating order with data:', newOrder);
        console.log('⏰ scheduledDeliveryTime in order:', newOrder.scheduledDeliveryTime);

        // INSTANT UPDATE: Immediately update UI, play sound, show success modal & clear cart
        playSuccessSound();
        setShowSuccessModal(true);
        if (!isDirectPurchase) {
            clearCart();
        }

        const hasGoldProduct = cartItems.some(item => item.isGold);
        if (finalDeliveryCharge === 0 && deliveryCharge === 0 && !hasGoldProduct) {
            setUser(prev => ({
                ...prev,
                coins: Math.max((prev?.coins || 0) - 1, 0),
                location: newOrder.shippingAddress.location || prev.location
            }));
            queryClient.invalidateQueries(['user-profile']);
        } else if (newOrder.shippingAddress.location) {
            setUser(prev => ({ ...prev, location: newOrder.shippingAddress.location }));
        }

        try {
            const createdOrder = await addOrder(newOrder);
            console.log('✅ Order created successfully:', createdOrder);
            const finalId = createdOrder?._id || createdOrder?.id || instantOrderId;
            setCreatedOrderId(finalId);
        } catch (error) {
            console.error('❌ Failed to create order:', error);
            let errorMessage = t('Failed to place order. Please try again.');
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            alert(`${t('Error')}: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to send WhatsApp notification to admin
    const sendWhatsAppNotification = (order, customerInfo, items, total, delivery) => {
        // Admin WhatsApp number
        const adminWhatsAppNumber = '919500171980'; // Format: country code + number (no + or spaces)

        // Format order details message
        const orderId = String(order._id || order.id).slice(-6).toUpperCase();
        const itemsList = items.map((item, index) => {
            const unitStr = (item.unit || item.weight || item.product?.unit || '').trim();
            const unitTag = unitStr ? ` (${unitStr})` : '';
            return `${index + 1}. ${item.name || item.title || item.product?.title}${unitTag} x${item.quantity} - ₹${item.price}`;
        }).join('\n');

        const deliveryTime = formData.deliveryTime ?
            `\n📅 *Scheduled Delivery:* ${new Date().toLocaleDateString()} at ${formData.deliveryTime}` : '';

        const deliveryText = delivery === 0 ? "FREE (Coin Applied)" : `₹${delivery}`;

        const message = `🛒 *NEW ORDER RECEIVED!*\n\n` +
            `📋 *Order ID:* #${orderId}\n\n` +
            `👤 *Customer Details:*\n` +
            `Name: ${customerInfo.fullName}\n` +
            `Mobile: ${customerInfo.mobile}\n` +
            `Address: ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.zip}\n` +
            `${deliveryTime}\n\n` +
            `🛍️ *Items Ordered:*\n${itemsList}\n\n` +
            `💰 *Total Amount:* ₹${total.toFixed(0)}\n` +
            `(Subtotal: ₹${(total - delivery).toFixed(0)} + Delivery: ${deliveryText})\n\n` +
            `⏰ *Order Time:* ${new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })}\n\n` +
            `✅ Please confirm and process this order.`;

        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);

        // WhatsApp URL
        const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${encodedMessage}`;

        // Automatically redirect to WhatsApp (opens WhatsApp app directly)
        // This happens immediately without asking permission
        setTimeout(() => {
            window.location.href = whatsappUrl;
        }, 1000); // Small delay to ensure order is saved first
    };

    const handleCloseSuccess = () => {
        // Navigate to orders replacing confirmation in history so back doesn't return here
        navigate('/orders', { replace: true });
    };

    // Intercept back button when success modal is open to ensure back goes to Home
    useEffect(() => {
        if (!showSuccessModal) return;

        const handlePopState = (e) => {
            e.preventDefault();
            navigate('/', { replace: true });
        };

        window.history.pushState({ modal: 'orderSuccess' }, '');
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [showSuccessModal, navigate]);

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 pb-20 md:pb-40 relative">
            {/* Premium Green Header matching other pages */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (showSuccessModal || createdOrderId) {
                                        navigate('/', { replace: true });
                                    } else {
                                        navigate(-1);
                                    }
                                }} 
                                className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[16px] font-bold text-gray-900 tracking-tight leading-tight">{t('Confirmation')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Order Summary')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-[42px] h-[42px]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-[86px] sm:pt-[88px] max-w-3xl mx-auto px-3.5 sm:px-5 lg:px-6 space-y-3 sm:space-y-3.5">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/60 flex items-center gap-2.5">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <Package size={18} />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Order Summary')}</h3>
                    </div>

                    <div className="p-3 sm:p-3.5">
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {cartItems.map((item) => (
                                <div key={item.id} className="py-2.5 flex gap-3 first:pt-0">
                                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">
                                        <img
                                            src={item.image || ((item._id || item.id || item.product) ? `${API_BASE_URL}/products/${item._id || item.id || item.product}/image` : "https://via.placeholder.com/150?text=No+Image")}
                                            alt={item.adTitle || item.title}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                        />

                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="mb-0.5 leading-tight">
                                                    {renderBilingualTitle(t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name, language, {
                                                        hideTag: true,
                                                        mainClassName: 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
                                                        subClassName: 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
                                                    })}
                                                </h4>
                                        {(item.storeId || item.storeName) && (
                                            <p className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate">
                                                {getStoreName(item.storeId, stores) || item.storeName}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-1">
                                            <div>
                                                <p className="text-sm font-medium text-black dark:text-white">₹{((item.price * item.quantity) || 0).toFixed(0)}</p>
                                                {item.unit && (
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                        {item.unit}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300">
                                                x{item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/60 flex items-center gap-2.5">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <MapPin size={18} />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Shipping details')}</h3>
                    </div>
                    <div className="p-4 sm:p-5">
                        <div className="space-y-1">
                            {/* 1. Name */}
                            <p className="font-bold text-[16px] text-gray-900 dark:text-white">
                                {formData.name || t('No Name')}
                            </p>

                            {/* 2. Number */}
                            {formData.mobile && (
                                <p className="text-[13px] font-semibold text-gray-600 dark:text-gray-300">
                                    {formData.mobile}
                                </p>
                            )}

                            {/* 3. Address */}
                            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                {formData.address}{formData.city ? `, ${formData.city}` : ''}
                            </p>

                            {/* 4. Pin / View on Map */}
                            {formData.location && (
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={() => openExternalLink(formData.location)}
                                        className="inline-flex items-center gap-1.5 text-[#2E5A2E] dark:text-[#CBF9B2] text-[11px] font-bold bg-green-50 dark:bg-[#CBF9B2]/10 px-3 py-1.5 rounded-full hover:bg-green-100 dark:hover:bg-[#CBF9B2]/20 transition-all border border-[#2E5A2E]/10 dark:border-[#CBF9B2]/20"
                                    >
                                        <MapPin size={13} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                        <span>{t('View on Map')}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {(() => {
                            const rawTime = formData.deliveryTime;
                            if (!rawTime) return null;
                            const strTime = String(rawTime).toLowerCase();
                            if (strTime.includes('instant')) return null;

                            const formattedRange = formatDeliveryRange(rawTime);
                            if (!formattedRange || formattedRange.toLowerCase().includes('instant')) return null;

                            return (
                                <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/60">
                                    <div className="flex items-center gap-3 text-[#2E5A2E] dark:text-[#CBF9B2]">
                                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Scheduled Delivery')}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {formattedRange}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div className="block mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-3.5">
                            <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Payment Summary')}</h2>
                            <span className="text-[13px] font-medium text-gray-400 tracking-tight">{cartItems.length} items</span>
                        </div>

                        <div className="space-y-2.5 mb-5">
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                                <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{(cartTotal || 0).toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[14px] text-gray-400 font-medium">{t('Delivery Charge')}</span>
                                {(deliveryCharge === 0 || deliveryCharge === null) ? (
                                    <span className="text-[15px] font-extrabold text-[#2E5A2E] dark:text-[#CBF9B2]">FREE</span>
                                ) : (
                                    <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{(deliveryCharge || 20).toFixed(0)}</span>
                                )}
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-700/50">
                                <span className="text-[15px] text-gray-500 font-medium">{t('Total Amount')}</span>
                                <span className="text-[17px] font-extrabold text-gray-900 dark:text-white">₹{finalTotal.toFixed(0)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmOrder}
                            disabled={isSubmitting}
                            className="w-full bg-black text-white rounded-full py-3 sm:py-3.5 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                t('Confirm Order')
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2E5A2E]/20 dark:bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.4, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 22 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl max-w-sm w-full p-6 sm:p-7 relative overflow-hidden"
                        >
                            <div className="text-center">
                                <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-3 flex items-center justify-center">
                                    {/* Green star burst rotating ONLY during the entrance movement like GPay */}
                                    <motion.div
                                        initial={{ rotate: -40, scale: 0.2, opacity: 0 }}
                                        animate={{ rotate: 30, scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                        className="absolute inset-0 pointer-events-none flex items-center justify-center"
                                    >
                                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                                            <motion.div
                                                key={angle}
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 0.95] }}
                                                transition={{ duration: 0.5, delay: 0.1 + i * 0.02, ease: "easeOut" }}
                                                style={{
                                                    transform: `rotate(${angle}deg) translateY(-76px)`,
                                                    transformOrigin: 'center center'
                                                }}
                                                className="absolute"
                                            >
                                                {/* 4-point green star (GPay style) */}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#22C55E">
                                                    <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                                                </svg>
                                            </motion.div>
                                        ))}
                                    </motion.div>

                                    {/* Expanding soft ring */}
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0.8 }}
                                        animate={{ scale: 1.45, opacity: 0 }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                        className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 border-green-500/40 pointer-events-none"
                                    />

                                    {/* GPay Scalloped Flower Badge (Large flower with compact tight viewBox) */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: [0, 1.15, 1] }}
                                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.05 }}
                                        className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center relative z-10"
                                    >
                                        <svg
                                            viewBox="16 16 68 68"
                                            className="w-full h-full"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            {/* Large Scalloped Flower Base */}
                                            <path
                                                d="M 79.70 42.04 A 11.5 11.5 0 0 1 79.70 57.96 A 11.5 11.5 0 0 1 71.74 71.74 A 11.5 11.5 0 0 1 57.96 79.70 A 11.5 11.5 0 0 1 42.04 79.70 A 11.5 11.5 0 0 1 28.26 71.74 A 11.5 11.5 0 0 1 20.30 57.96 A 11.5 11.5 0 0 1 20.30 42.04 A 11.5 11.5 0 0 1 28.26 28.26 A 11.5 11.5 0 0 1 42.04 20.30 A 11.5 11.5 0 0 1 57.96 20.30 A 11.5 11.5 0 0 1 71.74 28.26 A 11.5 11.5 0 0 1 79.70 42.04 Z"
                                                fill="#1EA34B"
                                            />
                                            {/* Animated Checkmark Tick (Little small, centered & proportionate) */}
                                            <motion.path
                                                d="M 36 50.5 L 45.5 59 L 63 41.5"
                                                stroke="#FFFFFF"
                                                strokeWidth="6.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
                                            />
                                        </svg>
                                    </motion.div>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {t('Order Placed!')}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">
                                    {t('Your order has been placed successfully.')}
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-3 sm:p-3.5 mb-4 sm:mb-5 border border-gray-100 dark:border-gray-600/50">
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5 tracking-widest uppercase font-bold">{t('Order ID')}</p>
                                    <p className="font-mono font-bold text-gray-900 dark:text-white text-lg sm:text-xl">
                                        #{String(createdOrderId || '000').slice(-6).toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseSuccess}
                                    className="w-full bg-black text-white py-3 sm:py-3.5 px-6 rounded-full font-medium text-sm sm:text-base shadow-lg shadow-gray-200 dark:shadow-gray-900/20 active:scale-[0.98] transition-transform"
                                >
                                    {t('Go to Orders')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderConfirmation;

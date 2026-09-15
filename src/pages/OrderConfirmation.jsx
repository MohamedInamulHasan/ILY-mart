import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { getStoreName, formatDeliveryRange, calculateDeliveryCharge } from '../utils/storeHelpers';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../utils/api';
import { openExternalLink } from '../utils/linkHelper';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, ArrowLeft, ClipboardList, ShoppingBag, MapPin, Store, ChevronLeft, MoreHorizontal, Package, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSuccessSound } from '../utils/soundHelper';

const OrderConfirmation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { clearCart } = useCart();
    const { addOrder, stores, setIsFooterHidden } = useData();
    const { t, language } = useLanguage();
    const { setUser } = useAuth();
    const queryClient = useQueryClient();

    const { formData, cartItems, cartTotal, deliveryCharge, isDirectPurchase } = location.state || {};
    const finalTotal = (cartTotal || 0) + (deliveryCharge || 0);

    if (!location.state) {
        return <Navigate to="/" replace />;
    }

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hide navbar when modals are open
    useEffect(() => {
        setIsFooterHidden(showConfirmModal || showSuccessModal);
        return () => setIsFooterHidden(false);
    }, [showConfirmModal, showSuccessModal, setIsFooterHidden]);

    const handleConfirmOrder = () => {
        setShowConfirmModal(true);
    };

    const confirmOrderAction = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Use provided delivery charge or default to 20
        const finalDeliveryCharge = deliveryCharge !== undefined ? deliveryCharge : 20;

        // NEW: Use dynamic delivery charge calculation
        const baseDeliveryCharge = calculateDeliveryCharge(cartItems);

        // Create order object matching backend schema
        const newOrder = {
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
                location: formData.location // Add GPS Location
            },
            paymentMethod: {
                type: 'Cash on Delivery',
                last4: ''
            },
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

        try {
            const createdOrder = await addOrder(newOrder);
            console.log('✅ Order created successfully:', createdOrder);
            
            // Only clear cart if this was NOT a direct purchase
            if (!isDirectPurchase) {
                clearCart();
            }
            
            playSuccessSound();
            setCreatedOrderId(createdOrderId || createdOrder?._id || 'NEW');
            setShowConfirmModal(false);
            setShowSuccessModal(true);

            // Instant update: Deduct coin locally if used (AND not a Gold Product order)
            // Note: Backend also handles this check, but we update UI immediately
            const hasGoldProduct = cartItems.some(item => item.isGold);
            if (finalDeliveryCharge === 0 && deliveryCharge === 0 && !hasGoldProduct) {
                setUser(prev => ({ 
                    ...prev, 
                    coins: Math.max((prev?.coins || 0) - 1, 0),
                    location: newOrder.shippingAddress.location || prev.location
                }));
                queryClient.invalidateQueries(['user-profile']);
            } else if (newOrder.shippingAddress.location) {
                // Always update location if present
                setUser(prev => ({ ...prev, location: newOrder.shippingAddress.location }));
            }

            // WhatsApp notification (Disabled as per user request to only have it in email)
            // sendWhatsAppNotification(createdOrder, formData, cartItems, finalTotal, finalDeliveryCharge);

            // Email notification is sent automatically from backend
        } catch (error) {
            console.error('❌ Failed to create order:', error);

            let errorMessage = t('Failed to place order. Please try again.');
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(`${t('Error')}: ${errorMessage}`);
            setIsSubmitting(false);
        }
    };

    // Function to send WhatsApp notification to admin
    const sendWhatsAppNotification = (order, customerInfo, items, total, delivery) => {
        // Admin WhatsApp number
        const adminWhatsAppNumber = '919500171980'; // Format: country code + number (no + or spaces)

        // Format order details message
        const orderId = String(order._id || order.id).slice(-6).toUpperCase();
        const itemsList = items.map((item, index) =>
            `${index + 1}. ${item.name || item.title} x${item.quantity} - ₹${item.price}`
        ).join('\n');

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
    const { setUser } = useAuth();
    const queryClient = useQueryClient();

    const { formData, cartItems, cartTotal, deliveryCharge, isDirectPurchase } = location.state || {};
    const finalTotal = (cartTotal || 0) + (deliveryCharge || 0);

    if (!location.state) {
        return <Navigate to="/" replace />;
    }

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hide navbar when modals are open
    useEffect(() => {
        setIsFooterHidden(showConfirmModal || showSuccessModal);
        return () => setIsFooterHidden(false);
    }, [showConfirmModal, showSuccessModal, setIsFooterHidden]);

    const handleConfirmOrder = () => {
        setShowConfirmModal(true);
    };

    const confirmOrderAction = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        // Use provided delivery charge or default to 20
        const finalDeliveryCharge = deliveryCharge !== undefined ? deliveryCharge : 20;

        // NEW: Use dynamic delivery charge calculation
        const baseDeliveryCharge = calculateDeliveryCharge(cartItems);

        // Create order object matching backend schema
        const newOrder = {
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
                location: formData.location // Add GPS Location
            },
            paymentMethod: {
                type: 'Cash on Delivery',
                last4: ''
            },
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

        try {
            const createdOrder = await addOrder(newOrder);
            console.log('✅ Order created successfully:', createdOrder);
            
            // Only clear cart if this was NOT a direct purchase
            if (!isDirectPurchase) {
                clearCart();
            }
            
            playSuccessSound();
            setCreatedOrderId(createdOrderId || createdOrder?._id || 'NEW');
            setShowConfirmModal(false);
            setShowSuccessModal(true);

            // Instant update: Deduct coin locally if used (AND not a Gold Product order)
            // Note: Backend also handles this check, but we update UI immediately
            const hasGoldProduct = cartItems.some(item => item.isGold);
            if (finalDeliveryCharge === 0 && deliveryCharge === 0 && !hasGoldProduct) {
                setUser(prev => ({ 
                    ...prev, 
                    coins: Math.max((prev?.coins || 0) - 1, 0),
                    location: newOrder.shippingAddress.location || prev.location
                }));
                queryClient.invalidateQueries(['user-profile']);
            } else if (newOrder.shippingAddress.location) {
                // Always update location if present
                setUser(prev => ({ ...prev, location: newOrder.shippingAddress.location }));
            }

            // WhatsApp notification (Disabled as per user request to only have it in email)
            // sendWhatsAppNotification(createdOrder, formData, cartItems, finalTotal, finalDeliveryCharge);

            // Email notification is sent automatically from backend
        } catch (error) {
            console.error('❌ Failed to create order:', error);

            let errorMessage = t('Failed to place order. Please try again.');
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(`${t('Error')}: ${errorMessage}`);
            setIsSubmitting(false);
        }
    };

    // Function to send WhatsApp notification to admin
    const sendWhatsAppNotification = (order, customerInfo, items, total, delivery) => {
        // Admin WhatsApp number
        const adminWhatsAppNumber = '919500171980'; // Format: country code + number (no + or spaces)

        // Format order details message
        const orderId = String(order._id || order.id).slice(-6).toUpperCase();
        const itemsList = items.map((item, index) =>
            `${index + 1}. ${item.name || item.title} x${item.quantity} - ₹${item.price}`
        ).join('\n');

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
        // Always go to the orders list, as requested
        navigate('/orders');
    };

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 pb-20 md:pb-40 relative">
            {/* Simple Header */}
            <div className="w-full px-5 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                     <button onClick={() => navigate(-1)} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-900 dark:text-white transition-transform active:scale-95 border border-gray-100/50">
                         <ArrowLeft size={22} />
                     </button>
                     <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">{t('Confirmation')}</h1>
                     <div className="w-[42px]" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Total Summary Card */}
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <Package size={18} />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Total Summary')}</h3>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                            {cartItems.map((item) => (
                                <div key={item.id} className="py-4 flex gap-4 first:pt-0">
                                    <div className="h-16 w-16 bg-gray-50 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden flex-shrink-0 relative">
                                        <img
                                            src={item.image || ((item._id || item.id || item.product) ? `${API_BASE_URL}/products/${item._id || item.id || item.product}/image` : "https://via.placeholder.com/150?text=No+Image")}
                                            alt={item.adTitle || item.title}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                        />
                                        <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                            {item.isGold && (
                                                <span className="bg-[#16A34A] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm mb-[1px]">
                                                    {t('Free Delivery')}
                                                </span>
                                            )}
                                            {item.isFromAd && (
                                                <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                                                    {t('Special Offer')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className={`text-sm font-medium text-gray-900 dark:text-white mb-0.5 ${item.isFromAd ? '' : 'truncate'}`} title={item.adTitle || item.title}>
                                            {(() => {
                                                const fullTitle = t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name;
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

                {/* Shipping Details Card */}
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
                        <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#CBF9B2]">
                            <MapPin size={18} />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Shipping details')}</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-1.5">
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
                                {formData.address}{formData.city ? `, ${formData.city}` : ''}{formData.pincode ? ` - ${formData.pincode}` : ''}
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

                        {formData.deliveryTime && (
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3 text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('Scheduled Delivery')}</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatDeliveryRange(formData.deliveryTime)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Card */}
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Payment')}</h2>
                        <span className="text-[13px] font-medium text-gray-400 tracking-tight">{cartItems.length} items</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                            <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹{(cartTotal || 0).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] text-gray-400 font-medium">{t('Delivery Charge')}</span>
                            {(deliveryCharge === 0 || deliveryCharge === null) ? (
                                <span className="text-[15px] font-bold text-[#2E5A2E] dark:text-[#CBF9B2]">FREE</span>
                            ) : (
                                <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹{(deliveryCharge || 20).toFixed(0)}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-700/50">
                            <span className="text-[15px] text-gray-500 font-medium">{t('Total Amount')}</span>
                            <span className="text-[17px] font-black text-gray-900 dark:text-white">₹{finalTotal.toFixed(0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-t border-gray-100 dark:border-gray-700 p-4 shadow-lg">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">{t('Total Amount')}</p>
                        <p className="text-xl font-black text-[#2E5A2E] dark:text-[#CBF9B2]">₹{finalTotal.toFixed(0)}</p>
                    </div>
                    <button
                        onClick={handleConfirmOrder}
                        className="px-8 py-3.5 bg-[#2E5A2E] text-white dark:bg-[#CBF9B2] dark:text-gray-900 rounded-full font-bold text-sm active:scale-95 transition-all shadow-md hover:bg-[#1f3f1f]"
                    >
                        {t('Place Order')}
                    </button>
                </div>
            </div>

            {showConfirmModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-[2.5rem] max-w-sm w-full p-8 transform transition-all border border-gray-100 dark:border-gray-700">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-50 dark:bg-gray-700 mb-6 shadow-inner relative">
                                <div className="absolute inset-0 rounded-full bg-black opacity-5 animate-ping"></div>
                                <ShoppingBag className="h-10 w-10 text-black dark:text-white relative z-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                {t('Ready to Wrap Up?')}
                            </h3>
                            <p className="text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                {t('You are just one step away from confirming your order. Do you want to proceed?')}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmOrderAction}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-4 text-sm font-normal text-white bg-black hover:bg-gray-900 rounded-full shadow-lg shadow-gray-200 dark:shadow-gray-900/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : t('Confirm Order')}
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 text-sm font-normal text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                >
                                    {t('Cancel')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2E5A2E]/20 dark:bg-black/60 backdrop-blur-md">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 transform transition-all scale-100 relative overflow-hidden"
                    >
                        <div className="text-center">
                            <div className="w-24 h-24 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <div className="absolute inset-0 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] opacity-20 animate-ping"></div>
                                <CheckCircle className="h-12 w-12 text-[#2E5A2E] dark:text-[#CBF9B2] relative z-10 animate-bounce" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('Order Placed!')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                {t('Your order has been placed successfully.')}
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-8 border border-gray-100 dark:border-gray-600/50">
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 tracking-widest uppercase font-bold">{t('Order ID')}</p>
                                <p className="font-mono font-bold text-gray-900 dark:text-white text-xl">
                                    #{String(createdOrderId || '000').slice(-6).toUpperCase()}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseSuccess}
                                className="w-full bg-black text-white py-4 px-6 rounded-full font-normal shadow-lg shadow-gray-200 dark:shadow-gray-900/20 active:scale-[0.98] transition-transform"
                            >
                                {t('Go to Orders')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default OrderConfirmation;

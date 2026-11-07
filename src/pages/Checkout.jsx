import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useUserProfile } from '../hooks/queries/useUsers';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { getStoreName, calculateDeliveryCharge, formatDeliveryRange, getAvailableDeliverySlots } from '../utils/storeHelpers';
import { isCategoryPreview } from '../utils/categoryHelpers';
import { useCategories } from '../hooks/queries/useCategories';
import { ArrowLeft, ShoppingCart, Banknote, MapPin, CreditCard, ShoppingBag, Truck, AlertCircle, X, Navigation, ShieldCheck, Trash2, Store, Pencil, Package, MoreHorizontal, CheckCircle, Clock, Sparkles, Calendar, ChevronDown } from 'lucide-react';
import { checkLocationPermission, requestLocationPermission, getCurrentLocation } from '../utils/locationHelpers';
import { AnimatePresence, motion } from 'framer-motion';

import { API_BASE_URL, apiService } from '../utils/api';
import { openExternalLink } from '../utils/linkHelper';

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const directPurchase = location.state?.directPurchase;
    const { cartItems, cartTotal, clearCart, removeFromCart, cartCount } = useCart();
    const { user, setUser, loading: authLoading, updateGuest } = useAuth();
    const { data: userProfile } = useUserProfile(); // Fetch fresh user data with coins
    const { t, language } = useLanguage();
    const { stores, updateUser, settings, categories: dataCategories } = useData();
    const { data: queryCategories = [] } = useCategories();
    const categories = (queryCategories && queryCategories.length > 0) ? queryCategories : (dataCategories || []);

    const displayItems = directPurchase ? directPurchase.items : cartItems;
    const displayTotal = directPurchase ? directPurchase.total : cartTotal;

    const hasPreviewItems = Boolean(
        displayItems && displayItems.length > 0 && displayItems.some(item => 
            item.isPreview === true || 
            item.product?.isPreview === true || 
            item.mode === 'preview' || 
            item.product?.mode === 'preview' || 
            isCategoryPreview(item.category || item.product?.category, categories)
        )
    );
    const [deliveryTimingMode, setDeliveryTimingMode] = useState('instant'); // 'instant' | 'scheduled'
    const [selectedDatePeriod, setSelectedDatePeriod] = useState('today'); // 'today' | 'tomorrow'
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

    const availableDeliverySlots = getAvailableDeliverySlots(settings?.deliveryTimes, selectedDatePeriod);

    useEffect(() => {
        if (selectedTimeSlot && !availableDeliverySlots.includes(selectedTimeSlot)) {
            setSelectedTimeSlot('');
        }
    }, [selectedDatePeriod, availableDeliverySlots, selectedTimeSlot]);
    const [formData, setFormData] = useState({
        fullName: '',
        mobile: '',
        address: '',
        city: '',
        zip: '630702', // Default Pincode
        paymentMethod: 'cod',
        location: '' // GPS Location
    });

    const [cities, setCities] = useState([]); // State for cities
    const [loadingCities, setLoadingCities] = useState(true);

    useEffect(() => {
        // Fetch cities
        const fetchCities = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/settings/cities`);
                const data = await response.json();
                if (data.success && data.data && Array.isArray(data.data.value)) {
                    setCities(data.data.value);
                    // Auto-clear if saved city is now marked unavailable
                    setFormData(prev => {
                        if (!prev.city) return prev;
                        const cl = prev.city.toLowerCase();
                        const isUnavail = cl.includes('(') && (cl.includes('not available') || cl.includes('not deliverable') || cl.includes('unavailable'));
                        return isUnavail ? { ...prev, city: '' } : prev;
                    });
                }
            } catch (error) {
                console.error('Error fetching cities:', error);
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, []);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isLocationSearching, setIsLocationSearching] = useState(false);
    const [cachedLocation, setCachedLocation] = useState(null); 
    const [locationMessage, setLocationMessage] = useState({ show: false, type: '', text: '' });
    const [showLocationError, setShowLocationError] = useState(false);
    const [gpsError, setGpsError] = useState(null);
    const locationRef = useRef(null);
    const fullNameRef = useRef(null);
    const addressRef = useRef(null);
    const mobileRef = useRef(null);
    const cityRef = useRef(null);
    const deliveryTimeRef = useRef(null);

    // PRE-FETCH LOCATION DISABLED - Causes crashes when permission dialog appears
    // User must manually click "Use Current Location" button
    // useEffect(() => {
    //     const preFetchLocation = async () => {
    //         // DISABLED - This was causing crashes when entering the page
    //     };
    //     preFetchLocation();
    // }, []);
    
    const handleDetectLocation = async () => {
        setIsLocationSearching(true);
        setShowLocationError(false);
        setGpsError(null);
        try {
            const result = await getCurrentLocation();
            if (result && result.success) {
                // Just access location, do not fill city or address
                setFormData(prev => ({
                    ...prev,
                    location: result.mapsLink
                }));
                setFieldErrors(prev => ({
                    ...prev,
                    location: false
                }));
                setGpsError(null);

                // Add location to DB whenever fetching
                try {
                    await apiService.updateProfile({ location: result.mapsLink });
                    if (user) {
                        const updatedUser = { ...user, location: result.mapsLink };
                        setUser(updatedUser);
                    }
                } catch (dbErr) {
                    console.warn('Failed to save location to DB:', dbErr);
                }
            } else {
                setGpsError({ code: result?.code || 'ERROR', text: result?.message });
            }
        } catch (locErr) {
            console.error('Checkout location error:', locErr);
            setGpsError({ code: 'ERROR', text: 'Unable to detect GPS location. Please enter your address manually.' });
        } finally {
            setIsLocationSearching(false);
        }
    };

    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState('prompt'); // granted, prompt, denied
    const [fieldErrors, setFieldErrors] = useState({});

    // Security Details for 9500171980
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityPassword, setSecurityPassword] = useState('');
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [securityError, setSecurityError] = useState('');
    const [securityVerified, setSecurityVerified] = useState(false);

    const handleVerifySecurityPassword = (e) => {
        e?.preventDefault();
        if (securityPassword === 'Moh@2004') {
            setSecurityVerified(true);
            setShowSecurityModal(false);
            setSecurityError('');
            setTimeout(() => {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.click();
            }, 100);
        } else {
            setSecurityError(language === 'ta' ? 'தவறான கடவுச்சொல்! அணுகல் மறுக்கப்பட்டது.' : 'Incorrect security password! Access denied.');
        }
    };


    // With the guest-first flow, all users have a session auto-created on launch.
    // Only redirect if loading is complete AND there is still no user (should not happen normally).
    useEffect(() => {
        if (!authLoading && !user) {
            // This is a fallback — guest registration must have failed silently.
            sessionStorage.setItem('redirectAfterLogin', '/checkout');
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    // Autofill form with user's saved address data
    // Priority: fullName > name (to use updated profile name instead of signup username)
    // Initialize address state once user data is ready
    useEffect(() => {
        if (!authLoading) {
            if (user) {
                const addressObj = user.address || {};
                const isAddressObject = typeof user.address === 'object' && user.address !== null;

                // Check if we have valid address data to show card view
                // We check for minimal requirement: street address + city
                const hasValidAddress = (isAddressObject && addressObj.street && addressObj.city) ||
                    (!isAddressObject && user.address && user.city);

                const userDisplayName = user.fullName || user.name || '';
                const isGuestName = userDisplayName.startsWith('User_') || userDisplayName === 'Guest User';

                setFormData(prev => {
                    let initAddress = (isAddressObject ? addressObj.street : user.address) || prev.address || '';
                    let initCity = (isAddressObject ? addressObj.city : user.city) || prev.city || '';
                    if (initAddress && initCity && initAddress.trim().toLowerCase() === initCity.trim().toLowerCase()) {
                        initAddress = '';
                    }
                    return {
                        ...prev,
                        fullName: isGuestName ? '' : userDisplayName,
                        mobile: user.mobile || user.phone || prev.mobile,
                        address: initAddress,
                        city: initCity,
                        zip: '630702',
                        location: user.location || prev.location
                    };
                });

                // Auto-switch to card view if address exists
                if (hasValidAddress) {
                    setIsEditingAddress(false);
                } else {
                    // No valid address, show form
                    setIsEditingAddress(true);
                }

                // Always start in edit mode to allow user to review/edit -- REMOVED forced true
                // setIsEditingAddress(true);
            } else {
                // No user, defaults to true (though we redirect)
                setIsEditingAddress(true);
            }
            setIsInitialized(true);
        }
    }, [user, authLoading]);

    // Check geolocation permission status on mount and when editing starts
    useEffect(() => {
        if (isEditingAddress && navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then(result => {
                setPermissionStatus(result.state);
                result.onchange = () => setPermissionStatus(result.state);
            }).catch(err => console.warn('Permissions API not supported', err));
        }
    }, [isEditingAddress]);

    // Auto-hide location messages
    useEffect(() => {
        if (locationMessage.show) {
            const timer = setTimeout(() => {
                setLocationMessage(prev => ({ ...prev, show: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [locationMessage.show]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validation logic for specific fields
        if (name === 'mobile') {
            // Only allow numbers and max 10 digits
            if (/^\d*$/.test(value) && value.length <= 10) {
                setFormData({ ...formData, [name]: value });
            }
        } else if (name === 'zip') {
            // Only allow numbers and max 6 digits
            if (/^\d*$/.test(value) && value.length <= 6) {
                setFormData({ ...formData, [name]: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const errors = {};
        if (!formData.fullName) errors.fullName = true;
        if (!formData.mobile) errors.mobile = true;
        if (!formData.address) errors.address = true;
        if (!formData.city) {
            errors.city = true;
        } else {
            const cl = formData.city.toLowerCase();
            if (cl.includes('(') && (cl.includes('not available') || cl.includes('not deliverable') || cl.includes('unavailable'))) {
                errors.city = true;
            }
        }
        if (!formData.location) errors.location = true;
        if (settings?.deliveryTimingType !== 'instant' && !hasPreviewItems && !selectedTimeSlot) {
            errors.deliveryTime = true;
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            
            // Only open address form if an address field is actually missing/invalid
            const hasAddressError = errors.fullName || errors.mobile || errors.address || errors.city || errors.location;
            if (hasAddressError) {
                setIsEditingAddress(true);
            }
            
            setTimeout(() => {
                if (errors.fullName) fullNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.address) addressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.mobile) mobileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.city) cityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.location) locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.deliveryTime) deliveryTimeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return;
        }

        // Validate Mobile Number (10 digits)
        if (!/^\d{10}$/.test(formData.mobile)) {
            setFieldErrors({ mobile: true });
            setIsEditingAddress(true);
            setTimeout(() => {
                mobileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
            return;
        }

        // Security password check for number 9500171980 ONLY when adding or updating address newly
        const cleanMobile = (formData.mobile || '').toString().replace(/\D/g, '');
        const isAddressChanged = isEditingAddress || 
            formData.address !== (user?.address?.street || '') || 
            formData.city !== (user?.address?.city || '') ||
            formData.mobile !== (user?.mobile || user?.phone || '');

        if (cleanMobile.endsWith('9500171980') && isAddressChanged && !securityVerified) {
            setShowSecurityModal(true);
            return;
        }

        // Show loading state for instant feedback
        setIsNavigating(true);

        const performOrderCheckout = async () => {
            try {
                // Step A: Update local user state immediately
                let activeUser = user;
                const updatedUserData = {
                    ...activeUser,
                    name: formData.fullName,
                    fullName: formData.fullName,
                    mobile: formData.mobile,
                    phone: formData.mobile,
                    address: {
                        street: formData.address,
                        city: formData.city,
                        zip: formData.zip,
                        state: '',
                        country: 'India'
                    },
                    city: formData.city,
                    zip: formData.zip,
                    pincode: formData.zip
                };

                // Save locally first (instant)
                localStorage.setItem('userInfo', JSON.stringify(updatedUserData));
                setUser(updatedUserData);

                // Step B: Calculate delivery & slot parameters
                const currentUser = userProfile?.data || updatedUserData;
                const hasCoins = currentUser?.coins > 0;
                const isItemFree = (item) => Boolean(
                    item && (item.isGold === true || (item.product && item.product.isGold === true) || item.deliveryCharge === 0 || item.isFreeDelivery === true || item.freeDelivery === true)
                );
                const isOnlyFreeProducts = displayItems.length > 0 && displayItems.every(isItemFree);
                const baseDeliveryCharge = calculateDeliveryCharge(displayItems);
                const finalDeliveryCharge = (hasCoins || isOnlyFreeProducts) ? 0 : baseDeliveryCharge;

                const isScheduledMode = settings?.deliveryTimingType !== 'instant' && !hasPreviewItems;
                const deliveryTimeParam = isScheduledMode && selectedTimeSlot 
                    ? `${selectedDatePeriod}|${selectedTimeSlot}` 
                    : '';

                // Step C: Fire background guest upgrade & profile update (non-blocking)
                if (typeof updateGuest === 'function') {
                    try { Promise.resolve(updateGuest(formData.fullName, formData.mobile)).catch(e => console.warn('Guest upgrade warning:', e)); } catch (e) {}
                }
                if (apiService && typeof apiService.updateProfile === 'function') {
                    try {
                        Promise.resolve(apiService.updateProfile({
                            name: formData.fullName,
                            mobile: formData.mobile,
                            address: updatedUserData.address,
                            city: formData.city,
                            zip: formData.zip
                        })).catch(e => console.warn('Profile update warning:', e));
                    } catch (e) {}
                }

                // Step D: Navigate instantly to Order Confirmation!
                navigate('/order-confirmation', {
                    state: {
                        formData: {
                            ...formData,
                            name: formData.fullName,
                            pincode: formData.zip,
                            location: formData.location,
                            deliveryTime: deliveryTimeParam
                        },
                        cartItems: displayItems,
                        cartTotal: displayTotal,
                        deliveryCharge: finalDeliveryCharge,
                        isDirectPurchase: !!directPurchase
                    }
                });
            } catch (err) {
                console.error('❌ Checkout submit error:', err);
                alert(t('Checkout failed. Please try again.'));
                setIsNavigating(false);
            }
        };

        performOrderCheckout();
    };

    useEffect(() => {
        if (displayItems.length === 0) {
            navigate('/cart');
        }
    }, [displayItems.length, navigate]);

    if (!user || displayItems.length === 0) {
        return null;
    }

    // Use userProfile for fresh coin data, fallback to user from auth
    const currentUser = userProfile?.data || user;
    const hasCoins = currentUser?.coins > 0;
    const isItemFree = (item) => Boolean(
        item && (item.isGold === true || (item.product && item.product.isGold === true) || item.deliveryCharge === 0 || item.isFreeDelivery === true || item.freeDelivery === true)
    );
    const isOnlyFreeProducts = displayItems.length > 0 && displayItems.every(isItemFree);
    const hasGoldProduct = isOnlyFreeProducts;
    const baseDeliveryCharge = calculateDeliveryCharge(displayItems);
    const deliveryCharge = (hasCoins || isOnlyFreeProducts) ? 0 : baseDeliveryCharge;
    const finalTotal = displayTotal + deliveryCharge;

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
                                onClick={() => navigate(-1)}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[16px] font-bold text-gray-900 tracking-tight leading-tight">{t('Checkout')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Shipping & Payment')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-[42px] h-[42px]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-[86px] sm:pt-[88px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Location Toast Message (errors only) */}
                {locationMessage.show && locationMessage.type === 'error' && (
                    <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-top-4 max-w-[90vw] bg-red-600 text-white">
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            <AlertCircle size={18} className="flex-shrink-0" />
                            <span className="font-bold text-[13px] tracking-tight">{locationMessage.text}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 space-y-3 sm:space-y-3.5">
                        {/* Shipping Address */}
                        {/* Shipping Address */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center text-[#2E5A2E] dark:text-[#CBF9B2]">
                                        <MapPin size={18} />
                                    </div>
                                    <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Shipping details')}</h2>
                                </div>
                                {!isEditingAddress && (
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditingAddress(true)}
                                        className="p-2 text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                                        title={t('Edit Address')}
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )}
                            </div>

                            {!isInitialized || authLoading ? (
                                <div className="animate-pulse space-y-2">
                                     <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/3"></div>
                                     <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4"></div>
                                     <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-3/4"></div>
                                </div>
                            ) : !isEditingAddress ? (
                                <div className="space-y-1.5 pl-1 sm:pl-2">
                                    {/* 1. Name */}
                                    <p className="font-bold text-[16px] text-gray-900 dark:text-white">
                                        {formData.fullName || t('No Name')}
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
                                    
                                    {/* 4. Pin / View on Map - Shining Card with Map SVG */}
                                    {formData.location && (
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => openExternalLink(formData.location)}
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
                            ) : (
                                <div className="space-y-5">
                                    {/* Location Detection Block */}
                                    <div ref={locationRef} className="relative">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">{t('GPS Location')}</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleDetectLocation}
                                            disabled={isLocationSearching}
                                            className={`w-full border rounded-xl px-4 py-3.5 flex items-center gap-3.5 transition-all duration-300 active:scale-[0.98] shadow-none ${
                                                isLocationSearching
                                                    ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                                                    : formData.location
                                                    ? 'bg-black dark:bg-black border-black text-white shadow-md'
                                                    : showLocationError
                                                    ? 'border-amber-400 bg-amber-50/10'
                                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {/* Icon Container */}
                                            <div className="relative flex-shrink-0 flex items-center justify-center w-11 h-11">
                                                {isLocationSearching ? (
                                                    /* Location Loading Animation - Grey Theme */
                                                    <div className="relative flex items-center justify-center w-11 h-11">
                                                        <motion.span
                                                            className="absolute rounded-full border border-red-500/40 bg-red-500/10 pointer-events-none"
                                                            initial={{ width: 14, height: 14, opacity: 0.9 }}
                                                            animate={{ width: 44, height: 44, opacity: 0 }}
                                                            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
                                                        />
                                                        <motion.span
                                                            className="absolute rounded-full border border-gray-400/40 bg-gray-400/10 dark:border-gray-500/40 dark:bg-gray-500/10 pointer-events-none"
                                                            initial={{ width: 14, height: 14, opacity: 0.8 }}
                                                            animate={{ width: 52, height: 52, opacity: 0 }}
                                                            transition={{ repeat: Infinity, duration: 1.4, delay: 0.45, ease: 'easeOut' }}
                                                        />
                                                        <div className="relative w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 border border-gray-400 dark:border-gray-500 flex items-center justify-center shadow-xs">
                                                            <motion.div
                                                                animate={{ y: [0, -4, 0] }}
                                                                transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                                                                className="flex flex-col items-center justify-center"
                                                            >
                                                                <MapPin size={20} className="text-red-500 fill-red-500/30" strokeWidth={2.2} />
                                                            </motion.div>
                                                            <motion.span
                                                                animate={{ scale: [1, 0.4, 1], opacity: [0.8, 0.2, 0.8] }}
                                                                transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
                                                                className="absolute bottom-1 w-1.5 h-1 bg-red-400 rounded-full pointer-events-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : formData.location ? (
                                                    /* Location Attached: Round low-opacity white circle with red pin */
                                                    <div className="relative w-10 h-10 rounded-full bg-white/20 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner transition-transform duration-200">
                                                        <MapPin size={20} className="text-red-500 fill-red-500/20" strokeWidth={2.2} />
                                                    </div>
                                                ) : (
                                                    /* Idle Unattached: Normal white/light circle */
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showLocationError ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                                                        <MapPin size={20} className={showLocationError ? 'text-amber-600' : 'text-gray-400 dark:text-gray-500'} strokeWidth={2} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`text-[13px] font-bold truncate ${
                                                    formData.location && !isLocationSearching
                                                        ? 'text-white'
                                                        : isLocationSearching
                                                        ? 'text-gray-900 dark:text-white'
                                                        : showLocationError
                                                        ? 'text-amber-600 font-bold'
                                                        : 'text-gray-800 dark:text-gray-200'
                                                }`}>
                                                    {isLocationSearching 
                                                        ? t('Finding location...') 
                                                        : formData.location 
                                                        ? (formData.address && formData.city ? t('GPS & Address Attached') : t('GPS Coordinates Attached'))
                                                        : t('Tap to attach GPS location')}
                                                </p>
                                                <p className={`text-[11px] truncate ${
                                                    formData.location && !isLocationSearching
                                                        ? 'text-white/80'
                                                        : isLocationSearching
                                                        ? 'text-gray-600 dark:text-gray-300'
                                                        : 'text-gray-400 dark:text-gray-500'
                                                }`}>
                                                    {isLocationSearching 
                                                        ? t('Accessing GPS coordinates...') 
                                                        : formData.location 
                                                        ? (formData.address && formData.city ? t('Tap to update location') : t('Enter street name & city below'))
                                                        : t('Helps us deliver faster')}
                                                </p>
                                            </div>

                                            {/* Arrow */}
                                            <ArrowLeft size={16} className={`flex-shrink-0 rotate-180 transition-colors ${
                                                formData.location && !isLocationSearching
                                                    ? 'text-white/80'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        </button>

                                        {fieldErrors.location && (
                                            <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                <span>{t('GPS Location is required')}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('Full Name')}</label>
                                            <input
                                                ref={fullNameRef}
                                                type="text"
                                                name="fullName"
                                                value={formData.fullName}
                                                onChange={e => { handleChange(e); setFieldErrors(p => ({...p, fullName: false})); }}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm shadow-none"
                                                placeholder={t('Enter your full name')}
                                            />
                                            {fieldErrors.fullName && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('Mobile Number')}</label>
                                            <input
                                                ref={mobileRef}
                                                type="tel"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={e => { handleChange(e); setFieldErrors(p => ({...p, mobile: false})); }}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm shadow-none"
                                                placeholder={t('Enter 10-digit mobile number')}
                                            />
                                            {fieldErrors.mobile && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('Address')}</label>
                                            <textarea
                                                ref={addressRef}
                                                name="address"
                                                rows="3"
                                                value={formData.address}
                                                onChange={e => { handleChange(e); setFieldErrors(p => ({...p, address: false})); }}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm shadow-none"
                                                placeholder={t('House no, Flat, Street name, Landmark')}
                                            />
                                            {fieldErrors.address && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('City')}</label>
                                            <input
                                                ref={cityRef}
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={(e) => {
                                                    setFormData(prev => ({ ...prev, city: e.target.value }));
                                                    setFieldErrors(prev => ({ ...prev, city: false }));
                                                }}
                                                placeholder={t('Enter city name')}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm shadow-none"
                                            />
                                            {fieldErrors.city && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preferred Order Timing & Delivery Slot Selection - Dropdown */}
                        {settings?.deliveryTimingType !== 'instant' && !hasPreviewItems && (
                            <div ref={deliveryTimeRef} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-[#2E5A2E] dark:text-[#7CA90E]" />
                                    <span className="font-bold text-xs text-gray-900 dark:text-white">{t('Delivery Timing')}</span>
                                </div>

                                {/* Delivery Time Slot Dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedTimeSlot || ''}
                                        onChange={(e) => {
                                            setSelectedTimeSlot(e.target.value);
                                            setFieldErrors(prev => ({ ...prev, deliveryTime: false }));
                                        }}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-0 focus:border-[#2E5A2E] appearance-none cursor-pointer pr-10 transition-colors shadow-none outline-none"
                                    >
                                        <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                            -- {t('Select Delivery Time Slot')} --
                                        </option>
                                        {availableDeliverySlots && availableDeliverySlots.length > 0 ? (
                                            availableDeliverySlots.map(slotId => (
                                                <option key={slotId} value={slotId} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2">
                                                    {formatDeliveryRange(slotId)}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-400">
                                                {t('No delivery slots available')}
                                            </option>
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500 dark:text-gray-400">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                                {fieldErrors.deliveryTime && (
                                    <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                        <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                        <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                        <span>{language === 'ta' ? 'தயவுசெய்து டெலிவரி நேரத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select a delivery time slot.'}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order Summary (Items List) */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700/60 flex items-center gap-2.5">
                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#2E5A2E]">
                                    <Package size={18} />
                                </div>
                                <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Order Summary')}</h3>
                            </div>

                            <div className="p-3.5 sm:p-4">
                                <div className="space-y-4">
                                    {displayItems.map((item, index) => (
                                        <div key={item.id || index} className="py-2.5 flex gap-3 first:pt-0">
                                            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 relative">
                                                {isItemFree(item) && (
                                                    <div className="absolute top-0 left-0 right-0 z-[10] bg-[#E11D48] text-white text-[5.5px] font-bold uppercase tracking-tight py-0.5 text-center leading-none shadow-xs select-none pointer-events-none whitespace-nowrap overflow-hidden">
                                                        {t('Free Delivery')}
                                                    </div>
                                                )}
                                                <img
                                                    src={item.image || ((item._id || item.id || item.product) ? `${API_BASE_URL}/products/${item._id || item.id || item.product}/image` : "https://via.placeholder.com/150?text=No+Image")}
                                                    alt={item.adTitle || item.title || item.name}
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
                                                        {(item.selectedMention || item.mention || item.unit || item.weight) && (
                                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                                {item.selectedMention || item.mention || item.unit || item.weight}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300">
                                                            x{item.quantity}
                                                        </div>
                                                        {!directPurchase && (
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    removeFromCart(item.id);
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                                title={t('Remove item')}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cash on Delivery Card (Direct White Card with Black outline SVG & Black Texts) */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-3.5 sm:p-4">
                            <label className="flex items-center cursor-pointer w-full select-none">
                                {/* 3 Green Cash Notes with Black Outline */}
                                <div className="mr-3.5 flex-shrink-0 flex items-center justify-center">
                                    <svg width="42" height="34" viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                                        {/* Back note (tilted left) */}
                                        <g transform="rotate(-9 19 15)">
                                            <rect x="3" y="5" width="29" height="16" rx="3" fill="#009922" stroke="#000000" strokeWidth="1.6" />
                                            <circle cx="17.5" cy="13" r="3" stroke="#000000" strokeWidth="1.1" fill="none" />
                                            <circle cx="7.5" cy="13" r="1.1" fill="#000000" />
                                            <circle cx="27.5" cy="13" r="1.1" fill="#000000" />
                                        </g>
                                        {/* Middle note (tilted right) */}
                                        <g transform="rotate(7 21 16)">
                                            <rect x="5" y="6" width="29" height="16" rx="3" fill="#00B329" stroke="#000000" strokeWidth="1.6" />
                                            <circle cx="19.5" cy="14" r="3" stroke="#000000" strokeWidth="1.1" fill="none" />
                                            <circle cx="9.5" cy="14" r="1.1" fill="#000000" />
                                            <circle cx="29.5" cy="14" r="1.1" fill="#000000" />
                                        </g>
                                        {/* Front note (prominent, straight) */}
                                        <g>
                                            <rect x="5" y="10" width="31" height="17.5" rx="3.2" fill="#00B329" stroke="#000000" strokeWidth="1.8" />
                                            <circle cx="20.5" cy="18.7" r="3.5" stroke="#000000" strokeWidth="1.2" fill="none" />
                                            <circle cx="10" cy="18.7" r="1.2" fill="#000000" />
                                            <circle cx="31" cy="18.7" r="1.2" fill="#000000" />
                                            <rect x="7.5" y="12" width="26" height="13.5" rx="2" stroke="#000000" strokeWidth="0.8" strokeDasharray="1.5 1.5" fill="none" opacity="0.85" />
                                        </g>
                                    </svg>
                                </div>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="cod"
                                    checked={formData.paymentMethod === 'cod'}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                <div className="flex-1">
                                    <span className="block font-bold text-[16px] leading-tight text-gray-900 dark:text-white">
                                        {t('Cash on Delivery')}
                                    </span>
                                    <span className="block text-[12.5px] font-medium mt-0.5 text-gray-500 dark:text-gray-400">
                                        {t('Pay when you receive your order')}
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Order Summary / Payment Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-3.5">
                                <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Payment Summary')}</h2>
                                <span className="text-[13px] font-medium text-gray-400 tracking-tight">{displayItems.length} {t('items')}</span>
                            </div>

                            <div className="space-y-2.5 mb-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                                    <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{displayTotal.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-gray-400 font-medium">{t('Delivery')}</span>
                                    {deliveryCharge === 0 ? (
                                        <span className="text-[15px] font-extrabold text-[#2E5A2E] dark:text-[#CBF9B2]">FREE</span>
                                    ) : (
                                        <span className="text-[15px] font-extrabold text-gray-900 dark:text-white">₹{deliveryCharge.toFixed(0)}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[15px] text-gray-500 font-medium">{t('Total')}</span>
                                    <span className="text-[17px] font-extrabold text-gray-900 dark:text-white">₹{finalTotal.toFixed(0)}</span>
                                </div>
                            </div>
    
                            <button
                                type="submit"
                                disabled={isNavigating}
                                className="w-full bg-black text-white rounded-full py-3 sm:py-3.5 flex items-center justify-center font-normal text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                            >
                                {isNavigating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : t('Continue')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Security Password Modal for 9500171980 */}
            <AnimatePresence>
                {showSecurityModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                                🔒
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                {language === 'ta' ? 'பாதுகாப்பு சரிபார்ப்பு' : 'Security Verification'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                                {language === 'ta' 
                                    ? '9500171980 எண்ணிற்கு முகவரியை மாற்ற கடவுச்சொல்லை உள்ளிடவும்.'
                                    : 'Security verification required for 9500171980 to add/update address.'}
                            </p>

                            <form onSubmit={handleVerifySecurityPassword} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={showPasswordText ? 'text' : 'password'}
                                        value={securityPassword}
                                        onChange={(e) => {
                                            setSecurityPassword(e.target.value);
                                            setSecurityError('');
                                        }}
                                        placeholder={language === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Enter Security Password'}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordText(!showPasswordText)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-semibold px-1"
                                    >
                                        {showPasswordText ? (language === 'ta' ? 'மறை' : 'Hide') : (language === 'ta' ? 'காட்டு' : 'Show')}
                                    </button>
                                </div>

                                {securityError && (
                                    <p className="text-xs font-bold text-red-500">
                                        {securityError}
                                    </p>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSecurityModal(false);
                                            setSecurityPassword('');
                                            setSecurityError('');
                                        }}
                                        className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs active:scale-95 transition-transform"
                                    >
                                        {language === 'ta' ? 'ரத்து' : 'Cancel'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs active:scale-95 transition-transform shadow-md"
                                    >
                                        {language === 'ta' ? 'சரிபார்' : 'Verify'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Checkout;

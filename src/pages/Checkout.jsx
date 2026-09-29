import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useUserProfile } from '../hooks/queries/useUsers';
import { getStoreName, calculateDeliveryCharge, formatDeliveryRange, getAvailableDeliverySlots } from '../utils/storeHelpers';
import { ArrowLeft, MapPin, CreditCard, ShoppingBag, Truck, AlertCircle, X, Navigation, ShieldCheck, Trash2, Store, Pencil, Package, MoreHorizontal, CheckCircle, Clock, Sparkles, Calendar } from 'lucide-react';
import { checkLocationPermission, requestLocationPermission, getCurrentLocation } from '../utils/locationHelpers';
import { AnimatePresence, motion } from 'framer-motion';

import { API_BASE_URL } from '../utils/api';
import { openExternalLink } from '../utils/linkHelper';

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const directPurchase = location.state?.directPurchase;
    const { cartItems, cartTotal, clearCart, removeFromCart } = useCart();
    const { user, setUser, loading: authLoading, updateGuest } = useAuth();
    const { data: userProfile } = useUserProfile(); // Fetch fresh user data with coins
    const { t, language } = useLanguage();
    const { stores, updateUser, settings } = useData();
    const [deliveryTimingMode, setDeliveryTimingMode] = useState('instant'); // 'instant' | 'scheduled'
    const [selectedDatePeriod, setSelectedDatePeriod] = useState('today'); // 'today' | 'tomorrow'
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

    const availableDeliverySlots = getAvailableDeliverySlots(settings?.deliveryTimes, selectedDatePeriod);

    useEffect(() => {
        if (availableDeliverySlots.length > 0 && (!selectedTimeSlot || !availableDeliverySlots.includes(selectedTimeSlot))) {
            setSelectedTimeSlot(availableDeliverySlots[0]);
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
    const locationRef = useRef(null);
    const fullNameRef = useRef(null);
    const addressRef = useRef(null);
    const mobileRef = useRef(null);
    const cityRef = useRef(null);

    // PRE-FETCH LOCATION DISABLED - Causes crashes when permission dialog appears
    // User must manually click "Use Current Location" button
    // useEffect(() => {
    //     const preFetchLocation = async () => {
    //         // DISABLED - This was causing crashes when entering the page
    //     };
    //     preFetchLocation();
    // }, []);
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

                setFormData(prev => ({
                    ...prev,
                    fullName: isGuestName ? '' : userDisplayName,
                    mobile: user.mobile || user.phone || prev.mobile,
                    // If user.address is an object, use .street, otherwise use it directly if string
                    address: (isAddressObject ? addressObj.street : user.address) || prev.address,
                    city: (isAddressObject ? addressObj.city : user.city) || prev.city,
                    zip: '630702', // Default if missing
                    location: user.location || prev.location // Auto-fill saved location from profile
                }));

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

    // If no user, don't render the form (will redirect)
    if (!user) {
        return null;
    }

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

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setIsEditingAddress(true);
            setTimeout(() => {
                if (errors.fullName) fullNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.address) addressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.mobile) mobileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.city) cityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                else if (errors.location) locationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                // Step A: Link guest account or switch to existing profile using the phone number
                console.log('🔄 Upgrading guest user profile with name and mobile...');
                let activeUser = user;
                try {
                    const freshUser = await updateGuest(formData.fullName, formData.mobile);
                    if (freshUser) activeUser = freshUser;
                } catch (guestErr) {
                    console.warn('⚠️ Guest upgrade failed (non-critical), continuing:', guestErr);
                }

                // Step B: Update user profile address details
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

                // Save locally first (always succeeds)
                localStorage.setItem('userInfo', JSON.stringify(updatedUserData));
                setUser(updatedUserData);

                // Save to database via own profile endpoint (non-blocking — don't fail order if this fails)
                try {
                    await apiService.updateProfile({
                        name: formData.fullName,
                        mobile: formData.mobile,
                        address: updatedUserData.address,
                        city: formData.city,
                        zip: formData.zip
                    });
                    console.log('✅ User profile and address saved to DB.');
                } catch (profileErr) {
                    console.warn('⚠️ Profile save failed (non-critical), continuing with order:', profileErr);
                }

                // Step C: Proceed to Order Confirmation
                const currentUser = userProfile?.data || updatedUserData;
                const hasCoins = currentUser?.coins > 0;
                const hasGoldProduct = displayItems.some(item => item.isGold);
                const baseDeliveryCharge = calculateDeliveryCharge(displayItems);
                const finalDeliveryCharge = (hasCoins || hasGoldProduct) ? 0 : baseDeliveryCharge;

                const isScheduledMode = settings?.deliveryTimingType !== 'instant';
                const deliveryTimeParam = isScheduledMode && selectedTimeSlot 
                    ? `${selectedDatePeriod}|${selectedTimeSlot}` 
                    : '';

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

    // Determine items to show (Direct Purchase or Cart)
    const displayItems = directPurchase ? directPurchase.items : cartItems;
    const displayTotal = directPurchase ? directPurchase.total : cartTotal;

    useEffect(() => {
        if (displayItems.length === 0) {
            navigate('/cart');
        }
    }, [displayItems.length, navigate]);

    if (displayItems.length === 0) {
        return null;
    }

    // Use userProfile for fresh coin data, fallback to user from auth
    const currentUser = userProfile?.data || user;
    const hasCoins = currentUser?.coins > 0;
    const hasGoldProduct = displayItems.some(item => item.isGold || (item.product && item.product.isGold)) || location.state?.hasGoldProduct;
    const baseDeliveryCharge = calculateDeliveryCharge(displayItems);
    const deliveryCharge = (hasCoins || hasGoldProduct) ? 0 : baseDeliveryCharge;
    const finalTotal = displayTotal + deliveryCharge;

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 pb-20 md:pb-40 relative">
            {/* Simple Header */}
            <div className="w-full px-5 py-4">
                <div className="max-w-md mx-auto flex items-center justify-between">
                     <button onClick={() => navigate(-1)} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-900 dark:text-white transition-transform active:scale-95 border border-gray-100/50">
                         <ArrowLeft size={22} />
                     </button>
                     <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">{t('Checkout')}</h1>
                     <div className="w-[42px]" /> 
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Location Toast Message - Refined for clarity */}
                {locationMessage.show && (
                    <div className={`fixed top-32 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-top-4 max-w-[90vw] ${
                        locationMessage.type === 'success'
                        ? 'bg-[#2E5A2E] text-white'
                        : 'bg-red-600 text-white'
                        }`}>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                            {locationMessage.type === 'success' ? (
                                <ShieldCheck size={18} className="flex-shrink-0" />
                            ) : (
                                <AlertCircle size={18} className="flex-shrink-0" />
                            )}
                            <span className="font-bold text-[13px] tracking-tight">{locationMessage.text}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Shipping Address */}
                        {/* Shipping Address */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-[#CBF9B2]/10 flex items-center justify-center text-[#2E5A2E] dark:text-[#CBF9B2]">
                                    <MapPin size={18} />
                                </div>
                                <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Shipping details')}</h2>
                            </div>

                            {!isInitialized || authLoading ? (
                                <div className="animate-pulse space-y-4">
                                     <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-2xl w-full"></div>
                                </div>
                            ) : !isEditingAddress ? (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-600 relative group">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditingAddress(true)}
                                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <div className="space-y-1.5">
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
                                            {formData.address}{formData.city ? `, ${formData.city}` : ''}{formData.zip ? ` - ${formData.zip}` : ''}
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
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Location Detection Block */}
                                    <div ref={locationRef} className="relative mb-6">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">{t('GPS Location')}</span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setIsLocationSearching(true);
                                                setShowLocationError(false);
                                                const result = await getCurrentLocation();
                                                
                                                if (result.success) {
                                                    setFormData(prev => ({ ...prev, location: result.mapsLink }));
                                                    setFieldErrors(prev => ({ ...prev, location: false }));
                                                    setIsLocationSearching(false);
                                                    setLocationMessage({ show: true, type: 'success', text: t('Location Accessed Successfully') });
                                                } else {
                                                    setIsLocationSearching(false);
                                                    setLocationMessage({ show: true, type: 'error', text: t(result.message) });
                                                }
                                            }}
                                            disabled={isLocationSearching}
                                            className={`w-full bg-white dark:bg-gray-800 border rounded-xl px-4 py-3.5 flex items-center gap-3 transition-all duration-300 active:scale-[0.98] shadow-none ${
                                                isLocationSearching ? 'border-[#2E5A2E] dark:border-[#CBF9B2] bg-green-50/30' :
                                                formData.location ? 'border-[#2E5A2E] dark:border-[#CBF9B2] bg-green-50/30 dark:bg-[#CBF9B2]/5' :
                                                showLocationError ? 'border-amber-400 bg-amber-50/10' :
                                                'border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            {/* Icon */}
                                            <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                                                isLocationSearching ? 'bg-[#2E5A2E] text-white' :
                                                formData.location ? 'bg-green-100 dark:bg-[#CBF9B2]/20 text-[#2E5A2E] dark:text-[#CBF9B2]' :
                                                showLocationError ? 'bg-amber-100 text-amber-600' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                            }`}>
                                                <AnimatePresence mode="wait">
                                                    {isLocationSearching ? (
                                                        <motion.div key="spin" animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                                                            <Navigation size={16} />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div key={formData.location ? 'pin-on' : 'pin-off'} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                                                            <MapPin size={16} />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Text */}
                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`text-[13px] font-bold truncate ${
                                                    formData.location ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' :
                                                    isLocationSearching ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 
                                                    showLocationError ? 'text-amber-600 font-bold' : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {isLocationSearching ? t('Finding location...') : formData.location ? t('Location Attached') : t('Tap to attach GPS location')}
                                                </p>
                                                {!isLocationSearching && (
                                                    <p className="text-[11px] text-gray-400 truncate">
                                                        {formData.location ? t('Tap to update location') : t('Helps us deliver faster')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Arrow */}
                                            <ArrowLeft size={14} className={`flex-shrink-0 rotate-180 transition-colors ${
                                                formData.location ? 'text-[#2E5A2E] dark:text-[#CBF9B2]' : 'text-gray-300 dark:text-gray-600'
                                            }`} />
                                        </button>

                                        {fieldErrors.location && (
                                            <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                <span>{t('GPS Location is required')}</span>
                                            </div>
                                        )}

                                        {/* Remove link when attached */}
                                        {formData.location && !isLocationSearching && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, location: '' }))}
                                                className="mt-1.5 w-full text-center text-[11px] text-gray-400 hover:text-red-500 transition-colors py-1"
                                            >
                                                {t('Remove location')}
                                            </button>
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
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm shadow-none"
                                                placeholder={t('Enter your full name')}
                                            />
                                            {fieldErrors.fullName && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('Full Address')}</label>
                                            <textarea
                                                ref={addressRef}
                                                name="address"
                                                rows="3"
                                                value={formData.address}
                                                onChange={e => { handleChange(e); setFieldErrors(p => ({...p, address: false})); }}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm shadow-none"
                                                placeholder={t('House no, Flat, Street name, Landmark')}
                                            />
                                            {fieldErrors.address && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
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
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm shadow-none"
                                                placeholder={t('Enter 10-digit mobile number')}
                                            />
                                            {fieldErrors.mobile && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('City')}</label>
                                            {loadingCities ? (
                                                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-400">{t('Loading cities...')}</div>
                                            ) : (
                                                <select
                                                    ref={cityRef}
                                                    value={formData.city}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData(prev => ({ ...prev, city: val }));
                                                        setFieldErrors(prev => ({ ...prev, city: false }));
                                                    }}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-gray-200 outline-none transition-all text-sm shadow-none"
                                                >
                                                    <option value="">{t('Select City')}</option>
                                                    {cities.map((city) => {
                                                        const m = city.match(/\(([^)]+)\)/);
                                                        const isUnavail = m && (() => {
                                                            const inner = m[1].toLowerCase();
                                                            return inner.includes('not available') || inner.includes('not deliverable') || inner.includes('unavailable');
                                                        })();
                                                        const baseName = city.replace(/\s*\([^)]*\)/, '').trim();
                                                        const note = m ? m[1] : '';
                                                        return (
                                                            <option
                                                                key={city}
                                                                value={city}
                                                                disabled={!!isUnavail}
                                                                style={isUnavail ? { color: '#9CA3AF' } : {}}
                                                            >
                                                                {isUnavail ? `${baseName} (${note})` : city}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            )}
                                            {fieldErrors.city && (
                                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('ZIP Code')}</label>
                                            <input 
                                                type="text" 
                                                name="zip" 
                                                required 
                                                value="630702" 
                                                readOnly
                                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none text-sm cursor-not-allowed text-gray-500 font-medium" 
                                                placeholder="630702"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preferred Order Timing & Delivery Slot Selection - Next 4 Real-time Options */}
                        {settings?.deliveryTimingType !== 'instant' && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-[#2E5A2E] dark:text-[#7CA90E]" />
                                    <span className="font-bold text-xs text-gray-900 dark:text-white">{t('Delivery Timing')}</span>
                                </div>

                                {/* Next 4 Real-Time Available Time Slots */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {availableDeliverySlots.map(slotId => {
                                        const isSelected = selectedTimeSlot === slotId;
                                        return (
                                            <button
                                                key={slotId}
                                                type="button"
                                                onClick={() => setSelectedTimeSlot(slotId)}
                                                className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                                                    isSelected
                                                        ? 'bg-[#2E5A2E] border-[#2E5A2E] text-white shadow-sm scale-[1.02]'
                                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#2E5A2E]'
                                                }`}
                                            >
                                                {formatDeliveryRange(slotId)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Order Summary (Items List) */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="p-5 flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-[#CBF9B2]/20 rounded-lg text-[#2E5A2E] dark:text-[#2E5A2E]">
                                    <Package size={18} />
                                </div>
                                <h3 className="font-medium text-gray-900 dark:text-white text-base">{t('Total Summary')}</h3>
                            </div>

                            <div className="p-4 sm:p-6">
                                <div className="space-y-4">
                                    {displayItems.map((item, index) => (
                                        <div key={item.id || index} className="py-4 flex gap-4 first:pt-0">
                                            <div className="h-16 w-16 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 relative">
                                                <img
                                                    src={item.image || ((item._id || item.id || item.product) ? `${API_BASE_URL}/products/${item._id || item.id || item.product}/image` : "https://via.placeholder.com/150?text=No+Image")}
                                                    alt={item.adTitle || item.title || item.name}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                                />
                                                <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-10">
                                                    {(item.isGold || (item.product && item.product.isGold)) && (
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
                                                <h4 className={`text-sm font-medium text-gray-900 dark:text-white mb-0.5 ${item.isFromAd ? '' : 'truncate'}`} title={item.adTitle || item.title || item.name}>
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
                                                        {(item.unit || item.weight) && (
                                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                                                {item.unit || item.weight}
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

                        {/* Payment Method */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                    <CreditCard size={20} />
                                </div>
                                <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Payment Method')}</h2>
                            </div>

                            <div className="space-y-4">
                                <label className={`flex items-center p-4 rounded-3xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-[#2E5A2E] dark:border-[#CBF9B2] bg-[#2E5A2E]/5 dark:bg-[#CBF9B2]/5' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}>
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center mr-4">
                                        {formData.paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2]" />}
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
                                        <span className="block font-bold text-[15px] text-gray-900 dark:text-white">{t('Cash on Delivery')}</span>
                                        <span className="block text-[13px] text-gray-400 dark:text-gray-500">{t('Pay when you receive your order')}</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary / Payment Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[17px] font-bold text-gray-900 dark:text-white">{t('Total Summary')}</h2>
                                <span className="text-[13px] font-medium text-gray-400 tracking-tight">{displayItems.length} {t('items')}</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-gray-400 font-medium">{t('Subtotal')}</span>
                                    <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹{displayTotal.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[14px] text-gray-400 font-medium">{t('Delivery')}</span>
                                    {deliveryCharge === 0 ? (
                                        <span className="text-[15px] font-bold text-[#2E5A2E] dark:text-[#CBF9B2]">FREE</span>
                                    ) : (
                                        <span className="text-[15px] font-bold text-gray-900 dark:text-white">₹{deliveryCharge.toFixed(0)}</span>
                                    )}
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-[15px] text-gray-500 font-medium">{t('Total')}</span>
                                    <span className="text-[17px] font-bold text-gray-900 dark:text-white">₹{finalTotal.toFixed(0)}</span>
                                </div>
                            </div>
    
                            <button
                                type="submit"
                                disabled={isNavigating}
                                className="w-full bg-black text-white rounded-full py-4 flex items-center justify-center font-normal text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
                            >
                                {isNavigating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : t('Place Order')}
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

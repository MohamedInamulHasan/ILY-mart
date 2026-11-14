import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { safeNavigateBack } from '../utils/useBackButton';
import { ArrowLeft, MapPin, Check, Navigation, AlertCircle, ChevronDown } from 'lucide-react';
import { API_BASE_URL, apiService } from '../utils/api';
import { getCurrentLocation } from '../utils/locationHelpers';

const isCityUnavailable = (cityName) => {
    if (!cityName) return false;
    const cl = String(cityName).toLowerCase();
    return cl.includes('not available') || cl.includes('not deliverable') || cl.includes('unavailable');
};

const EditAddress = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, setUser } = useAuth();
    const { t, language } = useLanguage();
    const [showLocationError, setShowLocationError] = useState(false);
    const [gpsError, setGpsError] = useState(null); // { code, text } for error modal
    const locationRef = useRef(null);
    const fullNameRef = useRef(null);
    const mobileRef = useRef(null);
    const streetRef = useRef(null);
    const cityRef = useRef(null);
    const lastInitializedUserIdRef = useRef(null);

    const [formData, setFormData] = useState({
        fullName: '',
        mobile: '',
        street: '',
        city: '',
        zip: '',
        location: '' // GPS Link
    });

    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [fieldErrors, setFieldErrors] = useState({});

    // Security Details for Admin (Moh@2004) and Delivery Boy (ILYmart@2026)
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityRole, setSecurityRole] = useState('admin'); // 'admin' | 'delivery_boy'
    const [securityPassword, setSecurityPassword] = useState('');
    const [showPasswordText, setShowPasswordText] = useState(false);
    const [securityError, setSecurityError] = useState('');
    const [securityVerified, setSecurityVerified] = useState(false);

    const handleVerifySecurityPassword = (e) => {
        e?.preventDefault();
        const isAdminPass = securityPassword === 'Moh@2004';
        const isDeliveryPass = securityPassword === 'ILYmart@2026';

        let isValid = false;
        if (securityRole === 'admin') {
            isValid = isAdminPass;
        } else if (securityRole === 'delivery_boy') {
            isValid = isDeliveryPass || isAdminPass;
        } else {
            isValid = isAdminPass || isDeliveryPass;
        }

        if (isValid) {
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

    useEffect(() => {
        // Fetch cities list
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

        // Initialize form with user data once per user session (prevents wiping user input on location detect)
        if (user) {
            const currentUserId = user._id || user.id || 'current_user';
            if (lastInitializedUserIdRef.current !== currentUserId) {
                lastInitializedUserIdRef.current = currentUserId;
                let savedFallback = null;
                try {
                    savedFallback = JSON.parse(localStorage.getItem('user_saved_address') || 'null');
                } catch {}

                const userDisplayName = user.fullName || user.name || savedFallback?.fullName || '';
                const isGuestName = userDisplayName.startsWith('User_') || userDisplayName === 'Guest User';
                let loadedStreet = user.address?.street || savedFallback?.address?.street || '';
                let loadedCity = user.address?.city || savedFallback?.address?.city || '';
                if (isCityUnavailable(loadedCity)) loadedCity = '';
                // If street was erroneously saved identical to city (e.g. Chennai / Chennai), clear it
                if (loadedStreet && loadedCity && loadedStreet.trim().toLowerCase() === loadedCity.trim().toLowerCase()) {
                    loadedStreet = '';
                }
                setFormData({
                    fullName: isGuestName ? '' : userDisplayName,
                    mobile: user.mobile || user.phone || savedFallback?.mobile || '',
                    street: loadedStreet,
                    city: loadedCity,
                    zip: user.address?.zip || savedFallback?.address?.zip || '630702',
                    location: user.location || savedFallback?.location || ''
                });
            }
        }
    }, [user]);

    // Auto-clear if selected city is marked not available
    useEffect(() => {
        if (formData.city && isCityUnavailable(formData.city)) {
            setFormData(prev => ({ ...prev, city: '' }));
        }
    }, [formData.city]);

    const citiesList = useMemo(() => {
        if (!Array.isArray(cities) || cities.length === 0) return [];
        return cities;
    }, [cities]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if ((name === 'mobile' || name === 'zip') && !/^\d*$/.test(value)) return;
        if (name === 'mobile' && value.length > 10) return;
        if (name === 'zip' && value.length > 6) return;

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetectLocation = async () => {
        if (isDetecting) return;

        setIsDetecting(true);
        setGpsError(null);
        setMessage({ type: '', text: '' });
        console.log('📍 EditAddress: Starting location detection...');

        try {
            const result = await getCurrentLocation();
            console.log('📍 EditAddress: Detection result:', result);

            if (result.success) {
                // Just access location, do not fill city or street
                setFormData(prev => ({
                    ...prev,
                    location: result.mapsLink
                }));
                setFieldErrors(prev => ({
                    ...prev,
                    location: false
                }));
                setShowLocationError(false);
                setGpsError(null);

                // Add location to DB whenever fetching
                try {
                    await apiService.updateProfile({ location: result.mapsLink });
                    if (user) {
                        const updatedUser = { ...user, location: result.mapsLink };
                        setUser(updatedUser);
                    }
                    console.log('📍 Location saved to DB immediately:', result.mapsLink);
                } catch (dbErr) {
                    console.warn('Could not save location to DB immediately:', dbErr);
                }
            } else {
                console.error('📍 EditAddress: Detection failed:', result.message);
                setGpsError({ code: result.code || 'ERROR', text: result.message });
            }
        } catch (err) {
            console.error('📍 EditAddress: Fatal detection error:', err);
            setGpsError({ code: 'ERROR', text: 'Unable to detect GPS location. Please enter your address manually.' });
        } finally {
            setIsDetecting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};
        if (!formData.fullName) errors.fullName = true;
        if (!formData.mobile) errors.mobile = true;
        if (!formData.street) errors.street = true;
        if (!formData.city || !formData.city.trim()) {
            errors.city = true;
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            // Scroll to first error
            if (errors.fullName) fullNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            else if (errors.mobile) mobileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            else if (errors.street) streetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            else if (errors.city) cityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Validate Mobile Number (10 digits)
        if (!/^\d{10}$/.test(formData.mobile)) {
            setFieldErrors(prev => ({ ...prev, mobile: true }));
            mobileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Security password check for Admin (Moh@2004) & Delivery Boy (ILYmart@2026) accounts
        const cleanMobile = (formData.mobile || '').toString().replace(/\D/g, '');
        const isDeliveryBoyMobile = cleanMobile.endsWith('9578654411') || cleanMobile === '9578654411';
        const isAdminMobile = cleanMobile.endsWith('9500171980') || cleanMobile.endsWith('9500171958') || cleanMobile.endsWith('9500171989');

        if (!securityVerified) {
            if (isAdminMobile) {
                setSecurityRole('admin');
                setShowSecurityModal(true);
                return;
            }
            if (isDeliveryBoyMobile) {
                setSecurityRole('delivery_boy');
                setShowSecurityModal(true);
                return;
            }
            // Check if entered mobile belongs to an admin or delivery boy in backend
            try {
                const authCheck = await apiService.checkMobileAuth(formData.mobile);
                if (authCheck?.data?.required) {
                    setSecurityRole(authCheck.data.role || 'delivery_boy');
                    setShowSecurityModal(true);
                    return;
                }
            } catch (e) {
                console.warn('checkMobileAuth error:', e);
            }
        }

        setFieldErrors({});
        setIsSaving(true);

        // 1. Instant optimistic local update (0ms delay)
        const updatedAddress = {
            street: formData.street,
            city: formData.city,
            zip: formData.zip || '630702',
            state: '',
            country: 'India'
        };

        const standardMobile = cleanMobile.slice(-10);
        const isDeliveryNumber = ['9578654411', '9500179180'].includes(standardMobile);

        const optimisticUser = {
            ...(user || {}),
            name: formData.fullName,
            fullName: formData.fullName,
            mobile: formData.mobile,
            phone: formData.mobile,
            address: updatedAddress,
            location: formData.location || ''
        };

        if (!isDeliveryNumber) {
            delete optimisticUser.deliveryId;
            if (Array.isArray(optimisticUser.role)) {
                optimisticUser.role = optimisticUser.role.filter(r => r !== 'delivery_boy' && r !== 'deliveryboy');
                if (optimisticUser.role.length === 0) optimisticUser.role = ['customer'];
            } else if (optimisticUser.role === 'delivery_boy' || optimisticUser.role === 'deliveryboy') {
                optimisticUser.role = 'customer';
            }
        }

        setUser(optimisticUser);
        localStorage.setItem('userInfo', JSON.stringify(optimisticUser));
        localStorage.setItem('user_saved_address', JSON.stringify({
            address: updatedAddress,
            location: formData.location || '',
            fullName: formData.fullName,
            mobile: formData.mobile
        }));
        queryClient.setQueryData(['users', 'profile'], optimisticUser);
        queryClient.removeQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });

        // 2. Synchronize to server and guarantee database persistence before navigating
        try {
            const profileData = {
                name: formData.fullName,
                mobile: formData.mobile,
                address: updatedAddress,
                location: formData.location,
                securityPassword: securityPassword || undefined
            };

            const isGuest = !user?.email || user.email.startsWith('guest_') || user.email.startsWith('mobile_');
            let result;
            if (isGuest) {
                result = await apiService.updateGuest(profileData);
            } else {
                result = await apiService.updateProfile(profileData);
            }

            const resData = result?.data || result;
            const userPayload = (resData && typeof resData === 'object' && resData.data) ? resData.data : resData;
            const newToken = result?.token || result?.data?.token || userPayload?.token;

            const finalUser = {
                ...optimisticUser,
                ...(userPayload && typeof userPayload === 'object' ? userPayload : {}),
                address: updatedAddress,
                location: formData.location || userPayload?.location || optimisticUser.location
            };

            setUser(finalUser);
            localStorage.setItem('userInfo', JSON.stringify(finalUser));
            queryClient.setQueryData(['users', 'profile'], finalUser);

            if (newToken) {
                localStorage.setItem('authToken', newToken);
                queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
            }
        } catch (err) {
            console.warn('Address sync error (local changes saved):', err);
        } finally {
            setIsSaving(false);
            window.dispatchEvent(new Event('userChanged'));
            navigate('/profile');
        }
    };

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 pb-24 transition-colors duration-200">
            {/* Premium Header */}
            <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="max-w-7xl mx-auto px-2 relative min-h-[38px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button
                                onClick={() => safeNavigateBack(navigate, '/checkout')}
                                className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-900 dark:text-white transition-transform active:scale-95 border border-gray-100/50 dark:border-gray-700/50"
                            >
                                <ArrowLeft size={19} />
                            </button>
                        </div>
                        <div className="flex flex-col items-center text-center pt-1">
                            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight leading-tight truncate">{t('My Address')}</h1>
                            <p className="text-[10px] sm:text-[10px] font-semibold text-gray-700 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{t('Manage delivery locations & ensures reachability')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-[86px] sm:pt-[88px] max-w-xl mx-auto px-3.5 sm:px-4">
                {/* Status Message (errors only) */}
                {message.text && message.type === 'error' && (
                    <div className="mb-3.5 p-3 sm:p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 bg-red-50 text-red-700 border border-red-100">
                        <AlertCircle size={18} />
                        <span className="text-sm font-semibold">{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                    {/* Location Detection Block */}
                    <div ref={locationRef}>
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('GPS Location')}</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isDetecting}
                            className={`w-full border rounded-xl px-4 py-3.5 flex items-center gap-3.5 transition-all duration-300 active:scale-[0.98] shadow-none ${
                                isDetecting
                                    ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                                    : formData.location
                                    ? 'bg-black dark:bg-black border-black text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {/* Icon Container */}
                            <div className="relative flex-shrink-0 flex items-center justify-center w-11 h-11">
                                {isDetecting ? (
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
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <MapPin size={20} className="text-gray-400 dark:text-gray-500" strokeWidth={2} />
                                    </div>
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 text-left min-w-0">
                                <p className={`text-[13px] font-bold truncate ${
                                    formData.location && !isDetecting
                                        ? 'text-white'
                                        : isDetecting
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-800 dark:text-gray-200'
                                }`}>
                                    {isDetecting
                                        ? t('Finding location...')
                                        : formData.location
                                        ? (formData.street && formData.city ? t('GPS & Address Attached') : t('GPS Coordinates Attached'))
                                        : t('Tap to attach GPS location')}
                                </p>
                                <p className={`text-[11px] truncate ${
                                    formData.location && !isDetecting
                                        ? 'text-white/80'
                                        : isDetecting
                                        ? 'text-gray-600 dark:text-gray-300'
                                        : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                    {isDetecting
                                        ? t('Accessing GPS coordinates...')
                                        : formData.location
                                        ? (formData.street && formData.city ? t('Tap to update location') : t('Enter street name & city below'))
                                        : t('Helps us deliver faster')}
                                </p>
                            </div>

                            {/* Arrow */}
                            <ArrowLeft size={16} className={`flex-shrink-0 rotate-180 transition-colors ${
                                formData.location && !isDetecting
                                    ? 'text-white/80'
                                    : 'text-gray-400 dark:text-gray-500'
                            }`} />
                        </button>
                    </div>

                    {/* Form Fields - Big Checkout Style */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 sm:space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('Full Name')}</label>
                            <input
                                ref={fullNameRef}
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={e => { handleChange(e); setFieldErrors(p => ({ ...p, fullName: false })); }}
                                placeholder={t('Enter your full name')}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm shadow-none"
                            />
                            {fieldErrors.fullName && (
                                <div className="relative mt-2 bg-white dark:bg-gray-850 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('Mobile Number')}</label>
                            <input
                                ref={mobileRef}
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={e => { handleChange(e); setFieldErrors(p => ({ ...p, mobile: false })); }}
                                placeholder={t('Enter 10-digit mobile number')}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm shadow-none"
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
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('Address')}</label>
                            <textarea
                                ref={streetRef}
                                name="street"
                                rows="3"
                                value={formData.street}
                                onChange={e => { handleChange(e); setFieldErrors(p => ({ ...p, street: false })); }}
                                placeholder={t('House no, Flat, Street name, Landmark')}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm resize-none shadow-none"
                            />
                            {fieldErrors.street && (
                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('City')}</label>
                            {citiesList.length > 0 ? (
                                <div className="relative">
                                    <select
                                        ref={cityRef}
                                        name="city"
                                        value={formData.city && !isCityUnavailable(formData.city) ? formData.city : ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (isCityUnavailable(val)) return;
                                            setFormData(prev => ({ ...prev, city: val }));
                                            setFieldErrors(prev => ({ ...prev, city: false }));
                                        }}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl focus:ring-0 focus:border-[#2E5A2E] outline-none transition-all text-sm appearance-none pr-10 shadow-none cursor-pointer"
                                    >
                                        <option value="" disabled>{t('-- Select City --')}</option>
                                        {citiesList.map((cityName, idx) => {
                                            const isUnavailable = isCityUnavailable(cityName);
                                            return (
                                                <option 
                                                    key={idx} 
                                                    value={cityName}
                                                    disabled={isUnavailable}
                                                    className={isUnavailable ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
                                                >
                                                    {cityName}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500">
                                        <ChevronDown size={18} />
                                    </div>
                                </div>
                            ) : (
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
                            )}
                            {fieldErrors.city && (
                                <div className="relative mt-2 bg-white dark:bg-gray-855 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 text-[13px] font-normal flex items-center gap-2.5 w-fit shadow-md z-10">
                                    <div className="absolute -top-[5px] left-4 w-2 h-2 bg-white dark:bg-gray-855 border-t border-l border-gray-300 dark:border-gray-600 rotate-45 transform"></div>
                                    <div className="w-5 h-5 rounded bg-[#F59E0B] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">!</div>
                                    <span>{language === 'ta' ? 'தயவுசெய்து இந்த புலத்தை நிரப்பவும்.' : 'Please fill out this field.'}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 sm:pt-3">
                            <button
                                type="submit"
                                className="w-full bg-black text-white py-3.5 sm:py-4 rounded-full font-bold text-sm sm:text-base active:scale-[0.98] transition-all shadow-sm"
                            >
                                {isSaving ? t('Saving Changes...') : t('Update Address')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* GPS Error Modal */}
            <AnimatePresence>
                {gpsError && (
                    <div className="fixed inset-0 z-[99998] flex items-end sm:items-center justify-center p-4 pb-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setGpsError(null)}
                        />
                        <motion.div
                            initial={{ y: 60, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 60, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className="relative bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 text-center z-10"
                        >
                            {/* Icon */}
                            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                                {gpsError.code === 'PERMISSION_DENIED'
                                    ? <MapPin size={30} className="text-red-500" />
                                    : gpsError.code === 'TIMEOUT'
                                    ? <Navigation size={30} className="text-red-500" />
                                    : <AlertCircle size={30} className="text-red-500" />
                                }
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                {gpsError.code === 'LOCATION_DISABLED'
                                    ? (language === 'ta' ? 'GPS முடக்கப்பட்டுள்ளது' : 'Location is Turned OFF')
                                    : gpsError.code === 'PERMISSION_DENIED'
                                    ? (language === 'ta' ? 'இருப்பிட அனுமதி மறுக்கப்பட்டது' : 'Location Permission Denied')
                                    : gpsError.code === 'TIMEOUT'
                                    ? (language === 'ta' ? 'GPS சமிக்ஞை நேரம் முடிந்தது' : 'GPS Signal Timed Out')
                                    : (language === 'ta' ? 'இருப்பிட பிழை' : 'Location Error')
                                }
                            </h3>

                            {/* Message */}
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                                {gpsError.code === 'LOCATION_DISABLED'
                                    ? (language === 'ta'
                                        ? 'உங்கள் சாதனத்தில் GPS/இட சேவை முடக்கப்பட்டுள்ளது. தயவுசெய்து அதை இயக்கி மீண்டும் முயற்சிக்கவும்.'
                                        : 'GPS / Location is turned OFF on your device. Please turn ON Location in settings and try again.')
                                    : gpsError.code === 'TIMEOUT'
                                    ? (language === 'ta'
                                        ? 'திறந்த வெளியில் நின்று மீண்டும் முயற்சிக்கவும், அல்லது கைமுறையாக முகவரியை உள்ளிடவும்.'
                                        : 'Move to open sky & try again, or type your address manually.')
                                    : gpsError.code === 'PERMISSION_DENIED'
                                    ? (language === 'ta'
                                        ? 'அமைப்புகளில் இட அணுகலை அனுமதிக்கவும் அல்லது கைமுறையாக முகவரியை உள்ளிடவும்.'
                                        : 'Allow location access in Settings or type your address manually.')
                                    : (gpsError.text || (language === 'ta'
                                        ? 'GPS கண்டறிய இயலவில்லை. கைமுறையாக முகவரியை உள்ளிடவும்.'
                                        : 'GPS could not be detected. Please enter your address manually.'))
                                }
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setGpsError(null)}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm active:scale-95 transition-transform"
                                >
                                    {language === 'ta' ? 'சரி' : 'OK'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setGpsError(null); handleDetectLocation(); }}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm active:scale-95 transition-transform"
                                >
                                    {language === 'ta' ? 'மீண்டும் முயற்சி' : 'Try Again'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                {securityRole === 'delivery_boy'
                                    ? (language === 'ta'
                                        ? 'டெலிவரி பாய் கணக்கிற்கான விவரங்களை மாற்ற கடவுச்சொல்லை உள்ளிடவும்.'
                                        : 'Security verification required for Delivery Boy account to update details.')
                                    : (language === 'ta'
                                        ? 'அட்மின் எண்ணிற்கு முகவரியை மாற்ற கடவுச்சொல்லை உள்ளிடவும்.'
                                        : 'Security verification required for Admin account to add/update address.')}
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

export default EditAddress;

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Wrench, ShieldCheck, MapPin, CheckCircle, Phone, Send, Check, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { playSuccessSound, unlockAudio } from '../utils/soundHelper'; // Import useAuth
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import SwipeActionButton from '../components/SwipeActionButton';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices, useServiceItems } from '../hooks/queries/useServices';
import { API_BASE_URL } from '../utils/api';
import { isStoreOpen as isServiceOpen } from '../utils/storeHelpers';

const Services = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { cartCount } = useCart();
    const { requestService, setIsFooterHidden } = useData();
    const { user } = useAuth(); // Get user for default address
    const [selectedService, setSelectedService] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [searchParams] = useSearchParams();
    const serviceIdFromQuery = searchParams.get('id');

    const [searchQuery, setSearchQuery] = useState('');

    // Dynamic Data Hooks
    const { data: services = [], isLoading: servicesLoading } = useServices();

    // Sub-services state
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'details'
    const [activeService, setActiveService] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Fetch items only when a service is active
    const { data: serviceItems = [], isLoading: itemsLoading } = useServiceItems(activeService?._id || activeService?.id);

    // Hide footer/navbar when modals are open
    useEffect(() => {
        setIsFooterHidden(showConfirmation || requestSuccess);
        return () => setIsFooterHidden(false); // Cleanup on unmount
    }, [showConfirmation, requestSuccess, setIsFooterHidden]);

    // Handle Deep Linking from Shop Toggle
    useEffect(() => {
        if (serviceIdFromQuery && services.length > 0) {
            const foundService = services.find(s => (s._id || s.id) === serviceIdFromQuery);
            if (foundService) {
                // Check if open before deep linking
                if (isServiceOpen(foundService)) {
                    setActiveService(foundService);
                    setViewMode('details');
                }
            }
        }
    }, [serviceIdFromQuery, services]);

    const handleViewServices = (service) => {
        if (!isServiceOpen(service)) {
            alert(t('This service is currently closed. Please check back later.'));
            return;
        }
        setActiveService(service);
        setSelectedItem(null); // Reset selection
        setViewMode('details');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSelectSubService = (sub) => {
        if (selectedItem?._id === sub._id) {
            setSelectedItem(null); // Deselect if already selected
        } else {
            setSelectedItem(sub);
        }
    };

        const handleCallProvider = () => {
        const phone = (activeService?.mobile || activeService?.phone || '').toString().trim();
        if (phone) {
            window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
        } else {
            handleRequestSubService(selectedItem || { name: activeService?.name || 'General Service', price: 'TBD', description: 'Standard service request' });
        }
    };

    const handleRequestSubService = (subService) => {
        // Create a composite service object for the request
        const serviceRequest = {
            ...activeService,
            name: `${activeService.name} - ${subService.name}`, // Combine names for display
            originalId: activeService._id || activeService.id,
            itemId: subService._id || subService.id,
            price: subService.price
        };
        setSelectedService(serviceRequest);
        unlockAudio();
        setShowConfirmation(true);
    };

    const confirmRequest = async () => {
        if (!selectedService) return;

        unlockAudio();
        setIsSubmitting(true);
        try {
            // 1. Get Location Data
            let locationText = '';

            // Default to User Profile Address
            if (user?.address) {
                locationText = `${user.address.street || ''}, ${user.address.city || ''}`;
                if (user.address.state) locationText += `, ${user.address.state}`;
                if (user.address.zip) locationText += ` - ${user.address.zip}`;
            }

            // USE STORED LOCATION ONLY (As per user request for speed)
            // We do NOT detect location here anymore. We use the 'location' field from the user profile
            // which contains the Google Maps link saved during Checkout or previous interactions.
            const storedLocation = user?.location || '';

            // 2. Send Request
            // valid 'coordinates' field to backend is now the stored Maps Link or empty string
            const items = [{
                name: selectedService.name.includes(' - ') 
                    ? selectedService.name.split(' - ')[1] 
                    : selectedService.name,
                price: parseFloat(String(selectedService.price).replace(/[^0-9.]/g, '')) || 0,
                quantity: 1
            }];

            await requestService(selectedService.originalId, {
                location: locationText,
                coordinates: storedLocation
            }, items);

            // 3. No need to update profile as we are reading FROM it.

            setShowConfirmation(false);
            playSuccessSound();
            setTimeout(() => {
                setRequestSuccess(true);
                setIsSubmitting(false);
            }, 50);
        } catch (error) {
            console.error("Failed to request service:", error);
            setIsSubmitting(false);
            alert(t('Failed to request service. Please try again.'));
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setActiveService(null);
    };

    return (
        <PullToRefreshLayout>
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200">
                {/* Premium Light Green Header Card / Dark Mode Adjusted */}
                <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => viewMode === 'details' ? handleBackToList() : navigate(-1)} 
                                    className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={19} />
                                </button>
                            </div>
                            
                            <div className="flex flex-col items-center text-center px-12 min-w-0">
                                <h1 className="text-[14.5px] font-bold text-gray-900 dark:text-gray-900 tracking-tight leading-tight truncate">
                                    {viewMode === 'details' && activeService ? activeService.name : t('Premium Services')}
                                </h1>
                                <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-700 mt-0.5 truncate">
                                    {viewMode === 'details' && activeService ? (activeService.address || t('Available Locally')) : t('Professional help at your doorstep')}
                                </p>
                            </div>

                            
                        </div>
                    </div>
                </div>

                <div className={`max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-[88px] ${viewMode === 'details' ? 'pb-36 sm:pb-32' : 'pb-20'}`}>

                    {viewMode === 'list' && (
                        <div className="mb-3.5 sm:mb-4 flex justify-center md:justify-start sticky top-[88px] z-30">
                            <div className="relative w-full max-w-lg group">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search services...')}
                                    className="w-full pl-11 sm:pl-12 pr-11 py-3.5 sm:py-4 text-[14.5px] sm:text-[15.5px] font-medium rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none transition-colors duration-200"
                                />
                                <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={20} />
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

                            {/* Search Results Dropdown */}
                            {searchQuery.trim() && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50 w-full overflow-x-hidden">
                                    {(() => {
                                        const q = searchQuery.toLowerCase();
                                        const results = services.filter(service =>
                                            service.name?.toLowerCase().includes(q) ||
                                            service.category?.toLowerCase().includes(q)
                                        ).sort((a, b) => {
                                            const aName = t(a, 'name').toLowerCase();
                                            const bName = t(b, 'name').toLowerCase();
                                            const aStarts = aName.startsWith(q);
                                            const bStarts = bName.startsWith(q);
                                            if (aStarts && !bStarts) return -1;
                                            if (!aStarts && bStarts) return 1;
                                            return 0;
                                        }).slice(0, 5);

                                        if (results.length === 0) {
                                            return (
                                                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    {t('No services found')}
                                                </div>
                                            );
                                        }

                                        return results.map((service) => {
                                            const serviceId = service._id || service.id;

                                            return (
                                                <div
                                                    key={serviceId}
                                                    onClick={() => {
                                                        handleViewServices(service);
                                                        setSearchQuery('');
                                                    }}
                                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-left"
                                                >
                                                    <div className="relative flex-shrink-0">
                                                        <img
                                                            src={service.image || `${API_BASE_URL}/services/${serviceId}/image`}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=Service'; }}
                                                            alt={service.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-gray-700"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {(() => {
                                                                const fullTitle = t(service, 'name');
                                                                const bracketIndex = fullTitle.indexOf('(');
                                                                if (bracketIndex !== -1) {
                                                                    const mainPart = fullTitle.substring(0, bracketIndex);
                                                                    const bracketPart = fullTitle.substring(bracketIndex);
                                                                    return (
                                                                        <>
                                                                            <span>{mainPart}</span>
                                                                            <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">{bracketPart}</span>
                                                                        </>
                                                                    );
                                                                }
                                                                return fullTitle;
                                                            })()}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                                            {service.address || t('Service')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}

                        </div>
                    )}

                    {viewMode === 'list' ? (
                        /* MAIN SERVICES LIST - Premium Horizontal Banners */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {servicesLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100/80 dark:border-gray-700/60"
                                    >
                                        {/* Full Card Shimmer Image Background */}
                                        <div className="absolute inset-0 blinkit-shimmer" />

                                        

                                        {/* Content Section - White Banner at Bottom */}
                                        <div className="absolute bottom-0 left-0 right-0 py-2 px-3.5 z-10 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                            <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                                                <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full blinkit-shimmer flex-shrink-0" />
                                                    <div className="h-3 w-28 rounded-md blinkit-shimmer" />
                                                </div>
                                            </div>
                                            {/* Right Action Arrow Skeleton */}
                                            <div className="w-7 h-7 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>
                                    </div>
                                ))
                            ) : (() => {
                                const filteredServices = services.filter(service =>
                                    service.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    service.category?.toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                if (filteredServices.length === 0) {
                                    return (
                                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                                <Wrench size={40} className="text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('No Services Found')}</h3>
                                            <p className="text-gray-500 dark:text-gray-400">{t('Try searching for something else.')}</p>
                                        </div>
                                    );
                                }

                                return filteredServices.map((service, index) => {
                                    const isOpen = isServiceOpen(service);
                                    const isClosed = !isOpen;
                                    return (
                                        <div 
                                            key={service._id || index} 
                                            onClick={() => handleViewServices(service)}
                                            className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full cursor-pointer shadow-sm hover:shadow-md ${!isOpen ? 'cursor-not-allowed' : ''}`}
                                        >
                                            {/* Full Background Image */}
                                            <div className={`absolute inset-0 z-0 ${!isOpen ? 'opacity-60' : ''}`}>
                                                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
                                                <img
                                                    src={service.image || `${API_BASE_URL}/services/${service._id || service.id}/image`}
                                                    alt={service.name}
                                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 z-10 ${!isOpen ? '' : ''}`}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://placehold.co/800x450?text=Service";
                                                    }}
                                                />
                                                
                                                {/* Dark Gradient Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                                            </div>

                                            {/* Content Section - White Banner at Bottom */}
                                            <div className="absolute bottom-0 left-0 right-0 py-2 px-3.5 z-20 overflow-hidden">
                                                {/* Solid White Banner Strip */}
                                                <div className="absolute inset-0 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700" />
                                                
                                                <div className="relative z-10">
                                                    <h3 className={`text-gray-900 dark:text-white text-[15px] font-semibold tracking-tight leading-tight mb-0.5 truncate pr-8 ${!isOpen ? 'opacity-60' : ''}`}>
                                                        {service.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 opacity-90">
                                                        <MapPin size={10} className="text-[#2E5A2E] dark:text-[#CBF9B2] flex-shrink-0" />
                                                        <p className="text-gray-500 dark:text-gray-400 text-[11px] font-normal truncate">
                                                            {service.address || t('Available Locally')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Action Arrow - Hide or dim if closed */}
                                            <div className={`absolute bottom-2.5 right-3 z-30 transition-all duration-300 ${!isOpen ? 'opacity-0 scale-50' : ''}`}>
                                                <div className="w-7 h-7 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 flex items-center justify-center scale-90 group-hover:scale-105 active:scale-90 transition-all shadow-sm">
                                                    <ArrowLeft size={16} className="rotate-180" />
                                                </div>
                                            </div>

                                            

                                            {isClosed && (
                                                <div className="absolute inset-0 z-30 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500">
                                                        {t('Closed')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    ) : (
                        /* DETAIL VIEW: SUB-SERVICES - Rectangular cards, 1 per row in mobile */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {itemsLoading ? (
                                // Sub-services Skeleton matching detail view
                                [...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-2xl aspect-[16/9] shadow-sm overflow-hidden relative border border-gray-100 dark:border-gray-700/50"
                                    >
                                        {/* Full Card Shimmer Background */}
                                        <div className="absolute inset-0 blinkit-shimmer" />
                                        {/* Dark gradient overlay matching real card */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                        {/* Bottom Content Skeleton */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 space-y-1.5">
                                            <div className="h-5 w-3/4 rounded-md bg-white/20 backdrop-blur-sm" />
                                            <div className="h-4 w-1/3 rounded-md bg-white/20 backdrop-blur-sm" />
                                        </div>
                                    </div>
                                ))
                            ) : serviceItems.length > 0 ? (
                                <>
                                    {/* Dialogue Header Banner - Character & Dialogue (No extra buttons) */}
                                    <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl p-3.5 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5 mb-1">
                                        <img 
                                            src="/service-character-transparent.png" 
                                            alt="Service Character" 
                                            className="h-16 w-16 object-contain flex-shrink-0 drop-shadow-sm select-none"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "/service-character.png"; }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                                                {t('Call and book the service')}
                                            </h3>
                                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                {t('Directly connect with the service provider to schedule and book your appointment.')}
                                            </p>
                                        </div>
                                    </div>

                                    {serviceItems.map((sub, idx) => (
                                        <div
                                            key={sub._id || idx}
                                            onClick={() => handleRequestSubService(sub)}
                                            className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md transition-all duration-300 aspect-[16/9] w-full border-2 border-transparent hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer active:scale-[0.99]`}
                                        >
                                            {/* Full Background Image */}
                                            <div className="absolute inset-0">
                                                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                                <img
                                                    src={sub.image}
                                                    alt={sub.name}
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x250?text=No+Image'; }}
                                                />
                                                {/* Gradient Overlay */}
                                                <div className="absolute inset-0 transition-opacity bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-85" />
                                            </div>

                                            {/* Content Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20 flex flex-col justify-end h-full">
                                                <div className="transform translate-y-0 transition-transform duration-300">
                                                    <h3 className="text-base sm:text-lg font-black text-white mb-0.5 line-clamp-1 leading-tight drop-shadow-md">
                                                        {sub.name}
                                                    </h3>
                                                    {sub.price && (
                                                        <p className="text-xs sm:text-sm text-gray-200 font-semibold drop-shadow-sm">
                                                            {typeof sub.price === 'number' ? `₹${sub.price}` : sub.price}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                /* Clean, beautiful Empty State with Uploaded Character & Dialogue Below (No extra call or request button) */
                                <div className="col-span-full flex flex-col items-center justify-center text-center py-6 px-4 animate-in fade-in zoom-in-95 duration-300 select-none">
                                    {/* Uploaded Service Character Image */}
                                    <div className="relative flex items-center justify-center mb-3">
                                        <img 
                                            src="/service-character-transparent.png" 
                                            alt="Service Character" 
                                            className="h-64 sm:h-72 w-auto object-contain drop-shadow-md select-none pointer-events-none"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/service-character.png";
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Dialogue Card Below Character */}
                                    <div className="relative max-w-sm w-full bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                                        {/* Speech Bubble Arrow */}
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 rotate-45 border-t border-l border-gray-100 dark:border-gray-700" />
                                        
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-1 relative z-10">
                                            {t('Call and book the service')}
                                        </h2>
                                        
                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed relative z-10">
                                            {t('Directly connect with the service provider to schedule and book your appointment.')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Floating Swipe Call Pill: Green button with white round knob + Phone icon */}
                <div
                    className="fixed bottom-24 sm:bottom-8 left-0 right-0 px-4 sm:px-6 z-[60] flex justify-center pointer-events-none"
                >
                    <div className={`w-[260px] sm:w-[280px] transition-all duration-500 ease-in-out transform ${
                        viewMode === 'details' && !showConfirmation && !requestSuccess
                            ? 'translate-y-0 opacity-100 pointer-events-auto'
                            : 'translate-y-12 opacity-0 pointer-events-none'
                    }`}>
                        <SwipeActionButton
                            variant="green"
                            label={t('SWIPE TO CALL')}
                            loadingLabel={t('Calling...')}
                            autoReset={true}
                            heightClass="h-[52px] sm:h-[54px]"
                            knobSizeClass="w-[38px] h-[38px] sm:w-[44px] sm:h-[44px]"
                            textSizeClass="text-xs sm:text-sm font-black tracking-wider"
                            iconSize={18}
                            knobIcon={<Phone size={18} />}
                            className="shadow-none"
                            onSuccess={handleCallProvider}
                        />
                    </div>
                </div>

                {/* Confirmation Modal - Matches Order Confirmation Design */}
                {showConfirmation && selectedService && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] max-w-sm w-full p-8 transform transition-all border border-gray-100 dark:border-gray-700 shadow-2xl">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-50 dark:bg-gray-700 mb-6 shadow-inner relative">
                                    <div className="absolute inset-0 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] opacity-5 animate-ping"></div>
                                    <Wrench className="h-10 w-10 text-[#2E5A2E] dark:text-[#CBF9B2] relative z-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
                                    {t('Confirm Request')}
                                </h3>
                                <p className="text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                    {t('Are you sure you want to request')} <br />
                                    <span className="font-bold text-gray-900 dark:text-white">"{t(selectedService, 'name') || selectedService.name}"</span>
                                </p>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={confirmRequest}
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-4 text-[15px] font-normal text-white bg-black hover:bg-gray-900 rounded-full shadow-lg shadow-gray-200 dark:shadow-gray-900/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : t('Confirm')}
                                    </button>
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        disabled={isSubmitting}
                                        className="w-full px-4 py-3 text-[14px] font-normal text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                    >
                                        {t('Cancel')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Modal - Matches Order Confirmation Design */}
                <AnimatePresence>
                    {requestSuccess && selectedService && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2E5A2E]/20 dark:bg-[#CBF9B2]/20 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.4, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.7, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 450, damping: 22 }}
                                className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 relative overflow-hidden"
                            >
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                        <CheckCircle className="h-12 w-12 text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                                        {t('Request Sent!')}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm leading-relaxed px-2">
                                        {t('Your request for')} <span className="font-bold text-gray-900 dark:text-white">"{t(selectedService, 'name') || selectedService.name}"</span> {t('has been received')}.
                                        <br />
                                        <span className="text-xs opacity-70 mt-2 block">{t('Our team will contact you shortly')}</span>
                                    </p>
                                    <button
                                        onClick={() => {
                                            setRequestSuccess(false);
                                            setSelectedItem(null);
                                            handleBackToList();
                                        }}
                                        className="w-full bg-black text-white py-4 px-6 rounded-full font-normal shadow-lg shadow-gray-200 dark:shadow-gray-900/20 active:scale-[0.98] transition-transform text-[15px]"
                                    >
                                        {t('Close')}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PullToRefreshLayout>
    );
};

export default Services;

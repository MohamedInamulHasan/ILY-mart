import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Wrench, ShieldCheck, MapPin, CheckCircle, Phone, Send, Check, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { useServices, useServiceItems } from '../hooks/queries/useServices';
import { API_BASE_URL } from '../utils/api';
import { isStoreOpen as isServiceOpen } from '../utils/storeHelpers';

const Services = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
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
        setShowConfirmation(true);
    };

    const confirmRequest = async () => {
        if (!selectedService) return;

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
                <div className="w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm relative overflow-hidden mb-8">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <div className="max-w-7xl mx-auto px-2 relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => viewMode === 'details' ? handleBackToList() : navigate(-1)} 
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-900 tracking-tight">
                                    {viewMode === 'details' && activeService ? activeService.name : t('Premium Services')}
                                </h1>
                                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-600 mt-0.5">
                                    {viewMode === 'details' && activeService ? activeService.category : t('Professional help at your doorstep')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

                    {viewMode === 'list' && (
                        <div className="mb-8 flex justify-center md:justify-start sticky top-4 z-30">
                            <div className="relative w-full max-w-lg group">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search services...')}
                                    className="w-full pl-12 pr-6 py-4 rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 shadow-sm"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] transition-colors" size={20} />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={18} /> 
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {searchQuery.trim() && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto z-50 w-full overflow-x-hidden">
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
                                                            {service.category || t('Service')}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {servicesLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] aspect-[16/9] animate-pulse shadow-sm border border-gray-100 dark:border-gray-700/50" />
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
                                            className={`group relative bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden transition-all duration-300 aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full cursor-pointer shadow-sm hover:shadow-md ${!isOpen ? 'cursor-not-allowed' : ''}`}
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
                                            <div className="absolute bottom-0 left-0 right-0 py-2.5 px-4 z-20 overflow-hidden">
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
                                            <div className={`absolute bottom-4 right-4 z-30 transition-all duration-300 ${!isOpen ? 'opacity-0 scale-50' : ''}`}>
                                                <div className="w-8 h-8 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 flex items-center justify-center scale-90 group-hover:scale-105 active:scale-90 transition-all shadow-sm">
                                                    <ArrowLeft size={16} className="rotate-180" />
                                                </div>
                                            </div>

                                            {/* Category Tag Overlay (Top Left) */}
                                            <div className="absolute top-4 left-4 z-20">
                                                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-bold rounded-full uppercase tracking-[0.15em] shadow-lg">
                                                    {service.category || t('Service')}
                                                </span>
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
                        /* DETAIL VIEW: SUB-SERVICES */
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {itemsLoading ? (
                                // Enhanced Skeleton for items
                                [...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl aspect-square shadow-sm overflow-hidden">
                                        <div className="relative h-full">
                                            {/* Image skeleton */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
                                            {/* Content skeleton */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                                                <div className="h-5 w-3/4 bg-white/40 rounded animate-pulse" />
                                                <div className="h-4 w-1/2 bg-white/30 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : serviceItems.length > 0 ? (
                                serviceItems.map((sub, idx) => (
                                    <div
                                        key={sub._id || idx}
                                         className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md transition-all duration-300 aspect-square w-full border-2 border-transparent hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700`}
                                    >
                                        {/* Full Background Image */}
                                        <div className="absolute inset-0">
                                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                            <img
                                                src={sub.image}
                                                alt={sub.name}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x400?text=No+Image'; }}
                                            />
                                            {/* Gradient Overlay */}
                                            <div className={`absolute inset-0 transition-opacity bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-80`} />
                                        </div>

                                        {/* Content Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col justify-end h-full">
                                            <div className="transform translate-y-0 transition-transform duration-300">
                                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight drop-shadow-md">
                                                    {sub.name}
                                                </h3>
                                                <p className="text-sm text-gray-200 font-medium">
                                                    {sub.price}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Fallback if no specific sub-services
                                <div className="col-span-full text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">{t('No specific sub-services listed.')}</p>
                                     <button
                                         onClick={() => handleRequestSubService({ name: 'General Service', price: 'TBD', description: 'Standard service request' })}
                                         className="mt-4 px-6 py-3 bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 rounded-xl font-bold"
                                     >
                                         {t('Request General Service')}
                                     </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                <div
                    className={`fixed bottom-32 md:bottom-8 left-0 right-0 px-6 z-[60] flex justify-center pointer-events-none`}
                >
                    <div className={`transition-all duration-500 ease-in-out transform ${viewMode === 'details' && !showConfirmation && !requestSuccess
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-12 opacity-0 pointer-events-none'
                        }`}>
                        <button
                            onClick={() => handleRequestSubService(selectedItem || { name: 'General Service', price: 'TBD', description: 'Standard service request' })}
                            className="bg-white dark:bg-gray-800 backdrop-blur-xl text-gray-900 dark:text-white px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 group hover:scale-105 transition-all duration-300 border border-gray-100 dark:border-gray-700"
                        >
                            <div className="flex flex-col items-start mr-2 text-left">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-[#2E5A2E] dark:text-[#CBF9B2] opacity-70 leading-none mb-1">
                                    {t('Request Now')}
                                </span>
                                <span className="text-[15px] font-bold leading-none tracking-tight">
                                    {selectedItem ? selectedItem.name : t('Service')}
                                </span>
                            </div>
                             <div className="w-10 h-10 bg-[#2E5A2E] dark:bg-[#CBF9B2] rounded-full flex items-center justify-center group-hover:bg-[#1a381a] dark:group-hover:bg-[#CBF9B2]/80 transition-colors shadow-sm">
                                 <Send size={18} className="ml-0.5 text-white dark:text-gray-900" />
                             </div>
                        </button>
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
                {requestSuccess && selectedService && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2E5A2E]/20 dark:bg-[#CBF9B2]/20 backdrop-blur-md">
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 transform transition-all scale-100">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
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
                        </div>
                    </div>
                )}
            </div>
        </PullToRefreshLayout>
    );
};

export default Services;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useStores } from '../../hooks/queries/useStores';
import { API_BASE_URL } from '../../utils/api';
import { getAdButtonText } from '../../utils/titleHelpers';

const HeroBanner = ({ slides = [], isLoading = false }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { t } = useLanguage();
    const { data: rawStores = [] } = useStores();
    const stores = Array.isArray(rawStores) ? rawStores : (rawStores?.data || []);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedImages, setLoadedImages] = useState({});
    const scrollRef = useRef(null);

    // Auto-slide logic: auto scroll every 5 seconds
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            const nextSlide = (currentSlide + 1) % slides.length;
            scrollToSlide(nextSlide);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length, currentSlide]);

    const scrollToSlide = (index) => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const slideWidth = container.offsetWidth;
            container.scrollTo({
                left: slideWidth * index,
                behavior: 'smooth'
            });
            setCurrentSlide(index);
        }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const container = scrollRef.current;
            const scrollLeft = container.scrollLeft;
            const slideWidth = container.offsetWidth;
            const newIndex = Math.round(scrollLeft / slideWidth);
            if (newIndex !== currentSlide) {
                setCurrentSlide(newIndex);
            }
        }
    };

    const handleBuy = (e, slide) => {
        if (e) e.stopPropagation(); // Don't navigate to store/link
        
        const sId = slide.storeId?._id || slide.storeId;
        const sName = slide.storeName || slide.storeId?.name;

        // If no price, fallback to normal link behavior or store navigation
        if (!slide.price || Number(slide.price) <= 0) {
            if (slide.link) {
                if (slide.link.startsWith('/')) navigate(slide.link);
                else if (slide.link.startsWith('http')) window.open(slide.link, '_blank');
                else navigate(slide.link);
            } else if (sId) {
                navigate(`/store/${sId}`);
            } else if (slide.productId) {
                navigate(`/product/${slide.productId}`);
            }
            return;
        }

        // Transform ad to item for direct purchase
        const adItem = {
            id: slide._id || slide.id,
            product: slide._id || slide.id,
            title: slide.offerTitle || slide.title || 'Offer Item',
            name: slide.offerTitle || slide.title || 'Offer Item',
            price: Number(slide.price),
            quantity: 1,
            image: slide.image || `${API_BASE_URL}/ads/${slide._id || slide.id}/image`,
            storeId: sId,
            storeName: sName,
            isFromAd: true,
            adTitle: slide.offerTitle || slide.title,
            unit: slide.unit || '' // If ads have units
        };
        
        // Navigate directly to checkout bypassing the cart
        navigate('/checkout', { 
            state: { 
                directPurchase: { 
                    items: [adItem], 
                    total: adItem.price 
                } 
            } 
        });
    };

    if (isLoading) {
        return (
            <section className="px-4 py-1.5 relative">
                {/* Clean Ads Card Skeleton Loader without inner skeleton */}
                <div className="w-full aspect-[16/9] relative rounded-3xl overflow-hidden shadow-sm blinkit-shimmer border border-gray-100 dark:border-gray-800/60" />
            </section>
        );
    }

    if (slides.length === 0) {
        return null;
    }

    return (
        <section className="px-4 py-1.5 relative">
            <div className="w-full aspect-[16/9] relative rounded-3xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800">
                {/* Scrollable Container */}
                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar h-full w-full touch-pan-x"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {slides.map((slide, index) => {
                        const slideKey = slide._id || slide.id || index;
                        const isLoaded = !!loadedImages[slideKey];
                        const sId = slide.storeId?._id || slide.storeId;
                        let sName = slide.storeName || slide.storeId?.name;
                        if (!sName && sId && stores.length > 0) {
                            const matchedStore = stores.find(s => String(s._id || s.id) === String(sId));
                            if (matchedStore) {
                                sName = matchedStore.name;
                            }
                        }
                        return (
                        <div
                            key={slideKey}
                            onClick={() => handleBuy(null, slide)}
                            className="w-full h-full flex-shrink-0 snap-center cursor-pointer relative group bg-gray-100 dark:bg-gray-800 overflow-hidden"
                        >
                            {/* Blinkit shimmer placeholder until image finishes downloading */}
                            {!isLoaded && (
                                <div className="absolute inset-0 blinkit-shimmer z-0" />
                            )}
                            <img
                                src={slide.image || `${API_BASE_URL}/ads/${slide._id || slide.id}/image`}
                                alt={slide.title}
                                onLoad={() => setLoadedImages(prev => ({ ...prev, [slideKey]: true }))}
                                className={`w-full h-full object-cover pointer-events-none transition-opacity duration-300 relative z-[1] ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onError={(e) => { 
                                    e.target.onerror = null; 
                                    e.target.src = 'https://atlas-content-cdn.pixelbin.io/ast/feed_v2/static_assets/common/vegetable_basket.png';
                                    setLoadedImages(prev => ({ ...prev, [slideKey]: true }));
                                }}
                            />


                            {/* Continuous light sheen shine effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-[2]"
                                animate={{ x: ['-100%', '150%'] }}
                                transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                            />

                            {/* Action Button (Order Now or Pre Order) in the right side of image: white card, black thick text */}
                            {(() => {
                                const btnText = getAdButtonText(slide);
                                if (!btnText) return null;
                                return (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-[5]" />
                                        <button
                                            type="button"
                                            onClick={(e) => handleBuy(e, slide)}
                                            className="absolute right-3.5 bottom-3.5 sm:right-4 sm:bottom-4 z-20 bg-white text-black font-extrabold text-[11px] sm:text-[12px] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lg flex items-center gap-1.5 select-none active:scale-95 transition-transform cursor-pointer border border-black/5"
                                        >
                                            <span>{btnText === 'Pre Order' ? t('Pre Order') : t('Order Now')}</span>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    );})}
                </div>
                
                {/* Dots indicator */}
                {slides.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    scrollToSlide(index);
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            ` }} />
        </section>
    );
};

export default HeroBanner;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { API_BASE_URL } from '../../utils/api';

const HeroBanner = ({ slides = [], isLoading = false }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadedImages, setLoadedImages] = useState({});
    const scrollRef = useRef(null);

    // Auto-slide logic
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            const nextSlide = (currentSlide + 1) % slides.length;
            scrollToSlide(nextSlide);
        }, 60000);
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
        
        // If no price, fallback to normal link behavior if available
        if (!slide.price || slide.price <= 0) {
            if (slide.link) {
                if (slide.link.startsWith('/')) navigate(slide.link);
                else window.open(slide.link, '_blank');
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
            storeId: slide.storeId,
            storeName: slide.storeName,
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
            <section className="px-4 py-2 relative">
                {/* Blinkit-style Ads Card Skeleton Loader */}
                <div className="relative rounded-3xl overflow-hidden shadow-sm h-44 md:h-64 lg:h-80 xl:h-[400px] blinkit-shimmer border border-gray-100 dark:border-gray-800/60">
                    <div className="absolute inset-0 p-5 md:p-8 flex flex-col justify-between pointer-events-none z-10">
                        {/* Top: Store Tag & Offer Badge */}
                        <div className="flex items-center justify-between">
                            <div className="h-5 w-24 rounded-full bg-white/80 dark:bg-gray-700/80 shadow-sm" />
                            <div className="h-5 w-16 rounded-full bg-white/50 dark:bg-gray-700/50" />
                        </div>

                        {/* Center: Headline & CTA Button */}
                        <div className="space-y-2.5 max-w-[75%]">
                            <div className="h-6 md:h-8 w-4/5 rounded-xl bg-white/80 dark:bg-gray-700/80 shadow-sm" />
                            <div className="h-3.5 md:h-5 w-3/5 rounded-lg bg-white/50 dark:bg-gray-700/50" />
                            <div className="h-8 md:h-10 w-28 md:w-36 rounded-full bg-white/90 dark:bg-gray-700/90 mt-3 shadow-sm" />
                        </div>

                        {/* Bottom: Carousel Pagination Dots Skeleton */}
                        <div className="flex justify-center gap-1.5 self-center mt-auto pt-2">
                            <div className="w-4 h-1.5 rounded-full bg-white/90 dark:bg-gray-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 dark:bg-gray-600" />
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 dark:bg-gray-600" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (slides.length === 0) {
        return null;
    }

    return (
        <section className="px-4 py-2 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-800 h-44 md:h-64 lg:h-80 xl:h-[400px]">
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


                            {/* Store Name Badge - Now Very Small */}
                            {slide.storeName && (
                                <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                                    <p className="text-white text-[8px] font-bold tracking-widest uppercase opacity-80">{slide.storeName}</p>
                                </div>
                            )}
                        </div>
                    );})}
                </div>
                
                {/* Dots indicator */}
                {slides.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    scrollToSlide(index);
                                }}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-4 bg-white' : 'bg-white/40'}`}
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

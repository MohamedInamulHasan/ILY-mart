import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Bookmark, Store } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../utils/api';
import { isStoreOpen, getStoreName, isProductScheduled, getProductTimeLabel } from '../utils/storeHelpers';

import { useData } from '../context/DataContext';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { getThumbnailUrl } from '../utils/imageOptimizer';
import { isCategoryPreview } from '../utils/categoryHelpers';
import { useCategories } from '../hooks/queries/useCategories';

const ProductCard = ({ product, showCartControls = true, showHeart = false, stores: propStores, largeControls = false }) => {
    const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
    const { data: queryCategories = [] } = useCategories();
    const { stores: contextStores, savedProducts, toggleSaveProduct, categories: contextCategories } = useData();
    const categories = (queryCategories && queryCategories.length > 0) ? queryCategories : (contextCategories || []);
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    const productId = product._id || product.id;
    const cartItem = cartItems.find(item => item.id === productId);
    const quantity = cartItem?.quantity || 0;
    const isSaved = savedProducts?.some(p => (p._id || p.id || p) === productId);

    // Store logic - Use context as primary source if props are missing
    const stores = propStores || contextStores || []; 
    const storeToUse = product.storeId?._id 
        ? product.storeId 
        : (stores.find(s => (s._id || s.id) === product.storeId) || product.storeId);
    
    const isOpen = product.isGroup 
        ? (storeToUse?._id ? isStoreOpen(storeToUse) : (product.anyStoreOpen ?? true)) 
        : isStoreOpen(storeToUse);
    const isAvailable = product.isGroup ? true : product.isAvailable !== false;
    const isScheduled = product.isGroup ? true : isProductScheduled(product);
    const timeLabel = !isScheduled ? getProductTimeLabel(product) : null;
    const isPreview = isCategoryPreview(product.category, categories) || product?.isPreview === true || product?.mode === 'preview';
    const canClick = isPreview || (isOpen && isAvailable && isScheduled);

    // Auto-cycling variants logic (for Group cards)
    const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
    const variants = product.variants || [];
    const isGroup = product.isGroup && variants.length > 0;

    useEffect(() => {
        if (!isGroup) return;
        const interval = setInterval(() => {
            setCurrentVariantIndex(prev => (prev + 1) % variants.length);
        }, 10000); // Cycle every 10 seconds
        return () => clearInterval(interval);
    }, [isGroup, variants.length]);

    const featuredVariant = isGroup ? variants[currentVariantIndex] : product;
    const checkFree = (p) => Boolean(
        p && (p.isGold === true || p.deliveryCharge === 0 || p.isFreeDelivery === true || p.freeDelivery === true)
    );
    const isFreeDelivery = checkFree(product) ||
        checkFree(featuredVariant) ||
        (Array.isArray(variants) && variants.some(checkFree)) ||
        (Array.isArray(product.variants) && product.variants.some(checkFree));

    return (
        <div className="relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden group transition-all duration-300">
            
            <Link 
                to={!canClick ? '#' : (product.isGroup ? `/product-group/${encodeURIComponent(product.title)}` : `/product/${productId}`)} 
                className={`flex-1 ${!canClick ? 'cursor-default' : ''}`}
                onClick={(e) => {
                    if (!canClick) {
                        e.preventDefault();
                    }
                }}
            >
                {/* Status Overlays */}
                {!isPreview && !isAvailable && (
                    <div className="absolute inset-0 z-20 bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            {t('Out of Stock')}
                        </span>
                    </div>
                )}
                {!isPreview && !isOpen && isAvailable && (
                    <div className="absolute inset-0 z-20 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-gray-800 text-white px-3 py-1 rounded-[4px] text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            {t('Closed')}
                        </span>
                    </div>
                )}

                {/* Image Container */}
                <div className={`aspect-square bg-[#F9FAFB] m-1 rounded-lg overflow-hidden flex items-center justify-center relative ${!isOpen || !isAvailable ? 'opacity-60' : !isScheduled ? 'opacity-75' : ''}`}>
                    {/* Pink Free Delivery Tag across top of image */}
                    {isFreeDelivery && (
                        <div className="absolute top-0 left-0 right-0 z-[30] bg-[#E11D48] dark:bg-[#BE123C] text-white text-[7.5px] sm:text-[8px] font-bold uppercase tracking-tight py-0.5 text-center leading-none shadow-xs select-none pointer-events-none whitespace-nowrap overflow-hidden">
                            {t('Free Delivery')}
                        </div>
                    )}
                    
                    {showHeart && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSaveProduct(product);
                            }}
                             className={`absolute top-2 right-2 z-[25] p-1.5 transition-all active:scale-90 ${isSaved ? 'text-[#FF5C5C]' : 'text-gray-400'}`}
                        >
                            <Bookmark 
                                size={18} 
                                fill={isSaved ? "currentColor" : "none"} 
                                className={isSaved ? "fill-current" : ""}
                            />
                        </button>
                    )}
                    <img
                        key={featuredVariant.image || currentVariantIndex}
                        src={getThumbnailUrl(featuredVariant.image, 340) || `${API_BASE_URL}/products/${productId}/image`}
                        alt={t(featuredVariant, 'title')}
                        className={`w-full h-full object-cover transition-transform duration-300 ${isAvailable && isOpen ? 'group-hover:scale-110' : ''} ${isAvailable && isOpen && !isScheduled ? 'blur-sm' : ''}`}
                        loading="lazy" decoding="async"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://atlas-content-cdn.pixelbin.io/ast/feed_v2/static_assets/common/vegetable_placeholder.png'; }}
                    />
                    {/* Available time overlay */}
                    {isAvailable && isOpen && !isScheduled && timeLabel && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[1px] bg-black/10 gap-1">
                            <div className="bg-black/70 shadow-lg rounded-[4px] px-3 py-1.5 flex flex-col items-center gap-0.5 mx-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">{t('Available')}</span>
                                <span className="text-[11px] font-bold text-white leading-none text-center block whitespace-nowrap">{timeLabel}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="px-2.5 pb-2.5 pt-0.5 flex flex-col items-start flex-1 min-w-0 transition-opacity duration-300">
                    
                    <div className="flex-1 min-h-[38px] sm:min-h-[40px] mb-0.5 w-full flex flex-col justify-start transition-opacity duration-300">
                        {renderBilingualTitle(t(featuredVariant, 'title') || featuredVariant.title || featuredVariant.name, language, {
                            mainClassName: 'text-[12px] sm:text-[13px] font-semibold text-gray-800 dark:text-white truncate w-full leading-snug',
                            subClassName: 'text-[10px] sm:text-[11px] font-semibold text-gray-600 dark:text-gray-300 truncate w-full pt-0.5 pb-0.5 leading-normal'
                        })}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate mb-1.5 w-full">
                       {getStoreName(product.storeId, stores) || "ILY mart Direct"}
                    </p>
                    
                    <div className="flex items-center justify-between w-full gap-1.5 mt-auto mb-0.5">
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center">
                                <span className="inline-flex items-center justify-center px-1.5 py-1 sm:py-1.5 rounded-[4px] bg-gradient-to-b from-[#16A34A] to-[#0D7A31] text-white font-black text-xs sm:text-sm shadow-[0_2.5px_0_#064e1d] border-t border-white/35 tracking-tight select-none leading-none">
                                    {product.isGroup ? (
                                        Number(product.minPrice) === Number(product.maxPrice)
                                            ? `₹${Number(product.minPrice).toFixed(0)}`
                                            : `₹${Number(product.minPrice).toFixed(0)} - ₹${Number(product.maxPrice).toFixed(0)}`
                                    ) : (
                                        `₹${Number(product.price * (isPreview ? 1 : (quantity || 1))).toFixed(0)}`
                                    )}
                                </span>
                            </div>
                            {(product.isGroup || (product.unit && !isPreview)) && (
                                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1 block truncate">
                                    {product.isGroup ? `${product.variantExtraCount + 1} ${t('options')}` : product.unit}
                                </span>
                            )}
                        </div>

                        {showCartControls && !product.isGroup && !isPreview && (
                            quantity > 0 ? (
                                <div 
                                    className={`flex items-center ${largeControls ? "gap-1 p-1 rounded-md" : "gap-0.5 p-0.5 rounded-[4px]"} bg-gray-100 dark:bg-gray-700 shadow-sm shrink-0`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!user) { navigate('/login'); return; }
                                            if (quantity > 1) {
                                                updateQuantity(productId, quantity - 1);
                                            } else {
                                                removeFromCart(productId);
                                            }
                                        }}
                                        className={`${largeControls ? "w-7 h-7 sm:w-8 sm:h-8" : "w-6 h-6 sm:w-6 sm:h-7"} flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-red-500 transition-colors`}
                                    >
                                        <Minus size={13} strokeWidth={2.5} />
                                    </button>
                                    <span className="font-bold text-[13px] min-w-[15px] text-center select-none text-gray-800 dark:text-gray-100">{quantity}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!user) { navigate('/login'); return; }
                                            updateQuantity(productId, quantity + 1);
                                        }}
                                        className={`${largeControls ? "w-7 h-7 sm:w-8 sm:h-8" : "w-6 h-6 sm:w-6 sm:h-7"} flex items-center justify-center text-gray-700 dark:text-gray-300 hover:opacity-80 transition-colors`}
                                    >
                                        <Plus size={13} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!user) { navigate('/login'); return; }
                                        addToCart(product);
                                    }}
                                    className={`${largeControls ? "w-8 h-8 sm:w-9 sm:h-9 rounded-md" : "w-7 h-7 sm:w-8 sm:h-8 rounded-[4px]"} flex items-center justify-center transition-all active:scale-95 select-none shrink-0 ${
                                        (!isAvailable || !isOpen || !isScheduled)
                                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm'
                                    }`}
                                    disabled={!isAvailable || !isOpen || !isScheduled}
                                >
                                    <Plus size={largeControls ? 17 : 15} strokeWidth={2.5} />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default React.memo(ProductCard);

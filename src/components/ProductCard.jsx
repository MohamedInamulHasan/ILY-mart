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

const ProductCard = ({ product, showCartControls = true, showHeart = false, stores: propStores }) => {
    const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
    const { stores: contextStores, savedProducts, toggleSaveProduct } = useData();
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

    return (
        <div className={`relative flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl overflow-hidden group transition-all duration-300`}>
            
            <Link 
                to={(!isOpen || !isAvailable || !isScheduled) ? '#' : (product.isGroup ? `/product-group/${encodeURIComponent(product.title)}` : `/product/${productId}`)} 
                className={`flex-1 ${(!isOpen || !isAvailable || !isScheduled) ? 'cursor-default' : ''}`}
                onClick={(e) => {
                    if (!isOpen || !isAvailable || !isScheduled) {
                        e.preventDefault();
                    }
                }}
            >
                {/* Unit pill — left side (only for single products) */}
                {!product.isGroup && product.unit && product.unit.trim() !== '' && (
                    <div className="absolute top-3 left-3 z-[15] pointer-events-none flex flex-col gap-1.5 items-start">
                        <div className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                            {product.unit.trim()}
                        </div>
                    </div>
                )}





                {/* Status Overlays */}
                {!isAvailable && (
                    <div className="absolute inset-0 z-20 bg-black/5 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            {t('Out of Stock')}
                        </span>
                    </div>
                )}
                {!isOpen && isAvailable && (
                    <div className="absolute inset-0 z-20 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                            {t('Closed')}
                        </span>
                    </div>
                )}


                {/* Image Container (Full Bleed) */}
                <div className={`aspect-square bg-[#F9FAFB] m-1 rounded-2xl overflow-hidden flex items-center justify-center relative ${!isOpen || !isAvailable ? 'opacity-60' : !isScheduled ? 'opacity-75' : ''}`}>
                    {showHeart && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSaveProduct(product);
                            }}
                             className={`absolute top-2 right-2 z-[25] p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm transition-all active:scale-90 ${isSaved ? 'text-[#FF5C5C]' : 'text-gray-400'}`}
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
                        src={featuredVariant.image || `${API_BASE_URL}/products/${productId}/image`}
                        alt={t(featuredVariant, 'title')}
                        className={`w-full h-full object-cover transition-transform duration-300 ${isAvailable && isOpen ? 'group-hover:scale-110' : ''} ${isAvailable && isOpen && !isScheduled ? 'blur-sm' : ''}`}
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://atlas-content-cdn.pixelbin.io/ast/feed_v2/static_assets/common/vegetable_placeholder.png'; }}
                    />
                    {/* Available time overlay — inside image container so it centers on the image */}
                    {isAvailable && isOpen && !isScheduled && timeLabel && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[1px] bg-black/10 gap-1">
                            <div className="bg-black/70 shadow-lg rounded-xl px-3 py-2 flex flex-col items-center gap-0.5 mx-2">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">{t('Available')}</span>
                                <span className="text-[11px] font-bold text-gray-300 leading-tight text-center">{timeLabel}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="px-3.5 pb-4 pt-1 flex flex-col items-start flex-1 min-w-0 transition-opacity duration-300">
                    <div className="flex-1 min-h-[42px] mb-1 w-full flex flex-col justify-center transition-opacity duration-300">
                        {renderBilingualTitle(t(featuredVariant, 'title') || featuredVariant.title || featuredVariant.name, language, {
                            mainClassName: 'text-sm font-semibold text-gray-800 dark:text-white truncate w-full',
                            subClassName: 'text-xs font-semibold text-gray-800 dark:text-white truncate w-full opacity-80'
                        })}
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate mb-2 w-full">
                       {getStoreName(product.storeId, stores) || "ILY mart Direct"}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2 w-full">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                {product.isGroup ? (
                                    <span className="text-base font-bold text-gray-900 dark:text-white">
                                        {Number(product.minPrice) === Number(product.maxPrice)
                                            ? `₹${Number(product.minPrice).toFixed(0)}`
                                            : `₹${Number(product.minPrice).toFixed(0)} - ₹${Number(product.maxPrice).toFixed(0)}`
                                        }
                                    </span>
                                ) : (
                                    <>
                                        <span className="text-base font-bold text-gray-900 dark:text-white">
                                            ₹{Number(product.price * (quantity || 1)).toFixed(0)}
                                        </span>
                                    </>
                                )}
                            </div>
                            {(product.isGroup || product.unit) && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                    {product.isGroup ? `${product.variantExtraCount + 1} ${t('options')}` : product.unit}
                                </span>
                            )}
                        </div>

                        {showCartControls && !product.isGroup && (
                            quantity > 0 ? (
                                <div 
                                    className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-700/80 p-0.5 rounded-2xl shadow-sm"
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
                                        className="w-8 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-bold text-sm min-w-[20px] text-center select-none text-[#2E5A2E] dark:text-[#CBF9B2]">{quantity}</span>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!user) { navigate('/login'); return; }
                                            updateQuantity(productId, quantity + 1);
                                        }}
                                        className="w-8 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                                    >
                                        <Plus size={16} />
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
                                     className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 select-none ${
                                        (!isAvailable || !isOpen || !isScheduled)
                                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            : 'bg-[#2E5A2E] dark:bg-[#CBF9B2] hover:opacity-90 text-white dark:text-gray-900'
                                    }`}
                                    disabled={!isAvailable || !isOpen || !isScheduled}
                                >
                                    <ShoppingCart size={18} />
                                </button>
                            )
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;

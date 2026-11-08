import React, { memo } from 'react';
import { getThumbnailUrl } from '../utils/imageOptimizer';
import { Plus, Minus, Store, ShoppingCart, Zap, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { API_BASE_URL } from '../utils/api';
import { isStoreOpen, isProductScheduled, getProductTimeLabel } from '../utils/storeHelpers';
import { isCategoryPreview } from '../utils/categoryHelpers';
import { useCategories } from '../hooks/queries/useCategories';
import { useState, useEffect } from 'react';

const SimpleProductCard = ({ product, isFastPurchase, stores: propStores, showSave = false, largeControls = false }) => {
    const { t, language } = useLanguage();
    const { data: queryCategories = [] } = useCategories();
    const { stores: contextStores, savedProducts, toggleSaveProduct, categories: contextCategories } = useData();
    const categories = (queryCategories && queryCategories.length > 0) ? queryCategories : (contextCategories || []);
    const stores = propStores || contextStores;
    const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const productId = product._id || product.id;
    const [showQuantity, setShowQuantity] = useState(false);

    // Look up store name from stores context
    const storeIdStr = product.storeId?._id || product.storeId;
    const store = stores?.find(s => (s._id || s.id) === storeIdStr);
    const storeName = store?.name || product.storeId?.name || 'Unknown Store';

    // Get cart quantity for this product
    const cartItem = cartItems.find(item => item.id === productId);
    const cartQuantity = cartItem ? cartItem.quantity : 0;

    // Check if store is open
    const isStoreOpenCheck = store ? isStoreOpen(store) : true;
    const isPreview = isCategoryPreview(product.category, categories) || product?.isPreview === true || product?.mode === 'preview';

    const handleClick = (e) => {
        if (!isPreview && !isStoreOpenCheck) {
            e.preventDefault();
        }
    };

    const handleFastPurchaseClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        if (!isAvailable || !isStoreOpenCheck || !isScheduled) return;

        if (cartQuantity > 0) {
            setShowQuantity(true);
        } else {
            addToCart({
                id: productId,
                title: product.title,
                price: product.price,
                image: product.image,
                storeId: product.storeId,
                quantity: 1,
                unit: product.unit,
                isGold: product.isGold
            });
            setShowQuantity(true);
        }
    };

    const handleIncrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        if (cartQuantity > 0) {
            updateQuantity(productId, cartQuantity + 1);
        } else {
            addToCart({
                id: productId,
                title: product.title,
                price: product.price,
                image: product.image,
                storeId: product.storeId,
                quantity: 1,
                unit: product.unit,
                isGold: product.isGold
            });
        }
    };

    const handleDecrement = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        if (cartQuantity > 1) {
            updateQuantity(productId, cartQuantity - 1);
        } else if (cartQuantity === 1) {
            removeFromCart(productId);
            setShowQuantity(false);
        }
    };

    // Auto-cycling variants logic (for Group cards)
    const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
    const variants = product.variants || [];
    const isGroupProduct = product.isGroup && variants.length > 0;

    useEffect(() => {
        if (!isGroupProduct) return;
        const interval = setInterval(() => {
            setCurrentVariantIndex(prev => (prev + 1) % variants.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isGroupProduct, variants.length]);

    const featuredVariant = isGroupProduct ? variants[currentVariantIndex] : product;
    const checkFree = (p) => Boolean(
        p && (p.isGold === true || p.deliveryCharge === 0 || p.isFreeDelivery === true || p.freeDelivery === true)
    );
    const isFreeDelivery = checkFree(product) ||
        checkFree(featuredVariant) ||
        (Array.isArray(variants) && variants.some(checkFree)) ||
        (Array.isArray(product.variants) && product.variants.some(checkFree));

    // Handle Grouped Products
    if (product.isGroup) {
        return (
            <Link
                to={(!product.anyStoreOpen || !isStoreOpenCheck) ? '#' : `/product-group/${encodeURIComponent(product.title)}?${isFastPurchase ? 'fast=true&' : ''}${product.storeId ? `storeId=${product.storeId._id || product.storeId}` : ''}`}
                className={`rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${(product.anyStoreOpen && isStoreOpenCheck) ? 'hover:scale-[1.01]' : 'cursor-default'}`}
                onClick={(e) => {
                    if (!product.anyStoreOpen || !isStoreOpenCheck) {
                        e.preventDefault();
                    }
                }}
            >
            <div className={`relative pb-[100%] m-1 rounded-lg overflow-hidden bg-[#F9FAFB] ${(!product.anyStoreOpen || !isStoreOpenCheck) ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    {/* Pink Free Delivery Tag across top of image */}
                    {isFreeDelivery && (
                        <div className="absolute top-0 left-0 right-0 z-[30] bg-[#E11D48] dark:bg-[#BE123C] text-white text-[9px] sm:text-[9.5px] font-extrabold uppercase tracking-tight py-1 text-center leading-tight shadow-xs select-none pointer-events-none whitespace-nowrap overflow-hidden">
                            {t('Free Delivery')}
                        </div>
                    )}
                    {/* Delivery Tag */}
                    <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-[25] pointer-events-none">
                        {product.isGold && (
                            <span className="bg-[#16A34A] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-br-md shadow-sm">
                                {t('Free Delivery')}
                            </span>
                        )}
                    </div>
                    <img
                        key={featuredVariant.image || currentVariantIndex}
                        src={featuredVariant.image || `${API_BASE_URL}/products/${productId}/image`}
                        alt={t(featuredVariant, 'title')}
                        loading="lazy" decoding="async"
                        className={`absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 ${(isStoreOpenCheck && product.anyStoreOpen) ? 'hover:scale-105' : 'grayscale'}`}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'; }}
                    />
                    
                    {showSave && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSaveProduct(product);
                            }}
                            className={`absolute top-2 right-2 z-[30] p-1.5 transition-all active:scale-90 ${savedProducts?.some(p => (p._id || p.id || p) === productId) ? 'text-[#FF5C5C]' : 'text-gray-400'}`}
                        >
                            <Bookmark 
                                size={14} 
                                fill={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "currentColor" : "none"} 
                                className={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "fill-current" : ""}
                            />
                        </button>
                    )}
                    {(!product.anyStoreOpen || !isStoreOpenCheck) && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-[4px] shadow-lg transform -rotate-12 border-2 border-white">
                                {t('STORE CLOSED')}
                            </span>
                        </div>
                    )}
                </div>
                <div className="p-3 flex flex-col flex-1 border-t border-gray-100 dark:border-gray-700">
                    <div className="w-full mb-1 min-h-[38px] sm:min-h-[40px] flex flex-col justify-start">
                        {renderBilingualTitle(t(product, 'title') || product.title || product.name, language, {
                            mainClassName: 'text-sm font-semibold text-gray-800 dark:text-white leading-snug truncate w-full',
                            subClassName: 'text-xs text-gray-600 dark:text-gray-300 font-medium truncate w-full pt-0.5 pb-0.5 leading-normal'
                        })}
                    </div>
                        {/* Store Options */}
                        <div className="flex items-center gap-1 mt-1 mb-1.5">
                            <Store size={12} className={`text-gray-400 dark:text-gray-500 flex-shrink-0`} />
                            <p className={`text-xs text-gray-500 dark:text-gray-400 truncate`}>
                                {product.variants?.length
                                    ? `${product.variants.length} ${t('options')}`
                                    : `${(product.variantExtraCount || 0) + 1} ${t('options')}`}
                            </p>
                        </div>

                    <div className="flex items-center justify-between mt-auto w-full pt-1.5 border-t border-gray-50 dark:border-gray-700/50">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 sm:py-1.5 rounded-[4px] bg-gradient-to-b from-[#16A34A] to-[#0D7A31] text-white font-black text-xs sm:text-sm shadow-[0_2.5px_0_#064e1d] border-t border-white/35 tracking-tight select-none leading-none">
                            {(() => {
                                if (product.minPrice !== undefined && product.maxPrice !== undefined) {
                                    if (Number(product.minPrice) === Number(product.maxPrice)) {
                                        return `₹${Number(product.minPrice).toFixed(0)}`;
                                    }
                                    return `₹${Number(product.minPrice).toFixed(0)} - ₹${Number(product.maxPrice).toFixed(0)}`;
                                }
                                if (product.variants && product.variants.length > 0) {
                                    const prices = product.variants.map(v => v.price).filter(p => p !== undefined);
                                    if (prices.length > 0) {
                                        const min = Math.min(...prices);
                                        const max = Math.max(...prices);
                                        if (min !== max) {
                                            return `₹${min.toFixed(0)} - ₹${max.toFixed(0)}`;
                                        }
                                        return `₹${min.toFixed(0)}`;
                                    }
                                }
                                return `₹${Number(product.price || 0).toFixed(0)}`;
                            })()}
                        </span>

                    {/* Fake Add Button */}
                    {isFastPurchase && (
                        <div className="">
                            {!product.anyStoreOpen ? (
                                <div
                                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-[4px] border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600"
                                >
                                    <Plus size={15} strokeWidth={2.5} />
                                </div>
                            ) : (
                                <div
                                    className="w-7 h-7 sm:w-7.5 sm:h-7.5 flex items-center justify-center rounded-[4px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all shadow-sm cursor-pointer"
                                >
                                    <Plus size={15} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </Link >
        );
    }

    const isAvailable = product.isAvailable !== false;
    const isScheduled = isProductScheduled(product);
    const timeLabel = !isScheduled ? getProductTimeLabel(product) : null;

    return (
        <Link
            to={(isStoreOpenCheck && isAvailable && isScheduled) ? `/product/${productId}` : '#'}
            onClick={(e) => {
                if (!isAvailable || !isStoreOpenCheck || !isScheduled) {
                    e.preventDefault();
                    return;
                }
                handleClick(e);
            }}
            className={`rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${isStoreOpenCheck && isAvailable && isScheduled ? 'hover:scale-[1.01]' : 'cursor-default'}`}
        >
            <div className={`relative pb-[100%] m-1 rounded-lg overflow-hidden bg-[#F9FAFB] ${(!isStoreOpenCheck || !isAvailable || !isScheduled) ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    {/* Pink Free Delivery Tag across top of image */}
                    {isFreeDelivery && (
                        <div className="absolute top-0 left-0 right-0 z-[30] bg-[#E11D48] dark:bg-[#BE123C] text-white text-[9px] sm:text-[9.5px] font-extrabold uppercase tracking-tight py-1 text-center leading-tight shadow-xs select-none pointer-events-none whitespace-nowrap overflow-hidden">
                            {t('Free Delivery')}
                        </div>
                    )}
                    <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-[25] pointer-events-none">
                        {product.isGold && (
                            <span className="bg-[#16A34A] text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-br-md shadow-sm">
                                {t('Free Delivery')}
                            </span>
                        )}
                    </div>
                    <img
                    src={getThumbnailUrl(product.image, 300) || `${API_BASE_URL}/products/${productId}/image`}
                    alt={t(product, 'title')}
                    loading="lazy" decoding="async"
                    className={`absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 ${isStoreOpenCheck && isAvailable ? 'group-hover:scale-105' : 'grayscale'} ${isAvailable && isStoreOpenCheck && !isScheduled ? 'blur-sm' : ''}`}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'; }}
                />
                {showSave && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSaveProduct(product);
                        }}
                        className={`absolute top-2 right-2 z-[30] p-1.5 transition-all active:scale-90 ${savedProducts?.some(p => (p._id || p.id || p) === productId) ? 'text-[#FF5C5C]' : 'text-gray-400'}`}
                    >
                        <Bookmark 
                            size={14} 
                            fill={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "currentColor" : "none"} 
                            className={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "fill-current" : ""}
                        />
                    </button>
                )}
                {isStoreOpenCheck && isAvailable && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                )}
                {!isPreview && !isStoreOpenCheck && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-[4px] shadow-lg transform -rotate-12 border-2 border-white">
                            {t('STORE CLOSED')}
                        </span>
                    </div>
                )}
                {!isPreview && !isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-[4px] shadow-lg transform -rotate-12 border-2 border-white">
                            {t('OUT OF STOCK')}
                        </span>
                    </div>
                )}
                {isAvailable && isStoreOpenCheck && !isScheduled && timeLabel && (
                    <div className="absolute top-0 left-0 w-full h-full z-20 flex flex-col items-center justify-center backdrop-blur-[1px] bg-black/10 gap-1">
                        <div className="bg-black/70 shadow-lg rounded-[4px] px-3 py-1.5 flex flex-col items-center gap-0.5 mx-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">{t('Available')}</span>
                            <span className="text-[11px] font-bold text-white leading-none text-center block whitespace-nowrap">{timeLabel}</span>
                        </div>
                    </div>
                )}

                {product.unit && !isPreview && (
                    <div className="absolute bottom-2 right-2 bg-[#2E5A2E] dark:bg-[#CBF9B2] px-2 py-0.5 rounded-[4px] z-10 pointer-events-none border border-white/20">
                        <span className="text-[10px] font-semibold text-white dark:text-gray-900 leading-none block">
                            {product.unit}
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3 flex flex-col flex-1">
                
                <div className="w-full mb-1 min-h-[38px] sm:min-h-[40px] flex flex-col justify-start">
                    {renderBilingualTitle(t(featuredVariant, 'title') || featuredVariant.title || featuredVariant.name, language, {
                        mainClassName: 'text-sm font-semibold text-gray-800 dark:text-white leading-snug truncate w-full',
                        subClassName: 'text-xs text-gray-600 dark:text-gray-300 font-medium truncate w-full pt-0.5 pb-0.5 leading-normal'
                    })}
                </div>
                    {product.storeId && (
                        <div className="flex items-center gap-1 mb-2">
                            <Store size={12} className={`text-gray-400 dark:text-gray-500 flex-shrink-0`} />
                            <p className={`text-xs text-gray-500 dark:text-gray-400 truncate`}>
                                {storeName}
                            </p>
                        </div>
                    )}

                <div className="flex items-center justify-between mt-auto w-full pt-1.5">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 sm:py-1.5 rounded-[4px] bg-gradient-to-b from-[#16A34A] to-[#0D7A31] text-white font-black text-xs sm:text-sm shadow-[0_2.5px_0_#064e1d] border-t border-white/35 tracking-tight select-none leading-none">
                        ₹{Number((product.price || 0) * (isPreview ? 1 : (cartQuantity || 1))).toFixed(0)}
                    </span>

                    {isFastPurchase && isAvailable && !isPreview && (
                        <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                            {!isStoreOpenCheck ? (
                                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-[4px] border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600">
                                    <Plus size={15} strokeWidth={2.5} />
                                </div>
                            ) : cartQuantity > 0 ? (
                                <div className={`flex items-center ${largeControls ? "gap-1.5 p-1 rounded-lg" : "gap-1 p-1 rounded-[4px]"} bg-gray-100 dark:bg-gray-700 shadow-sm`}>
                                    <button 
                                        onClick={handleDecrement}
                                        className={`${largeControls ? "w-8 h-8 sm:w-9 sm:h-9" : "w-6 h-7 sm:w-7 sm:h-7"} flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-red-500 transition-colors cursor-pointer`}
                                    >
                                        <Minus size={largeControls ? 14 : 13} strokeWidth={2.8} />
                                    </button>
                                    <span className={`font-bold ${largeControls ? "text-[14px] min-w-[18px]" : "text-sm sm:text-[14px] min-w-[16px]"} text-center select-none text-gray-800 dark:text-gray-100`}>{cartQuantity}</span>
                                    <button 
                                        onClick={handleIncrement}
                                        className={`${largeControls ? "w-8 h-8 sm:w-9 sm:h-9" : "w-6 h-7 sm:w-7 sm:h-7"} flex items-center justify-center text-gray-700 dark:text-gray-300 hover:opacity-80 transition-colors cursor-pointer`}
                                    >
                                        <Plus size={largeControls ? 14 : 13} strokeWidth={2.8} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleFastPurchaseClick}
                                    className={`${largeControls ? "w-9 h-9 sm:w-10 sm:h-10 rounded-lg" : "w-8 h-8 sm:w-9 sm:h-9 rounded-[4px]"} flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 active:scale-95 transition-all shadow-sm cursor-pointer`}
                                >
                                    <Plus size={largeControls ? 16 : 15} strokeWidth={2.8} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default memo(SimpleProductCard);

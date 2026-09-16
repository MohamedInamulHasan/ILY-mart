import { Plus, Minus, Store, ShoppingCart, Zap, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { API_BASE_URL } from '../utils/api';
import { isStoreOpen, isProductScheduled, getProductTimeLabel } from '../utils/storeHelpers';
import { useState, useEffect } from 'react';

const SimpleProductCard = ({ product, isFastPurchase, stores: propStores, showSave = false }) => {
    const { t } = useLanguage();
    const { stores: contextStores, savedProducts, toggleSaveProduct } = useData();
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

    const handleClick = (e) => {
        if (!isStoreOpenCheck) {
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
            // If already in cart, show quantity controls
            setShowQuantity(true);
        } else {
            // Add to cart with quantity 1
            addToCart({
                id: productId,
                title: product.title,
                price: product.price,
                image: product.image,
                storeId: product.storeId,
                quantity: 1,
                unit: product.unit, // Pass unit immediately
                isGold: product.isGold // Pass isGold status
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
                unit: product.unit, // Pass unit immediately
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
        }, 3000); // Cycle every 3 seconds
        return () => clearInterval(interval);
    }, [isGroupProduct, variants.length]);

    const featuredVariant = isGroupProduct ? variants[currentVariantIndex] : product;

    // Handle Grouped Products
    if (product.isGroup) {
        return (
            <Link
                to={(!product.anyStoreOpen || !isStoreOpenCheck) ? '#' : `/product-group/${encodeURIComponent(product.title)}?${isFastPurchase ? 'fast=true&' : ''}${product.storeId ? `storeId=${product.storeId._id || product.storeId}` : ''}`}
                className={`rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${(product.anyStoreOpen && isStoreOpenCheck) ? 'hover:scale-[1.01]' : 'cursor-default'}`}
                onClick={(e) => {
                    if (!product.anyStoreOpen || !isStoreOpenCheck) {
                        e.preventDefault();
                    }
                }}
            >
            <div className={`relative pb-[100%] m-1 rounded-2xl overflow-hidden bg-[#F9FAFB] ${(!product.anyStoreOpen || !isStoreOpenCheck) ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    
                    {/* Delivery Tag */}
                    <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-[25] pointer-events-none">
                        {product.isGold && (
                            <span className="bg-[#16A34A] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-br-lg shadow-sm">
                                {t('Free Delivery')}
                            </span>
                        )}
                    </div>
                    <img
                        key={featuredVariant.image || currentVariantIndex}
                        src={featuredVariant.image || `${API_BASE_URL}/products/${productId}/image`}
                        alt={t(featuredVariant, 'title')}
                        loading="lazy"
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
                            className={`absolute top-2 right-2 z-[30] p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm transition-all active:scale-90 ${savedProducts?.some(p => (p._id || p.id || p) === productId) ? 'text-[#FF5C5C]' : 'text-gray-400'}`}
                        >
                            <Bookmark 
                                size={14} 
                                fill={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "currentColor" : "none"} 
                                className={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "fill-current" : ""}
                            />
                        </button>
                    )}
                    {/* Show Closed Overlay for Group ONLY if ALL stores are closed */}
                    {(!product.anyStoreOpen || !isStoreOpenCheck) && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform -rotate-12 border-2 border-white">
                                {t('STORE CLOSED')}
                            </span>
                        </div>
                    )}


                </div>
                <div className="p-3 flex flex-col flex-1 border-t border-gray-100 dark:border-gray-700">
                    <div className="w-full mb-1">
                        {renderBilingualTitle(t(product, 'title') || product.title || product.name, useLanguage().language, {
                            mainClassName: 'text-sm font-semibold text-gray-800 dark:text-white leading-tight truncate w-full',
                            subClassName: 'text-xs text-gray-500 dark:text-gray-400 font-medium truncate w-full opacity-80'
                        })}
                    </div>
                        {/* Store Options - Centered */}
                        <div className="flex items-center gap-1 mt-1 mb-1">
                            <Store size={12} className={`text-gray-400 dark:text-gray-500 flex-shrink-0`} />
                            <p className={`text-xs text-gray-500 dark:text-gray-400 truncate`}>
                                {product.variants?.length
                                    ? `${product.variants.length} ${t('options')}`
                                    : `${(product.variantExtraCount || 0) + 1} ${t('options')}`}
                            </p>
                        </div>

                    <div className="flex items-center justify-between mt-2 w-full pt-2 border-t border-gray-50 dark:border-gray-700/50">
                        <span className={`text-base font-bold ${!product.anyStoreOpen ? 'text-gray-400' : 'text-[#2E5A2E] dark:text-[#CBF9B2]'}`}>
                            {(() => {
                                // Robust Price Logic
                                if (product.minPrice !== undefined && product.maxPrice !== undefined) {
                                    if (Number(product.minPrice) === Number(product.maxPrice)) {
                                        return `₹${Number(product.minPrice).toFixed(0)}`;
                                    }
                                    return `₹${Number(product.minPrice).toFixed(0)} - ₹${Number(product.maxPrice).toFixed(0)}`;
                                }
                                // Fallback: Check variants if available locally
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
                                // Default Fallback
                                return `₹${Number(product.price || 0).toFixed(0)}`;
                            })()}
                        </span>

                    {/* Fake Add Button for Visual Consistency - Clickable as part of the Link */}
                    {isFastPurchase && (
                        <div className="">
                            {!product.anyStoreOpen ? (
                                <div
                                    className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full transition-colors border border-gray-200 dark:border-gray-600"
                                >
                                    <ShoppingCart size={16} className="text-gray-400" />
                                </div>
                            ) : (
                                <div
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 active:scale-90`}
                                >
                                    <ShoppingCart size={16} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </Link >
        );
    }

    const isAvailable = product.isAvailable !== false; // Default to true
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
            className={`rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${isStoreOpenCheck && isAvailable && isScheduled ? 'hover:scale-[1.01]' : 'cursor-default'
                }`}
        >
            <div className={`relative pb-[100%] m-1 rounded-2xl overflow-hidden bg-[#F9FAFB] ${(!isStoreOpenCheck || !isAvailable || !isScheduled) ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div className="absolute top-0 left-0 flex flex-col items-start gap-0 z-[25] pointer-events-none">
                        {product.isGold && (
                            <span className="bg-[#16A34A] text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-br-lg shadow-sm">
                                {t('Free Delivery')}
                            </span>
                        )}
                    </div>
                    <img
                    src={product.image || `${API_BASE_URL}/products/${productId}/image`}
                    alt={t(product, 'title')}
                    loading="lazy"
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
                        className={`absolute top-2 right-2 z-[30] p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm transition-all active:scale-90 ${savedProducts?.some(p => (p._id || p.id || p) === productId) ? 'text-[#FF5C5C]' : 'text-gray-400'}`}
                    >
                        <Bookmark 
                            size={14} 
                            fill={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "currentColor" : "none"} 
                            className={savedProducts?.some(p => (p._id || p.id || p) === productId) ? "fill-current" : ""}
                        />
                    </button>
                )}
                {/* Subtle gradient overlay for depth */}
                {isStoreOpenCheck && isAvailable && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                )}
                {!isStoreOpenCheck && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform -rotate-12 border-2 border-white">
                            {t('STORE CLOSED')}
                        </span>
                    </div>
                )}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform -rotate-12 border-2 border-white">
                            {t('OUT OF STOCK')}
                        </span>
                    </div>
                )}
                {isAvailable && isStoreOpenCheck && !isScheduled && timeLabel && (
                    <div className="absolute top-0 left-0 w-full h-full z-20 flex flex-col items-center justify-center backdrop-blur-[1px] bg-black/10 gap-1">
                        <div className="bg-black/70 shadow-lg rounded-xl px-3 py-2 flex flex-col items-center gap-0.5 mx-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-300">{t('Available')}</span>
                            <span className="text-[11px] font-bold text-gray-300 leading-tight text-center">{timeLabel}</span>
                        </div>
                    </div>
                )}


                {/* Unit Tag */}
                {product.unit && (
                    <div className="absolute bottom-2 right-2 bg-[#2E5A2E] dark:bg-[#CBF9B2] px-2.5 py-1 rounded-full z-10 pointer-events-none border border-white/20">
                        <span className="text-[11px] font-semibold text-white dark:text-gray-900 leading-none block">
                            {product.unit}
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3 flex flex-col flex-1">
                <div className="w-full mb-1">
                    {renderBilingualTitle(t(featuredVariant, 'title') || featuredVariant.title || featuredVariant.name, useLanguage().language, {
                        mainClassName: 'text-sm font-semibold text-gray-800 dark:text-white leading-normal truncate w-full',
                        subClassName: 'text-xs text-gray-500 dark:text-gray-400 font-medium truncate pb-0.5 w-full opacity-80'
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

                <div className="flex items-center justify-between mt-2 w-full pt-2">
                    <span className={`text-base font-bold ${!isStoreOpenCheck || !isAvailable ? 'text-gray-400' : 'text-[#2E5A2E] dark:text-[#CBF9B2]'}`}>
                        ₹{Number((product.price || 0) * (cartQuantity || 1)).toFixed(0)}
                    </span>

                    {isFastPurchase && isAvailable && (
                        <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                            {!isStoreOpenCheck ? (
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                                    <ShoppingCart size={16} className="text-gray-400" />
                                </div>
                            ) : cartQuantity > 0 ? (
                                <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-gray-700/80 p-0.5 rounded-2xl shadow-sm">
                                    <button 
                                        onClick={handleDecrement}
                                        className="w-8 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-bold text-sm min-w-[20px] text-center select-none text-[#2E5A2E] dark:text-[#CBF9B2]">{cartQuantity}</span>
                                    <button 
                                        onClick={handleIncrement}
                                        className="w-8 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#2E5A2E] dark:hover:text-[#CBF9B2] transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleFastPurchaseClick}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 active:scale-95 transition-transform"
                                >
                                    <ShoppingCart size={16} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default SimpleProductCard;

import { getMediumImageUrl, getThumbnailUrl } from '../utils/imageOptimizer';
import { useState, useEffect, useMemo } from 'react';
import { parseProductDescription } from '../utils/descriptionHelper';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { renderBilingualTitle } from '../utils/titleHelpers';
import { Plus, ArrowLeft, Minus, ShoppingCart, ChevronLeft, ChevronRight, Star, Share2, Bookmark, Store as StoreIcon, Phone } from 'lucide-react';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import { isCategoryPreview } from '../utils/categoryHelpers';
import { useCategories } from '../hooks/queries/useCategories';
import SwipeActionButton from '../components/SwipeActionButton';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cartItems, updateQuantity } = useCart();
    const { data: queryCategories = [] } = useCategories();
    const { products, stores, savedProducts, toggleSaveProduct, categories: contextCategories, settings } = useData();
    const categories = (queryCategories && queryCategories.length > 0) ? queryCategories : (contextCategories || []);
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [selectedMention, setSelectedMention] = useState('');

    const { blocks: descBlocks, mentions: descMentions } = useMemo(() => {
        return parseProductDescription(product?.description);
    }, [product?.description]);

    const productMentions = useMemo(() => {
        const list = [];
        if (descMentions && Array.isArray(descMentions)) {
            list.push(...descMentions);
        }
        const rawUnit = product?.unit || product?.mention;
        if (rawUnit && typeof rawUnit === 'string') {
            const parts = rawUnit.split(/[,/|]+/).map(s => s.trim()).filter(Boolean);
            if (parts.length > 1 || (parts.length === 1 && ['s', 'm', 'l', 'xl', 'xxl', '28', '30', '32', '34', '36', '38', '40', '42'].includes(parts[0].toLowerCase()))) {
                for (const p of parts) {
                    if (!list.includes(p)) list.push(p);
                }
            }
        }
        return list;
    }, [descMentions, product?.unit, product?.mention]);

    // Look up store name from stores context
    const store = product && stores?.find(s => (s._id || s.id) === product.storeId);
    const storeName = store?.name || 'Unknown Store';
    const isPreview = isCategoryPreview(product?.category, categories) || product?.isPreview === true || product?.mode === 'preview';

    const handleCallStore = () => {
        const rawPhone = product?.phone || product?.contactPhone || store?.phone || store?.mobile || settings?.contactPhone || '919500171980';
        const phone = String(rawPhone).replace(/\s+/g, '');
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    };

    // Updated effect to handle individual product fetching
    useEffect(() => {
        const loadProduct = async () => {
            setLoading(true);
            // 1. Try to find in context first (fastest)
            if (products.length > 0) {
                const foundProduct = products.find(p => (p._id || p.id) === id || (p._id || p.id) === parseInt(id));
                if (foundProduct) {
                    setProduct(foundProduct);
                    setCurrentImageIndex(0);
                    setLoading(false);
                    return;
                }
            }

            // 2. If not in context (e.g. direct link or paginated out), fetch from API
            try {
                const response = await import('../utils/api').then(m => m.apiService.getProduct(id));
                if (response.success && response.data) {
                    setProduct(response.data);
                    setCurrentImageIndex(0);
                } else {
                    setProduct(null);
                }
            } catch (err) {
                console.error('Failed to fetch individual product:', err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id, products]);

    const productId = product ? (product._id || product.id) : null;
    const cartItem = product ? cartItems.find(item => item.id === productId) : null;
    const quantity = cartItem ? cartItem.quantity : 0;

    // Check if product is saved (savedProducts contains objects now due to populate, so check IDs)
    const isSaved = product && savedProducts.some(p => (p._id || p.id || p) === (product._id || product.id));

    const handleToggleSave = async () => {
        if (product) {
            await toggleSaveProduct(product._id || product.id);
        }
    };

    const getProductWithMention = () => {
        if (!product) return null;
        if (selectedMention) {
            return {
                ...product,
                selectedMention,
                title: `${product.title} (${selectedMention})`,
                mention: selectedMention
            };
        }
        return product;
    };

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        addToCart(getProductWithMention());
    };

    const handleCheckout = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        const itemToAdd = getProductWithMention();
        if (isPreview) {
            // Preview mode: ignore existing cart items and only order this item
            navigate('/checkout', {
                state: {
                    directPurchase: {
                        items: [{ ...itemToAdd, quantity: 1, isPreview: true }],
                        total: Number(itemToAdd.price) || 0
                    }
                }
            });
            return;
        }
        addToCart(itemToAdd, 1);
        navigate('/checkout');
    };

    const handleScroll = (e) => {
        const container = e.target;
        const slideIndex = Math.round(container.scrollLeft / container.clientWidth);
        setCurrentImageIndex(slideIndex);
    };

    const scrollToImage = (index) => {
        const container = document.getElementById('product-slider');
        if (container) {
            container.scrollTo({
                left: index * container.clientWidth,
                behavior: 'smooth'
            });
            setCurrentImageIndex(index);
        }
    };

    const handleShare = async () => {
        try {
            const shareTitle = t(product, 'title') || product.title;
            const sharePrice = Number(product.price).toFixed(0);
            const shareUrl = window.location.href;
            const shareText = `${t('Checkout this')} ${shareTitle} ${t('for only')} ₹${sharePrice} ${t('on')} ILY mart!`;

            if (navigator.share) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } else {
                // Fallback to WhatsApp sharing
                const message = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
                window.open(`https://wa.me/?text=${message}`, '_blank');
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error sharing:', err);
            }
        }
    };

    // Show loading skeleton while fetching
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        {/* Back button skeleton */}
                        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Image skeleton */}
                            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>

                            {/* Details skeleton */}
                            <div className="space-y-4">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mt-8"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show not found only after loading completes
    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-4 transition-colors duration-200">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('Product not found')}</h2>
                <Link to="/store" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">{t('Return to Store')}</Link>
            </div>
        );
    }
    
    const images = product.images || [product.image];
    const totalPrice = (Number(product.price) * (quantity || 1)).toFixed(0);

    // Availability Logic (Manual + Time-based)
    const isManualAvailable = product.isAvailable !== false;
    const isScheduled = isProductScheduled(product);

    const isStoreCurrentlyOpen = store ? isStoreOpen(store) : true;
    const isCurrentlyAvailable = isManualAvailable && isScheduled && isStoreCurrentlyOpen;

    // Free delivery check
    const isFreeDelivery = Boolean(
        product && (product.isGold === true || product.deliveryCharge === 0 || product.isFreeDelivery === true || product.freeDelivery === true)
    );

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 flex flex-col lg:py-12 lg:px-8">
            
            {/* Desktop Layout Container Wrapper */}
            <div className="flex flex-col lg:flex-row lg:max-w-[1200px] lg:mx-auto lg:bg-white lg:dark:bg-gray-800 lg:rounded-2xl lg:shadow-sm lg:overflow-hidden flex-1 lg:flex-initial w-full">
            
                {/* Image Section (Top on mobile, Left on desktop) */}
                <div className="relative w-full lg:w-1/2 aspect-square md:aspect-[16/8] lg:aspect-auto lg:min-h-[600px] bg-[#E8EAEF] lg:bg-gray-50/50 dark:bg-gray-900 lg:dark:bg-gray-900/50 flex items-center justify-center p-0 lg:p-12 overflow-hidden border-r-0 lg:border-r border-gray-100 dark:border-gray-700/50">
                    {/* Floating Navigation Buttons */}
                    <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center text-gray-900 dark:text-gray-900 transition-transform active:scale-90"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button
                            onClick={handleToggleSave}
                            className="w-10 h-10 flex items-center justify-center text-gray-900 dark:text-gray-900 transition-transform active:scale-90"
                        >
                            <Bookmark size={24} className={isSaved ? "fill-[#FF5C5C] text-[#FF5C5C]" : "text-gray-400"} />
                        </button>
                    </div>

                    {/* Main Product Image Carousel */}
                    <div className="w-full h-full relative overflow-hidden">
                        <div 
                            id="product-slider"
                            onScroll={handleScroll}
                            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {images.map((img, index) => (
                                <div key={index} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                                    <img
                                        src={img || `${API_BASE_URL}/products/${productId}/image`}
                                        alt={`${product.title} - ${index + 1}`}
                                        className="w-full h-full object-cover lg:max-h-[500px]"
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Pagination Dots */}
                        {images.length > 1 && (
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-30">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollToImage(index)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            currentImageIndex === index 
                                                ? 'w-6 bg-[#2E5A2E] dark:bg-[#CBF9B2]' 
                                                : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {product.unit && (
                            <div className="absolute bottom-4 right-4 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold text-gray-900 dark:text-white normal-case shadow-sm border border-black/5 hidden lg:block">
                                {product.unit}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section (Pull-up on mobile, Right on desktop) */}
                <div className="flex-1 bg-white dark:bg-[#1a1f26] rounded-t-3xl lg:rounded-none -mt-4 lg:mt-0 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] lg:shadow-none px-5 pt-5 pb-5 lg:p-8 lg:flex lg:flex-col lg:justify-center border-t border-transparent dark:border-white/5">
                    <div className="max-w-2xl mx-auto w-full">
                    {/* Header: Title & Unit */}
                    <div className="mb-1 min-w-0">
                        <h1 className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white leading-normal" title={product.title}>
                            {renderBilingualTitle(t(product, 'title') || product.title, language, {
                                mainClassName: 'leading-snug',
                                subClassName: 'text-sm sm:text-base text-gray-600 dark:text-gray-300 font-medium leading-normal mt-0.5 pt-0.5 pb-1',
                                tagClassName: 'inline-flex items-center justify-center text-xs sm:text-sm font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gradient-to-b from-[#FF4B4B] to-[#DC2626] text-white shadow-[0_2.5px_0_#991B1B] border-t border-white/40 tracking-tight leading-none select-none shrink-0 self-center'
                            })}
                        </h1>
                        {product.unit && (
                            <p className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium normal-case mt-0.5">
                                {product.unit}
                            </p>
                        )}
                    </div>

                    {/* Price & Quantity Selector */}
                    <div className="flex items-center justify-between mb-2 mt-3">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center justify-center px-3.5 py-1.5 sm:py-2 rounded-[6px] bg-gradient-to-b from-[#16A34A] to-[#0D7A31] text-white font-black text-xl sm:text-2xl shadow-[0_3px_0_#064e1d] border-t border-white/35 tracking-tight select-none leading-none">
                                    ₹{totalPrice}
                                </div>
                                {isFreeDelivery && (
                                    <span className="inline-block bg-[#E11D48] dark:bg-[#BE123C] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-[4px] shadow-xs select-none">
                                        {t('Free Delivery')}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Minimalist Quantity Selector - Hidden in preview mode */}
                        {!isPreview && (
                            <div className="flex items-center gap-1 bg-gray-100/90 dark:bg-gray-700/90 p-1 rounded-xl shadow-sm">
                                <button
                                    onClick={() => updateQuantity(productId, Math.max(0, quantity - 1))}
                                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <span className="w-7 text-center text-base font-bold text-gray-800 dark:text-gray-100">
                                    {quantity || 0}
                                </span>
                                <button
                                    onClick={handleAddToCart}
                                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:opacity-80 transition-opacity"
                                >
                                    <Plus size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        )}
                    </div>



                    {/* Mentions (Sizes / Variants, e.g. S, M, L, XL - Uniform white cards, selected black with white text) */}
                    {productMentions && productMentions.length > 0 && (
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {productMentions.map((m, idx) => {
                                    const isSel = selectedMention === m;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedMention(isSel ? '' : m)}
                                            className={`min-w-[48px] h-10 px-3.5 flex items-center justify-center rounded-xl text-sm font-semibold transition-all select-none cursor-pointer shadow-xs ${
                                                isSel
                                                    ? 'bg-black text-white border-2 border-black dark:bg-white dark:text-black dark:border-white font-bold'
                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-500'
                                            }`}
                                        >
                                            {m}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Description Section */}
                    <div className="mb-4">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                            {t('Description')}
                        </h2>
                        
                        <div className="space-y-3">
                            {descBlocks.map((block, bIdx) => {
                                if (block.type === 'normal') {
                                    const text = block.content || '';
                                    const lines = text.split('\n').filter(Boolean);
                                    const isLong = lines.length > 7 || text.length > 300;
                                    return (
                                        <div key={bIdx} className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                                            <p className={!isDescriptionExpanded && isLong ? "line-clamp-7 whitespace-pre-line" : "whitespace-pre-line"}>
                                                {text}
                                            </p>
                                            {isLong && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                    className="mt-1 text-gray-900 dark:text-white font-bold text-xs sm:text-sm hover:underline cursor-pointer block"
                                                >
                                                    {isDescriptionExpanded ? t('Read Less') : t('Read More...')}
                                                </button>
                                            )}
                                        </div>
                                    );
                                }

                                if (block.type === 'box') {
                                    const rows = block.rows || [];
                                    if (!rows.length) return null;
                                    return (
                                        <div key={bIdx} className="border border-black/10 dark:border-gray-700 rounded-xl overflow-hidden shadow-xs my-2">
                                            <table className="w-full text-left border-collapse">
                                                <tbody>
                                                    {rows.map((row, rIdx) => (
                                                        <tr key={rIdx} className="border-b border-black/10 dark:border-gray-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                            <td className="w-1/3 py-2 px-3 bg-gray-50/50 dark:bg-gray-900/30 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-black/10 dark:border-gray-700">
                                                                {row.key}
                                                            </td>
                                                            <td className="py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                {row.val}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                }

                                if (block.type === 'card') {
                                    return (
                                        <div key={bIdx} className="p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 text-sm leading-relaxed shadow-xs">
                                            {block.content}
                                        </div>
                                    );
                                }

                                if (block.type === 'point') {
                                    const points = (block.points || []).filter(Boolean);
                                    if (!points.length) return null;
                                    return (
                                        <ul key={bIdx} className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                                            {points.map((pt, pIdx) => (
                                                <li key={pIdx} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white mt-2 shrink-0" />
                                                    <span>{pt}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>

                    {/* Action Button (Reduced size & length, Add Product in preview mode without call button) */}
                    <div className="w-full flex justify-center mt-3 mb-10 pb-4">
                        {!isCurrentlyAvailable && !isPreview ? (
                            <div className="w-[82%] sm:w-[70%] max-w-sm py-3 bg-red-50 dark:bg-red-900/10 rounded-full border border-red-100 dark:border-red-800 text-center">
                                <p className="text-red-600 dark:text-red-400 font-bold text-sm">
                                     {!isStoreCurrentlyOpen ? t('Store Closed') : t('Currently Unavailable')}
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleCheckout}
                                className="w-[82%] sm:w-[70%] max-w-sm bg-black text-white py-2.5 sm:py-3 px-6 rounded-full font-bold text-sm sm:text-base active:scale-[0.98] transition-transform flex items-center justify-center shadow-md hover:bg-gray-900 cursor-pointer"
                            >
                                <span>{t('Add product')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default ProductDetails;

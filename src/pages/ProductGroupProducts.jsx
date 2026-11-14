import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useProducts } from '../hooks/queries/useProducts';
import { useLanguage } from '../context/LanguageContext';
import { safeNavigateBack, registerModalBackHandler, safeNavigateBackFromGroup } from '../utils/useBackButton';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import SimpleProductCard from '../components/SimpleProductCard';
import ProductCard from '../components/ProductCard';
import PullToRefreshLayout from '../components/PullToRefreshLayout';
import { ArrowLeft, ShoppingCart, Zap } from 'lucide-react';
import { isStoreOpen, isProductScheduled } from '../utils/storeHelpers';
import { safeDecodeURIComponent } from '../utils/categoryHelpers';
import { useStores } from '../hooks/queries/useStores';

const ProductGroupProducts = () => {
    const { productName } = useParams();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { fastMode, toggleFastMode } = useData();
    const { cartItems } = useCart();
    const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Fetch stores for status check
    const { data: rawStores = [] } = useStores();
    const stores = Array.isArray(rawStores) ? rawStores : (rawStores?.data || []);

    // Fetch all products - we catch them from cache/query
    const { data: rawProducts = [], isLoading } = useProducts();
    const products = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

    // Filter products by name (case-insensitive)
    const decodedName = safeDecodeURIComponent(productName);

    const storeIdParam = searchParams.get('storeId');

    const groupProducts = products
        .filter(product => {
            const productTitle = (product.title || '').trim();
            const searchTitle = decodedName.trim();
            const isExactTitleSearch = searchTitle.includes('(');

            let matchesName;
            if (isExactTitleSearch) {
                const exactMatch = productTitle.toLowerCase() === searchTitle.toLowerCase();

                if (!exactMatch) {
                    const searchBase = searchTitle.substring(0, searchTitle.indexOf('(')).trim().toLowerCase();
                    const searchBracket = searchTitle.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';

                    const productBase = productTitle.split('(')[0].trim().toLowerCase();
                    const productBracketFromTitle = productTitle.match(/\(([^)]+)\)/)?.[1]?.toLowerCase() || '';
                    const productBracketFromUnit = (product.unit || '').toLowerCase();

                    matchesName = productBase === searchBase &&
                        (productBracketFromTitle === searchBracket || productBracketFromUnit === searchBracket);
                } else {
                    matchesName = true;
                }
            } else {
                const baseProductTitle = productTitle.split('(')[0].trim().toLowerCase();
                matchesName = baseProductTitle === searchTitle.toLowerCase();
            }

            // Consistent availability check (Manual only — timed products show overlay on card)
            if (product.isAvailable === false) return false;

            // Apply storeId filter when present in the URL.
            let matchesStore = true;
            if (storeIdParam) {
                const pStoreId = product.storeId?._id || product.storeId;
                matchesStore = pStoreId && (String(pStoreId) === String(storeIdParam));
            }

            return matchesName && matchesStore;
        })
        .sort((a, b) => {
            const storeA = stores.find(s => (s._id || s.id) === (a.storeId?._id || a.storeId));
            const storeB = stores.find(s => (s._id || s.id) === (b.storeId?._id || b.storeId));
            const isOpenA = storeA ? isStoreOpen(storeA) : true;
            const isOpenB = storeB ? isStoreOpen(storeB) : true;
            if (isOpenA && !isOpenB) return -1;
            if (!isOpenA && isOpenB) return 1;
            return Number(a.price) - Number(b.price);
        });

    // Resolved page title
    const pageTitle = (() => {
        const fullTitle = t(decodedName);
        const bracketIndex = fullTitle.indexOf('(');
        let mainTitle = fullTitle;
        let bracketText = '';

        if (bracketIndex !== -1) {
            mainTitle = fullTitle.substring(0, bracketIndex).trim();
            bracketText = fullTitle.substring(bracketIndex).trim();
        } else {
            const firstProduct = groupProducts[0];
            if (firstProduct) {
                const pTitle = firstProduct.title || '';
                const pTitleTa = firstProduct.title_ta || '';
                const bMatch = pTitle.match(/\(([^)]+)\)/);
                if (bMatch) bracketText = bMatch[0];
                else if (pTitleTa && pTitleTa !== pTitle) bracketText = `(${pTitleTa})`;
            }
        }

        return `${mainTitle} ${bracketText || ''}`.trim();
    })();

    const handleBack = () => {
        const fallback = storeIdParam ? `/store/${storeIdParam}` : '/';
        safeNavigateBackFromGroup(navigate, fallback);
    };

    // Hardware back button handler: reliably returns to the exact prior page
    useEffect(() => {
        const fallback = storeIdParam ? `/store/${storeIdParam}` : '/';
        const unregister = registerModalBackHandler(() => {
            safeNavigateBackFromGroup(navigate, fallback);
        });
        return unregister;
    }, [navigate, storeIdParam]);

    return (
        <PullToRefreshLayout>
            <div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200 w-full relative">

                {/* Premium Attached Header */}
                <div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden">
                    {/* Decorative blur blob */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[38px]">

                            {/* Back button */}
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={handleBack}
                                    className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50"
                                >
                                    <ArrowLeft size={19} />
                                </button>
                            </div>

                            {/* Centered title */}
                            <div className="flex flex-col items-center text-center px-14 min-w-0">
                                <h1 className="text-gray-900 text-[14.5px] font-bold tracking-tight truncate w-full leading-tight">
                                    {pageTitle}
                                </h1>
                                {groupProducts.length > 0 && (
                                    <p className="text-gray-700 text-[10px] font-semibold mt-0.5">
                                        {groupProducts.length} {t('options')}
                                    </p>
                                )}
                            </div>

                            {/* Cart icon */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Link
                                    to="/cart"
                                    className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 relative"
                                >
                                    <ShoppingCart size={19} className="text-[#2E5A2E]" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-[18px] w-[18px] rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-[88px] pb-6">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between space-y-2.5 h-full">
                                    <div className="aspect-square w-full rounded-xl blinkit-shimmer"></div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="h-3.5 w-full rounded-lg blinkit-shimmer"></div>
                                        <div className="h-3 w-2/3 rounded-lg blinkit-shimmer"></div>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                        <div className="h-5 w-14 rounded-md blinkit-shimmer"></div>
                                        <div className="h-8 w-8 rounded-full blinkit-shimmer"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : groupProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
                            {groupProducts.map(product => (
                                <ProductCard
                                    key={product._id || product.id}
                                    product={product}
                                    showCartControls={true}
                                    stores={stores}
                                    largeControls={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <span className="text-4xl">🛍️</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('No products found')}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {t('We couldn\'t find any products with this name.')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </PullToRefreshLayout>
    );
};

export default ProductGroupProducts;

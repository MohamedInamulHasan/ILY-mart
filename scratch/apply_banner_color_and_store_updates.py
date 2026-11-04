import re

# 1. Update CategorySection.jsx:
# Set full round color to the ILY mart banner color (#2E5A2E), no outline
with open('src/components/home/CategorySection.jsx', 'r', encoding='utf-8') as f:
    cat = f.read()

# Replace bg-[#00B329] with bg-[#2E5A2E]
cat = cat.replace("bg-[#00B329] dark:bg-[#00B329]", "bg-[#2E5A2E] dark:bg-[#2E5A2E]")
cat = cat.replace("text-[#00B329] dark:text-[#00B329]", "text-[#2E5A2E] dark:text-[#CBF9B2]")

with open('src/components/home/CategorySection.jsx', 'w', encoding='utf-8') as f:
    f.write(cat)
print("Updated CategorySection.jsx: selected round is now #2E5A2E (ILY mart banner color), no outline!")

# 2. Update Home.jsx:
# Make categories filter by available products as before, but ensure it appears correctly without the flashing/jumping
with open('src/pages/Home.jsx', 'r', encoding='utf-8') as f:
    home = f.read()

# Logic: compute featuredCategories from rawCategories filtered by rawProducts.
# If products are still loading, isLoadingAll is true so CategorySection shows shimmer.
# When ready, it renders directly with only the categories that have products.
old_featured = """    // Categories appear stably without jumping or delayed 'correcting'
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        return raw.filter(cat => !cat.isHidden);
    }, [rawCategories]);"""

new_featured = """    // Filter categories by products (as before), stably rendered once data is ready
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

        if (raw.length === 0) return [];
        if (loadingProducts || allProducts.length === 0) {
            // While products are still loading, don't flash unfiltered categories
            return [];
        }

        const productCategories = new Set(allProducts.map(p => p.category?.toLowerCase()));
        return raw.filter(cat => !cat.isHidden && productCategories.has(cat.name?.toLowerCase()));
    }, [rawCategories, rawProducts, loadingProducts]);"""

if old_featured in home:
    home = home.replace(old_featured, new_featured)
else:
    print("Warning: old_featured block not matched directly, check Home.jsx")

# Also ensure CategorySection receives isLoading={loadingCategories || loadingProducts}
home = home.replace(
    "isLoading={loadingCategories}",
    "isLoading={loadingCategories || loadingProducts}"
)

with open('src/pages/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(home)
print("Updated Home.jsx: categories filter by products without appearing and then correcting!")

# 3. Update Shop.jsx: Remove PullToRefreshLayout
with open('src/pages/Shop.jsx', 'r', encoding='utf-8') as f:
    shop = f.read()

shop = shop.replace("import PullToRefreshLayout from '../components/PullToRefreshLayout';\n", "")
shop = shop.replace("import PullToRefreshLayout from '../components/PullToRefreshLayout';", "")
shop = shop.replace("<PullToRefreshLayout>", "")
shop = shop.replace("</PullToRefreshLayout>", "")

with open('src/pages/Shop.jsx', 'w', encoding='utf-8') as f:
    f.write(shop)
print("Updated Shop.jsx: removed scroll refresh (PullToRefreshLayout)!")

# 4. Update StoreCard.jsx to look like ServiceCard
new_store_card = """import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { isStoreOpen, getStoreTimeLabel } from '../utils/storeHelpers';
import { API_BASE_URL } from '../utils/api';

const StoreCard = ({ store }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const isOpen = isStoreOpen(store);
    const timeLabel = getStoreTimeLabel(store);

    const handleVisit = () => {
        if (isOpen) {
            navigate(`/store/${store._id || store.id}`);
        }
    };

    return (
        <div 
            onClick={handleVisit}
            className={`group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden transition-all duration-300 aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full cursor-pointer shadow-sm hover:shadow-md ${!isOpen ? 'cursor-not-allowed' : ''}`}
        >
            {/* Full Background Image */}
            <div className={`absolute inset-0 z-0 ${!isOpen ? 'opacity-60' : ''}`}>
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700" />
                <img
                    src={store.image || `${API_BASE_URL}/stores/${store._id || store.id}/image`}
                    alt={store.name}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 z-10"
                    loading="lazy"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/800x450?text=Store";
                    }}
                />
                
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 z-10" />
            </div>

            {/* Category Tag Overlay (Top Left) like service card */}
            {store.category && (
                <div className="absolute top-3 left-3 z-20">
                    <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9.5px] font-bold rounded-full uppercase tracking-[0.15em] shadow-lg">
                        {store.category}
                    </span>
                </div>
            )}

            {/* Timing Badge (Top Right) */}
            {timeLabel && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full shadow-md">
                    <Clock size={9} className="flex-shrink-0 opacity-80" />
                    <span className="text-[9px] font-bold tracking-tight leading-none">{timeLabel}</span>
                </div>
            )}

            {/* Closed Status Overlay */}
            {!isOpen && (
                <div className="absolute inset-0 z-30 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in-95 duration-500">
                        {t('Closed')}
                    </span>
                </div>
            )}

            {/* Content Section - White Banner Strip at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 py-2 px-3.5 z-20 overflow-hidden">
                {/* Solid White Banner Strip */}
                <div className="absolute inset-0 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700" />
                
                <div className="relative z-10">
                    <h3 className={`text-gray-900 dark:text-white text-[15px] font-semibold tracking-tight leading-tight mb-0.5 truncate pr-8 ${!isOpen ? 'opacity-60' : ''}`}>
                        {t(store, 'name')}
                    </h3>
                    <div className="flex items-center gap-1.5 opacity-90">
                        <MapPin size={10} className="text-[#2E5A2E] dark:text-[#CBF9B2] flex-shrink-0" />
                        <p className="text-gray-500 dark:text-gray-400 text-[11px] font-normal truncate">
                            {store.address || t('No address')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Action Arrow in bottom strip */}
            <div className={`absolute bottom-2.5 right-3 z-30 transition-all duration-300 ${!isOpen ? 'opacity-0 scale-50' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900 flex items-center justify-center scale-90 group-hover:scale-105 active:scale-90 transition-all shadow-sm">
                    <ArrowRight size={15} />
                </div>
            </div>
        </div>
    );
};

export default StoreCard;
"""

with open('src/components/StoreCard.jsx', 'w', encoding='utf-8') as f:
    f.write(new_store_card)
print("Updated StoreCard.jsx: styled exactly like service cards!")

# 5. Fix black outline on input fields:
# Update index.css
with open('src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

old_outline_css = """/* Remove unwanted default browser outline boxes, tap highlights and focus rings */
a, button, input, textarea, select {
    -webkit-tap-highlight-color: transparent !important;
}
a:focus, a:focus-visible, a:active,
button:focus, button:focus-visible, button:active,
input:focus, input:focus-visible, input:active,
textarea:focus, textarea:focus-visible, textarea:active,
select:focus, select:focus-visible, select:active {
    outline: none !important;
    box-shadow: none !important;
    -webkit-tap-highlight-color: transparent !important;
}"""

new_outline_css = """/* Remove unwanted default browser outline boxes, tap highlights and focus rings */
*, *::before, *::after {
    -webkit-tap-highlight-color: transparent !important;
}

input, textarea, select, button {
    outline: none !important;
    outline-color: transparent !important;
    outline-style: none !important;
    outline-width: 0 !important;
    box-shadow: none;
    -webkit-tap-highlight-color: transparent !important;
}

input:focus, input:focus-visible, input:active,
textarea:focus, textarea:focus-visible, textarea:active,
select:focus, select:focus-visible, select:active,
button:focus, button:focus-visible, button:active,
a:focus, a:focus-visible, a:active {
    outline: none !important;
    outline-color: transparent !important;
    outline-style: none !important;
    outline-width: 0 !important;
    box-shadow: none !important;
    -webkit-tap-highlight-color: transparent !important;
}"""

if old_outline_css in css:
    css = css.replace(old_outline_css, new_outline_css)
else:
    print("Warning: old_outline_css not matched directly in index.css")

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated index.css: completely disabled black outline on all input fields!")

# Also remove focus:ring-2 focus:ring-gray-200 in EditAddress.jsx and Checkout.jsx
with open('src/pages/EditAddress.jsx', 'r', encoding='utf-8') as f:
    ea = f.read()
ea = ea.replace("focus:ring-2 focus:ring-gray-200", "focus:ring-0 focus:border-[#2E5A2E]")
with open('src/pages/EditAddress.jsx', 'w', encoding='utf-8') as f:
    f.write(ea)

with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    chk = f.read()
chk = chk.replace("focus:ring-2 focus:ring-gray-200", "focus:ring-0 focus:border-[#2E5A2E]")
with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(chk)
print("Updated EditAddress.jsx and Checkout.jsx: replaced focus:ring-gray-200 with clean focus:ring-0!")


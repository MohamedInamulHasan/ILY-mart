# -*- coding: utf-8 -*-
import sys

# 1. HomeHeader.jsx
with open('src/components/home/HomeHeader.jsx', 'r', encoding='utf-8') as f:
    hh = f.read()

hh_target = '''        <header className="flex items-center justify-between px-4 py-2 bg-transparent transition-colors duration-200">
            {/* Location Selector */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50">
                    <MapPin className="text-red-500 dark:text-red-500" size={20} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-wider">{t('Delivery to')}</span>
                    <Link to="/edit-address" className="flex items-center gap-1 group cursor-pointer border-b border-dashed border-gray-400 dark:border-gray-600 max-w-[180px]">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-900 truncate">{displayAddress}</span>
                        <ChevronDown size={14} className="text-gray-600 dark:text-gray-700" />
                    </Link>
                </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3">
                <Link 
                    to="/cart"
                    className="w-10 h-10 bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 relative hover:bg-gray-50 dark:hover:bg-white/70 transition-all active:scale-95"
                >
                    <ShoppingCart size={20} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-gray-800">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>'''

hh_replace = '''        <header className="flex items-center justify-between px-2 sm:px-4 py-0 bg-transparent transition-colors duration-200 min-h-[42px]">
            {/* Location Selector */}
            <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 shadow-sm transition-transform active:scale-95 flex-shrink-0">
                    <MapPin className="text-red-500 dark:text-red-500" size={22} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-gray-700 dark:text-gray-700 font-semibold uppercase tracking-wider leading-tight">{t('Delivery to')}</span>
                    <Link to="/edit-address" className="flex items-center gap-1 group cursor-pointer border-b border-dashed border-gray-400 dark:border-gray-600 max-w-[190px] sm:max-w-[260px] mt-0.5">
                        <span className="text-[16px] sm:text-[17px] font-bold text-gray-900 dark:text-gray-900 truncate leading-tight">{displayAddress}</span>
                        <ChevronDown size={15} className="text-gray-600 dark:text-gray-700 flex-shrink-0" />
                    </Link>
                </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3">
                <Link 
                    to="/cart"
                    className="w-[42px] h-[42px] bg-white dark:bg-white/80 rounded-full flex items-center justify-center border border-black/5 dark:border-gray-200/50 relative hover:bg-gray-50 dark:hover:bg-white/70 shadow-sm transition-all active:scale-95 flex-shrink-0"
                >
                    <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>'''

assert hh_target in hh, "hh_target not found in HomeHeader.jsx"
hh = hh.replace(hh_target, hh_replace)
with open('src/components/home/HomeHeader.jsx', 'w', encoding='utf-8') as f:
    f.write(hh)
print('HomeHeader.jsx updated')

# 2. Home.jsx
with open('src/pages/Home.jsx', 'r', encoding='utf-8') as f:
    home = f.read()

home_target = '<div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-2 pt-2 pb-3 overflow-hidden">'
home_replace = '<div className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">'
assert home_target in home, "home_target not found in Home.jsx"
home = home.replace(home_target, home_replace)
with open('src/pages/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(home)
print('Home.jsx updated')

# 3. Shop.jsx
with open('src/pages/Shop.jsx', 'r', encoding='utf-8') as f:
    shop = f.read()

shop_target = '<div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-2 pt-2 pb-3 shadow-sm overflow-hidden">'
shop_replace = '<div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">'
assert shop_target in shop, "shop_target not found in Shop.jsx"
shop = shop.replace(shop_target, shop_replace)
with open('src/pages/Shop.jsx', 'w', encoding='utf-8') as f:
    f.write(shop)
print('Shop.jsx updated')

# 4. Profile.jsx
with open('src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    prof = f.read()

prof_target = '''            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2rem] px-4 pt-3.5 pb-3.5 shadow-sm overflow-hidden flex-shrink-0 relative">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="w-full px-2 relative flex items-center justify-center min-h-[38px]">
                        <div className="absolute left-1 top-1/2 -translate-y-1/2">
                            <button onClick={() => navigate(-1)} className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50">
                                <ArrowLeft size={20} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">{t('Profile')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Manage account')}</p>
                        </div>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => navigate('/cart')}
                                className="w-[38px] h-[38px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                            >
                                <ShoppingCart size={20} className="text-gray-700 dark:text-gray-800" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>'''

prof_replace = '''            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden flex-shrink-0 relative">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/30 dark:bg-[#CBF9B2]/20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={() => navigate(-1)} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50">
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('Profile')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Manage account')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => navigate('/cart')}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                            >
                                <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>'''

assert prof_target in prof, "prof_target not found in Profile.jsx"
prof = prof.replace(prof_target, prof_replace)
with open('src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(prof)
print('Profile.jsx updated')

# 5. Services.jsx
with open('src/pages/Services.jsx', 'r', encoding='utf-8') as f:
    srv = f.read()

# Add ShoppingCart and useCart to imports if not present
if 'ShoppingCart' not in srv:
    srv = srv.replace("import { ArrowLeft,", "import { ArrowLeft, ShoppingCart,")
if 'useCart' not in srv:
    srv = srv.replace("import { useLanguage } from '../context/LanguageContext';", "import { useLanguage } from '../context/LanguageContext';\nimport { useCart } from '../context/CartContext';")
if 'const { cartCount } = useCart();' not in srv:
    srv = srv.replace("const { t } = useLanguage();", "const { t } = useLanguage();\n    const { cartCount } = useCart();")

srv_target = '''                    <div className="relative z-10">
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
                    </div>'''

srv_replace = '''                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => viewMode === 'details' ? handleBackToList() : navigate(-1)} 
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            
                            <div className="flex flex-col items-center text-center px-12 min-w-0">
                                <h1 className="text-[18px] font-bold text-gray-900 dark:text-gray-900 tracking-tight leading-tight truncate">
                                    {viewMode === 'details' && activeService ? activeService.name : t('Premium Services')}
                                </h1>
                                <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-700 mt-0.5 truncate">
                                    {viewMode === 'details' && activeService ? activeService.category : t('Professional help at your doorstep')}
                                </p>
                            </div>

                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate('/cart')}
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                                >
                                    <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>'''

assert srv_target in srv, "srv_target not found in Services.jsx"
srv = srv.replace(srv_target, srv_replace)
with open('src/pages/Services.jsx', 'w', encoding='utf-8') as f:
    f.write(srv)
print('Services.jsx updated')

# 6. ProductGroupProducts.jsx
with open('src/pages/ProductGroupProducts.jsx', 'r', encoding='utf-8') as f:
    pgp = f.read()

pgp_target = '''                    <div className="relative z-10">
                        <div className="max-w-7xl mx-auto px-2 relative min-h-[42px]">

                            {/* Back button */}
                            <button
                                onClick={() => navigate(-1)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 z-10"
                            >
                                <ArrowLeft size={22} />
                            </button>

                            {/* Centered title */}
                            <div className="flex flex-col items-center text-center px-14 pt-1 min-w-0">
                                <h1 className="text-gray-900 text-[14.5px] sm:text-[16px] font-bold tracking-tight truncate w-full leading-tight">
                                    {pageTitle}
                                </h1>
                                {groupProducts.length > 0 && (
                                    <p className="text-[#2E5A2E] text-[11px] font-semibold mt-0.5">
                                        {groupProducts.length} {t('options')}
                                    </p>
                                )}
                            </div>

                            {/* Cart icon */}
                            <Link
                                to="/cart"
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 z-10"
                            >
                                <ShoppingCart size={22} className="text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                        </div>
                    </div>'''

pgp_replace = '''                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">

                            {/* Back button */}
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>

                            {/* Centered title */}
                            <div className="flex flex-col items-center text-center px-14 min-w-0">
                                <h1 className="text-gray-900 text-[18px] font-bold tracking-tight truncate w-full leading-tight">
                                    {pageTitle}
                                </h1>
                                {groupProducts.length > 0 && (
                                    <p className="text-gray-700 text-[11px] font-semibold mt-0.5">
                                        {groupProducts.length} {t('options')}
                                    </p>
                                )}
                            </div>

                            {/* Cart icon */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Link
                                    to="/cart"
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 relative"
                                >
                                    <ShoppingCart size={22} className="text-[#2E5A2E]" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>

                        </div>
                    </div>'''

assert pgp_target in pgp, "pgp_target not found in ProductGroupProducts.jsx"
pgp = pgp.replace(pgp_target, pgp_replace)
with open('src/pages/ProductGroupProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(pgp)
print('ProductGroupProducts.jsx updated')

# 7. CategoryProducts.jsx
with open('src/pages/CategoryProducts.jsx', 'r', encoding='utf-8') as f:
    cat = f.read()

cat_target = '''                    <div className="relative z-10">
                        <div className="max-w-2xl mx-auto px-2 relative flex items-center justify-center min-h-[42px]">
                            <button
                                onClick={() => navigate(-1)}
                                className="absolute left-4 w-10 h-10 flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50 flex-shrink-0 z-10"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex flex-col items-center text-center px-16 min-w-0">
                                <h1 className="text-gray-900 dark:text-gray-900 text-[18px] font-bold tracking-tight truncate w-full">
                                    {(() => {
                                        const fullName = t(categoryName);
                                        const bracketIndex = fullName.indexOf('(');
                                        if (bracketIndex !== -1) {
                                            const mainName = fullName.substring(0, bracketIndex).trim();
                                            const bracketPart = fullName.substring(bracketIndex).trim();
                                            return `${mainName} ${bracketPart}`;
                                        }
                                        return fullName;
                                    })()}
                                </h1>
                                <p className="text-[10px] text-gray-500 dark:text-gray-600 font-medium truncate w-full uppercase tracking-wider">{displayProducts.length} {t('Products Available')}</p>
                            </div>
                            <Link 
                                to="/cart"
                                className="absolute right-4 w-10 h-10 flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50 flex-shrink-0 z-10"
                            >
                                <ShoppingCart size={20} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>'''

cat_replace = '''                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center text-center px-14 min-w-0">
                                <h1 className="text-gray-900 dark:text-gray-900 text-[18px] font-bold tracking-tight truncate w-full leading-tight">
                                    {(() => {
                                        const fullName = t(categoryName);
                                        const bracketIndex = fullName.indexOf('(');
                                        if (bracketIndex !== -1) {
                                            const mainName = fullName.substring(0, bracketIndex).trim();
                                            const bracketPart = fullName.substring(bracketIndex).trim();
                                            return `${mainName} ${bracketPart}`;
                                        }
                                        return fullName;
                                    })()}
                                </h1>
                                <p className="text-[11px] text-gray-700 dark:text-gray-700 font-semibold truncate w-full mt-0.5">{displayProducts.length} {t('Products Available')}</p>
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Link 
                                    to="/cart"
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50 relative"
                                >
                                    <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                        </div>
                    </div>'''

assert cat_target in cat, "cat_target not found in CategoryProducts.jsx"
cat = cat.replace(cat_target, cat_replace)
with open('src/pages/CategoryProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(cat)
print('CategoryProducts.jsx updated')

# 8. StoreProducts.jsx
with open('src/pages/StoreProducts.jsx', 'r', encoding='utf-8') as f:
    sp = f.read()

sp_target = '''                    <div className="relative z-10">
                        <div className="w-full px-2 relative flex items-center justify-center min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate(-1)} 
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center text-center px-12 min-w-0">
                                <h1 className="text-[15px] sm:text-[16px] font-bold text-gray-900 tracking-tight leading-tight truncate max-w-[240px] sm:max-w-[340px]">{store?.name}</h1>
                                {store?.address && (
                                    <div className="flex items-center justify-center gap-1 mt-0.5 max-w-[240px] sm:max-w-[340px] truncate">
                                        <MapPin size={10} className="text-[#2E5A2E] flex-shrink-0" />
                                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-700 truncate">{store?.address}</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate('/cart')}
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                                >
                                    <ShoppingCart size={22} className="text-gray-700 dark:text-gray-800" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>'''

sp_replace = '''                    <div className="relative z-10">
                        <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate(-1)} 
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50 dark:border-gray-200/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center text-center px-12 min-w-0">
                                <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight truncate max-w-[240px] sm:max-w-[340px]">{store?.name}</h1>
                                {store?.address && (
                                    <div className="flex items-center justify-center gap-1 mt-0.5 max-w-[240px] sm:max-w-[340px] truncate">
                                        <MapPin size={11} className="text-[#2E5A2E] flex-shrink-0" />
                                        <p className="text-[11px] font-semibold text-gray-700 truncate">{store?.address}</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={() => navigate('/cart')}
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 dark:text-gray-900 transition-transform active:scale-95 shadow-sm border border-black/5 dark:border-gray-200/50 relative"
                                >
                                    <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#2E5A2E]" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>'''

assert sp_target in sp, "sp_target not found in StoreProducts.jsx"
sp = sp.replace(sp_target, sp_replace)
with open('src/pages/StoreProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(sp)
print('StoreProducts.jsx updated')

# 9. Cart.jsx
with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
    cart_page = f.read()

cart_target1 = '''                        <div className="max-w-7xl mx-auto px-2 relative min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={handleBackNav} 
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            <div className="flex flex-col items-center text-center pt-1">
                                <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                                <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Your selected items')}</p>
                            </div>
                        </div>'''

cart_replace1 = '''                        <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                <button 
                                    onClick={handleBackNav} 
                                    className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </div>
                            <div className="flex flex-col text-center">
                                <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                                <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{t('Your selected items')}</p>
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <div className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full shadow-sm border border-gray-100/50">
                                    <ShoppingCart size={22} className="text-[#2E5A2E]" />
                                </div>
                            </div>
                        </div>'''

cart_target2 = '''                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={handleBackNav} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50">
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{cartItems.length} {t('items')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full shadow-sm border border-gray-100/50">
                                <ShoppingCart size={20} className="text-[#2E5A2E]" />
                            </div>
                        </div>
                    </div>'''

cart_replace2 = '''                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button onClick={handleBackNav} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full text-gray-900 transition-transform active:scale-95 shadow-sm border border-gray-100/50">
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 tracking-tight leading-tight">{t('Cart')}</h1>
                            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{cartItems.length} {t('items')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <div className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-white/80 rounded-full shadow-sm border border-gray-100/50">
                                <ShoppingCart size={22} className="text-[#2E5A2E]" />
                            </div>
                        </div>
                    </div>'''

assert cart_target1 in cart_page, "cart_target1 not in Cart.jsx"
assert cart_target2 in cart_page, "cart_target2 not in Cart.jsx"
cart_page = cart_page.replace(cart_target1, cart_replace1).replace(cart_target2, cart_replace2)
with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
    f.write(cart_page)
print('Cart.jsx updated')

# 10. Checkout.jsx
with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    chk = f.read()

chk_target = '''            {/* White Header matching Orders List Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden border-b border-gray-100 dark:border-gray-700/60">
                <div className="relative z-10">
                    <div className="max-w-md mx-auto px-2 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-200/60 dark:border-gray-600"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{t('Checkout')}</h1>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{t('Shipping & Payment')}</p>
                        </div>
                    </div>
                </div>
            </div>'''

chk_replace = '''            {/* White Header matching Orders List Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden border-b border-gray-100 dark:border-gray-700/60">
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-200/60 dark:border-gray-600"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{t('Checkout')}</h1>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{t('Shipping & Payment')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button
                                type="button"
                                onClick={() => navigate('/cart')}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-200/60 dark:border-gray-600 relative"
                            >
                                <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>'''

assert chk_target in chk, "chk_target not in Checkout.jsx"
chk = chk.replace(chk_target, chk_replace)
with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(chk)
print('Checkout.jsx updated')

# 11. OrderConfirmation.jsx
with open('src/pages/OrderConfirmation.jsx', 'r', encoding='utf-8') as f:
    conf = f.read()

# Add ShoppingCart if not present
if 'ShoppingCart' not in conf:
    conf = conf.replace("import { CheckCircle, ArrowLeft,", "import { CheckCircle, ArrowLeft, ShoppingCart,")

conf_target = '''            {/* White Header matching Orders List Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden border-b border-gray-100 dark:border-gray-700/60">
                <div className="relative z-10">
                    <div className="max-w-3xl mx-auto px-2 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (showSuccessModal || createdOrderId) {
                                        navigate('/', { replace: true });
                                    } else {
                                        navigate(-1);
                                    }
                                }} 
                                className="w-[42px] h-[42px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-200/60 dark:border-gray-600"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{t('Confirmation')}</h1>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{t('Order Summary')}</p>
                        </div>
                    </div>
                </div>
            </div>'''

conf_replace = '''            {/* White Header matching Orders List Header */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white dark:bg-gray-800 rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden border-b border-gray-100 dark:border-gray-700/60">
                <div className="relative z-10">
                    <div className="w-full px-4 relative flex items-center justify-center min-h-[42px]">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2">
                            <button 
                                type="button"
                                onClick={() => {
                                    if (showSuccessModal || createdOrderId) {
                                        navigate('/', { replace: true });
                                    } else {
                                        navigate(-1);
                                    }
                                }} 
                                className="w-[42px] h-[42px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-200/60 dark:border-gray-600"
                            >
                                <ArrowLeft size={22} />
                            </button>
                        </div>
                        <div className="flex flex-col text-center">
                            <h1 className="text-[18px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{t('Confirmation')}</h1>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{t('Order Summary')}</p>
                        </div>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button 
                                type="button"
                                onClick={() => navigate('/cart')}
                                className="w-[42px] h-[42px] flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full text-gray-900 dark:text-white transition-transform active:scale-95 shadow-sm border border-gray-200/60 dark:border-gray-600 relative"
                            >
                                <ShoppingCart size={22} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>'''

assert conf_target in conf, "conf_target not in OrderConfirmation.jsx"
conf = conf.replace(conf_target, conf_replace)
with open('src/pages/OrderConfirmation.jsx', 'w', encoding='utf-8') as f:
    f.write(conf)
print('OrderConfirmation.jsx updated')


# -*- coding: utf-8 -*-
import sys

# 1. EditAddress.jsx
with open('src/pages/EditAddress.jsx', 'r', encoding='utf-8') as f:
    addr = f.read()

target1 = """            const result = await updateProfile(profileData, config);
            if (result) {
                // Update local auth state with returned data
                setUser(result);
                localStorage.setItem('userInfo', JSON.stringify(result));
                setMessage({ type: 'success', text: t('Address updated successfully!') });
                setTimeout(() => navigate('/profile'), 1500);
            }"""
replace1 = """            const result = await updateProfile(profileData, config);
            if (result) {
                // Update local auth state with returned data
                setUser(result);
                localStorage.setItem('userInfo', JSON.stringify(result));
                navigate('/profile');
            }"""

target2 = """                {/* Status Message */}
                {message.text && (
                    <div className={`mb-3.5 p-3 sm:p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                        <span className="text-sm font-semibold">{message.text}</span>
                    </div>
                )}"""
replace2 = """                {/* Status Message (errors only) */}
                {message.text && message.type === 'error' && (
                    <div className="mb-3.5 p-3 sm:p-3.5 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 bg-red-50 text-red-700 border border-red-100">
                        <AlertCircle size={18} />
                        <span className="text-sm font-semibold">{message.text}</span>
                    </div>
                )}"""

assert target1 in addr, "target1 not in EditAddress.jsx"
assert target2 in addr, "target2 not in EditAddress.jsx"
addr = addr.replace(target1, replace1).replace(target2, replace2)
with open('src/pages/EditAddress.jsx', 'w', encoding='utf-8') as f:
    f.write(addr)
print('EditAddress.jsx updated')

# 2. PullToRefreshLayout.jsx
with open('src/components/PullToRefreshLayout.jsx', 'r', encoding='utf-8') as f:
    ptr = f.read()
assert '<div className="min-h-screen">' in ptr, "min-h-screen not in PullToRefreshLayout.jsx"
ptr = ptr.replace('<div className="min-h-screen">', '<div className="w-full">')
with open('src/components/PullToRefreshLayout.jsx', 'w', encoding='utf-8') as f:
    f.write(ptr)
print('PullToRefreshLayout.jsx updated')

# 3. Shop.jsx
with open('src/pages/Shop.jsx', 'r', encoding='utf-8') as f:
    shop = f.read()
shop_target = '<div className="flex-1 min-h-[calc(100vh-8rem)] md:min-h-0 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200">'
assert shop_target in shop, "shop_target not in Shop.jsx"
shop = shop.replace(
    shop_target,
    '<div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full">'
)
with open('src/pages/Shop.jsx', 'w', encoding='utf-8') as f:
    f.write(shop)
print('Shop.jsx updated')

# 4. Orders.jsx
with open('src/pages/Orders.jsx', 'r', encoding='utf-8') as f:
    orders = f.read()
orders_target = '<div className="flex-1 min-h-[calc(100vh-8rem)] md:min-h-0 bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative pb-8">'
assert orders_target in orders, "orders_target not in Orders.jsx"
orders = orders.replace(
    orders_target,
    '<div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative">'
)
with open('src/pages/Orders.jsx', 'w', encoding='utf-8') as f:
    f.write(orders)
print('Orders.jsx updated')

# 5. App.jsx
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    app = f.read()
app_target = "showMobileFooter && location.pathname !== '/profile' ? 'pb-32 md:pb-0 md:pr-28' : ''"
assert app_target in app, "app_target not in App.jsx"
app = app.replace(
    app_target,
    "showMobileFooter && location.pathname !== '/profile' ? 'pb-24 md:pb-0 md:pr-28' : ''"
)
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(app)
print('App.jsx updated')

# 6. Checkout.jsx Header
with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    chk = f.read()

chk_target = """            {/* Simple Header */}
            <div className="w-full px-5 py-4">
                <div className="max-w-md mx-auto flex items-center justify-between">
                     <button onClick={() => navigate(-1)} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-900 dark:text-white transition-transform active:scale-95 border border-gray-100/50">
                         <ArrowLeft size={22} />
                     </button>
                     <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">{t('Checkout')}</h1>
                     <div className="w-[42px]" /> 
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

chk_replace = """            {/* White Header matching Orders List Header */}
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
            </div>

            <div className="pt-[86px] sm:pt-[88px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

assert chk_target in chk, "chk_target not in Checkout.jsx"
chk = chk.replace(chk_target, chk_replace)
with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(chk)
print('Checkout.jsx updated')

# 7. OrderConfirmation.jsx Header
with open('src/pages/OrderConfirmation.jsx', 'r', encoding='utf-8') as f:
    conf = f.read()

conf_target = """            {/* Simple Header */}
            <div className="w-full px-5 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={() => {
                            if (showSuccessModal || createdOrderId) {
                                navigate('/', { replace: true });
                            } else {
                                navigate(-1);
                            }
                        }} 
                        className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-900 dark:text-white transition-transform active:scale-95 border border-gray-100/50"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight">{t('Confirmation')}</h1>
                    <div className="w-[42px]" />
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-3.5 sm:px-5 lg:px-6 space-y-3 sm:space-y-3.5">"""

conf_replace = """            {/* White Header matching Orders List Header */}
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
            </div>

            <div className="pt-[86px] sm:pt-[88px] max-w-3xl mx-auto px-3.5 sm:px-5 lg:px-6 space-y-3 sm:space-y-3.5">"""

assert conf_target in conf, "conf_target not in OrderConfirmation.jsx"
conf = conf.replace(conf_target, conf_replace)
with open('src/pages/OrderConfirmation.jsx', 'w', encoding='utf-8') as f:
    f.write(conf)
print('OrderConfirmation.jsx updated')

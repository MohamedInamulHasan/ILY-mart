import os

# 1. Update src/pages/Checkout.jsx
checkout_path = 'src/pages/Checkout.jsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    checkout_code = f.read()

old_checkout_label = """                                <label className={`flex items-center p-3 sm:p-3.5 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-[#2E5A2E] dark:border-[#CBF9B2] bg-[#2E5A2E]/5 dark:bg-[#CBF9B2]/5' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}>
                                    <div className="w-10 h-10 rounded-2xl bg-green-50 dark:bg-[#CBF9B2]/20 border border-green-200/50 dark:border-[#CBF9B2]/20 text-[#2E5A2E] dark:text-[#CBF9B2] flex items-center justify-center mr-4 flex-shrink-0 shadow-xs">
                                        <Banknote size={22} />
                                    </div>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <div className="flex-1">
                                        <span className="block font-bold text-[15px] text-gray-900 dark:text-white">{t('Cash on Delivery')}</span>
                                        <span className="block text-[13px] text-gray-400 dark:text-gray-500">{t('Pay when you receive your order')}</span>
                                    </div>
                                </label>"""

new_checkout_label = """                                <label className={`flex items-center p-3.5 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                    formData.paymentMethod === 'cod'
                                        ? 'bg-black text-white border-black shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                }`}>
                                    <div className="w-11 h-11 rounded-2xl bg-[#00B329]/20 border border-[#00B329]/40 text-[#00B329] flex items-center justify-center mr-3.5 flex-shrink-0 shadow-xs">
                                        <Banknote size={23} className="text-[#00B329] stroke-[2.2]" />
                                    </div>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleChange}
                                        className="hidden"
                                    />
                                    <div className="flex-1">
                                        <span className="block font-bold text-[15.5px] leading-tight">
                                            <span className="text-[#00B329]">
                                                {language === 'ta' ? 'பணம்' : 'Cash'}
                                            </span>{' '}
                                            <span className={formData.paymentMethod === 'cod' ? 'text-white' : 'text-gray-900 dark:text-white'}>
                                                {language === 'ta' ? 'செலுத்தும் டெலிவரி' : 'on Delivery'}
                                            </span>
                                        </span>
                                        <span className={`block text-[12.5px] font-medium mt-0.5 ${formData.paymentMethod === 'cod' ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                                            {t('Pay when you receive your order')}
                                        </span>
                                    </div>
                                </label>"""

if old_checkout_label in checkout_code:
    checkout_code = checkout_code.replace(old_checkout_label, new_checkout_label)
    with open(checkout_path, 'w', encoding='utf-8') as f:
        f.write(checkout_code)
    print("Checkout.jsx updated successfully!")
else:
    print("WARNING: old_checkout_label not found in Checkout.jsx!")

# 2. Update src/pages/admin/DeliveryDashboard.jsx
delivery_path = 'src/pages/admin/DeliveryDashboard.jsx'
with open(delivery_path, 'r', encoding='utf-8') as f:
    delivery_code = f.read()

old_delivery_skeleton = """                            {isLoading ? (
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700/60 overflow-hidden flex flex-col justify-between p-5 space-y-2.5 sm:space-y-3 shadow-sm"
                                        >
                                            {/* Delivery charge & customer details skeleton */}
                                            <div className="flex flex-col items-center space-y-2 py-2">
                                                <div className="h-3 w-28 rounded-full blinkit-shimmer" />
                                                <div className="h-10 w-24 rounded-xl blinkit-shimmer" />
                                                <div className="h-3 w-36 rounded-full blinkit-shimmer mt-1" />
                                                <div className="h-4 w-44 rounded-md blinkit-shimmer mt-2" />
                                                <div className="h-3 w-56 rounded-md blinkit-shimmer" />
                                            </div>
                                            {/* Bottom action button skeleton */}
                                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                                <div className="h-12 w-full rounded-full blinkit-shimmer" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : displayData.length > 0 ? ("""

new_delivery_skeleton = """                            {isLoading ? (
                                <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700/60 overflow-hidden flex flex-col justify-between shadow-xs"
                                        >
                                            {/* Top Header Row Skeleton: Time Left & ID Right */}
                                            <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full blinkit-shimmer shrink-0" />
                                                    <div className="h-4 w-28 rounded-md blinkit-shimmer" />
                                                </div>
                                                <div className="h-4 w-16 rounded-md blinkit-shimmer shrink-0" />
                                            </div>

                                            {/* Divider Line */}
                                            <div className="mx-4 h-px bg-gray-100 dark:bg-gray-700/50 shrink-0" />

                                            {/* Card Content Skeleton */}
                                            <div className="pt-3 pb-3 px-4">
                                                {/* Delivery Charge in Center */}
                                                <div className="flex flex-col items-center py-1.5 mb-2 border-b border-gray-100 dark:border-gray-700/60">
                                                    <div className="h-3 w-28 rounded-full blinkit-shimmer mb-2" />
                                                    <div className="h-10 w-24 rounded-xl blinkit-shimmer" />
                                                </div>

                                                {/* Left-Aligned Details with Route Timeline */}
                                                <div className="flex gap-3 text-left mt-3">
                                                    {/* Timeline Track with dots and line */}
                                                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 dark:bg-emerald-400/20 ring-2 ring-emerald-100 dark:ring-emerald-950/40 shrink-0" />
                                                        <div className="w-[2px] flex-1 bg-gray-200 dark:bg-gray-700 my-1 min-h-[44px]" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 dark:bg-emerald-400/20 ring-2 ring-emerald-100 dark:ring-emerald-950/40 shrink-0" />
                                                    </div>

                                                    {/* Customer & Address lines */}
                                                    <div className="flex-1 min-w-0 space-y-2 py-0.5">
                                                        {/* Customer Name */}
                                                        <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                                                        {/* Address Street */}
                                                        <div className="h-3 w-48 rounded-md blinkit-shimmer" />
                                                        {/* City */}
                                                        <div className="h-3 w-24 rounded-md blinkit-shimmer" />
                                                        {/* Items count */}
                                                        <div className="h-3 w-20 rounded-md blinkit-shimmer pt-0.5" />

                                                        {/* Scheduled Delivery Time block */}
                                                        <div className="pt-2 space-y-1.5">
                                                            <div className="h-2.5 w-24 rounded-full blinkit-shimmer" />
                                                            <div className="h-4 w-32 rounded-md blinkit-shimmer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom action button skeleton (Swipe button) */}
                                            <div className="p-3 sm:p-3.5 border-t border-gray-100 dark:border-gray-700/60">
                                                <div className="h-[50px] w-full rounded-full blinkit-shimmer" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : displayData.length > 0 ? ("""

if old_delivery_skeleton in delivery_code:
    delivery_code = delivery_code.replace(old_delivery_skeleton, new_delivery_skeleton)
    with open(delivery_path, 'w', encoding='utf-8') as f:
        f.write(delivery_code)
    print("DeliveryDashboard.jsx updated successfully!")
else:
    print("WARNING: old_delivery_skeleton not found in DeliveryDashboard.jsx!")

# 3. Update src/pages/Orders.jsx
orders_path = 'src/pages/Orders.jsx'
with open(orders_path, 'r', encoding='utf-8') as f:
    orders_code = f.read()

old_orders_skeleton = """                        {loadingOrders ? (
                            // Blinkit-style Orders Skeleton Loader
                            <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 sm:p-5 shadow-sm space-y-3.5"
                                    >
                                        {/* Top Header: Package Icon + Order ID/Date + Status Pill */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-xl blinkit-shimmer flex-shrink-0" />
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="h-4 w-28 rounded-md blinkit-shimmer" />
                                                    <div className="h-3 w-36 rounded-md blinkit-shimmer" />
                                                </div>
                                            </div>
                                            <div className="h-6 w-24 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>

                                        {/* Items Section: Product image + Details */}
                                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {[1, 2].map((itemIdx) => (
                                                <div key={itemIdx} className="py-2.5 flex items-center gap-3 first:pt-0">
                                                    <div className="h-14 w-14 rounded-xl blinkit-shimmer flex-shrink-0" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                                        <div className="h-3 w-1/3 rounded-md blinkit-shimmer" />
                                                        <div className="h-3.5 w-20 rounded-md blinkit-shimmer" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Bottom Footer: Total Amount + View Details */}
                                        <div className="pt-2.5 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                                            <div className="space-y-1">
                                                <div className="h-2.5 w-16 rounded-full blinkit-shimmer" />
                                                <div className="h-5 w-20 rounded-md blinkit-shimmer" />
                                            </div>
                                            <div className="h-9 w-28 rounded-full blinkit-shimmer" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredOrders.length > 0 ? ("""

new_orders_skeleton = """                        {loadingOrders ? (
                            // Blinkit-style Orders Skeleton Loader
                            <div className="grid grid-cols-1 gap-4 lg:gap-6 w-full">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-4 sm:p-5 shadow-sm"
                                    >
                                        {/* Top Header: Package icon box + Order ID/Date + Status Badge */}
                                        <div className="flex justify-between items-start gap-2 mb-3 pb-2.5 border-b border-gray-100/80 dark:border-gray-700/40">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <div className="w-8 h-8 rounded-lg blinkit-shimmer flex-shrink-0" />
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="h-4 w-24 rounded-md blinkit-shimmer" />
                                                    <div className="h-3 w-32 rounded-md blinkit-shimmer" />
                                                </div>
                                            </div>
                                            <div className="h-6 w-20 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>

                                        {/* Items Section: 2 item rows matching real card */}
                                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {[1, 2].map((itemIdx) => (
                                                <div key={itemIdx} className="py-2.5 flex items-center gap-3 first:pt-0">
                                                    {/* 14x14 (56px) rounded product image skeleton */}
                                                    <div className="h-14 w-14 rounded-xl blinkit-shimmer flex-shrink-0" />
                                                    <div className="flex-1 space-y-1.5 min-w-0">
                                                        {/* Product title */}
                                                        <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                                        {/* Store name */}
                                                        <div className="h-3 w-2/5 rounded-md blinkit-shimmer" />
                                                        {/* Price & Quantity badge */}
                                                        <div className="flex items-center justify-between pt-0.5">
                                                            <div className="h-4 w-14 rounded-md blinkit-shimmer" />
                                                            <div className="h-5 w-8 rounded-md blinkit-shimmer" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Bottom Footer: Total Amount + Details underline */}
                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700/80 flex justify-between items-center">
                                            <div className="space-y-1.5">
                                                <div className="h-2.5 w-16 rounded-full blinkit-shimmer" />
                                                <div className="h-5 w-20 rounded-md blinkit-shimmer" />
                                            </div>
                                            <div className="h-4 w-14 rounded-md blinkit-shimmer" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredOrders.length > 0 ? ("""

if old_orders_skeleton in orders_code:
    orders_code = orders_code.replace(old_orders_skeleton, new_orders_skeleton)
    with open(orders_path, 'w', encoding='utf-8') as f:
        f.write(orders_code)
    print("Orders.jsx updated successfully!")
else:
    print("WARNING: old_orders_skeleton not found in Orders.jsx!")

# 4. Update src/pages/Shop.jsx
shop_path = 'src/pages/Shop.jsx'
with open(shop_path, 'r', encoding='utf-8') as f:
    shop_code = f.read()

old_shop_skeleton = """                                {isStoresLoading ? (
                                    // Blinkit style store card skeleton
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700/50 flex flex-col space-y-3">
                                                <div className="aspect-[16/9] w-full rounded-xl blinkit-shimmer"></div>
                                                <div className="flex items-center justify-between pt-1">
                                                    <div className="space-y-1.5 flex-1 pr-3">
                                                        <div className="h-4 w-3/4 rounded-lg blinkit-shimmer"></div>
                                                        <div className="h-3 w-1/2 rounded-md blinkit-shimmer"></div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full blinkit-shimmer flex-shrink-0"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredStores.length > 0 ? ("""

new_shop_skeleton = """                                {isStoresLoading ? (
                                    // Store card skeleton matching StoreCard layout 1:1
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div
                                                key={i}
                                                className="group relative bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100/80 dark:border-gray-700/60"
                                            >
                                                {/* Full Card Shimmer Image Background */}
                                                <div className="absolute inset-0 blinkit-shimmer" />

                                                {/* Top-Right Timing Badge Skeleton */}
                                                <div className="absolute top-2.5 right-2.5 z-10">
                                                    <div className="h-5 w-20 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-sm" />
                                                </div>

                                                {/* Overlaid Bottom White Banner Strip */}
                                                <div className="absolute bottom-0 left-0 right-0 py-2.5 px-4 z-10 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                                    <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                                                        <div className="h-4 w-40 rounded-md blinkit-shimmer" />
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2.5 h-2.5 rounded-full blinkit-shimmer flex-shrink-0" />
                                                            <div className="h-3 w-28 rounded-md blinkit-shimmer" />
                                                        </div>
                                                    </div>
                                                    {/* Bottom-right circular button */}
                                                    <div className="w-8 h-8 rounded-full blinkit-shimmer flex-shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : filteredStores.length > 0 ? ("""

if old_shop_skeleton in shop_code:
    shop_code = shop_code.replace(old_shop_skeleton, new_shop_skeleton)
    with open(shop_path, 'w', encoding='utf-8') as f:
        f.write(shop_code)
    print("Shop.jsx stores skeleton updated successfully!")
else:
    print("WARNING: old_shop_skeleton not found in Shop.jsx!")

# Also update services skeleton in Shop.jsx
old_shop_services_skeleton = """                                {servicesLoading ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden animate-pulse" />
                                        ))}
                                    </div>
                                ) : (() => {"""

new_shop_services_skeleton = """                                {servicesLoading ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div
                                                key={i}
                                                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100/80 dark:border-gray-700/60"
                                            >
                                                <div className="absolute inset-0 blinkit-shimmer" />
                                                <div className="absolute top-3 left-3 z-10">
                                                    <div className="h-5 w-20 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-sm" />
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 py-2 px-3.5 z-10 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                                    <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                                                        <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-2.5 h-2.5 rounded-full blinkit-shimmer flex-shrink-0" />
                                                            <div className="h-3 w-28 rounded-md blinkit-shimmer" />
                                                        </div>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-full blinkit-shimmer flex-shrink-0" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (() => {"""

if old_shop_services_skeleton in shop_code:
    shop_code = shop_code.replace(old_shop_services_skeleton, new_shop_services_skeleton)
    with open(shop_path, 'w', encoding='utf-8') as f:
        f.write(shop_code)
    print("Shop.jsx services skeleton updated successfully!")
else:
    print("WARNING: old_shop_services_skeleton not found in Shop.jsx!")

# 5. Update src/pages/Services.jsx
services_path = 'src/pages/Services.jsx'
with open(services_path, 'r', encoding='utf-8') as f:
    services_code = f.read()

old_services_main_skeleton = """                            {servicesLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100 dark:border-gray-700/50 relative flex flex-col justify-between"
                                    >
                                        {/* Top Tag Placeholder */}
                                        <div className="p-4 z-10">
                                            <div className="h-6 w-24 rounded-full blinkit-shimmer" />
                                        </div>

                                        {/* Middle Area */}
                                        <div className="absolute inset-0 blinkit-shimmer opacity-40" />

                                        {/* Bottom Content Bar */}
                                        <div className="relative z-10 bg-white dark:bg-gray-800 py-3 px-4 border-t border-gray-50 dark:border-gray-700/60 flex items-center justify-between">
                                            <div className="space-y-2 flex-1 min-w-0 pr-4">
                                                <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                                <div className="h-3 w-1/2 rounded-md blinkit-shimmer" />
                                            </div>
                                            <div className="w-8 h-8 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>
                                    </div>
                                ))
                            ) : (() => {"""

new_services_main_skeleton = """                            {servicesLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100/80 dark:border-gray-700/60"
                                    >
                                        {/* Full Card Shimmer Image Background */}
                                        <div className="absolute inset-0 blinkit-shimmer" />

                                        {/* Category Tag Overlay (Top Left) */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <div className="h-5 w-20 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-sm" />
                                        </div>

                                        {/* Content Section - White Banner at Bottom */}
                                        <div className="absolute bottom-0 left-0 right-0 py-2 px-3.5 z-10 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                            <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                                                <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full blinkit-shimmer flex-shrink-0" />
                                                    <div className="h-3 w-28 rounded-md blinkit-shimmer" />
                                                </div>
                                            </div>
                                            {/* Right Action Arrow Skeleton */}
                                            <div className="w-7 h-7 rounded-full blinkit-shimmer flex-shrink-0" />
                                        </div>
                                    </div>
                                ))
                            ) : (() => {"""

old_subservices_skeleton = """                            {itemsLoading ? (
                                // Blinkit-style Sub-services Skeleton
                                [...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl aspect-square shadow-sm overflow-hidden relative flex flex-col justify-between p-3 border border-gray-100 dark:border-gray-700/50">
                                        <div className="absolute inset-0 blinkit-shimmer opacity-50" />
                                        <div className="relative z-10 flex justify-between">
                                            <div className="h-4 w-16 rounded-full blinkit-shimmer" />
                                        </div>
                                        <div className="relative z-10 space-y-1.5 bg-black/20 backdrop-blur-sm p-2 rounded-xl">
                                            <div className="h-3.5 w-3/4 rounded-md blinkit-shimmer" />
                                            <div className="h-3 w-1/2 rounded-md blinkit-shimmer" />
                                        </div>
                                    </div>
                                ))
                            ) : serviceItems.length > 0 ? ("""

new_subservices_skeleton = """                            {itemsLoading ? (
                                // Sub-services Skeleton matching detail view
                                [...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-gray-800 rounded-2xl aspect-square shadow-sm overflow-hidden relative border border-gray-100 dark:border-gray-700/50"
                                    >
                                        {/* Full Card Shimmer Background */}
                                        <div className="absolute inset-0 blinkit-shimmer" />
                                        {/* Dark gradient overlay matching real card */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                        {/* Bottom Content Skeleton */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10 space-y-1.5">
                                            <div className="h-4 w-3/4 rounded-md bg-white/20 backdrop-blur-sm" />
                                            <div className="h-3.5 w-1/3 rounded-md bg-white/20 backdrop-blur-sm" />
                                        </div>
                                    </div>
                                ))
                            ) : serviceItems.length > 0 ? ("""

if old_services_main_skeleton in services_code:
    services_code = services_code.replace(old_services_main_skeleton, new_services_main_skeleton)
    print("Services.jsx main skeleton replaced!")
else:
    print("WARNING: old_services_main_skeleton not found in Services.jsx!")

if old_subservices_skeleton in services_code:
    services_code = services_code.replace(old_subservices_skeleton, new_subservices_skeleton)
    print("Services.jsx subservices skeleton replaced!")
else:
    print("WARNING: old_subservices_skeleton not found in Services.jsx!")

with open(services_path, 'w', encoding='utf-8') as f:
    f.write(services_code)

print("All updates script finished successfully!")


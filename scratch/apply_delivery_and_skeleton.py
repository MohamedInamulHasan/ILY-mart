import re

# 1. Update src/pages/OrderDetails.jsx Skeleton
od_path = 'src/pages/OrderDetails.jsx'
with open(od_path, 'r', encoding='utf-8') as f:
    od_code = f.read()

old_od_skeleton = """    // Show skeleton ONLY if we don't have the order AND we are loading.
    if (!order && (loading.orders || loadingSingle)) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 mx-auto max-w-3xl w-full relative pb-12">
                <div className="px-5 pt-8">
                    {/* Header Skeleton */}
                    <div className="flex items-center justify-between mb-8 mt-2">
                        <div className="w-[46px] h-[46px] rounded-full blinkit-shimmer"></div>
                        <div className="h-6 w-36 rounded-xl blinkit-shimmer"></div>
                        <div className="w-[46px] h-[46px]"></div>
                    </div>

                    <div className="space-y-3 sm:space-y-3.5">
                        {/* Status Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <div className="h-5 w-40 rounded-lg blinkit-shimmer" />
                            <div className="h-3 w-60 rounded-md blinkit-shimmer" />
                            <div className="h-10 w-full rounded-2xl blinkit-shimmer mt-4" />
                        </div>

                        {/* Items Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-50 dark:border-gray-700">
                                <div className="h-6 w-40 rounded-lg blinkit-shimmer"></div>
                            </div>
                            <div className="p-5 space-y-6">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="h-16 w-16 rounded-2xl blinkit-shimmer flex-shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-3/4 rounded-lg blinkit-shimmer"></div>
                                            <div className="h-3 w-1/2 rounded-md blinkit-shimmer"></div>
                                            <div className="flex justify-between items-center pt-1">
                                                <div className="h-5 w-16 rounded-lg blinkit-shimmer"></div>
                                                <div className="h-5 w-10 rounded-lg blinkit-shimmer"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Address Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                            <div className="h-4 w-28 rounded-md blinkit-shimmer" />
                            <div className="h-3.5 w-3/4 rounded-md blinkit-shimmer" />
                            <div className="h-3.5 w-1/2 rounded-md blinkit-shimmer" />
                        </div>

                        {/* Payment Summary Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <div className="h-5 w-36 rounded-lg blinkit-shimmer" />
                            <div className="space-y-3">
                                <div className="flex justify-between"><div className="h-3.5 w-20 rounded blinkit-shimmer" /><div className="h-3.5 w-16 rounded blinkit-shimmer" /></div>
                                <div className="flex justify-between"><div className="h-3.5 w-24 rounded blinkit-shimmer" /><div className="h-3.5 w-12 rounded blinkit-shimmer" /></div>
                                <div className="flex justify-between pt-2 border-t border-gray-50 dark:border-gray-700"><div className="h-4 w-24 rounded blinkit-shimmer" /><div className="h-4 w-20 rounded blinkit-shimmer" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }"""

new_od_skeleton = """    // Show skeleton ONLY if we don't have the order AND we are loading.
    if (!order && (loading.orders || loadingSingle)) {
        return (
            <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 mx-auto max-w-3xl w-full relative pb-12">
                <div className="px-5 pt-4">
                    {/* Header Skeleton matching real header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-[46px] h-[46px] rounded-full blinkit-shimmer shrink-0" />
                        <div className="h-5 w-32 rounded-lg blinkit-shimmer" />
                        <div className="w-[46px] h-[46px]" />
                    </div>

                    <div className="space-y-3 sm:space-y-3.5">
                        {/* Status Card Skeleton: Top Banner + 3-Node Timeline */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {/* Status Banner */}
                            <div className="p-5 sm:p-6 bg-gray-50/70 dark:bg-gray-750 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-3.5 w-28 rounded-md blinkit-shimmer" />
                                    <div className="h-7 w-36 rounded-xl blinkit-shimmer" />
                                    <div className="h-3 w-44 rounded-md blinkit-shimmer" />
                                </div>
                                <div className="w-12 h-12 rounded-full blinkit-shimmer shrink-0" />
                            </div>

                            {/* 3-Step Timeline Skeleton */}
                            <div className="px-4 py-4 relative">
                                <div className="absolute top-[34px] left-8 right-8 h-1 bg-gray-100 dark:bg-gray-700 rounded-full" />
                                <div className="relative flex justify-between">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className="flex flex-col items-center z-10 space-y-2">
                                            <div className="w-9 h-9 rounded-full blinkit-shimmer border-4 border-white dark:border-gray-800" />
                                            <div className="h-3 w-16 rounded-md blinkit-shimmer" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Items Ordered Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="px-3.5 py-2.5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg blinkit-shimmer shrink-0" />
                                <div className="h-4 w-32 rounded-md blinkit-shimmer" />
                            </div>
                            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                {[1, 2].map((i) => (
                                    <div key={i} className="p-3 sm:p-3.5 flex gap-3">
                                        <div className="w-14 h-14 rounded-xl blinkit-shimmer shrink-0" />
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="h-4 w-3/4 rounded-md blinkit-shimmer" />
                                            <div className="h-3 w-1/3 rounded-md blinkit-shimmer" />
                                            <div className="flex items-center justify-between pt-1">
                                                <div className="h-4 w-16 rounded-md blinkit-shimmer" />
                                                <div className="h-5 w-8 rounded-md blinkit-shimmer" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Address Card Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg blinkit-shimmer shrink-0" />
                                <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                            </div>
                            <div className="space-y-1.5 pl-1">
                                <div className="h-4 w-40 rounded-md blinkit-shimmer" />
                                <div className="h-3.5 w-60 rounded-md blinkit-shimmer" />
                                <div className="h-3.5 w-32 rounded-md blinkit-shimmer" />
                            </div>
                        </div>

                        {/* Payment Summary Skeleton */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg blinkit-shimmer shrink-0" />
                                <div className="h-4 w-36 rounded-md blinkit-shimmer" />
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center"><div className="h-3.5 w-20 rounded blinkit-shimmer" /><div className="h-3.5 w-16 rounded blinkit-shimmer" /></div>
                                <div className="flex justify-between items-center"><div className="h-3.5 w-24 rounded blinkit-shimmer" /><div className="h-3.5 w-12 rounded blinkit-shimmer" /></div>
                                <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 dark:border-gray-700/60"><div className="h-5 w-24 rounded blinkit-shimmer" /><div className="h-5 w-20 rounded blinkit-shimmer" /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }"""

if old_od_skeleton in od_code:
    od_code = od_code.replace(old_od_skeleton, new_od_skeleton)
    with open(od_path, 'w', encoding='utf-8') as f:
        f.write(od_code)
    print("OrderDetails.jsx skeleton updated successfully!")
else:
    print("WARNING: old_od_skeleton not found in OrderDetails.jsx")

# 2. Update IncomingOrderModal.jsx
modal_path = 'src/components/IncomingOrderModal.jsx'
with open(modal_path, 'r', encoding='utf-8') as f:
    modal_code = f.read()

if 'renderBilingualTitle' not in modal_code:
    modal_code = modal_code.replace("import { getStoreName", "import { renderBilingualTitle } from '../utils/titleHelpers';\nimport { getStoreName")

old_modal_item = """                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-0.5" title={item.name}>
                                            {item.name}
                                        </h4>"""

new_modal_item = """                                        <div className="mb-0.5 leading-tight" title={item.name}>
                                            {renderBilingualTitle(item.name || item.title, language, {
                                                hideTag: true,
                                                mainClassName: 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
                                                subClassName: 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
                                            })}
                                        </div>"""

if old_modal_item in modal_code:
    modal_code = modal_code.replace(old_modal_item, new_modal_item)
    with open(modal_path, 'w', encoding='utf-8') as f:
        f.write(modal_code)
    print("IncomingOrderModal.jsx updated successfully!")
else:
    print("WARNING: old_modal_item not found in IncomingOrderModal.jsx")

print("Finished script execution.")

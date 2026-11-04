const fs = require('fs');

// 1. Revert Orders.jsx status tag
let orders = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

// Replace getStatusColor
const oldColorPattern = /case 'Processing':\s*case 'Pending':\s*return 'bg-orange-50[^']*';/;
orders = orders.replace(oldColorPattern, "case 'Processing':\r\n            case 'Pending':\r\n                return 'bg-amber-500/80 text-white';");

// Restore text-white in getStatusIcon
orders = orders.replace(
    'return <CheckCircle size={13} className="mr-1 stroke-[2.5]" />;',
    'return <CheckCircle size={13} className="mr-1 stroke-[2.5] text-white" />;'
);
orders = orders.replace(
    'return <Truck size={13} className="mr-1 stroke-[2.5]" />;',
    'return <Truck size={13} className="mr-1 stroke-[2.5] text-white" />;'
);
orders = orders.replace(
    'return <Clock size={13} className="mr-1 stroke-[2.5]" />;',
    'return <Clock size={13} className="mr-1 stroke-[2.5] text-white" />;'
);
orders = orders.replace(
    'return <RotateCcw size={13} className="mr-1 stroke-[2.5]" />;',
    'return <RotateCcw size={13} className="mr-1 stroke-[2.5] text-white" />;'
);

// Restore text-white on wrapper and span
orders = orders.replace(
    'text-[11px] md:text-xs font-bold shadow-xs select-none',
    'text-[11px] md:text-xs font-bold text-white shadow-xs select-none'
);
orders = orders.replace(
    '<span className="font-bold">{getStatusText(order.status)}</span>',
    '<span className="font-bold text-white">{getStatusText(order.status)}</span>'
);

fs.writeFileSync('src/pages/Orders.jsx', orders, 'utf8');
console.log('Reverted Orders.jsx status tag color to old version');

// 2. Update Shop.jsx store skeleton to match service cards exactly
let shop = fs.readFileSync('src/pages/Shop.jsx', 'utf8');

const oldSkeletonBlock = `{isStoresLoading ? (
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
                                ) : filteredStores.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">`;

const newSkeletonBlock = `{isStoresLoading ? (
                                    /* Store card skeleton matching service cards exactly */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                                        {[...Array(6)].map((_, i) => (
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

                                                {/* Timing Badge Skeleton (Top Right) */}
                                                <div className="absolute top-3 right-3 z-10">
                                                    <div className="h-5 w-16 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-sm" />
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
                                        ))}
                                    </div>
                                ) : filteredStores.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">`;

if (shop.includes(oldSkeletonBlock)) {
    shop = shop.replace(oldSkeletonBlock, newSkeletonBlock);
} else {
    // try normalized line breaks
    const oldNorm = oldSkeletonBlock.replace(/\r\n/g, '\n');
    const newNorm = newSkeletonBlock.replace(/\r\n/g, '\n');
    shop = shop.replace(oldNorm, newNorm);
}

fs.writeFileSync('src/pages/Shop.jsx', shop, 'utf8');
console.log('Successfully updated Shop.jsx store skeleton');


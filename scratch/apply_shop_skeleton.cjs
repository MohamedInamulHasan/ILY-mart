const fs = require('fs');

let shop = fs.readFileSync('src/pages/Shop.jsx', 'utf8');

const isCRLF = shop.includes('\r\n');
const lineBreak = isCRLF ? '\r\n' : '\n';

const lines = shop.split(/\r?\n/);
const startIndex = lines.findIndex(l => l.includes('{isStoresLoading ?'));
const endIndex = lines.findIndex(l => l.includes('filteredStores.length > 0 ?'));

console.log('startIndex:', startIndex, 'endIndex:', endIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const replacementLines = [
        "                                {isStoresLoading ? (",
        "                                    /* Store cards skeleton matching service cards exactly */",
        "                                    <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5\">",
        "                                        {[...Array(6)].map((_, i) => (",
        "                                            <div",
        "                                                key={i}",
        "                                                className=\"group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[3/2] lg:aspect-[4/3] w-full shadow-sm border border-gray-100/80 dark:border-gray-700/60\"",
        "                                            >",
        "                                                {/* Full Card Shimmer Image Background */}",
        "                                                <div className=\"absolute inset-0 blinkit-shimmer\" />",
        "",
        "                                                {/* Category Tag Overlay (Top Left) */}",
        "                                                <div className=\"absolute top-3 left-3 z-10\">",
        "                                                    <div className=\"h-5 w-20 rounded-full bg-white/30 dark:bg-white/10 backdrop-blur-sm\" />",
        "                                                </div>",
        "",
        "                                                {/* Timing Badge Skeleton (Top Right) */}",
        "                                                <div className=\"absolute top-3 right-3 z-10\">",
        "                                                    <div className=\"h-5 w-16 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-sm\" />",
        "                                                </div>",
        "",
        "                                                {/* Content Section - White Banner at Bottom */}",
        "                                                <div className=\"absolute bottom-0 left-0 right-0 py-2 px-3.5 z-10 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between\">",
        "                                                    <div className=\"space-y-1.5 flex-1 min-w-0 pr-3\">",
        "                                                        <div className=\"h-4 w-36 rounded-md blinkit-shimmer\" />",
        "                                                        <div className=\"flex items-center gap-1.5\">",
        "                                                            <div className=\"w-2.5 h-2.5 rounded-full blinkit-shimmer flex-shrink-0\" />",
        "                                                            <div className=\"h-3 w-28 rounded-md blinkit-shimmer\" />",
        "                                                        </div>",
        "                                                    </div>",
        "                                                    {/* Right Action Arrow Skeleton */}",
        "                                                    <div className=\"w-7 h-7 rounded-full blinkit-shimmer flex-shrink-0\" />",
        "                                                </div>",
        "                                            </div>",
        "                                        ))}",
        "                                    </div>",
        "                                ) : filteredStores.length > 0 ? (",
        "                                    <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5\">"
    ];

    lines.splice(startIndex, endIndex - startIndex + 1, ...replacementLines);
    fs.writeFileSync('src/pages/Shop.jsx', lines.join(lineBreak), 'utf8');
    console.log('Successfully replaced store skeleton in Shop.jsx!');
} else {
    console.error('Could not find start/end indices in Shop.jsx');
}


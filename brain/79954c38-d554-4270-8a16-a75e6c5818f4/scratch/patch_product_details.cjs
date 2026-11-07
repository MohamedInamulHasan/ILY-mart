const fs = require('fs');
const path = 'src/pages/ProductDetails.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. Safe isFreeDelivery check
content = content.replace(
    'const isFreeDelivery = Boolean(\n        product.isGold === true',
    'const isFreeDelivery = Boolean(\n        product && (product.isGold === true'
);
if (content.includes('product.freeDelivery === true\n    );')) {
    content = content.replace(
        'product.freeDelivery === true\n    );',
        'product.freeDelivery === true)\n    );'
    );
}

// 2. Put rectangular tag below price & quantity selector
const searchTarget = `                        {/* Minimalist Quantity Selector - Hidden in preview mode */}
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
                    </div>`;

const replacement = searchTarget + `\n
                    {/* Rectangular Free Delivery Tag below price */}
                    {isFreeDelivery && (
                        <div className="mb-3">
                            <span className="inline-block bg-[#E11D48] dark:bg-[#BE123C] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-[4px] shadow-xs select-none">
                                {t('Free Delivery')}
                            </span>
                        </div>
                    )}`;

if (content.includes(searchTarget)) {
    content = content.replace(searchTarget, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: added rectangular free delivery tag below price');
} else {
    console.log('Target not found, checking snippet...');
    console.log(content.indexOf('Minimalist Quantity Selector'));
}

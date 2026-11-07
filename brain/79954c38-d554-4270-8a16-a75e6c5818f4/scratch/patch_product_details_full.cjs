const fs = require('fs');
const path = 'src/pages/ProductDetails.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. Add useMemo and parseProductDescription import
content = content.replace(
    "import { useState, useEffect } from 'react';",
    "import { useState, useEffect, useMemo } from 'react';\nimport { parseProductDescription } from '../utils/descriptionHelper';"
);

// 2. Add selectedMention state
content = content.replace(
    "const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);",
    "const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);\n    const [selectedMention, setSelectedMention] = useState('');"
);

// 3. Helper to attach mention & update handleAddToCart and handleCheckout
const oldHandlers = `    const handleAddToCart = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        addToCart(product);
    };

    const handleCheckout = () => {
        if (isPreview) return;
        if (!user) {
            navigate('/login');
            return;
        }
        if (!cartItem) {
            addToCart(product);
        }
        navigate('/checkout');
    };`;

const newHandlers = `    const getProductWithMention = () => {
        if (!product) return null;
        if (selectedMention) {
            return {
                ...product,
                selectedMention,
                title: \`\${product.title} (\${selectedMention})\`,
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
        addToCart(itemToAdd, 1);
        navigate('/checkout');
    };`;

if (content.includes(oldHandlers)) {
    content = content.replace(oldHandlers, newHandlers);
    console.log('SUCCESS: replaced handleAddToCart and handleCheckout');
} else {
    console.log('WARNING: oldHandlers not matched');
}

// 4. Parse description blocks & mentions
const oldDescLogic = `    const rawDescription = t(product, 'description') || '';
    const descParts = rawDescription.split('|').map(s => s.trim());
    const mainDesc = descParts[0] || '';
    const descTags = descParts.slice(1).filter(Boolean);

    const shouldTruncate = mainDesc.length > 150;
    const displayDescription = isDescriptionExpanded ? mainDesc : mainDesc.slice(0, 150) + (shouldTruncate ? '...' : '');`;

const newDescLogic = `    const { blocks: descBlocks, mentions: productMentions } = useMemo(() => {
        return parseProductDescription(product?.description);
    }, [product?.description]);`;

if (content.includes(oldDescLogic)) {
    content = content.replace(oldDescLogic, newDescLogic);
    console.log('SUCCESS: replaced old description parsing with structured blocks parser');
} else {
    console.log('WARNING: oldDescLogic not matched');
}

// 5. Replace Description Section and Action Button in JSX
const oldJSXSection = `                    {/* Description Section */}
                    <div className="mb-4">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                            {t('Description')}
                        </h2>
                        <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                            {displayDescription}
                            {shouldTruncate && (
                                <button
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="ml-1 text-gray-900 dark:text-white font-bold hover:underline"
                                >
                                    {isDescriptionExpanded ? t('Read Less') : t('Read More...')}
                                </button>
                            )}
                        </div>

                        {/* Parsed Tags Section - Table Format */}
                        {descTags.length > 0 && (
                            <div className="mt-3 border border-black/10 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <tbody>
                                        {descTags.map((tag, index) => {
                                            const dashMatch = tag.match(/[-–—]/);
                                            if (dashMatch) {
                                                const dashIdx = dashMatch.index;
                                                const key = tag.substring(0, dashIdx).trim();
                                                const val = tag.substring(dashIdx + 1).trim();
                                                return (
                                                    <tr key={index} className="border-b border-black/10 dark:border-gray-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="w-1/3 py-2 px-3 bg-gray-50/50 dark:bg-gray-900/30 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-r border-black/10 dark:border-gray-700">
                                                            {key}
                                                        </td>
                                                        <td className="py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                                                            {val}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return (
                                                <tr key={index} className="border-b border-black/10 dark:border-gray-700 last:border-0">
                                                    <td colSpan="2" className="py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50/20 dark:bg-gray-900/10">
                                                        {tag}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="w-full flex justify-center mt-3 mb-10 pb-4">
                        {isPreview ? (
                            <div className="w-[260px] sm:w-[280px]">
                                <SwipeActionButton
                                    variant="green"
                                    label={t('SWIPE TO CALL')}
                                    loadingLabel={t('Calling...')}
                                    autoReset={true}
                                    heightClass="h-[50px] sm:h-[52px]"
                                    knobSizeClass="w-[40px] h-[40px] sm:w-[42px] sm:h-[42px]"
                                    textSizeClass="text-xs sm:text-sm font-black tracking-wider"
                                    iconSize={18}
                                    knobIcon={<Phone size={18} />}
                                    className="shadow-none"
                                    onSuccess={handleCallStore}
                                />
                            </div>
                        ) : !isCurrentlyAvailable ? (
                            <div className="w-full py-4 bg-red-50 dark:bg-red-900/10 rounded-full border border-red-100 dark:border-red-800 text-center">
                                <p className="text-red-600 dark:text-red-400 font-bold">
                                     {!isStoreCurrentlyOpen ? t('Store Closed') : t('Currently Unavailable')}
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-black text-white py-4 rounded-full font-normal text-[15px] active:scale-[0.98] transition-transform flex items-center justify-center"
                            >
                                <span>{t('Add product')}</span>
                            </button>
                        )}
                    </div>`;

const newJSXSection = `                    {/* Mentions (Sizes / Variants, e.g. S, M, L, XL) */}
                    {productMentions && productMentions.length > 0 && (
                        <div className="mb-4">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
                                {t('Select Size / Option')}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {productMentions.map((m, idx) => {
                                    const isSel = selectedMention === m;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedMention(isSel ? '' : m)}
                                            className={\`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm transition-all select-none cursor-pointer \${
                                                isSel
                                                    ? 'border-2 border-black dark:border-white font-bold text-black dark:text-white bg-black/5 dark:bg-white/10 shadow-xs'
                                                    : 'border border-gray-300 dark:border-gray-600 font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-gray-400'
                                            }\`}
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
                                    const lines = text.split('\\n').filter(Boolean);
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
                    </div>`;

if (content.includes(oldJSXSection)) {
    content = content.replace(oldJSXSection, newJSXSection);
    console.log('SUCCESS: replaced JSX section with rich blocks, mentions, and sleek Add Product button');
} else {
    console.log('WARNING: oldJSXSection not matched');
}

fs.writeFileSync(path, content, 'utf8');
console.log('ProductDetails.jsx patching complete');

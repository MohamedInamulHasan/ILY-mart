/**
 * Helper to determine if a category or product category is in Preview mode.
 * When in preview mode, products cannot be ordered, show no quantity controllers/add-to-cart buttons,
 * and display a "Swipe to Call" action on the product details page.
 */
export const isCategoryPreview = (categoryRef, categories = []) => {
    if (!categoryRef) return false;
    
    // Check if categoryRef is already an object with preview flags
    if (typeof categoryRef === 'object') {
        if (categoryRef.isPreview === true || categoryRef.mode === 'preview') return true;
        categoryRef = categoryRef.name || categoryRef._id || categoryRef.id;
    }

    let list = Array.isArray(categories) && categories.length > 0 ? categories : [];
    if (list.length === 0) {
        try {
            const cached = localStorage.getItem('homly_cached_categories_v3');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
            }
        } catch (e) {}
    }

    if (!categoryRef || list.length === 0) return false;

    const rawRef = String(categoryRef).trim().toLowerCase();
    const cleanRef = rawRef.split('(')[0].replace(/[^a-z0-9]/g, '');

    const found = list.find(c => {
        if (!c) return false;
        const idMatch = (c._id && String(c._id) === rawRef) || (c.id && String(c.id) === rawRef);
        if (idMatch) return true;

        const rawCatName = String(c.name || '').trim().toLowerCase();
        if (rawCatName === rawRef) return true;

        const cleanCatName = rawCatName.split('(')[0].replace(/[^a-z0-9]/g, '');
        if (cleanCatName && cleanRef && cleanCatName === cleanRef) return true;

        if (c.name_ta) {
            const rawCatNameTa = String(c.name_ta).trim().toLowerCase();
            if (rawCatNameTa === rawRef) return true;
            const cleanCatNameTa = rawCatNameTa.split('(')[0].replace(/[^a-z0-9]/g, '');
            if (cleanCatNameTa && cleanRef && cleanCatNameTa === cleanRef) return true;
        }

        return false;
    });

    return Boolean(found?.isPreview === true || found?.mode === 'preview');
};

// Common static translations for categories and subcategories
const staticCategoryTranslations = {
    'Home': { en: 'Home', ta: 'முகப்பு' },
    'Store': { en: 'Store', ta: 'கடை' },
    'Categories': { en: 'Categories', ta: 'வகைகள்' },
    'Electronics': { en: 'Electronics', ta: 'எலக்ட்ரானிக்ஸ்' },
    'Fashion': { en: 'Fashion', ta: 'ஃபேஷன்' },
    'Beauty': { en: 'Beauty', ta: 'அழகு' },
    'Sports': { en: 'Sports', ta: 'விளையாட்டு' },
    'Toys': { en: 'Toys', ta: 'பொம்மைகள்' },
    'Books': { en: 'Books', ta: 'புத்தகங்கள்' },
    'Automotive': { en: 'Automotive', ta: 'வாகனம்' },
    'Medicals': { en: 'Medicals', ta: 'மருத்துவம்' },
    'Medical': { en: 'Medical', ta: 'மருத்துவம்' },
    'Pharmacy': { en: 'Pharmacy', ta: 'மருந்தகம்' },
    'Stationary': { en: 'Stationary', ta: 'நிலையானது' },
    'Grocery': { en: 'Grocery', ta: 'மளிகை' },
    'Groceries': { en: 'Groceries', ta: 'மளிகை' },
    'Vegetables': { en: 'Vegetables', ta: 'காய்கறிகள்' },
    'Vegetable': { en: 'Vegetable', ta: 'காய்கறி' },
    'Fruits': { en: 'Fruits', ta: 'பழங்கள்' },
    'Fruit': { en: 'Fruit', ta: 'பழம்' },
    'Meat': { en: 'Meat', ta: 'இறைச்சி' },
    'Fish': { en: 'Fish', ta: 'மீன்' },
    'Bakery': { en: 'Bakery', ta: 'பேக்கரி' },
    'Dairy': { en: 'Dairy', ta: 'பால் பண்ணை' },
    'Snacks': { en: 'Snacks', ta: 'தின்பண்டங்கள்' },
    'Beverages': { en: 'Beverages', ta: 'பானங்கள்' },
    'All': { en: 'All', ta: 'அனைத்தும்' }
};

/**
 * Utility to strip emojis and pictographs from text for strict text-only rendering.
 */
export const stripEmojis = (str) => {
    if (!str || typeof str !== 'string') return '';
    try {
        return str
            .replace(/\p{Extended_Pictographic}/gu, '')
            .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE00}-\u{FE0F}]/gu, '')
            .replace(/\s+/g, ' ')
            .trim();
    } catch {
        return str.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '').replace(/\s+/g, ' ').trim();
    }
};

/**
 * Utility to extract emojis from a string.
 */
export const extractEmojis = (str) => {
    if (!str || typeof str !== 'string') return '';
    try {
        const matches = str.match(/\p{Extended_Pictographic}/gu);
        return matches ? matches.join(' ') : '';
    } catch {
        const matches = str.match(/[\uD83C-\uDBFF\uDC00-\uDFFF]+/g);
        return matches ? matches.join(' ') : '';
    }
};

/**
 * Helper to get clean category or subcategory name based on active language.
 * Completely strips brackets and hides the other language:
 * - When language is 'en': shows only English (no Tamil brackets).
 * - When language is 'ta': shows only Tamil (no English brackets).
 * - Strips square bracket tags: "Food [shop]" -> "Food" (never shown anywhere outside the store list category).
 * - Unless options.keepEmoji is true (e.g. store page horizontal category scroller),
 *   strictly strips all emojis and returns text only.
 */
export const getCleanCategoryName = (categoryOrName, language = 'en', t = null, options = {}) => {
    if (!categoryOrName) return '';
    const { keepEmoji = false } = (typeof options === 'object' && options !== null) ? options : {};

    let full = '';
    let categoryEmoji = '';

    if (typeof categoryOrName === 'object') {
        categoryEmoji = categoryOrName.emoji || categoryOrName.icon || '';
        if (language === 'ta' && categoryOrName.name_ta) {
            full = categoryOrName.name_ta;
        } else {
            full = categoryOrName.name || categoryOrName.title || '';
        }
    } else {
        full = String(categoryOrName).trim();
    }

    if (!full) return '';

    // Extract any embedded emoji from string
    const embeddedEmojis = extractEmojis(full);
    const activeEmoji = categoryEmoji || embeddedEmojis;

    // Check optional translation function
    if (t && typeof t === 'function' && full.indexOf('(') === -1) {
        const translated = t(full);
        if (translated && translated !== full) {
            full = translated;
        }
    }

    const bracketIndex = full.indexOf('(');
    let chosenText = full;

    if (bracketIndex !== -1) {
        const part1 = full.substring(0, bracketIndex).trim();
        const part2 = full.substring(bracketIndex).replace(/^\(/, '').replace(/\)$/, '').trim();

        const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
        const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);

        let tamStr = '';
        let engStr = '';

        if (isPart1Tamil && !isPart2Tamil) {
            tamStr = part1;
            engStr = part2;
        } else if (isPart2Tamil && !isPart1Tamil) {
            tamStr = part2;
            engStr = part1;
        } else {
            engStr = part1;
            tamStr = part2;
        }

        chosenText = (language === 'ta' ? tamStr : engStr) || tamStr || engStr || full;
    } else {
        // If no brackets, check static translations dictionary
        const trimmed = full.trim();
        const cleanNoEmoji = stripEmojis(trimmed);
        let resolved = trimmed;

        if (staticCategoryTranslations[trimmed]) {
            resolved = staticCategoryTranslations[trimmed][language] || trimmed;
        } else if (cleanNoEmoji && staticCategoryTranslations[cleanNoEmoji]) {
            resolved = staticCategoryTranslations[cleanNoEmoji][language] || cleanNoEmoji;
        } else {
            for (const item of Object.values(staticCategoryTranslations)) {
                if (item.en === trimmed || item.ta === trimmed || (cleanNoEmoji && (item.en === cleanNoEmoji || item.ta === cleanNoEmoji))) {
                    resolved = item[language] || trimmed;
                    break;
                }
            }
        }
        chosenText = resolved;
    }

    const cleanFinalText = stripEmojis(chosenText);

    // If keepEmoji is requested, prepend the emoji if present
    if (keepEmoji) {
        if (activeEmoji) {
            return `${activeEmoji} ${cleanFinalText}`.trim();
        }
        return chosenText.trim();
    }

    // Strictly text only everywhere else
    return cleanFinalText;
};

/**
 * Universal category normalization:
 * Strips emojis, collapses whitespace, normalizes parentheses and casing.
 * Ensures '🍔Foods(உணவு)', 'Foods (உணவு)', and 'foods(உணவு)' all produce 'foods(உணவு)'.
 */
export const normCategoryKey = (str) => {
    if (!str || typeof str !== 'string') return '';
    return stripEmojis(str)
        .toLowerCase()
        .replace(/\s*\(\s*/g, '(')
        .replace(/\s*\)\s*/g, ')')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Checks if two category references (string or object) represent the same category.
 * Tolerates emoji presence/absence, whitespace variations, and bilingual bracket differences.
 */
export const areCategoriesMatching = (catA, catB) => {
    if (!catA || !catB) return false;

    // Check ID match if both are objects
    if (typeof catA === 'object' && typeof catB === 'object') {
        const idA = catA._id || catA.id;
        const idB = catB._id || catB.id;
        if (idA && idB && String(idA) === String(idB)) return true;
    }

    const strA = typeof catA === 'object' ? (catA.name || catA.name_ta || '') : String(catA);
    const strB = typeof catB === 'object' ? (catB.name || catB.name_ta || '') : String(catB);

    const normA = normCategoryKey(strA);
    const normB = normCategoryKey(strB);

    if (!normA || !normB) return false;
    if (normA === normB) return true;

    // Compare base English names (portion before '(')
    const baseA = normA.split('(')[0].replace(/[^a-z0-9]/g, '');
    const baseB = normB.split('(')[0].replace(/[^a-z0-9]/g, '');
    if (baseA && baseB && baseA === baseB) return true;

    // Compare Tamil portion inside '(' and ')'
    const taA = normA.match(/\(([^)]+)\)/)?.[1]?.trim();
    const taB = normB.match(/\(([^)]+)\)/)?.[1]?.trim();
    if (taA && taB && taA === taB) return true;

    // Also check name_ta if objects
    if (typeof catA === 'object' && catA.name_ta && normCategoryKey(catA.name_ta) === normB) return true;
    if (typeof catB === 'object' && catB.name_ta && normCategoryKey(catB.name_ta) === normA) return true;

    return false;
};

/**
 * Finds the canonical category object from a categories array.
 */
export const findCanonicalCategory = (categoryRef, categories = []) => {
    if (!categoryRef || !Array.isArray(categories)) return null;
    return categories.find(cat => areCategoriesMatching(categoryRef, cat)) || null;
};

/**
 * Universal subcategory normalization:
 * Strips emojis, trims whitespace, lowercases, and normalizes brackets.
 */
export const normSubcategoryKey = (str) => {
    if (!str || typeof str !== 'string') return '';
    return stripEmojis(str)
        .toLowerCase()
        .replace(/\s*\(\s*/g, '(')
        .replace(/\s*\)\s*/g, ')')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Checks if two subcategory strings represent the same subcategory.
 * Tolerates emojis, plural 's' differences (biscuit vs biscuits, wafer vs wafers),
 * casing, and bracket whitespace.
 */
export const areSubcategoriesMatching = (subA, subB) => {
    if (!subA || !subB) return false;
    const a = normSubcategoryKey(subA);
    const b = normSubcategoryKey(subB);
    if (!a || !b) return false;
    if (a === b) return true;

    // Plural tolerance for singular/plural differences
    const singularA = a.endsWith('s') && !a.endsWith('ss') ? a.slice(0, -1) : a;
    const singularB = b.endsWith('s') && !b.endsWith('ss') ? b.slice(0, -1) : b;
    if (singularA === singularB) return true;

    // Compare portion before '('
    const baseA = a.split('(')[0].trim();
    const baseB = b.split('(')[0].trim();
    if (baseA && baseB) {
        const sBaseA = baseA.endsWith('s') && !baseA.endsWith('ss') ? baseA.slice(0, -1) : baseA;
        const sBaseB = baseB.endsWith('s') && !baseB.endsWith('ss') ? baseB.slice(0, -1) : baseB;
        if (sBaseA === sBaseB) return true;
    }

    return false;
};


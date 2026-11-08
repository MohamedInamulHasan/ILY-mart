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
 * Helper to get clean category or subcategory name based on active language.
 * Completely strips brackets and hides the other language:
 * - When language is 'en': shows only English (no Tamil brackets).
 * - When language is 'ta': shows only Tamil (no English brackets).
 */
export const getCleanCategoryName = (categoryOrName, language = 'en', t = null) => {
    if (!categoryOrName) return '';
    let full = '';
    if (typeof categoryOrName === 'object') {
        if (language === 'ta' && categoryOrName.name_ta) {
            full = categoryOrName.name_ta;
        } else {
            full = categoryOrName.name || categoryOrName.title || '';
        }
    } else {
        full = String(categoryOrName).trim();
    }

    if (!full) return '';

    // Check optional translation function
    if (t && typeof t === 'function' && full.indexOf('(') === -1) {
        const translated = t(full);
        if (translated && translated !== full) {
            full = translated;
        }
    }

    const bracketIndex = full.indexOf('(');
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

        if (language === 'ta') {
            return tamStr || engStr || full;
        } else {
            return engStr || tamStr || full;
        }
    }

    // If no brackets, check static translations dictionary
    const trimmed = full.trim();
    if (staticCategoryTranslations[trimmed]) {
        return staticCategoryTranslations[trimmed][language] || trimmed;
    }
    // Check reverse (Tamil to English or vice-versa)
    for (const item of Object.values(staticCategoryTranslations)) {
        if (item.en === trimmed || item.ta === trimmed) {
            return item[language] || trimmed;
        }
    }

    return full;
};

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

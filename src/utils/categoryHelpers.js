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
    
    if (!categoryRef || !Array.isArray(categories)) return false;
    
    const catStr = String(categoryRef).trim().toLowerCase();
    const cat = categories.find(c => {
        if (!c) return false;
        const nameMatch = c.name && c.name.trim().toLowerCase() === catStr;
        const idMatch = (c._id && String(c._id) === catStr) || (c.id && String(c.id) === catStr);
        return nameMatch || idMatch;
    });

    return Boolean(cat?.isPreview === true || cat?.mode === 'preview');
};

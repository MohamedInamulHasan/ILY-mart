import { isStoreOpen } from './storeHelpers';

/**
 * Centrally groups products by name while applying "Smart Title" logic.
 * 
 * @param {Array} productList - The list of products to group.
 * @param {Array} stores - The list of stores to check for open status.
 * @param {Object} options - Options for grouping.
 * @param {boolean} options.exactMatch - If true, groups only by exact full title (default: false, groups by base name).
 * @param {string} options.forcedStoreId - If provided, treats the group as specific to this store.
 */
export const groupProducts = (productList, stores = [], options = {}) => {
    if (!productList || !Array.isArray(productList)) return [];

    const { exactMatch = false, forcedStoreId = null } = options;
    const groups = {};

    productList.forEach(p => {
        const fullTitle = p.title?.trim() || 'Unknown Product';
        let key;

        if (exactMatch) {
            key = fullTitle.toLowerCase();
        } else {
            // Group by base name (e.g. "Pizza (1kg)" -> "pizza")
            const bracketIndex = fullTitle.indexOf('(');
            key = (bracketIndex !== -1 ? fullTitle.substring(0, bracketIndex).trim() : fullTitle).toLowerCase();
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    });

    const result = [];
    Object.values(groups).forEach(group => {
        if (group.length > 1) {
            // 1. Sort variants: Open stores first, then by price
            group.sort((a, b) => {
                const storeA = stores.find(s => String(s._id || s.id) === String(a.storeId?._id || a.storeId || ''));
                const storeB = stores.find(s => String(s._id || s.id) === String(b.storeId?._id || b.storeId || ''));
                const isOpenA = storeA ? isStoreOpen(storeA) : true;
                const isOpenB = storeB ? isStoreOpen(storeB) : true;

                if (isOpenA && !isOpenB) return -1;
                if (!isOpenA && isOpenB) return 1;
                return Number(a.price) - Number(b.price);
            });

            const displayProduct = group[0];
            const anyStoreOpen = group.some(p => {
                const pStoreId = String(p.storeId?._id || p.storeId || '');
                const pStore = stores.find(s => String(s._id || s.id) === pStoreId);
                return pStore ? isStoreOpen(pStore) : true;
            });

            // 2. Build "Smart Title" with brackets
            const baseName = displayProduct.title.split('(')[0].trim();

            // Priority for bracket content:
            // a. Explicit bracket from any variant (prefer Tamil)
            const variantWithTamilBracket = group.find(p => {
                const m = p.title?.match(/\(([^)]+)\)/);
                return m && /[^\x00-\x7F]/.test(m[1]);
            });
            const variantWithAnyBracket = group.find(p => p.title?.includes('('));
            const variantWithTamilTitle = group.find(p => p.title_ta && p.title_ta !== p.title);

            let bracketText = '';
            if (variantWithTamilBracket) {
                bracketText = variantWithTamilBracket.title.match(/\(([^)]+)\)/)[1];
            } else if (variantWithAnyBracket) {
                bracketText = variantWithAnyBracket.title.match(/\(([^)]+)\)/)[1];
            } else if (variantWithTamilTitle) {
                bracketText = variantWithTamilTitle.title_ta;
            }

            const groupTitle = bracketText ? `${baseName} (${bracketText})` : baseName;

            // 3. Construct Group Object
            const prices = group.map(p => Number(p.price));
            result.push({
                ...displayProduct,
                title: groupTitle,
                isGroup: true,
                variantExtraCount: group.length - 1,
                anyStoreOpen: anyStoreOpen,
                minPrice: Math.min(...prices),
                maxPrice: Math.max(...prices),
                isGold: group.some(p => p.isGold === true || p.deliveryCharge === 0 || p.isFreeDelivery === true || p.freeDelivery === true),
                _id: `group-${displayProduct._id || displayProduct.id}`,
                id: `group-${displayProduct._id || displayProduct.id}`,
                storeId: forcedStoreId || displayProduct.storeId, // Preverve storeId from first product if no forced ID
                variants: group
            });
        } else {
            result.push(group[0]);
        }
    });

    return result;
};

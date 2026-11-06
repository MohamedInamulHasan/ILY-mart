import { isStoreOpen } from './storeHelpers';

/**
 * Sorts products based on:
 * 1. Store Open Status (Open > Closed)
 * 2. Gold Status (Gold > Regular)
 * 
 * @param {Array} products - List of products to sort
 * @param {Array} stores - List of available stores
 * @returns {Array} - Sorted products
 */
export const sortProductsByGoldAndOpen = (products, stores) => {
    if (!products || !Array.isArray(products)) return [];
    if (!stores || !Array.isArray(stores)) return products; // Cannot sort by store status effectively without stores

    return [...products].sort((a, b) => {
        // Helper to get open status
        const getStatus = (item) => {
            if (!item) return false;

            // Handle Group Products
            if (item.isGroup) {
                return item.anyStoreOpen;
            }

            // Normal Products
            const sId = item.storeId?._id || item.storeId;
            const store = stores.find(st => (st._id || st.id) === sId);
            return store ? isStoreOpen(store) : true; // Default to OPEN if store not found (matches ProductCard visual)
        };

        const isOpenA = getStatus(a);
        const isOpenB = getStatus(b);

        // 1. Primary Sort: Store Open Status
        if (isOpenA !== isOpenB) {
            return isOpenA ? -1 : 1; // Open comes first
        }

        return 0; // Maintain original/random order without forcing gold products first
    });
};

const fs = require('fs');

// 1. Update productController.js
let productContent = fs.readFileSync('backend/src/controllers/productController.js', 'utf8');

if (!productContent.includes('productCatalogCache')) {
    const cacheHeader = `// In-memory catalog cache for public GET queries (TTL 60s)
const productCatalogCache = new Map();
const PRODUCT_CACHE_TTL = 60 * 1000;

export const invalidateProductCache = () => {
    productCatalogCache.clear();
};
`;
    productContent = cacheHeader + productContent;

    // Inside getProducts, right after const { category, search, featured, page, limit, fields } = req.query;
    const queryExtract = "const { category, search, featured, page, limit, fields } = req.query;";
    const cacheCheck = `const { category, search, featured, page, limit, fields } = req.query;

        // Check in-memory cache for standard public catalog queries
        const isPublicCacheable = !isAdmin && !search;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;
        const cacheKey = isPublicCacheable 
            ? \`cat_\${category || 'all'}_feat_\${featured || 'all'}_store_\${req.query.storeId || 'all'}_p_\${pageNum}_l_\${limitNum}_f_\${fields || 'all'}\`
            : null;

        if (cacheKey && productCatalogCache.has(cacheKey)) {
            const cached = productCatalogCache.get(cacheKey);
            if (Date.now() - cached.timestamp < PRODUCT_CACHE_TTL) {
                return res.status(200).json(cached.payload);
            } else {
                productCatalogCache.delete(cacheKey);
            }
        }`;

    // Need to move const roles / isAdmin before cache check
    const rolesTarget = `        // By default, only show available products
        // Unless user is admin/store_admin AND explicitly asks for all (or we just show all for them?)
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isAdmin = req.user && (roles.includes('admin') || roles.includes('store_admin'));`;

    // Replace the opening of getProducts
    const getProductsOpen = `export const getProducts = async (req, res, next) => {
    console.log('🔍 GET /api/products - Request received');
    try {
        const { category, search, featured, page, limit, fields } = req.query;
        let query = {};

        // By default, only show available products
        // Unless user is admin/store_admin AND explicitly asks for all (or we just show all for them?)
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isAdmin = req.user && (roles.includes('admin') || roles.includes('store_admin'));`;

    const getProductsReplacement = `export const getProducts = async (req, res, next) => {
    try {
        const { category, search, featured, page, limit, fields } = req.query;
        let query = {};

        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isAdmin = req.user && (roles.includes('admin') || roles.includes('store_admin'));

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;

        // Check in-memory cache for standard public catalog queries
        const isPublicCacheable = !isAdmin && !search;
        const cacheKey = isPublicCacheable 
            ? \`cat_\${category || 'all'}_feat_\${featured || 'all'}_store_\${req.query.storeId || 'all'}_p_\${pageNum}_l_\${limitNum}_f_\${fields || 'all'}\`
            : null;

        if (cacheKey && productCatalogCache.has(cacheKey)) {
            const cached = productCatalogCache.get(cacheKey);
            if (Date.now() - cached.timestamp < PRODUCT_CACHE_TTL) {
                return res.status(200).json(cached.payload);
            } else {
                productCatalogCache.delete(cacheKey);
            }
        }`;

    productContent = productContent.replace(getProductsOpen, getProductsReplacement);

    // Remove the duplicate pageNum / limitNum declaration further down
    productContent = productContent.replace(
        `        // Pagination\n        const pageNum = parseInt(page, 10) || 1;\n        const limitNum = parseInt(limit, 10) || 12; // Default 12 items per page (reduced from 50 for performance)`,
        `        // Pagination`
    );

    // Save payload to cache
    const resTarget = `        res.status(200).json({
            success: true,
            count: processedProducts.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: processedProducts
        });`;

    const resReplacement = `        const payload = {
            success: true,
            count: processedProducts.length,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            data: processedProducts
        };

        if (cacheKey) {
            productCatalogCache.set(cacheKey, {
                timestamp: Date.now(),
                payload
            });
        }

        res.status(200).json(payload);`;

    productContent = productContent.replace(resTarget, resReplacement);

    // Invalidate in mutations
    productContent = productContent.replace(
        `getIO().emit('product:updated', product);`,
        `invalidateProductCache();\n        getIO().emit('product:updated', product);`
    );
    productContent = productContent.replace(
        `getIO().emit('product:updated');`,
        `invalidateProductCache();\n        getIO().emit('product:updated');`
    );

    fs.writeFileSync('backend/src/controllers/productController.js', productContent, 'utf8');
    console.log('✅ Updated productController.js with in-memory caching');
} else {
    console.log('ℹ️ productController.js already has caching');
}

// 2. Update categoryController.js
let categoryContent = fs.readFileSync('backend/src/controllers/categoryController.js', 'utf8');
if (!categoryContent.includes('categoryCache')) {
    const catCacheHeader = `// In-memory cache for categories (TTL 60s)
let categoryCache = null;
let categoryCacheTimestamp = 0;
const CATEGORY_CACHE_TTL = 60 * 1000;

export const invalidateCategoryCache = () => {
    categoryCache = null;
    categoryCacheTimestamp = 0;
};
`;
    categoryContent = catCacheHeader + categoryContent;

    const catGetTarget = `export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true }).lean()`;

    const catGetReplacement = `export const getCategories = async (req, res, next) => {
    try {
        if (categoryCache && (Date.now() - categoryCacheTimestamp < CATEGORY_CACHE_TTL)) {
            return res.status(200).json(categoryCache);
        }
        const categories = await Category.find({ isActive: true }).lean()`;

    categoryContent = categoryContent.replace(catGetTarget, catGetReplacement);

    const catResTarget = `        res.status(200).json({
            success: true,
            count: processedCategories.length,
            data: processedCategories
        });`;

    const catResReplacement = `        const payload = {
            success: true,
            count: processedCategories.length,
            data: processedCategories
        };
        categoryCache = payload;
        categoryCacheTimestamp = Date.now();
        res.status(200).json(payload);`;

    categoryContent = categoryContent.replace(catResTarget, catResReplacement);

    // Invalidate on mutations
    categoryContent = categoryContent.replace(
        /res\.status\(201\)\.json\(\{/g,
        'invalidateCategoryCache();\n        res.status(201).json({'
    );
    categoryContent = categoryContent.replace(
        /await Category\.findByIdAndDelete/g,
        'invalidateCategoryCache();\n        await Category.findByIdAndDelete'
    );
    categoryContent = categoryContent.replace(
        /await Category\.findByIdAndUpdate/g,
        'invalidateCategoryCache();\n        await Category.findByIdAndUpdate'
    );

    fs.writeFileSync('backend/src/controllers/categoryController.js', categoryContent, 'utf8');
    console.log('✅ Updated categoryController.js with in-memory caching');
}

// 3. Update storeController.js
let storeContent = fs.readFileSync('backend/src/controllers/storeController.js', 'utf8');
if (!storeContent.includes('storeCache')) {
    const storeCacheHeader = `// In-memory cache for stores (TTL 60s)
let storeCache = null;
let storeCacheTimestamp = 0;
const STORE_CACHE_TTL = 60 * 1000;

export const invalidateStoreCache = () => {
    storeCache = null;
    storeCacheTimestamp = 0;
};
`;
    storeContent = storeCacheHeader + storeContent;

    const storeGetTarget = `export const getStores = async (req, res, next) => {
    try {
        const { search, isActive } = req.query;`;

    const storeGetReplacement = `export const getStores = async (req, res, next) => {
    try {
        const { search, isActive } = req.query;
        if (!search && storeCache && (Date.now() - storeCacheTimestamp < STORE_CACHE_TTL)) {
            return res.status(200).json(storeCache);
        }
`;

    storeContent = storeContent.replace(storeGetTarget, storeGetReplacement);

    const storeResTarget = `        res.status(200).json({
            success: true,
            count: processedStores.length,
            data: processedStores
        });`;

    const storeResReplacement = `        const payload = {
            success: true,
            count: processedStores.length,
            data: processedStores
        };
        if (!search) {
            storeCache = payload;
            storeCacheTimestamp = Date.now();
        }
        res.status(200).json(payload);`;

    storeContent = storeContent.replace(storeResTarget, storeResReplacement);

    // Invalidate on mutations
    storeContent = storeContent.replace(
        /res\.status\(201\)\.json\(\{/g,
        'invalidateStoreCache();\n        res.status(201).json({'
    );
    storeContent = storeContent.replace(
        /await Store\.findByIdAndDelete/g,
        'invalidateStoreCache();\n        await Store.findByIdAndDelete'
    );
    storeContent = storeContent.replace(
        /await Store\.findByIdAndUpdate/g,
        'invalidateStoreCache();\n        await Store.findByIdAndUpdate'
    );

    fs.writeFileSync('backend/src/controllers/storeController.js', storeContent, 'utf8');
    console.log('✅ Updated storeController.js with in-memory caching');
}


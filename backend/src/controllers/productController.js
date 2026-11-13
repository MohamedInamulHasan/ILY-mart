// In-memory catalog cache for public GET queries (TTL 60s)
const productCatalogCache = new Map();
const PRODUCT_CACHE_TTL = 60 * 1000;

export const invalidateProductCache = () => {
    productCatalogCache.clear();
};
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Store from '../models/Store.js';
import { getIO } from '../socket.js';
import { deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
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
            ? `cat_${category || 'all'}_feat_${featured || 'all'}_store_${req.query.storeId || 'all'}_p_${pageNum}_l_${limitNum}_f_${fields || 'all'}`
            : null;

        if (cacheKey && productCatalogCache.has(cacheKey)) {
            const cached = productCatalogCache.get(cacheKey);
            if (Date.now() - cached.timestamp < PRODUCT_CACHE_TTL) {
                return res.status(200).json(cached.payload);
            } else {
                productCatalogCache.delete(cacheKey);
            }
        }

        if (!isAdmin) {
            query.isAvailable = true;
        } else {
            // If admin, they can filter by availability if they want, 
            // but if they don't specify, maybe we show all?
            // Let's check if 'isAvailable' param was passed? 
            // Typically admin dashboard might want to see all.
            if (req.query.isAvailable) {
                query.isAvailable = req.query.isAvailable === 'true';
            }
        }

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (featured) {
            query.featured = featured === 'true';
        }

        if (req.query.storeId) {
            query.storeId = req.query.storeId;
        }

        // Pagination
        const skip = (pageNum - 1) * limitNum;

        // Field selection (if specified)
        let selectFields = '';
        if (fields) {
            selectFields = fields.split(',').join(' ');
        }

        // Execute query with pagination
        // Removed .populate() to avoid N+1 query issue - frontend already has stores
        // TEMPORARY DEBUG: Exclude image to test if it's too big (Base64)
        // Concurrent query with lean() for 4x faster execution & minimal memory
        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Product.countDocuments(query)
        ]);

        // Clean lightweight image payloads
        const processedProducts = products.map(productObj => {
            if (productObj.image && productObj.image.startsWith('data:image')) {
                productObj.image = null;
            }
            return productObj;
        });

        const payload = {
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

        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('storeId', 'name').lean();

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Check availability logic
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isAdmin = req.user && (roles.includes('admin') || roles.includes('store_admin'));
        if (!product.isAvailable && !isAdmin) {
            res.status(404);
            throw new Error('Product not found');
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
    try {
        // Store Admin Restriction: Enforce storeId
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        if (roles.includes('store_admin')) {
            req.body.storeId = req.user.storeId;
        }

        if (!req.body.image) {
            req.body.image = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product';
        }
        if (!req.body.images || req.body.images.length === 0) {
            req.body.images = [req.body.image];
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            data: product
        });

        // Real-time update
        invalidateProductCache();
        getIO().emit('product:updated', product);
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
    try {
        // Prevent overwriting existing image with empty string
        const updateData = { ...req.body };
        if (!updateData.image) {
            delete updateData.image;
        }

        // Also cleanup images array if it contains empty strings
        if (updateData.images && Array.isArray(updateData.images)) {
            updateData.images = updateData.images.filter(img => img && img.trim() !== '');
            if (updateData.images.length === 0) {
                delete updateData.images;
            }
        }

        let product = await Product.findById(req.params.id);

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Store Admin Restriction: Verify ownership
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        if (roles.includes('store_admin')) {
            if (product.storeId && product.storeId.toString() !== req.user.storeId.toString()) {
                res.status(403);
                throw new Error('Not authorized to update this product');
            }
        }

        product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            data: product
        });

        // Real-time update
        invalidateProductCache();
        getIO().emit('product:updated', product);
    } catch (error) {
        next(error);
    }
};

// @desc    Get product image
// @route   GET /api/products/:id/image
// @access  Public
export const getProductImage = async (req, res, next) => {
    try {
        console.log(`🖼️ Fetching image for product: ${req.params.id}`);
        const product = await Product.findById(req.params.id).select('image images');

        if (!product || (!product.image && (!product.images || product.images.length === 0))) {
            console.warn(`⚠️ Image not found for product: ${req.params.id}`);
            return res.status(404).send('Image not found');
        }

        const imageToServe = product.image || product.images[0];

        console.log(`✅ Image found for product: ${req.params.id}, length: ${imageToServe.length}`);

        // Check if it's a Base64 string
        if (imageToServe.startsWith('data:image')) {
            const matches = imageToServe.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches.length !== 3) {
                return res.status(404).send('Invalid image data');
            }
            const type = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');

            res.writeHead(200, {
                'Content-Type': type,
                'Content-Length': buffer.length
            });
            res.end(buffer);
        } else {
            // It's a URL (Cloudinary or placeholder)
            // Add Cloudinary optimization params if it's a cloudinary URL
            let imageUrl = imageToServe;
            if (imageUrl.includes('cloudinary.com')) {
                // Insert q_auto,f_auto into the URL for optimization
                // Typically after /upload/
                imageUrl = imageUrl.replace('/upload/', '/upload/q_auto,f_auto/');
            }
            res.redirect(imageUrl);
        }
    } catch (error) {
        next(error);
    }
};

export const deleteProduct = async (req, res, next) => {
    try {
        const productToCheck = await Product.findById(req.params.id);

        if (!productToCheck) {
            res.status(404);
            throw new Error('Product not found');
        }

        // Store Admin Restriction: Verify ownership
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        if (roles.includes('store_admin')) {
            if (productToCheck.storeId && productToCheck.storeId.toString() !== req.user.storeId.toString()) {
                res.status(403);
                throw new Error('Not authorized to delete this product');
            }
        }

        // Delete image(s) from Cloudinary
        if (productToCheck.image) {
            await deleteFromCloudinary(productToCheck.image);
        }
        if (Array.isArray(productToCheck.images) && productToCheck.images.length > 0) {
            await deleteFromCloudinary(productToCheck.images);
        }

        await Product.findByIdAndDelete(req.params.id);


        res.status(200).json({
            success: true,
            data: {}
        });

        // Real-time update
        invalidateProductCache();
        getIO().emit('product:updated');
    } catch (error) {
        next(error);
    }
};

// @desc    Bulk Delete Products by IDs
// @route   DELETE /api/products/bulk-delete
// @access  Private (Admin / Store Admin)
export const bulkDeleteProducts = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide an array of product IDs to delete.' });
        }

        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];

        // Store Admin: can only delete their own store's products
        let filter = { _id: { $in: ids } };
        if (roles.includes('store_admin') && !roles.includes('admin')) {
            filter.storeId = req.user.storeId;
        }

        // Delete Cloudinary images for each product
        const productsToDelete = await Product.find(filter).select('image images');
        for (const p of productsToDelete) {
            if (p.image) await deleteFromCloudinary(p.image).catch(() => {});
            if (Array.isArray(p.images) && p.images.length > 0) await deleteFromCloudinary(p.images).catch(() => {});
        }

        const result = await Product.deleteMany(filter);

        invalidateProductCache();
        getIO().emit('product:updated');

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} product(s).`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove duplicate products (keep oldest copy of each title+price+unit+storeId)
// @route   POST /api/products/dedup
// @access  Private (Admin)
export const dedupProducts = async (req, res, next) => {
    try {
        // Find all duplicates grouped by title + price + unit + storeId
        // Products with same name but different price/unit are legitimate variants
        const dupes = await Product.aggregate([
            { $group: {
                _id: { title: { $toLower: '$title' }, price: '$price', unit: { $toLower: { $ifNull: ['$unit', ''] } }, storeId: '$storeId' },
                ids: { $push: '$_id' },
                count: { $sum: 1 }
            }},
            { $match: { count: { $gt: 1 } } }
        ]);

        let totalRemoved = 0;
        for (const group of dupes) {
            // Keep the first (oldest) product, delete the rest
            const idsToDelete = group.ids.slice(1);
            const delResult = await Product.deleteMany({ _id: { $in: idsToDelete } });
            totalRemoved += delResult.deletedCount;
        }

        if (totalRemoved > 0) {
            invalidateProductCache();
            try { getIO().emit('product:updated'); } catch (e) {}
        }

        res.status(200).json({
            success: true,
            message: `Removed ${totalRemoved} duplicate product(s) from ${dupes.length} group(s).`,
            data: { removed: totalRemoved, groups: dupes.length }
        });
    } catch (error) {
        next(error);
    }
};

// Simple CSV parser for product bulk upload (no external dependencies)
function parseSimpleCSV(content) {
    if (!content || typeof content !== 'string') return [];
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];

    const parseRow = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        result.push(cur.trim());
        return result;
    };

    const firstRow = parseRow(lines[0]);
    const isHeader = firstRow.some(col =>
        ['title', 'name', 'price', 'category', 'subcategory', 'sub_category', 'unit', 'description', 'stock', 'store', 'store_name', 'storename'].includes(col.toLowerCase())
    );

    let headers;
    let dataLines;
    if (isHeader) {
        headers = firstRow.map(h => h.toLowerCase().trim());
        dataLines = lines.slice(1);
    } else {
        headers = ['title', 'price', 'category', 'subcategory', 'unit', 'description', 'store'];
        dataLines = lines;
    }

    const items = [];
    for (const line of dataLines) {
        const cols = parseRow(line);
        if (cols.length === 0 || !cols.some(c => c.length > 0)) continue;
        const obj = {};
        headers.forEach((h, idx) => {
            if (cols[idx] !== undefined) {
                obj[h] = cols[idx];
            }
        });
        if (obj.title || obj.name) {
            items.push(obj);
        }
    }
    return items;
}

// @desc    Bulk Import Products from CSV or JSON text (Direct DB import - No AI, No auto images)
// @route   POST /api/products/bulk-import
// @access  Private (Admin / Store Admin)
export const bulkImportProducts = async (req, res, next) => {
    try {
        const { text, products: incomingProducts, storeId: bodyStoreId } = req.body;
        let items = [];

        if (Array.isArray(incomingProducts) && incomingProducts.length > 0) {
            items = incomingProducts;
        } else if (typeof text === 'string' && text.trim().length > 0) {
            const trimmed = text.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                const parsed = JSON.parse(trimmed);
                items = Array.isArray(parsed) ? parsed : [parsed];
            } else {
                items = parseSimpleCSV(trimmed);
            }
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid products found. Please provide CSV text or products list.'
            });
        }

        // Store admin restriction
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        const isStoreAdmin = roles.includes('store_admin');
        const forcedStoreId = isStoreAdmin ? req.user.storeId : null;

        // Fetch all existing stores to match store names from CSV
        const storeMap = new Map();
        try {
            const allStores = await Store.find({}).select('_id name');
            allStores.forEach(s => {
                if (s.name) storeMap.set(s.name.toLowerCase().trim(), s._id);
            });
        } catch (storeLookupErr) {
            console.warn('Could not load stores for lookup:', storeLookupErr.message);
        }

        const defaultPlaceholderImage = 'https://placehold.co/400x400/e2e8f0/64748b?text=Product';
        const docsToInsert = [];

        for (const item of items) {
            const title = (item.title || item.name || '').trim();
            if (!title) continue;

            const rawPrice = (item.price || '').toString().replace(/[^0-9.]/g, '');
            const price = parseFloat(rawPrice);
            if (isNaN(price)) continue;

            const category = (item.category || 'Grocery').trim();
            const rawSub = (item.subcategory || item.subCategory || item.sub_category || '').toString().trim();
            const subcategory = rawSub
                ? rawSub.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0)
                : [];
            const unit = (item.unit || item.weight || '').trim();
            const description = (item.description || title).trim();

            // Stock is completely optional: default to 999 so items are always available
            const rawStock = item.stock !== undefined && item.stock !== ''
                ? parseInt(item.stock.toString().replace(/[^0-9]/g, ''), 10)
                : 999;
            const stock = !isNaN(rawStock) ? rawStock : 999;

            const image = (item.image || '').trim() || defaultPlaceholderImage;

            // Resolve store: CSV row store name > body storeId > forced store admin storeId
            const rowStoreName = (item.store || item.store_name || item.storeName || '').toString().trim().toLowerCase();
            let matchedStoreId = rowStoreName && storeMap.has(rowStoreName) ? storeMap.get(rowStoreName) : null;
            if (!matchedStoreId && item.storeId) matchedStoreId = item.storeId;
            const finalStoreId = forcedStoreId || matchedStoreId || bodyStoreId || null;

            docsToInsert.push({
                title,
                price,
                category,
                subcategory,
                unit,
                description,
                stock,
                image,
                images: [image],
                isAvailable: true,
                storeId: finalStoreId ? new mongoose.Types.ObjectId(finalStoreId) : undefined
            });
        }

        if (docsToInsert.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid products to insert. Please ensure each row has title and price.'
            });
        }

        // Deduplicate: skip products that already exist with the same title+price+unit+storeId
        // Products with same name but different price/unit are legitimate variants
        const storeIds = [...new Set(docsToInsert.map(d => d.storeId?.toString()).filter(Boolean))];
        const existingProducts = storeIds.length > 0
            ? await Product.find({ storeId: { $in: storeIds } }).select('title price unit storeId').lean()
            : [];
        const existingSet = new Set(
            existingProducts.map(p => `${(p.title || '').toLowerCase().trim()}::${p.price || 0}::${(p.unit || '').toLowerCase().trim()}::${p.storeId?.toString() || ''}`)
        );
        const uniqueDocs = docsToInsert.filter(d => {
            const key = `${(d.title || '').toLowerCase().trim()}::${d.price || 0}::${(d.unit || '').toLowerCase().trim()}::${d.storeId?.toString() || ''}`;
            return !existingSet.has(key);
        });
        const skippedCount = docsToInsert.length - uniqueDocs.length;

        if (uniqueDocs.length === 0) {
            return res.status(200).json({
                success: true,
                message: `All ${docsToInsert.length} products already exist in the store. Nothing new to import.`,
                data: { inserted: 0, skipped: skippedCount, total: items.length }
            });
        }

        const inserted = await Product.insertMany(uniqueDocs);

        invalidateProductCache();
        try {
            getIO().emit('product:updated');
        } catch (e) {
            // Ignore socket warning
        }

        res.status(200).json({
            success: true,
            message: `Successfully imported ${inserted.length} of ${items.length} products` + (skippedCount > 0 ? ` (${skippedCount} duplicates skipped)` : ''),
            data: {
                inserted: inserted.length,
                skipped: skippedCount,
                total: items.length
            }
        });
    } catch (error) {
        console.error('Error in bulkImportProducts:', error);
        next(error);
    }
};

// @desc    Update products order
// @route   PUT /api/products/reorder
// @access  Private/Admin
export const updateProductsOrder = async (req, res, next) => {
    try {
        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            res.status(400);
            throw new Error('Please provide an array of ordered IDs');
        }

        // Store Admin Restriction: Verify that ALL orderedIds belong to the user's store
        const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
        if (roles.includes('store_admin')) {
            const count = await Product.countDocuments({
                _id: { $in: orderedIds },
                storeId: req.user.storeId
            });

            if (count !== orderedIds.length) {
                res.status(403);
                throw new Error('Not authorized to reorder products from other stores');
            }
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { order: index }
            }
        }));

        await Product.bulkWrite(bulkOps);

        res.status(200).json({
            success: true,
            message: 'Products reordered successfully'
        });

        // Real-time update
        invalidateProductCache();
        getIO().emit('product:updated');
    } catch (error) {
        next(error);
    }
};

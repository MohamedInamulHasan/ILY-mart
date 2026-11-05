// In-memory cache for stores (TTL 60s)
let storeCache = null;
let storeCacheTimestamp = 0;
const STORE_CACHE_TTL = 60 * 1000;

export const invalidateStoreCache = () => {
    storeCache = null;
    storeCacheTimestamp = 0;
};
import Store from '../models/Store.js';
import bcrypt from 'bcryptjs';
import { deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public
export const getStores = async (req, res, next) => {
    try {
        const { type, city } = req.query;
        let query = { isActive: true };

        if (type) {
            query.type = type;
        }

        if (city) {
            query.city = { $regex: city, $options: 'i' };
        }

        const stores = await Store.find({}).lean()
            .sort({ order: 1, createdAt: -1 });

        // Smart Image Filtering for Stores
        const processedStores = stores.map(store => {
            const storeObj = store;
            if (storeObj.image && storeObj.image.startsWith('data:image')) {
                storeObj.image = null;
            }
            return storeObj;
        });

        const payload = {
            success: true,
            count: processedStores.length,
            data: processedStores
        };
        storeCache = payload;
        storeCacheTimestamp = Date.now();
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
};

// @desc    Update stores order
// @route   PUT /api/stores/reorder
// @access  Private/Admin
export const updateStoresOrder = async (req, res, next) => {
    try {
        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            res.status(400);
            throw new Error('Please provide an array of ordered IDs');
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { order: index }
            }
        }));

        await Store.bulkWrite(bulkOps);

        res.status(200).json({
            success: true,
            message: 'Stores reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Public
export const getStore = async (req, res, next) => {
    try {
        const store = await Store.findById(req.params.id).lean();

        if (!store) {
            res.status(404);
            throw new Error('Store not found');
        }

        res.status(200).json({
            success: true,
            data: store
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new store
// @route   POST /api/stores
// @access  Private/Admin
export const createStore = async (req, res, next) => {
    try {
        if (req.body && req.body.location) { req.body.location = await autoNormalizeStoreLocation(req.body.location); }
        const store = await Store.create(req.body);

        invalidateStoreCache();
        res.status(201).json({
            success: true,
            data: store
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private/Admin
export const updateStore = async (req, res, next) => {
    try {
        // Prevent overwriting existing image with empty string
        const updateData = { ...req.body };
        if (updateData.location) { updateData.location = await autoNormalizeStoreLocation(updateData.location); }
        if (!updateData.image) {
            delete updateData.image;
        }

        // Explicitly handle fields if needed, but findByIdAndUpdate is generally fine
        // for fields that exist in the schema.

        invalidateStoreCache();
        const store = await Store.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!store) {
            res.status(404);
            throw new Error('Store not found');
        }

        res.status(200).json({
            success: true,
            data: store
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private/Admin
export const deleteStore = async (req, res, next) => {
    try {
        const storeId = req.params.id;

        // Important: Import Product model dynamically to avoid circular dependencies if any
        // and to ensure we can update associated products
        const Product = await import('../models/Product.js').then(m => m.default);

        // Before deleting the store, delete all associated products and their Cloudinary images
        console.log(`📦 Deleting products and images from store ${storeId}...`);
        const storeProducts = await Product.find({ storeId: storeId });
        for (const prod of storeProducts) {
            if (prod.image) await deleteFromCloudinary(prod.image);
            if (Array.isArray(prod.images)) await deleteFromCloudinary(prod.images);
        }
        const deleteResult = await Product.deleteMany({ storeId: storeId });
        console.log(`✅ Deleted ${deleteResult.deletedCount} products and their images.`);

        const store = await Store.findById(storeId).lean();
        if (!store) {
            res.status(404);
            throw new Error('Store not found');
        }

        // Delete store images from Cloudinary
        if (store.image) await deleteFromCloudinary(store.image);
        if (store.logo) await deleteFromCloudinary(store.logo);
        if (store.bannerImage) await deleteFromCloudinary(store.bannerImage);

        invalidateStoreCache();
        await Store.findByIdAndDelete(storeId);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify store password
// @route   POST /api/stores/:id/verify-password
// @access  Private/Admin
export const verifyStorePassword = async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password) {
            res.status(400);
            throw new Error('Please provide a password');
        }

        const store = await Store.findById(req.params.id).lean().select('+password');

        if (!store) {
            res.status(404);
            throw new Error('Store not found');
        }

        const isMatch = await bcrypt.compare(password, store.password);

        if (!isMatch) {
            res.status(401);
            throw new Error('Invalid password');
        }

        res.status(200).json({
            success: true,
            message: 'Password verified'
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Get store image
// @route   GET /api/stores/:id/image
// @access  Public
export const getStoreImage = async (req, res, next) => {
    try {
        console.log(`🏪 Fetching image for store: ${req.params.id}`);
        const store = await Store.findById(req.params.id).lean().select('image');

        if (!store || !store.image) {
            console.warn(`⚠️ Image not found for store: ${req.params.id}`);
            return res.status(404).send('Image not found');
        }

        if (store.image.startsWith('data:image')) {
            const matches = store.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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
            res.redirect(store.image);
        }
    } catch (error) {
        next(error);
    }
};

// Helper to auto-normalize short or redirecting map links
async function autoNormalizeStoreLocation(location) {
    if (!location || typeof location !== 'string') return location;
    const trimmed = location.trim();
    if (!trimmed.includes('goo.gl') && !trimmed.includes('maps.app')) {
        const directMatch = trimmed.match(/^([-]?\d+\.\d+)[\s,+]+\s*([-]?\d+\.\d+)$/);
        if (directMatch) return `https://www.google.com/maps?q=${directMatch[1]},${directMatch[2]}`;
        return trimmed;
    }
    try {
        const target = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        const resp = await fetch(target, {
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const finalUrl = resp.url || target;
        const decoded = decodeURIComponent(decodeURIComponent(finalUrl));
        const coordMatch = decoded.match(/([-]?\d+\.\d+)[\s,+]+\s*([-]?\d+\.\d+)/);
        if (coordMatch) {
            return `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`;
        }
        return finalUrl;
    } catch (e) {
        console.warn('Auto normalize location error:', e.message);
        try {
            const uResp = await fetch('https://unshorten.me/json/' + encodeURIComponent(trimmed));
            const uData = await uResp.json();
            if (uData && uData.resolved_url) {
                const uDecoded = decodeURIComponent(decodeURIComponent(uData.resolved_url));
                const m = uDecoded.match(/([-]?\d+\.\d+)[\s,+]+\s*([-]?\d+\.\d+)/);
                if (m) return `https://www.google.com/maps?q=${m[1]},${m[2]}`;
                return uData.resolved_url;
            }
        } catch (uErr) {}
    }
    return trimmed;
}

// @desc    Resolve short map links (e.g. maps.app.goo.gl) to direct coordinates URL
// @route   GET /api/stores/resolve-map-link
// @access  Public
export const resolveMapLink = async (req, res, next) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }
        const resolved = await autoNormalizeStoreLocation(url);
        const m = resolved.match(/([-]?\d+\.\d+)[\s,+]+\s*([-]?\d+\.\d+)/);
        res.json({
            success: true,
            originalUrl: url,
            resolvedUrl: resolved,
            coords: m ? { lat: m[1], lng: m[2] } : null
        });
    } catch (error) {
        console.error('Error resolving map link:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

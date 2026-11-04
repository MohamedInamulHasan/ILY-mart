// In-memory catalog cache for public GET queries (TTL 60s)
const productCatalogCache = new Map();
const PRODUCT_CACHE_TTL = 60 * 1000;

export const invalidateProductCache = () => {
    productCatalogCache.clear();
};
import mongoose from 'mongoose';
import Product from '../models/Product.js';
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

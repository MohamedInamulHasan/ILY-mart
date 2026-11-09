// In-memory cache for categories (TTL 60s)
let categoryCache = null;
let categoryCacheTimestamp = 0;
const CATEGORY_CACHE_TTL = 60 * 1000;

export const invalidateCategoryCache = () => {
    categoryCache = null;
    categoryCacheTimestamp = 0;
};
import Category from '../models/Category.js';
import { getIO } from '../socket.js';
import { deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
    try {
        if (categoryCache && (Date.now() - categoryCacheTimestamp < CATEGORY_CACHE_TTL)) {
            return res.status(200).json(categoryCache);
        }
        const categories = await Category.find({ isActive: true }).lean()
            .sort({ order: 1, name: 1 });

        // Smart Image Filtering for Categories
        const processedCategories = categories.map(cat => {
            const catObj = cat;
            if (catObj.image && catObj.image.startsWith('data:image')) {
                catObj.image = null;
            }
            if (catObj.storeImage && catObj.storeImage.startsWith('data:image')) {
                catObj.storeImage = null;
            }
            return catObj;
        });

        const payload = {
            success: true,
            count: processedCategories.length,
            data: processedCategories
        };
        categoryCache = payload;
        categoryCacheTimestamp = Date.now();
        res.status(200).json(payload);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id).lean();

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
    try {
        const { name, name_ta, description, icon, image, storeImage, subcategories, subcategoryImages, isPreview, mode, mainCategory } = req.body;

        // Check if category already exists
        const categoryExists = await Category.findOne({ name });

        if (categoryExists) {
            res.status(400);
            throw new Error('Category already exists');
        }

        const category = await Category.create({
            name,
            name_ta,
            description,
            icon,
            image,
            storeImage: storeImage || '',
            subcategories: subcategories || [],
            subcategoryImages: subcategoryImages || {},
            isPreview: Boolean(isPreview === true || mode === 'preview'),
            mode: mode || (isPreview ? 'preview' : 'normal'),
            mainCategory: mainCategory || ''
        });

        invalidateCategoryCache();
        res.status(201).json({
            success: true,
            data: category
        });

        // Real-time update
        getIO().emit('category:updated', category);
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id).lean();

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        const oldName = category.name;

        // Strip immutable fields to prevent Mongoose errors
        const { _id, __v, createdAt, ...updateFields } = req.body;

        if (updateFields.isPreview !== undefined) {
            updateFields.isPreview = Boolean(updateFields.isPreview === true || updateFields.mode === 'preview');
            updateFields.mode = updateFields.isPreview ? 'preview' : 'normal';
        }

        // Subcategory rename cascade to all products
        if (Array.isArray(updateFields.subcategories) && Array.isArray(category.subcategories)) {
            const oldSubs = category.subcategories;
            const newSubs = updateFields.subcategories;
            const renames = req.body.subcategoryRenames || {};

            // If explicit renames not passed, detect positional or single-item renames
            if (Object.keys(renames).length === 0) {
                if (oldSubs.length === newSubs.length) {
                    for (let i = 0; i < oldSubs.length; i++) {
                        if (oldSubs[i] && newSubs[i] && oldSubs[i] !== newSubs[i] && !oldSubs.includes(newSubs[i])) {
                            renames[oldSubs[i]] = newSubs[i];
                        }
                    }
                } else {
                    const removed = oldSubs.filter(s => !newSubs.includes(s));
                    const added = newSubs.filter(s => !oldSubs.includes(s));
                    if (removed.length === 1 && added.length === 1) {
                        renames[removed[0]] = added[0];
                    }
                }
            }

            if (Object.keys(renames).length > 0) {
                try {
                    const Product = (await import('../models/Product.js')).default;
                    const catNames = [oldName, updateFields.name || oldName].filter(Boolean);
                    const catRegexes = catNames.map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
                    const catFilter = { $in: [...catNames, ...catRegexes] };

                    for (const [fromSub, toSub] of Object.entries(renames)) {
                        if (!fromSub || !toSub || fromSub === toSub) continue;

                        console.log(`🔄 Cascading subcategory rename in "${oldName}": "${fromSub}" → "${toSub}"`);

                        // 1. Update products where subcategory is an array containing fromSub
                        await Product.updateMany(
                            {
                                category: catFilter,
                                subcategory: { $elemMatch: { $eq: fromSub } }
                            },
                            {
                                $set: { "subcategory.$[elem]": toSub }
                            },
                            {
                                arrayFilters: [{ elem: fromSub }]
                            }
                        );

                        // 2. Also update products where subcategory might be stored as a string
                        await Product.updateMany(
                            {
                                category: catFilter,
                                subcategory: { $type: "string", $eq: fromSub }
                            },
                            {
                                $set: { subcategory: [toSub] }
                            }
                        );

                        // 3. Update subcategoryImages in updateFields if present
                        if (updateFields.subcategoryImages && updateFields.subcategoryImages[fromSub]) {
                            updateFields.subcategoryImages[toSub] = updateFields.subcategoryImages[fromSub];
                            delete updateFields.subcategoryImages[fromSub];
                        }
                    }

                    getIO().emit('products:updated');
                } catch (subErr) {
                    console.error('Failed to cascade subcategory rename (non-fatal):', subErr.message);
                }
            }
        }

        invalidateCategoryCache();
        category = await Category.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            {
                new: true,
                runValidators: true
            }
        );

        // If the category name changed, update all products, stores, services, and news that used the old name
        if (updateFields.name && updateFields.name !== oldName) {
            try {
                // Update Products
                const Product = (await import('../models/Product.js')).default;
                const prodResult = await Product.updateMany(
                    { category: oldName },
                    { $set: { category: updateFields.name } }
                );
                console.log(`📦 Updated ${prodResult.modifiedCount} products from category "${oldName}" → "${updateFields.name}"`);

                // Update Stores
                const Store = (await import('../models/Store.js')).default;
                const storeResult = await Store.updateMany(
                    { category: oldName },
                    { $set: { "category.$": updateFields.name } }
                );
                console.log(`🏪 Updated ${storeResult.modifiedCount} stores from category "${oldName}" → "${updateFields.name}"`);

                // Update Services
                const Service = (await import('../models/Service.js')).default;
                const serviceResult = await Service.updateMany(
                    { category: oldName },
                    { $set: { category: updateFields.name } }
                );
                console.log(`🛠️ Updated ${serviceResult.modifiedCount} services from category "${oldName}" → "${updateFields.name}"`);

                // Update News
                const News = (await import('../models/News.js')).default;
                const newsResult = await News.updateMany(
                    { category: oldName },
                    { $set: { category: updateFields.name } }
                );
                console.log(`📰 Updated ${newsResult.modifiedCount} news items from category "${oldName}" → "${updateFields.name}"`);
            } catch (err) {
                console.error('Failed to cascade category name changes (non-fatal):', err.message);
            }
        }

        res.status(200).json({
            success: true,
            data: category
        });

        // Real-time update
        getIO().emit('category:updated', category);
    } catch (error) {
        next(error);
    }
};


// @desc    Update categories order
// @route   PUT /api/categories/reorder
// @access  Private/Admin
export const updateCategoriesOrder = async (req, res, next) => {
    try {
        const { orderedIds } = req.body; // Array of category IDs in order

        if (!orderedIds || !Array.isArray(orderedIds)) {
            res.status(400);
            throw new Error('Invalid data format');
        }

        const updates = orderedIds.map((id, index) => {
            return Category.findByIdAndUpdate(id, { order: index });
        });

        await Promise.all(updates);

        res.status(200).json({
            success: true,
            message: 'Categories reordered successfully'
        });

        // Real-time update
        getIO().emit('category:updated');
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id).lean();

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        if (category.image) {
            await deleteFromCloudinary(category.image);
        }
        if (category.storeImage) {
            await deleteFromCloudinary(category.storeImage);
        }

        invalidateCategoryCache();
        await Category.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            data: {}
        });

        // Real-time update
        getIO().emit('category:updated');
    } catch (error) {
        next(error);
    }
};
// @desc    Get category image
// @route   GET /api/categories/:id/image
// @access  Public
export const getCategoryImage = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id).lean().select('image');

        if (!category || !category.image) {
            return res.status(404).send('Image not found');
        }

        if (category.image.startsWith('data:image')) {
            const matches = category.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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
            res.redirect(category.image);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get category store image
// @route   GET /api/categories/:id/store-image
// @access  Public
export const getCategoryStoreImage = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id).lean().select('storeImage image');

        const targetImg = category?.storeImage || category?.image;
        if (!category || !targetImg) {
            return res.status(404).send('Image not found');
        }

        if (targetImg.startsWith('data:image')) {
            const matches = targetImg.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
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
            res.redirect(targetImg);
        }
    } catch (error) {
        next(error);
    }
};

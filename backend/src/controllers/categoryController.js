import Category from '../models/Category.js';
import { getIO } from '../socket.js';
import { deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({ isActive: true }).lean()
            .sort({ order: 1, name: 1 });

        // Smart Image Filtering for Categories
        const processedCategories = categories.map(cat => {
            const catObj = cat.toObject();
            if (catObj.image && catObj.image.startsWith('data:image')) {
                catObj.image = null;
            }
            return catObj;
        });

        res.status(200).json({
            success: true,
            count: processedCategories.length,
            data: processedCategories
        });
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
        const { name, name_ta, description, icon, image, subcategories } = req.body;

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
            subcategories: subcategories || []
        });

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

        await category.deleteOne();

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

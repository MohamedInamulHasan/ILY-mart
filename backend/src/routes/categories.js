import express from 'express';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryImage,
    getCategoryStoreImage,
    updateCategoriesOrder
} from '../controllers/categoryController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(protect, adminOnly, createCategory);

router.put('/reorder', protect, adminOnly, updateCategoriesOrder);

router.route('/:id')
    .get(getCategoryById)
    .put(protect, adminOnly, updateCategory)
    .delete(protect, adminOnly, deleteCategory);


router.get('/:id/image', getCategoryImage);
router.get('/:id/store-image', getCategoryStoreImage);

export default router;

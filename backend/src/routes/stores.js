import express from 'express';
import {
    getStores,
    getStore,
    createStore,
    updateStore,
    deleteStore,
    verifyStorePassword,
    getStoreImage,
    resolveMapLink,
    updateStoresOrder
} from '../controllers/storeController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getStores)
    .post(createStore);

router.put('/reorder', protect, adminOnly, updateStoresOrder);

router.route('/:id')
    .get(getStore)
    .put(updateStore)
    .delete(deleteStore);

router.post('/:id/verify-password', protect, adminOnly, verifyStorePassword);
router.get('/resolve-map-link', resolveMapLink);
router.get('/:id/image', getStoreImage);

export default router;

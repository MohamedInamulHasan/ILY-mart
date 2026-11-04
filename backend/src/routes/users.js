import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    updateUserByAdmin,
    deleteUser,
    getSavedProducts,
    toggleSavedProduct,
    resetPassword,
    forgotPassword,
    logoutUser,
    testEmailController,
    googleAuth,
    requestAccountDeletion,
    sendOTP,
    verifyOTP,
    registerGuest,
    updateGuest,
    mobileLogin
} from '../controllers/userController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/mobile-login', mobileLogin);
router.post('/google', googleAuth);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register-guest', registerGuest);
router.post('/update-guest', protect, updateGuest);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.post('/logout', logoutUser);
router.post('/delete-request', requestAccountDeletion);
router.get('/test-email', testEmailController);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/profile/saved-products')
    .get(protect, getSavedProducts)
    .post(protect, toggleSavedProduct);

// Admin routes
router.route('/')
    .get(protect, adminOnly, getAllUsers);

router.route('/:id')
    .put(protect, adminOnly, updateUserByAdmin)
    .delete(protect, adminOnly, deleteUser);

export default router;

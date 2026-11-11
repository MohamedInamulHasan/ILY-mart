import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    updateUserByAdmin,
    createUserByAdmin,
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
    mobileLogin,
    saveFcmToken
} from '../controllers/userController.js';

import { protect, adminOnly } from '../middleware/authMiddleware.js';

import { getApps } from 'firebase-admin/app';

const router = express.Router();

router.get('/fcm-status', (req, res) => {
    res.json({
        success: true,
        fcmInitialized: getApps().length > 0,
        hasServiceAccountEnv: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT)
    });
});

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
router.post('/fcm-token', protect, saveFcmToken);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/profile/saved-products')
    .get(protect, getSavedProducts)
    .post(protect, toggleSavedProduct);

// Admin routes
router.route('/')
    .get(protect, adminOnly, getAllUsers)
    .post(protect, adminOnly, createUserByAdmin);

router.route('/:id')
    .put(protect, adminOnly, updateUserByAdmin)
    .delete(protect, adminOnly, deleteUser);

export default router;

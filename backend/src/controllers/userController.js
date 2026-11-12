import User from '../models/User.js';
import Settings from '../models/Settings.js';
import LoginLog from '../models/LoginLog.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios from 'axios';
import { sendPasswordResetEmail, sendDeleteAccountRequestEmail, sendOTPEmail } from '../services/emailService.js';
import { OAuth2Client } from 'google-auth-library';
import { getIO } from '../socket.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Helper to send token in cookie
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const options = {
        expires: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        ),
        httpOnly: true, // Secure: not accessible via client-side JS
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // CSRF protection
    };

    res.status(statusCode)
        .cookie('jwt', token, options)
        .json({
            success: true,
            token, // Send token for client-side storage (Hybrid Auth)
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address,
                location: user.location,
                mobile: user.mobile,
                storeId: user.storeId,
                serviceId: user.serviceId,
                coins: user.coins || 0,
                avatar: user.avatar || '',
                isFastMode: user.isFastMode || false,
                deliveryId: user.deliveryId || user.deliverySettings?.deliveryId || '',
                displayPassword: user.displayPassword || user.deliverySettings?.displayPassword || '',
                deliverySettings: user.deliverySettings || {}
            }
        });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, mobile } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Check for signup bonus
        let initialCoins = 0;
        const bonusConfig = await Settings.findOne({ key: 'signup_bonus' });
        
        if (bonusConfig && bonusConfig.value?.isEnabled && bonusConfig.value?.remainingLimit > 0) {
            initialCoins = 1;
            
            // Decrement limit
            bonusConfig.value.remainingLimit -= 1;
            if (bonusConfig.value.remainingLimit <= 0) {
                bonusConfig.value.isEnabled = false;
            }
            bonusConfig.markModified('value');
            await bonusConfig.save();
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            mobile,
            role: ['customer'],
            coins: initialCoins
        });

        if (user) {
            sendTokenResponse(user, 201, res);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Google Authentication (Login/Signup)
// @route   POST /api/users/google
// @access  Public
export const googleAuth = async (req, res, next) => {
    try {
        const { credential, accessToken } = req.body;
        let name, email, picture, sub;

        if (credential) {
            // Verify Google ID Token
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
            picture = payload.picture;
            sub = payload.sub;
        } else if (accessToken) {
            // Verify/Fetch via Access Token (Implicit Flow)
            const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
            name = response.data.name;
            email = response.data.email;
            picture = response.data.picture;
            sub = response.data.sub;
        } else {
            res.status(400);
            throw new Error('No Google token provided');
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // User exists - Login
            // Log Login
            await LoginLog.create({
                user: user._id,
                ipAddress: req.ip || '',
                device: req.headers ? req.headers['user-agent'] : ''
            });
            sendTokenResponse(user, 200, res);
        } else {
            // User doesn't exist - Signup
            const randomPassword = crypto.randomBytes(16).toString('hex');

            // Check for signup bonus
            let initialCoins = 0;
            const bonusConfig = await Settings.findOne({ key: 'signup_bonus' });
            
            if (bonusConfig && bonusConfig.value?.isEnabled && bonusConfig.value?.remainingLimit > 0) {
                initialCoins = 1;
                
                // Decrement limit
                bonusConfig.value.remainingLimit -= 1;
                if (bonusConfig.value.remainingLimit <= 0) {
                    bonusConfig.value.isEnabled = false;
                }
                bonusConfig.markModified('value');
                await bonusConfig.save();
            }

            user = await User.create({
                name,
                email,
                password: randomPassword,
                role: ['customer'],
                mobile: '', // Placeholder
                coins: initialCoins
            });

            if (user) {
                // Log Login
                await LoginLog.create({
                    user: user._id,
                    ipAddress: req.ip || '',
                    device: req.headers ? req.headers['user-agent'] : ''
                });
                sendTokenResponse(user, 201, res);
            }
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Mobile number login (no OTP required)
// @route   POST /api/users/mobile-login
// @access  Public
export const mobileLogin = async (req, res, next) => {
    try {
        const { mobile, mobileNumber, password } = req.body;
        const inputMobile = (mobile || mobileNumber || '').toString().trim();

        if (!inputMobile) {
            return res.status(400).json({ success: false, message: 'Please enter a valid mobile number' });
        }

        const raw = inputMobile.replace(/\D/g, '');
        if (raw.length < 10) {
            return res.status(400).json({ success: false, message: 'Please enter a 10-digit mobile number' });
        }

        const standardMobile = raw.slice(-10);
        const mobileQueries = [
            standardMobile,
            '91' + standardMobile,
            '+91' + standardMobile
        ];

        // 1. Search for existing user with this mobile number or mobile email
        let user = await User.findOne({
            $or: [
                { mobile: { $in: mobileQueries } },
                { email: `mobile_${standardMobile}@ily-mart.com` }
            ]
        }).select('+password');

        if (user) {
            const roles = Array.isArray(user.role) ? user.role : [user.role || 'customer'];
            const isStaff = roles.some(r => ['admin', 'store_admin', 'service_admin', 'delivery_boy'].includes(r));

            // If staff/admin account and password exists, require valid password
            if (isStaff && user.password) {
                if (!password) {
                    return res.status(401).json({ success: false, message: 'Staff credentials required: please enter password' });
                }
                const isMatch = await user.matchPassword(password);
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Invalid password' });
                }
            } else if (password && user.password) {
                // If customer provided password, verify if it was set
                const isMatch = await user.matchPassword(password);
                if (!isMatch) {
                    return res.status(401).json({ success: false, message: 'Invalid password' });
                }
            }

            // Normalize mobile to standard 10-digit
            if (user.mobile !== standardMobile) {
                user.mobile = standardMobile;
                await user.save();
            }

            // Log Login
            await LoginLog.create({
                user: user._id,
                ipAddress: req.ip || '',
                device: req.headers ? req.headers['user-agent'] : ''
            });

            return sendTokenResponse(user, 200, res);
        }

        // 2. New customer registration with permanent unique MongoDB ID
        const randomPassword = crypto.randomBytes(16).toString('hex');

        // Check for signup bonus
        let initialCoins = 0;
        const bonusConfig = await Settings.findOne({ key: 'signup_bonus' });
        if (bonusConfig && bonusConfig.value?.isEnabled && bonusConfig.value?.remainingLimit > 0) {
            initialCoins = 1;
            bonusConfig.value.remainingLimit -= 1;
            if (bonusConfig.value.remainingLimit <= 0) {
                bonusConfig.value.isEnabled = false;
            }
            bonusConfig.markModified('value');
            await bonusConfig.save();
        }

        user = await User.create({
            name: `User_${standardMobile.slice(-4)}`,
            email: `mobile_${standardMobile}@ily-mart.com`,
            mobile: standardMobile,
            password: password && password.length >= 6 ? password : randomPassword,
            role: ['customer'],
            coins: initialCoins,
            hasReceivedSignupBonus: initialCoins > 0
        });

        if (user) {
            await LoginLog.create({
                user: user._id,
                ipAddress: req.ip || '',
                device: req.headers ? req.headers['user-agent'] : ''
            });

            return sendTokenResponse(user, 201, res);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Login user (email or mobile)
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res, next) => {
    try {
        const { email, password, mobile, mobileNumber } = req.body;
        const identifier = (email || mobile || mobileNumber || '').toString().trim();

        if (!identifier) {
            return res.status(400).json({ success: false, message: 'Please provide email or mobile number' });
        }

        const cleanId = identifier.trim();
        const escapedId = cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const idRegex = new RegExp('^' + escapedId + '$', 'i');
        const digitsOnly = cleanId.replace(/\D/g, '');
        const phone10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : '';

        // Generate interchangeable aliases for SHI / SHT delivery codes
        const aliasRegexes = [idRegex];
        if (/^SH[IT]@/i.test(cleanId)) {
            const numPart = cleanId.slice(4);
            const escNum = numPart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            aliasRegexes.push(new RegExp('^SH[IT]@' + escNum + '$', 'i'));
        }

        const orConditions = [
            { email: cleanId.toLowerCase() }
        ];
        aliasRegexes.forEach(reg => {
            orConditions.push({ deliveryId: reg });
            orConditions.push({ 'deliverySettings.deliveryId': reg });
        });
        if (phone10) {
            orConditions.push({ mobile: { $regex: phone10 + '$' } });
        }

        // Check for user by email, deliveryId, or mobile
        const user = await User.findOne({
            $or: orConditions
        }).select('+password');

        if (user && (await user.matchPassword(password))) {
            await LoginLog.create({
                user: user._id,
                ipAddress: req.ip || '',
                device: req.headers ? req.headers['user-agent'] : ''
            });
            return sendTokenResponse(user, 200, res);
        }

        if (!identifier.includes('@')) {
            req.body.mobile = identifier;
            return mobileLogin(req, res, next);
        }

        res.status(401);
        throw new Error('Invalid email or password');
    } catch (error) {
        next(error);
    }
};
// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === 'production', // Must match set options
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Must match set options
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.status(200).json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: Array.isArray(user.role) ? user.role : [user.role || 'customer'],
                    mobile: user.mobile,
                    address: user.address,
                    location: user.location,
                    storeId: user.storeId,
                    serviceId: user.serviceId,
                    coins: user.coins || 0,
                    avatar: user.avatar || '',
                    deliveryId: user.deliveryId || user.deliverySettings?.deliveryId || '',
                    displayPassword: user.displayPassword || user.deliverySettings?.displayPassword || '',
                    deliverySettings: user.deliverySettings
                }
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private


// Helper: award signup bonus coins to a user if eligible
const rewardSignupBonus = async (user) => {
    // Skip if already received in this round
    if (user.hasReceivedSignupBonus) return false;
    // Skip if no mobile number
    if (!user.mobile || !user.mobile.trim()) return false;
    try {
        const bonusConfig = await Settings.findOne({ key: 'signup_bonus' });
        if (bonusConfig && bonusConfig.value?.isEnabled && bonusConfig.value?.remainingLimit > 0) {
            user.coins = (user.coins || 0) + 1;
            user.hasReceivedSignupBonus = true;
            await user.save();
            bonusConfig.value.remainingLimit -= 1;
            if (bonusConfig.value.remainingLimit <= 0) {
                bonusConfig.value.isEnabled = false;
            }
            bonusConfig.markModified('value');
            await bonusConfig.save();
            console.log(`🪙 Signup bonus awarded to user ${user._id} (${user.mobile}). Remaining: ${bonusConfig.value.remainingLimit}`);
            return true;
        }
    } catch (err) {
        console.error('rewardSignupBonus error (non-fatal):', err.message);
    }
    return false;
};

// Helper: safe no-op (never delete other user accounts or steal orders across accounts)
const cleanupGuestAccount = async (mobileNumber, currentUserId) => {
    return;
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || req.body.fullName || user.name;
            user.email = req.body.email || user.email;

            if (req.body.mobile !== undefined) {
                const rawMobile = req.body.mobile ? req.body.mobile.replace(/[^0-9]/g, '') : '';
                const standardMobile = rawMobile.slice(-10);

                if (standardMobile) {
                    // Check if mobile belongs to an existing staff account (delivery_boy, admin, store_admin)
                    // or another registered account
                    const existingUser = await User.findOne({
                        _id: { $ne: user._id },
                        $or: [
                            { mobile: standardMobile },
                            { mobile: '91' + standardMobile },
                            { email: 'mobile_' + standardMobile + '@ily-mart.com' }
                        ]
                    });

                    if (existingUser) {
                        const existingRoles = Array.isArray(existingUser.role) ? existingUser.role : [existingUser.role || 'customer'];
                        const isStaff = existingRoles.some(r => ['delivery_boy', 'admin', 'store_admin', 'service_admin'].includes(r));
                        const isRegisteredUser = existingUser.email && !existingUser.email.startsWith('guest_');

                        if (isStaff || isRegisteredUser) {
                            if (req.body.address) existingUser.address = req.body.address;
                            if (req.body.location) existingUser.location = req.body.location;
                            await existingUser.save();
                            return sendTokenResponse(existingUser, 200, res);
                        }
                    }
                }
                user.mobile = rawMobile;
            }

            user.address = req.body.address || user.address;
            user.avatar = req.body.avatar || user.avatar;

            if (req.body.location) {
                user.location = req.body.location;
            }

            if (req.body.isFastMode !== undefined) {
                user.isFastMode = req.body.isFastMode;
            }

            if (req.body.deliverySettings) {
                user.deliverySettings = {
                    ...user.deliverySettings?.toObject(),
                    ...req.body.deliverySettings
                };
            }

            const updatedUser = await user.save();
            // Award signup bonus if this is the first time they set their mobile
            if (req.body.mobile) await rewardSignupBonus(updatedUser);
            sendTokenResponse(updatedUser, 200, res);

            // Real-time update to this specific user only
            getIO().to(`user:${updatedUser._id}`).emit('user:updated', updatedUser);
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').populate('storeId', 'name').populate('serviceId', 'name');

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user by admin
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUserByAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.mobile = req.body.mobile || user.mobile;
        if (req.body.deliveryId !== undefined) {
            user.deliveryId = req.body.deliveryId;
            if (!user.deliverySettings) user.deliverySettings = {};
            user.deliverySettings.deliveryId = req.body.deliveryId;
            user.markModified('deliverySettings');
        }
        user.address = req.body.address || user.address;

        if (req.body.deliverySettings) {
            user.deliverySettings = {
                ...(user.deliverySettings?.toObject() || {}),
                ...req.body.deliverySettings,
                deliveryId: req.body.deliveryId !== undefined ? req.body.deliveryId : (req.body.deliverySettings.deliveryId || user.deliverySettings?.deliveryId || user.deliveryId || '')
            };
            user.markModified('deliverySettings');
        }

        // Update location if provided
        if (req.body.location !== undefined) {
            user.location = req.body.location;
        }

        if (req.body.role) {
            user.role = Array.isArray(req.body.role) ? req.body.role : [req.body.role];
        }

        const currentRoles = Array.isArray(user.role) ? user.role : [user.role];

        if (req.body.storeId) {
            user.storeId = req.body.storeId;
        } else if (!currentRoles.includes('store_admin')) {
            // Remove storeId if not store_admin
            user.storeId = undefined;
        }

        if (req.body.serviceId) {
            user.serviceId = req.body.serviceId;
        } else if (!currentRoles.includes('service_admin')) {
            // Remove serviceId if not service_admin
            user.serviceId = undefined;
        }

        // Debug logging for coin updates
        console.log('📝 updateUserByAdmin Request:', {
            id: req.params.id,
            body: req.body,
            coinsReceived: req.body.coins
        });

        if (req.body.coins !== undefined) {
            console.log(`🪙 Updating coins for user ${user._id}: ${user.coins} -> ${req.body.coins}`);
            user.coins = Number(req.body.coins);
        }

        if (req.body.isFastMode !== undefined) {
            user.isFastMode = req.body.isFastMode;
        }

        const passToSet = (req.body.password && typeof req.body.password === 'string' && req.body.password.trim().length >= 4)
            ? req.body.password.trim()
            : (req.body.displayPassword && typeof req.body.displayPassword === 'string' && req.body.displayPassword.trim().length >= 4 ? req.body.displayPassword.trim() : null);

        if (passToSet) {
            user.password = passToSet;
            user.displayPassword = passToSet;
            if (!user.deliverySettings) user.deliverySettings = {};
            user.deliverySettings.displayPassword = passToSet;
            user.markModified('password');
            user.markModified('deliverySettings');
        }

        await user.save();
        // Clean up ghost guest account with same mobile
        if (req.body.mobile) await cleanupGuestAccount(req.body.mobile, user._id);
        const updatedUser = await User.findById(user._id).populate('storeId', 'name').populate('serviceId', 'name');

        res.status(200).json({
            success: true,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                storeId: updatedUser.storeId,
                serviceId: updatedUser.serviceId,
                mobile: updatedUser.mobile,
                address: updatedUser.address,
                location: updatedUser.location,
                coins: updatedUser.coins || 0,
                deliveryId: updatedUser.deliveryId || updatedUser.deliverySettings?.deliveryId || '',
                displayPassword: updatedUser.displayPassword || updatedUser.deliverySettings?.displayPassword || '',
                deliverySettings: updatedUser.deliverySettings
            }
        });

        // Real-time update to the specific user (role/coins changed by admin)
        getIO().to(`user:${updatedUser._id}`).emit('user:updated', updatedUser);
    } catch (error) {
        next(error);
    }
};


// @desc    Create new user (admin)
// @route   POST /api/users
// @access  Private/Admin
export const createUserByAdmin = async (req, res, next) => {
    try {
        const { name, mobile, password, email, deliveryId, deliverySettings, role } = req.body;
        const cleanMobile = mobile ? mobile.toString().trim() : '';
        const userEmail = email ? email.toLowerCase().trim() : `${deliveryId ? deliveryId.toLowerCase().replace(/\s+/g, '') : (cleanMobile || Date.now())}@homly.delivery`;

        const existingQuery = [
            { email: userEmail }
        ];
        if (cleanMobile) existingQuery.push({ mobile: cleanMobile });
        if (deliveryId) existingQuery.push({ deliveryId }, { 'deliverySettings.deliveryId': deliveryId });

        const existing = await User.findOne({ $or: existingQuery });

        if (existing) {
            res.status(400);
            throw new Error('A user with this mobile, email, or Delivery ID already exists');
        }

        const newUser = await User.create({
            name,
            mobile: cleanMobile,
            email: userEmail,
            password: password || '123456',
            role: role || ['delivery_boy'],
            deliveryId: deliveryId || '',
            deliverySettings: {
                workTimings: {
                    start: deliverySettings?.workTimings?.start || '09:00',
                    end: deliverySettings?.workTimings?.end || '21:00'
                },
                deliveryId: deliveryId || '',
                telegramChatId: deliverySettings?.telegramChatId || '',
                isActive: deliverySettings?.isActive !== undefined ? deliverySettings.isActive : true
            }
        });

        res.status(201).json({
            success: true,
            data: newUser
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get saved products (wishlist)
// @route   GET /api/users/profile/saved-products
// @access  Private
export const getSavedProducts = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate('savedProducts');

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        res.status(200).json({
            success: true,
            data: user.savedProducts || []
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle saved product (add/remove from wishlist)
// @route   POST /api/users/profile/saved-products
// @access  Private
export const toggleSavedProduct = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // Initialize savedProducts if it doesn't exist
        if (!user.savedProducts) {
            user.savedProducts = [];
        }

        // Check if product is already saved
        const index = user.savedProducts.indexOf(productId);

        if (index > -1) {
            // Product exists, remove it
            user.savedProducts.splice(index, 1);
        } else {
            // Product doesn't exist, add it
            user.savedProducts.push(productId);
        }

        await user.save();

        // Return updated list
        const updatedUser = await User.findById(req.user._id).populate('savedProducts');

        res.status(200).json({
            success: true,
            data: updatedUser.savedProducts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot Password - Send reset email
// @route   POST /api/users/forgotpassword
// @access  Public
// @desc    Forgot Password - Send reset email
// @route   POST /api/users/forgotpassword
// @access  Public
export const forgotPassword = async (req, res, next) => {
    // console.log('🔹 forgotPassword Request Received:', req.body.email); // Keep logs for debug but maybe reduce verbosity in prod
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            console.log('ℹ️ Forgot Password: User not found for email:', req.body.email);
            // SECURITY: Return success to prevent email enumeration
            return res.status(200).json({
                success: true,
                data: 'If an account with that email exists, we have sent a password reset link.'
            });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        // DEBUG: Log URL to console (REMOVE IN PRODUCTION)
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔗 MANUAL RESET LINK:', resetUrl);
        }

        try {
            await sendPasswordResetEmail(user.email, resetUrl);

            res.status(200).json({
                success: true,
                data: 'If an account with that email exists, we have sent a password reset link.'
            });
        } catch (error) {
            console.error('❌ Email Sending Failed:', error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            // In case of email error, we *could* still return success to mask it, 
            // but for now, 500 is okay as it indicates a server fault, not user existence.
            res.status(500);
            throw new Error('Email server error. Please try again later.');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset Password
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            res.status(400);
            throw new Error('Invalid token');
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};




// @desc    Test Email Configuration
// @route   GET /api/users/test-email
// @access  Public
export const testEmailController = async (req, res) => {
    try {
        console.log('🧪 Testing Email Configuration...');
        const result = await sendPasswordResetEmail(
            process.env.EMAIL_USER || 'test@example.com',
            'http://test-url.com'
        );
        res.json({
            success: true,
            message: 'Email should have been sent!',
            config: {
                user: process.env.EMAIL_USER,
                hasPass: !!process.env.EMAIL_PASS,
                admin: process.env.ADMIN_EMAIL
            },
            result
        });
    } catch (error) {
        console.error('❌ Test Email Failed:', error);
        res.status(500).json({
            success: false,
            message: 'Email Sending Failed',
            error: error.message,
            stack: error.stack,
            config: {
                user: process.env.EMAIL_USER,
                hasPass: !!process.env.EMAIL_PASS
            }
        });
    }
};

// @desc    Submit account deletion request
// @route   POST /api/users/delete-request
// @access  Public
export const requestAccountDeletion = async (req, res, next) => {
    try {
        const { email, reason } = req.body;
        if (!email) {
            res.status(400);
            throw new Error('Email is required');
        }

        // Send the email to the admin
        await sendDeleteAccountRequestEmail(email, reason);

        res.status(200).json({
            success: true,
            message: 'Account deletion request submitted successfully'
        });
    } catch (error) {
        next(error);
    }
};// @desc    Send OTP to email or mobile
// @route   POST /api/users/send-otp
// @access  Public
export const sendOTP = async (req, res, next) => {
    try {
        const { emailOrMobile } = req.body;

        if (!emailOrMobile) {
            return res.status(400).json({ success: false, message: 'Email or Mobile number is required' });
        }

        const trimmedInput = emailOrMobile.trim();
        const isEmail = /^\S+@\S+\.\S+$/.test(trimmedInput);
        const isMobile = /^\+?[0-9]{10,15}$/.test(trimmedInput.replace(/[\s\-\(\)]/g, ''));

        if (!isEmail && !isMobile) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email or mobile number' });
        }

        // Generate 6-digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

        // Save OTP to database (upsert for the input)
        const key = trimmedInput.toLowerCase();
        await OTP.findOneAndUpdate(
            { emailOrMobile: key },
            { otp, expiresAt },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        if (isEmail) {
            // Send OTP via Brevo SMTP
            await sendOTPEmail(key, otp);
            console.log(`📧 OTP sent to email ${key}: ${otp}`);
        } else {
            // Send OTP via Brevo Transactional SMS API
            const formattedMobile = trimmedInput.replace(/[^0-9]/g, '');
            // If it's a 10-digit number without country code, prefix India (91)
            const recipient = formattedMobile.length === 10 ? '91' + formattedMobile : formattedMobile;

            let smsSent = false;
            if (process.env.SMTP_PASS && process.env.SMTP_PASS.startsWith('xsmtpsib-')) {
                try {
                    const response = await axios.post(
                        'https://api.brevo.com/v3/transactionalSMS/sms',
                        {
                            sender: 'ILYmart',
                            recipient,
                            content: `Your ILY mart verification code is: ${otp}. Valid for 5 minutes.`,
                            type: 'transactional'
                        },
                        {
                            headers: {
                                'api-key': process.env.SMTP_PASS,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    if (response.data) {
                        console.log(`✅ Brevo SMS API response:`, response.data);
                        smsSent = true;
                    }
                } catch (smsError) {
                    console.warn(`⚠️ Brevo SMS API failed:`, smsError.response?.data || smsError.message);
                }
            } else {
                console.warn(`⚠️ Brevo SMS API skipped: No Brevo API Key found in SMTP_PASS`);
            }

            // Developer fallback console log (always printed for easy testing)
            console.log(`\n🔑 [DEVELOPER TEST] Mobile OTP for ${trimmedInput} is: ${otp}\n`);
        }

        res.status(200).json({
            success: true,
            message: 'Verification code sent successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP and log in / register
// @route   POST /api/users/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
    try {
        const { emailOrMobile, otp } = req.body;

        if (!emailOrMobile || !otp) {
            return res.status(400).json({ success: false, message: 'Email/Mobile and OTP are required' });
        }

        const key = emailOrMobile.trim().toLowerCase();

        // Find OTP record
        const otpRecord = await OTP.findOne({ emailOrMobile: key, otp });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, message: 'Verification code has expired' });
        }

        // Delete verified OTP code
        await OTP.deleteOne({ _id: otpRecord._id });

        const isEmail = /^\S+@\S+\.\S+$/.test(key);

        let user = null;

        if (isEmail) {
            user = await User.findOne({ email: key });
        } else {
            const rawMobile = key.replace(/[^0-9]/g, '');
            // Search robustly with or without country code prefixes
            user = await User.findOne({
                $or: [
                    { mobile: rawMobile },
                    { mobile: rawMobile.replace(/^91/, '') },
                    { mobile: '91' + rawMobile.replace(/^91/, '') }
                ]
            });
        }

        if (user) {
            // Existing user - Log Login
            await LoginLog.create({
                user: user._id,
                ipAddress: req.ip || '',
                device: req.headers ? req.headers['user-agent'] : ''
            });
            sendTokenResponse(user, 200, res);
        } else {
            // New user registration
            const randomPassword = crypto.randomBytes(16).toString('hex');

            let emailValue = '';
            let mobileValue = '';
            let nameValue = '';

            if (isEmail) {
                emailValue = key;
                nameValue = key.split('@')[0];
            } else {
                const rawMobile = key.replace(/[^0-9]/g, '');
                mobileValue = rawMobile;
                emailValue = `mobile_${rawMobile}@ily-mart.com`;
                nameValue = `User_${rawMobile.slice(-4)}`;
            }

            // Check for signup bonus
            let initialCoins = 0;
            const bonusConfig = await Settings.findOne({ key: 'signup_bonus' });
            
            if (bonusConfig && bonusConfig.value?.isEnabled && bonusConfig.value?.remainingLimit > 0) {
                initialCoins = 1;
                
                // Decrement limit
                bonusConfig.value.remainingLimit -= 1;
                if (bonusConfig.value.remainingLimit <= 0) {
                    bonusConfig.value.isEnabled = false;
                }
                bonusConfig.markModified('value');
                await bonusConfig.save();
            }

            user = await User.create({
                name: nameValue,
                email: emailValue,
                password: randomPassword,
                mobile: mobileValue,
                role: ['customer'],
                coins: initialCoins
            });

            if (user) {
                // Log Login
                await LoginLog.create({
                    user: user._id,
                    ipAddress: req.ip || '',
                    device: req.headers ? req.headers['user-agent'] : ''
                });
                sendTokenResponse(user, 201, res);
            }
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Register a silent guest user
// @route   POST /api/users/register-guest
// @access  Public
export const registerGuest = async (req, res, next) => {
    try {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const nameValue = `User_${randomNum}`;
        const randomStr = crypto.randomBytes(6).toString('hex');
        const emailValue = `guest_${randomStr}@ily-mart.com`;
        const passwordValue = crypto.randomBytes(16).toString('hex');

        const user = await User.create({
            name: nameValue,
            email: emailValue,
            password: passwordValue,
            role: ['customer']
        });

        if (user) {
            sendTokenResponse(user, 201, res);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update guest user info with name and mobile, or log in if mobile already exists
// @route   POST /api/users/update-guest
// @access  Private
export const updateGuest = async (req, res, next) => {
    try {
        const { name, mobile, address, location } = req.body;

        if (!name || !mobile) {
            return res.status(400).json({ success: false, message: 'Name and mobile number are required' });
        }

        const rawMobile = mobile.replace(/[^0-9]/g, '');
        const standardMobile = rawMobile.slice(-10);
        const currentUserId = req.user.id || req.user._id;

        // Check if the entered mobile belongs to an existing DIFFERENT account
        const existingUser = await User.findOne({
            _id: { $ne: currentUserId },
            $or: [
                { mobile: standardMobile },
                { mobile: '91' + standardMobile },
                { email: 'mobile_' + standardMobile + '@ily-mart.com' }
            ]
        });

        if (existingUser) {
            // Check if this existing account is a staff account (delivery_boy, admin, store_admin)
            // or an existing registered account (NOT a temporary guest_ account)
            const existingRoles = Array.isArray(existingUser.role) ? existingUser.role : [existingUser.role || 'customer'];
            const isStaff = existingRoles.some(r => ['delivery_boy', 'admin', 'store_admin', 'service_admin'].includes(r));
            const isRegisteredUser = existingUser.email && !existingUser.email.startsWith('guest_');

            if (isStaff || isRegisteredUser) {
                // Switch session to this existing account (delivery boy, admin, or existing customer claiming their account)
                if (address) existingUser.address = address;
                if (location) existingUser.location = location;
                if (name) existingUser.name = name;
                await existingUser.save();
                return sendTokenResponse(existingUser, 200, res);
            }
        }

        // Update current user's name, mobile, address, and location
        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.name = name;
        user.mobile = standardMobile;
        if (address) user.address = address;
        if (location) user.location = location;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Save/Register FCM token for push notifications
// @route   POST /api/users/fcm-token
// @access  Private
export const saveFcmToken = async (req, res, next) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'FCM token is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.fcmTokens) {
            user.fcmTokens = [];
        }

        if (!user.fcmTokens.includes(fcmToken)) {
            user.fcmTokens.push(fcmToken);
            await user.save();
            console.log(`📲 FCM token registered for user ${user._id}`);
        }

        res.status(200).json({ success: true, message: 'FCM token saved successfully' });
    } catch (error) {
        next(error);
    }
};




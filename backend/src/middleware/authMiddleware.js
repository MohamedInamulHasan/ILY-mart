import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Centralized helper to check if a user is the platform owner/super-admin
export const isOwnerUser = (user) => {
    if (!user) return false;
    const cleanMobile = (user.mobile || '').toString().replace(/\D/g, '');
    const isOwnerMobile = cleanMobile.endsWith('9500171980') || 
                          cleanMobile === '9500171980' || 
                          cleanMobile === '9500171958' || 
                          cleanMobile === '9500171989';
    const email = (user.email || '').toLowerCase().trim();
    const isOwnerEmail = email.includes('mohamedinamulhasan') || 
                         email.includes('inamul') ||
                         email === 'admin@ilayangudimart.com';
    return Boolean(isOwnerMobile || isOwnerEmail);
};

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.error('❌ Auth Failed: User not found in DB for token payload:', decoded);
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Grant super-admin role in memory to owner user
            if (isOwnerUser(req.user)) {
                if (!Array.isArray(req.user.role)) {
                    req.user.role = req.user.role ? [req.user.role, 'admin'] : ['admin'];
                } else if (!req.user.role.includes('admin')) {
                    req.user.role.push('admin');
                }
            }

            next();
        } catch (error) {
            console.error('❌ Auth Failed: Token verification error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        console.error('❌ Auth Failed: No token provided in cookies or header');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Optional Auth - populates req.user if token exists, otherwise proceeds as guest
export const optionalAuth = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (req.user && isOwnerUser(req.user)) {
                if (!Array.isArray(req.user.role)) {
                    req.user.role = req.user.role ? [req.user.role, 'admin'] : ['admin'];
                } else if (!req.user.role.includes('admin')) {
                    req.user.role.push('admin');
                }
            }
        } catch (error) {
            console.log('⚠️ Optional Auth: Token invalid/expired, proceeding as guest.');
        }
    }

    next();
};

// Admin middleware
export const adminOnly = (req, res, next) => {
    if (!req.user) {
        console.error('⛔ Admin Access Denied: No User');
        return res.status(401).json({ message: 'Not authorized, please log in' });
    }

    const roles = Array.isArray(req.user?.role) ? req.user.role : [req.user?.role || 'customer'];
    const isOwner = isOwnerUser(req.user);
    const isStaff = roles.some(r => ['admin', 'store_admin', 'delivery_boy', 'service_admin'].includes(r));

    if (isStaff || isOwner) {
        return next();
    } else {
        console.error('⛔ Admin Access Denied. User Role:', req.user ? req.user.role : 'No User');
        return res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Admin OR Store Admin middleware
export const adminOrStoreAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, please log in' });
    }
    const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isOwner = isOwnerUser(req.user);

    if (roles.includes('admin') || roles.includes('store_admin') || isOwner) {
        return next();
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized as admin or store admin' });
};

// Admin OR Service Admin middleware
export const adminOrServiceAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, please log in' });
    }
    const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isOwner = isOwnerUser(req.user);

    if (roles.includes('admin') || roles.includes('service_admin') || isOwner) {
        return next();
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized as admin or service admin' });
};

// Admin OR Delivery Boy middleware
export const adminOrDelivery = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, please log in' });
    }
    const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isOwner = isOwnerUser(req.user);

    if (roles.includes('admin') || roles.includes('delivery_boy') || isOwner) {
        return next();
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized as admin or delivery boy' });
};

// Any Role with Admin Access (Admin, Store, Service, Delivery)
export const anyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, please log in' });
    }
    const allowedRoles = ['admin', 'store_admin', 'service_admin', 'delivery_boy'];
    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
    const isOwner = isOwnerUser(req.user);

    if (userRoles.some(r => allowedRoles.includes(r)) || isOwner) {
        return next();
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized' });
};

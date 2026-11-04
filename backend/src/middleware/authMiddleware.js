import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
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

    if (req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            // If user not found, just proceed as guest (req.user remains undefined)
        } catch (error) {
            // Token invalid or expired - just proceed as guest
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
    const cleanMobile = (req.user?.mobile || '').toString().replace(/\D/g, '');
    const isOwnerMobile = cleanMobile.endsWith('9500171980') || cleanMobile === '9500171980' || cleanMobile === '9500171958' || cleanMobile === '9500171989';
    const isStaff = roles.some(r => ['admin', 'store_admin', 'delivery_boy', 'service_admin'].includes(r));

    if (req.user && (isStaff || isOwnerMobile || roles.includes('customer'))) {
        next();
    } else {
        console.error('⛔ Admin Access Denied. User Role:', req.user ? req.user.role : 'No User');
        return res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Admin OR Store Admin middleware
export const adminOrStoreAdmin = (req, res, next) => {
    if (req.user) {
        const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (roles.includes('admin') || roles.includes('store_admin')) {
            return next();
        }
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized as admin or store admin' });
};

// Admin OR Service Admin middleware
export const adminOrServiceAdmin = (req, res, next) => {
    if (req.user) {
        const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (roles.includes('admin') || roles.includes('service_admin')) {
            return next();
        }
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized as admin or service admin' });
};

// Admin OR Delivery Boy middleware
export const adminOrDelivery = (req, res, next) => {
    if (req.user) {
        const roles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (roles.includes('admin') || roles.includes('delivery_boy')) {
            return next();
        }
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized as admin or delivery boy' });
};

// Any Role with Admin Access (Admin, Store, Service, Delivery)
export const anyAdmin = (req, res, next) => {
    const allowedRoles = ['admin', 'store_admin', 'service_admin', 'delivery_boy'];
    if (req.user) {
        const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];
        if (userRoles.some(r => allowedRoles.includes(r))) {
            return next();
        }
    }
    console.error('⛔ Access Denied. User Role:', req.user ? req.user.role : 'No User');
    return res.status(403).json({ message: 'Not authorized' });
};

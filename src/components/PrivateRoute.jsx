import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { getUserRoles, hasAdminAccess } from '../utils/userHelpers';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Admin-only routes: require a real admin/staff account
    // If delivery boy tries to access non-admin customer routes, redirect to delivery panel
    const roles = getUserRoles(user);
    const isDeliveryBoy = roles.includes('delivery_boy') && !roles.includes('admin');
    if (isDeliveryBoy && !adminOnly) {
        return <Navigate to="/admin" replace />;
    }

    if (adminOnly) {
        // If still loading and we don't have cached admin credentials yet, show spinner
        if (loading && !hasAdminAccess(user)) {
            return <LoadingSpinner />;
        }

        const canAccess = hasAdminAccess(user);
        if (!canAccess) {
            console.warn('⛔ PrivateRoute: Access denied to admin route. Redirecting to home.', { user });
            return <Navigate to="/" replace />;
        }
        return children;
    }

    // Guest-first flow: all users (including auto-created guests) have a session.
    // If user is null here, it means guest registration silently failed (e.g. backend sleeping).
    // DO NOT redirect to /login — just render the page. The page itself will handle empty state.
    return children;
};

export default PrivateRoute;

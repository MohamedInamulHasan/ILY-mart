import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // Show spinner while auth is loading (guest registration in progress)
    if (loading && adminOnly) {
        return <LoadingSpinner />;
    }

    // Admin-only routes: require a real admin/staff account
    if (adminOnly) {
        if (!user) {
            return <Navigate to="/" replace />;
        }
        const userRoles = Array.isArray(user.role) ? user.role : [user.role || 'customer'];
        const hasAdminAccess = userRoles.some(r =>
            ['admin', 'store_admin', 'service_admin', 'delivery_boy'].includes(r)
        );
        if (!hasAdminAccess) {
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

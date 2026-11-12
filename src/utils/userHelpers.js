/**
 * User and Role Helpers
 * Centralized, ultra-robust user role resolution across the entire app.
 */

export const getUserRoles = (user) => {
    const set = new Set();

    const addRoles = (obj) => {
        if (!obj) return;
        const r = obj.role || obj.roles;
        if (Array.isArray(r)) {
            r.forEach(item => {
                if (typeof item === 'string' && item.trim()) {
                    set.add(item.toLowerCase().trim());
                }
            });
        } else if (typeof r === 'string' && r.trim()) {
            set.add(r.toLowerCase().trim());
        }

        if (obj.isAdmin) set.add('admin');
        if (obj.isStoreAdmin) set.add('store_admin');
        if (obj.isServiceAdmin) set.add('service_admin');
        if (obj.isDeliveryBoy) set.add('delivery_boy');
    };

    // 1. Check user object passed in
    addRoles(user);
    if (user?.data) addRoles(user.data);

        // 2. Check localStorage cached userInfo ONLY IF user matches or no user object passed
    try {
        const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const userObj = user?.data || user;
        const cachedObj = cached?.data || cached;
        const uId = String(userObj?._id || userObj?.id || '');
        const cId = String(cachedObj?._id || cachedObj?.id || '');
        const uMobile = (userObj?.mobile || '').toString().replace(/\D/g, '').slice(-10);
        const cMobile = (cachedObj?.mobile || '').toString().replace(/\D/g, '').slice(-10);

        // Prevent cross-user pollution: only add cached roles if it belongs to the same active user
        if (user && ((uId && cId && uId === cId) || (uMobile && cMobile && uMobile === cMobile))) {
            addRoles(cached);
            if (cached?.data) addRoles(cached.data);
        }
    } catch {}

    // 3. Fallback for store owner / admin mobile (9500171980) - only for active matching user
    const cleanMobile = (user?.mobile || user?.data?.mobile || '').toString().replace(/\D/g, '');
    let cachedMobile = '';
    try {
        const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
        cachedMobile = (cached?.mobile || cached?.data?.mobile || '').toString().replace(/\D/g, '');
    } catch {}

    if (
        (cleanMobile && (cleanMobile.endsWith('9500171980') || cleanMobile === '9500171980')) ||
        (user && cachedMobile && (cachedMobile.endsWith('9500171980') || cachedMobile === '9500171980'))
    ) {
        set.add('admin');
    }

    // 4. Fallback for Delivery Boy mobile (9578654411) - ensure delivery_boy role is recognized
    if (
        (cleanMobile && (cleanMobile.endsWith('9578654411') || cleanMobile === '9578654411')) ||
        (user && cachedMobile && (cachedMobile.endsWith('9578654411') || cachedMobile === '9578654411'))
    ) {
        set.add('delivery_boy');
    }

    // Strictly ensure delivery_boy role is ONLY granted to verified delivery numbers or verified deliveryId
    const effectiveMobile = (cleanMobile || cachedMobile || '').slice(-10);
    const isDeliveryBoyMobile = ['9578654411', '9500179180'].includes(effectiveMobile);
    const hasDeliveryId = Boolean(user?.deliveryId || user?.data?.deliveryId);
    if (!isDeliveryBoyMobile && !hasDeliveryId) {
        set.delete('delivery_boy');
        set.delete('deliveryboy');
    }

    const list = Array.from(set);
    return list.length > 0 ? list : ['customer'];
};

export const hasAdminAccess = (user) => {
    const roles = getUserRoles(user);
    return roles.some(r =>
        ['admin', 'store_admin', 'service_admin', 'delivery_boy'].includes(r)
    );
};


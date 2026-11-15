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

        // 2. Check localStorage cached userInfo
    try {
        const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
        addRoles(cached);
        if (cached?.data) addRoles(cached.data);
    } catch {}

    // Check saved address
    let savedMobile = '';
    try {
        const saved = JSON.parse(localStorage.getItem('user_saved_address') || 'null');
        savedMobile = (saved?.mobile || saved?.phone || '').toString().replace(/\D/g, '');
    } catch {}

    // 3. Fallbacks for Admin, Delivery Boy, Store Admin, and Service Admin authorized mobile numbers
    const cleanMobile = (savedMobile || user?.mobile || user?.data?.mobile || '').toString().replace(/\D/g, '');
    let cachedMobile = '';
    try {
        const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
        cachedMobile = (cached?.mobile || cached?.data?.mobile || '').toString().replace(/\D/g, '');
    } catch {}

    const ADMIN_NUMBERS = ['9500171980', '9500171958', '9500171989'];
    const DELIVERY_NUMBERS = ['9578654411', '9500179180'];
    const STORE_ADMIN_NUMBERS = ['9876543211', '8474958585'];
    const SERVICE_ADMIN_NUMBERS = ['9999999999'];
    const effectiveMobile = (cleanMobile || cachedMobile || '').slice(-10);

    if (ADMIN_NUMBERS.includes(effectiveMobile)) {
        set.delete('delivery_boy');
        set.add('admin');
    } else if (DELIVERY_NUMBERS.includes(effectiveMobile)) {
        set.delete('admin');
        set.delete('store_admin');
        set.add('delivery_boy');
    } else if (STORE_ADMIN_NUMBERS.includes(effectiveMobile)) {
        set.delete('delivery_boy');
        set.add('store_admin');
    } else if (SERVICE_ADMIN_NUMBERS.includes(effectiveMobile)) {
        set.delete('delivery_boy');
        set.add('service_admin');
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


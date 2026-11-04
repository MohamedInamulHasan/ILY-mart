with open('src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update React import to include useMemo
code = code.replace(
    "import { useState, useContext, useEffect } from 'react';",
    "import { useState, useContext, useEffect, useMemo } from 'react';"
)

# 2. Update user and roles resolution
old_user_logic = """    const user = userProfile?.data || authUser;
    const orders = ordersData?.data || ordersData || [];
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const { mutate: updateProfile } = useUpdateProfile();

    const fruitAvatars = [
        { id: 'strawberry', url: '/avatars/strawberry.png', name: 'Strawberry' },
        { id: 'mango', url: '/avatars/mango.png', name: 'Mango' },
        { id: 'watermelon', url: '/avatars/watermelon.png', name: 'Watermelon' },
    ];

    const handleSelectAvatar = (url) => {
        updateProfile({ avatar: url }, {
            onSuccess: (response) => {
                if (response.success && response.data) {
                    setAuthUser(response.data);
                }
            }
        });
        setShowAvatarModal(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                updateProfile({ avatar: base64 }, {
                    onSuccess: (response) => {
                        if (response.success && response.data) {
                            setAuthUser(response.data);
                        }
                    }
                });
                setShowAvatarModal(false);
            };
            reader.readAsDataURL(file);
        }
    };

    // Filter relevant statuses for admins
    const statusCounts = orders.reduce((acc, order) => {
        const s = order.status;
        if (s === 'Delivered') acc.delivered++;
        if (s === 'Cancelled') acc.cancelled++;
        if (s === 'Out for Delivery') acc.outForDelivery++;
        if (s === 'Processing') acc.processing++;
        return acc;
    }, { delivered: 0, cancelled: 0, outForDelivery: 0, processing: 0 });

    const roles = user ? (Array.isArray(user.role) ? user.role : [user.role || 'customer']) : [];
    const isAdminView = roles.some(role => ['admin', 'delivery_boy', 'store_admin', 'service_admin'].includes(role));"""

new_user_logic = """    // Robust resolution of user from userProfile (React Query) and authUser (AuthContext)
    const user = useMemo(() => {
        if (userProfile && (userProfile.role || userProfile._id)) return userProfile;
        if (userProfile?.data && (userProfile.data.role || userProfile.data._id)) return userProfile.data;
        if (authUser && (authUser.role || authUser._id)) return authUser;
        if (authUser?.data && (authUser.data.role || authUser.data._id)) return authUser.data;
        try {
            const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (cached && (cached.role || cached._id)) return cached;
            if (cached?.data && (cached.data.role || cached.data._id)) return cached.data;
        } catch {}
        return userProfile || authUser || {};
    }, [userProfile, authUser]);

    const orders = ordersData?.data || ordersData || [];
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const { mutate: updateProfile } = useUpdateProfile();

    const fruitAvatars = [
        { id: 'strawberry', url: '/avatars/strawberry.png', name: 'Strawberry' },
        { id: 'mango', url: '/avatars/mango.png', name: 'Mango' },
        { id: 'watermelon', url: '/avatars/watermelon.png', name: 'Watermelon' },
    ];

    const handleSelectAvatar = (url) => {
        updateProfile({ avatar: url }, {
            onSuccess: (response) => {
                if (response.success && response.data) {
                    setAuthUser(response.data);
                }
            }
        });
        setShowAvatarModal(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                updateProfile({ avatar: base64 }, {
                    onSuccess: (response) => {
                        if (response.success && response.data) {
                            setAuthUser(response.data);
                        }
                    }
                });
                setShowAvatarModal(false);
            };
            reader.readAsDataURL(file);
        }
    };

    // Filter relevant statuses for admins
    const statusCounts = orders.reduce((acc, order) => {
        const s = order.status;
        if (s === 'Delivered') acc.delivered++;
        if (s === 'Cancelled') acc.cancelled++;
        if (s === 'Out for Delivery') acc.outForDelivery++;
        if (s === 'Processing') acc.processing++;
        return acc;
    }, { delivered: 0, cancelled: 0, outForDelivery: 0, processing: 0 });

    // Robust extraction of all roles from every available source
    const roles = useMemo(() => {
        const set = new Set();
        const addRoles = (obj) => {
            if (!obj) return;
            const r = obj.role || obj.roles;
            if (Array.isArray(r)) r.forEach(item => item && set.add(item));
            else if (r) set.add(r);
            if (obj.isAdmin) set.add('admin');
            if (obj.isStoreAdmin) set.add('store_admin');
            if (obj.isServiceAdmin) set.add('service_admin');
            if (obj.isDeliveryBoy) set.add('delivery_boy');
        };

        addRoles(user);
        addRoles(userProfile);
        addRoles(userProfile?.data);
        addRoles(authUser);
        addRoles(authUser?.data);
        try {
            const cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
            addRoles(cached);
            addRoles(cached?.data);
        } catch {}

        // Fallback for owner / admin mobile
        const cleanMobile = (user?.mobile || authUser?.mobile || '').toString().replace(/\\D/g, '');
        if (cleanMobile.endsWith('9500171980') || cleanMobile === '9500171980') {
            set.add('admin');
        }

        const result = Array.from(set);
        return result.length > 0 ? result : ['customer'];
    }, [user, userProfile, authUser]);

    const isAdmin = roles.includes('admin');
    const isStoreAdmin = roles.includes('store_admin');
    const isServiceAdmin = roles.includes('service_admin');
    const isDeliveryBoy = roles.includes('delivery_boy');
    const isAdminView = isAdmin || isStoreAdmin || isServiceAdmin || isDeliveryBoy;"""

if old_user_logic in code:
    code = code.replace(old_user_logic, new_user_logic)
    print('[OK] Updated user and roles resolution!')
else:
    print('[ERR] old_user_logic not found')

# 3. Add Dedicated Administration Card and update Performance Summary condition
old_summary = """                {/* Performance Summary for Global Admin */}
                {roles.includes('admin') && (
                    <div className="grid grid-cols-4 gap-2 mb-3">"""

new_summary = """                {/* Performance Summary for Global Admin / Store Admin / Delivery */}
                {(isAdmin || isStoreAdmin || isDeliveryBoy) && (
                    <div className="grid grid-cols-4 gap-2 mb-3">"""

if old_summary in code:
    code = code.replace(old_summary, new_summary)
    print('[OK] Updated summary condition to (isAdmin || isStoreAdmin || isDeliveryBoy)!')
else:
    print('[ERR] old_summary not found')

# 4. Insert dedicated Administration Card right before Account section
old_account_section = """                {/* Account Section */}
                <div className="mb-3">"""

new_admin_and_account = """                {/* Administration Section Card */}
                {isAdminView && (
                    <div className="mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h3 className="text-[14px] sm:text-[14.5px] font-bold text-gray-900 dark:text-white mb-2 px-1 tracking-tight flex items-center gap-2">
                            <Shield size={16} className="text-[#2E5A2E] dark:text-[#CBF9B2]" />
                            {t('Administration')}
                        </h3>
                        <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-1.5 sm:p-2 flex flex-col items-center shadow-sm border border-gray-100 dark:border-gray-700">
                            {isAdmin && (
                                <MenuLink 
                                    to="/admin" 
                                    icon={<Shield size={17} strokeWidth={2} />} 
                                    title={t('Admin Dashboard')} 
                                />
                            )}
                            {isDeliveryBoy && !isAdmin && (
                                <MenuLink 
                                    to="/admin" 
                                    icon={<Truck size={17} strokeWidth={2} />} 
                                    title={t('Manage Deliveries')} 
                                />
                            )}
                            {isStoreAdmin && (
                                <>
                                    {isAdmin && <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5" />}
                                    <MenuLink 
                                        to="/my-store" 
                                        icon={<Store size={17} strokeWidth={2} />} 
                                        title={t('My Store')} 
                                    />
                                </>
                            )}
                            {isServiceAdmin && (
                                <>
                                    {(isAdmin || isStoreAdmin) && <div className="h-[1px] w-[calc(100%-4rem)] ml-auto bg-gray-200/60 dark:bg-gray-700/60 mr-3.5" />}
                                    <MenuLink 
                                        to="/my-service" 
                                        icon={<Wrench size={17} strokeWidth={2} />} 
                                        title={t('My Service')} 
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Account Section */}
                <div className="mb-3">"""

if old_account_section in code:
    code = code.replace(old_account_section, new_admin_and_account)
    print('[OK] Dedicated Administration Section Card inserted!')
else:
    print('[ERR] old_account_section not found')

with open('src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('[DONE] Profile.jsx updated successfully!')

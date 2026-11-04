const fs = require('fs');

// 1. Update EditAddress.jsx
let editAddress = fs.readFileSync('src/pages/EditAddress.jsx', 'utf8');

// Add useQueryClient import
if (!editAddress.includes('useQueryClient')) {
    editAddress = editAddress.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useQueryClient } from '@tanstack/react-query';"
    );
    editAddress = editAddress.replace(
        "const navigate = useNavigate();",
        "const navigate = useNavigate();\n    const queryClient = useQueryClient();"
    );
}

// Replace handleSubmit with instant optimistic update
const oldSubmitStart = "        setFieldErrors({});\r\n        setIsSaving(true);\r\n\r\n        try {";
const oldSubmitStartLF = "        setFieldErrors({});\n        setIsSaving(true);\n\n        try {";

const newSubmitCode = `        setFieldErrors({});
        setIsSaving(true);

        const updatedAddress = {
            street: formData.street,
            city: formData.city,
            zip: formData.zip || '630702',
            state: '',
            country: 'India'
        };

        const optimisticUser = {
            ...(user || {}),
            name: formData.fullName,
            fullName: formData.fullName,
            mobile: formData.mobile,
            phone: formData.mobile,
            address: updatedAddress,
            location: formData.location || ''
        };

        // Instant optimistic update across all local caches (0ms delay)
        setUser(optimisticUser);
        localStorage.setItem('userInfo', JSON.stringify(optimisticUser));
        queryClient.setQueryData(['users', 'profile'], { success: true, data: optimisticUser });
        queryClient.setQueriesData({ queryKey: ['users'] }, (old) => {
            if (!old) return old;
            return { ...old, data: optimisticUser };
        });
        queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });

        // Navigate immediately back to profile so user sees the change with 0 lag
        navigate('/profile');

        // Background server sync without blocking the UI
        (async () => {
            try {
                const freshUser = await updateGuest(formData.fullName, formData.mobile);
                const token = localStorage.getItem('authToken');
                const config = token ? { headers: { Authorization: \`Bearer \${token}\` } } : {};
                const profileData = {
                    name: formData.fullName,
                    mobile: formData.mobile,
                    address: updatedAddress,
                    location: formData.location
                };
                const result = await updateProfile(profileData, config);
                if (result) {
                    const finalUser = { ...optimisticUser, ...(result?.data || result) };
                    setUser(finalUser);
                    localStorage.setItem('userInfo', JSON.stringify(finalUser));
                    queryClient.setQueryData(['users', 'profile'], { success: true, data: finalUser });
                }
            } catch (err) {
                console.warn('Background address sync warning:', err);
            }
        })();
        return;`;

// Find the index of try { in handleSubmit
const submitIndex = editAddress.indexOf('const handleSubmit = async');
if (submitIndex !== -1) {
    const tryIndex = editAddress.indexOf('try {', submitIndex);
    const catchIndex = editAddress.indexOf('} catch (err) {', tryIndex);
    const endBlockIndex = editAddress.indexOf('};', catchIndex) + 2;

    // We can replace from "setFieldErrors({});" up to the end of handleSubmit
    const setFieldErrorsIndex = editAddress.indexOf('setFieldErrors({});', submitIndex);
    if (setFieldErrorsIndex !== -1 && setFieldErrorsIndex < tryIndex) {
        const toReplace = editAddress.substring(setFieldErrorsIndex, endBlockIndex - 2);
        editAddress = editAddress.substring(0, setFieldErrorsIndex) + newSubmitCode + '\n    ';
        console.log('✅ EditAddress.jsx handleSubmit successfully upgraded to instant optimistic flow');
    }
}

fs.writeFileSync('src/pages/EditAddress.jsx', editAddress, 'utf8');

// 2. Update Profile.jsx
let profile = fs.readFileSync('src/pages/Profile.jsx', 'utf8');

const oldUserMemo = `    // Robust resolution of user from userProfile (React Query) and authUser (AuthContext)
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
    }, [userProfile, authUser]);`;

const newUserMemo = `    // Robust resolution of user: seamlessly prioritizes latest local address updates
    const user = useMemo(() => {
        let cached = null;
        try {
            cached = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (cached?.data) cached = cached.data;
        } catch {}

        const profileObj = userProfile?.data || userProfile || {};
        const authObj = authUser?.data || authUser || {};
        const cachedObj = cached || {};

        const street = cachedObj.address?.street || authObj.address?.street || profileObj.address?.street || '';
        const city = cachedObj.address?.city || authObj.address?.city || profileObj.address?.city || '';
        const zip = cachedObj.address?.zip || authObj.address?.zip || profileObj.address?.zip || '';

        return {
            ...profileObj,
            ...authObj,
            ...cachedObj,
            address: {
                ...(profileObj.address || {}),
                ...(authObj.address || {}),
                ...(cachedObj.address || {}),
                street,
                city,
                zip
            }
        };
    }, [userProfile, authUser]);`;

if (profile.includes('Robust resolution of user from userProfile')) {
    const startIdx = profile.indexOf('// Robust resolution of user from userProfile');
    const endIdx = profile.indexOf('}, [userProfile, authUser]);', startIdx) + '}, [userProfile, authUser]);'.length;
    profile = profile.substring(0, startIdx) + newUserMemo + profile.substring(endIdx);
    fs.writeFileSync('src/pages/Profile.jsx', profile, 'utf8');
    console.log('✅ Profile.jsx useMemo successfully updated to instantly show updated address');
} else {
    console.log('Profile target comment not found, check lines manually');
}


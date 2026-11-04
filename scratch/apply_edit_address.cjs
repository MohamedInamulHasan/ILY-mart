const fs = require('fs');
let code = fs.readFileSync('src/pages/EditAddress.jsx', 'utf8');

// 1. Add imports
if (!code.includes('useQueryClient')) {
    code = code.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { useQueryClient } from '@tanstack/react-query';"
    );
    code = code.replace(
        "const navigate = useNavigate();",
        "const navigate = useNavigate();\n    const queryClient = useQueryClient();"
    );
}

// 2. Replace try { ... } in handleSubmit
const startMarker = '        try {\r\n            // Link guest profile';
const startMarkerLF = '        try {\n            // Link guest profile';
const isCRLF = code.includes(startMarker);
const activeStart = isCRLF ? startMarker : startMarkerLF;

const endMarker = '            setIsSaving(false);\r\n        }';
const endMarkerLF = '            setIsSaving(false);\n        }';
const activeEnd = isCRLF ? endMarker : endMarkerLF;

const startIndex = code.indexOf(activeStart);
const endIndex = code.indexOf(activeEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `        // 1. Instant optimistic local update (0ms delay)
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

        setUser(optimisticUser);
        localStorage.setItem('userInfo', JSON.stringify(optimisticUser));
        queryClient.setQueryData(['users', 'profile'], { success: true, data: optimisticUser });
        queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
        navigate('/profile');

        // 2. Background server synchronization
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
            } finally {
                setIsSaving(false);
            }
        })();`;

    code = code.substring(0, startIndex) + replacement + code.substring(endIndex + activeEnd.length);
    fs.writeFileSync('src/pages/EditAddress.jsx', code, 'utf8');
    console.log('✅ EditAddress.jsx updated cleanly!');
} else {
    console.error('Markers not found: startIndex =', startIndex, 'endIndex =', endIndex);
}


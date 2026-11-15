const fs = require('fs');
let fileContent = fs.readFileSync('src/pages/EditAddress.jsx', 'utf8');

const target = `        const standardMobile = cleanMobile.slice(-10);
        const isDeliveryNumber = ['9578654411', '9500179180'].includes(standardMobile);

        const optimisticUser = {
            ...(user || {}),
            name: formData.fullName,
            fullName: formData.fullName,
            mobile: formData.mobile,
            phone: formData.mobile,
            address: updatedAddress,
            location: formData.location || ''
        };

        if (!isDeliveryNumber) {
            delete optimisticUser.deliveryId;
            if (Array.isArray(optimisticUser.role)) {
                optimisticUser.role = optimisticUser.role.filter(r => r !== 'delivery_boy' && r !== 'deliveryboy');
                if (optimisticUser.role.length === 0) optimisticUser.role = ['customer'];
            } else if (optimisticUser.role === 'delivery_boy' || optimisticUser.role === 'deliveryboy') {
                optimisticUser.role = 'customer';
            }
        }`;

const replacement = `        const standardMobile = cleanMobile.slice(-10);
        const isDeliveryNumber = ['9578654411', '9500171980', '9500179180'].includes(standardMobile);
        const isStoreNumber = ['9876543211', '8474958585'].includes(standardMobile);
        const isServiceNumber = ['9999999999'].includes(standardMobile);

        const optimisticUser = {
            ...(user || {}),
            name: formData.fullName,
            fullName: formData.fullName,
            mobile: formData.mobile,
            phone: formData.mobile,
            address: updatedAddress,
            location: formData.location || ''
        };

        if (isDeliveryNumber) {
            optimisticUser.role = ['delivery_boy'];
            delete optimisticUser.storeId;
            delete optimisticUser.serviceId;
            localStorage.removeItem('my_store_id');
            localStorage.removeItem('my_service_id');
        } else if (isStoreNumber) {
            optimisticUser.role = ['store_admin'];
            optimisticUser.storeId = '6a5c5bf5445f08d3448365c2';
            delete optimisticUser.deliveryId;
            delete optimisticUser.serviceId;
            localStorage.setItem('my_store_id', '6a5c5bf5445f08d3448365c2');
            localStorage.removeItem('my_service_id');
        } else if (isServiceNumber) {
            optimisticUser.role = ['service_admin'];
            optimisticUser.serviceId = '6aa8c41f7d177bd3cd8baea1';
            delete optimisticUser.deliveryId;
            delete optimisticUser.storeId;
            localStorage.setItem('my_service_id', '6aa8c41f7d177bd3cd8baea1');
            localStorage.removeItem('my_store_id');
        } else if (['9500171958'].includes(standardMobile)) {
            optimisticUser.role = ['admin'];
        } else {
            delete optimisticUser.deliveryId;
            delete optimisticUser.storeId;
            delete optimisticUser.serviceId;
            optimisticUser.role = ['customer'];
            localStorage.removeItem('my_store_id');
            localStorage.removeItem('my_service_id');
        }`;

const normalize = str => str.replace(/\r\n/g, '\n');
const fileContentNorm = normalize(fileContent);
const targetNorm = normalize(target);

if (fileContentNorm.includes(targetNorm)) {
    const updated = fileContentNorm.replace(targetNorm, normalize(replacement));
    fs.writeFileSync('src/pages/EditAddress.jsx', updated, 'utf8');
    console.log('Successfully updated EditAddress.jsx');
} else {
    console.error('Target not found in EditAddress.jsx');
}

const fs = require('fs');

let p = fs.readFileSync('src/pages/Profile.jsx', 'utf8');

// 1. Remove useOrders import
p = p.replace("import { useOrders } from '../hooks/queries/useOrders';\r\n", "");
p = p.replace("import { useOrders } from '../hooks/queries/useOrders';\n", "");

// 2. Remove orders query hook
p = p.replace("    const { data: ordersData } = useOrders();\r\n", "");
p = p.replace("    const { data: ordersData } = useOrders();\n", "");
p = p.replace("    const orders = ordersData?.data || ordersData || [];\r\n", "");
p = p.replace("    const orders = ordersData?.data || ordersData || [];\n", "");

// 3. Fix address check
const oldAddressCheck = `    const addressObj = user?.address || {};
    const isAddressObject = typeof user?.address === 'object' && user?.address !== null;
    const hasAddress = isAddressObject 
        ? (addressObj.street && addressObj.street.trim().length > 0)
        : (user?.address && String(user.address).trim().length > 0);
    const showLogout = hasAddress || isAdminView;`;

const newAddressCheck = `    const addressObj = (user?.address && typeof user.address === 'object') ? user.address : {};
    const isAddressObject = typeof user?.address === 'object' && user?.address !== null;
    const streetStr = typeof addressObj.street === 'string' 
        ? addressObj.street.trim() 
        : (addressObj.street != null ? String(addressObj.street).trim() : '');
    const rawAddressStr = typeof user?.address === 'string' ? user.address.trim() : '';
    const hasAddress = isAddressObject 
        ? streetStr.length > 0 
        : rawAddressStr.length > 0;
    const showLogout = Boolean(hasAddress || isAdminView || user?.mobile || user?._id);`;

if (p.includes(oldAddressCheck)) {
    p = p.replace(oldAddressCheck, newAddressCheck);
} else {
    // try with \n
    const oldAddressCheckLF = oldAddressCheck.replace(/\r\n/g, '\n');
    const newAddressCheckLF = newAddressCheck.replace(/\r\n/g, '\n');
    p = p.replace(oldAddressCheckLF, newAddressCheckLF);
}

fs.writeFileSync('src/pages/Profile.jsx', p, 'utf8');
console.log('Updated Profile.jsx');

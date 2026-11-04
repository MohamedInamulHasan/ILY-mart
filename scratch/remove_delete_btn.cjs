const fs = require('fs');

let orders = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

const targetRegex = /\s*\{!\[['"]Processing['"],\s*['"]Shipped['"],\s*['"]Out for Delivery['"],\s*['"]Delivered['"]\]\.includes\(order\.status\)\s*&&\s*\(\s*<button[\s\S]*?<\/button>\s*\)\}/;

if (targetRegex.test(orders)) {
    orders = orders.replace(targetRegex, '');
    fs.writeFileSync('src/pages/Orders.jsx', orders, 'utf8');
    console.log('Successfully removed delete button from Orders.jsx!');
} else {
    console.error('Target regex did not match in Orders.jsx');
}

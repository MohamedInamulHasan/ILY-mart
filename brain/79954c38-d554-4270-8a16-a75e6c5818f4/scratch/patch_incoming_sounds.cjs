const fs = require('fs');
const path = 'src/components/IncomingOrderModal.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Find both playSuccessSound() calls and their contexts, then replace
// 1. When Out for Delivery -> Delivered
const old1 = `                await updateOrderStatus({
                    id,
                    status: 'Delivered',
                    deliveredBy: user?._id
                });
                playSuccessSound();`;
const new1 = `                await updateOrderStatus({
                    id,
                    status: 'Delivered',
                    deliveredBy: user?._id
                });
                playOrderDeliveredSound();`;

// 2. When Processing -> Out for Delivery (accepted)
const old2 = `                await updateOrderStatus({
                    id,
                    status: 'Out for Delivery',
                    deliveredBy: user?._id
                });
                playSuccessSound();`;
const new2 = `                await updateOrderStatus({
                    id,
                    status: 'Out for Delivery',
                    deliveredBy: user?._id
                });
                playOrderAcceptedSound();`;

let result = content;
if (result.includes(old1.trim().split('\n')[0])) {
    result = result.replace(old1, new1);
    console.log('Replaced delivered sound');
} else {
    console.log('Could not find delivered block');
    // Show playSuccessSound lines
    result.split('\n').forEach((l,i) => { if(l.includes('playSuccessSound')) console.log(i+1, l); });
}

if (result.includes(old2.trim().split('\n')[0])) {
    result = result.replace(old2, new2);
    console.log('Replaced accepted sound');
} else {
    console.log('Could not find accepted block');
}

fs.writeFileSync(path, result, 'utf8');
console.log('Done');

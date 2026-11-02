const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'public', 'floating-logo.jpg');
const dest = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'drawable', 'floating_logo.png');
const oldJpg = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'drawable', 'floating_logo.jpg');

fs.copyFileSync(src, dest);
if (fs.existsSync(oldJpg)) {
    fs.unlinkSync(oldJpg);
}
console.log('Copied to', dest);


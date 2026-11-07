const fs = require('fs');
const path = 'src/pages/OrderConfirmation.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Replace playSuccessSound() with playOrderPlacedSound() in confirmOrderAction context
const old = 'playSuccessSound();\n        markOrderPlaced();\n        setShowSuccessModal(true);';
const nw  = 'playOrderPlacedSound();\n        markOrderPlaced();\n        setShowSuccessModal(true);';

if (content.includes(old)) {
    content = content.replace(old, nw);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: replaced playSuccessSound with playOrderPlacedSound');
} else {
    // Show context around playSuccessSound
    const lines = content.split('\n');
    lines.forEach((l, i) => { if (l.includes('playSuccessSound')) console.log(i+1, JSON.stringify(l)); });
}

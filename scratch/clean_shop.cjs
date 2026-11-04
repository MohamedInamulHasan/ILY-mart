const fs = require('fs');
let s = fs.readFileSync('src/pages/Shop.jsx', 'utf8');
const isCRLF = s.includes('\r\n');
const lb = isCRLF ? '\r\n' : '\n';

const lines = s.split(/\r?\n/);
let foundIdx = -1;
for (let i = 0; i < lines.length - 1; i++) {
    if (lines[i].includes('filteredStores.length > 0 ?') && lines[i+1].includes('grid-cols-1') && lines[i+2].includes('grid-cols-1')) {
        foundIdx = i + 2;
        break;
    }
}
if (foundIdx !== -1) {
    lines.splice(foundIdx, 1);
    fs.writeFileSync('src/pages/Shop.jsx', lines.join(lb), 'utf8');
    console.log('Removed duplicate grid div successfully!');
} else {
    console.log('No duplicate found');
}


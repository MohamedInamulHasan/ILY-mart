const fs = require('fs');

// 1. Update StoreCard.jsx
let sc = fs.readFileSync('src/components/StoreCard.jsx', 'utf8');
if (!sc.includes("import React")) {
    sc = "import React, { memo } from 'react';\r\n" + sc;
}
sc = sc.replace('export default React.memo(StoreCard);', 'export default memo(StoreCard);');
fs.writeFileSync('src/components/StoreCard.jsx', sc, 'utf8');
console.log('Updated StoreCard.jsx');

// 2. Update SimpleProductCard.jsx
let spc = fs.readFileSync('src/components/SimpleProductCard.jsx', 'utf8');
if (!spc.includes("import React")) {
    spc = "import React, { memo } from 'react';\r\n" + spc;
}
spc = spc.replace('export default React.memo(SimpleProductCard);', 'export default memo(SimpleProductCard);');
fs.writeFileSync('src/components/SimpleProductCard.jsx', spc, 'utf8');
console.log('Updated SimpleProductCard.jsx');

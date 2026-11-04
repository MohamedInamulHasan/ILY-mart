const fs = require('fs');

let content = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

// Replace getStatusColor case
content = content.replace(
    "case 'Processing':\r\n            case 'Pending':\r\n                return 'bg-amber-500/80 text-white';",
    "case 'Processing':\r\n            case 'Pending':\r\n                return 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50';"
);
content = content.replace(
    "case 'Processing':\n            case 'Pending':\n                return 'bg-amber-500/80 text-white';",
    "case 'Processing':\n            case 'Pending':\n                return 'bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50';"
);

// Remove text-white from getStatusIcon
content = content.replace(/className="mr-1 stroke-\[2\.5\] text-white"/g, 'className="mr-1 stroke-[2.5]"');

// Remove hardcoded text-white from status pill wrapper and span
content = content.replace(
    'text-[11px] md:text-xs font-bold text-white shadow-xs select-none',
    'text-[11px] md:text-xs font-bold shadow-xs select-none'
);
content = content.replace(
    '<span className="font-bold text-white">{getStatusText(order.status)}</span>',
    '<span className="font-bold">{getStatusText(order.status)}</span>'
);

fs.writeFileSync('src/pages/Orders.jsx', content, 'utf8');
console.log('Successfully updated Orders.jsx');


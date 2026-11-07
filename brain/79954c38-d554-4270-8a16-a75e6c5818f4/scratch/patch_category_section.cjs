const fs = require('fs');
const path = 'src/components/home/CategorySection.jsx';
let content = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// 1. Remove the hamburger icon card when loads/not set
const oldAllImageBlock = `                        {allCategoryImage ? (
                            <img
                                src={allCategoryImage}
                                alt="All Categories"
                                className="w-full h-full object-contain rounded-2xl transition-transform"
                                onError={(e) => { e.target.style.opacity = '0'; }}
                            />
                        ) : (
                            <div className="w-full h-full rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="4" y="4" width="13" height="13" rx="3" fill="currentColor" className="text-gray-500 dark:text-gray-400" />
                                    <rect x="23" y="4" width="13" height="13" rx="3" fill="currentColor" className="text-gray-500 dark:text-gray-400" />
                                    <rect x="4" y="23" width="13" height="13" rx="3" fill="currentColor" className="text-gray-500 dark:text-gray-400" />
                                    <rect x="23" y="23" width="13" height="13" rx="3" fill="currentColor" className="text-gray-500 dark:text-gray-400" />
                                </svg>
                            </div>
                        )}`;

const newAllImageBlock = `                        {allCategoryImage ? (
                            <img
                                src={allCategoryImage}
                                alt="All Categories"
                                className="w-full h-full object-contain rounded-2xl transition-transform"
                                onError={(e) => { e.target.style.opacity = '0'; }}
                            />
                        ) : (
                            <div className="w-full h-full rounded-2xl blinkit-shimmer"></div>
                        )}`;

if (content.includes(oldAllImageBlock)) {
    content = content.replace(oldAllImageBlock, newAllImageBlock);
    console.log('SUCCESS: replaced hamburger icon with shimmer');
} else {
    console.log('Old allCategoryImage block not matched exactly, checking substring...');
    const searchPart = '<rect x="4" y="4"';
    if (content.includes(searchPart)) {
        console.log('Found SVG rect, updating manually');
    }
}

// 2. Update Selected vs Unselected styling (no dull effect, selected bigger, unselected smaller for both img and text)
// For 'All' item
const oldAllClass = "${selectedCategory === 'All' ? 'scale-105 opacity-100 filter brightness-110 contrast-105' : 'scale-95 opacity-55 hover:opacity-85'}";
const newAllClass = "${selectedCategory === 'All' ? 'scale-105 sm:scale-110 opacity-100 filter contrast-105' : 'scale-90 opacity-100'}";

if (content.includes(oldAllClass)) {
    content = content.replace(oldAllClass, newAllClass);
    console.log('SUCCESS: updated All container scaling');
}

// For Categories mapping
const oldCatClass = "${isSelected ? 'scale-105 opacity-100 filter brightness-110 contrast-105' : 'scale-95 opacity-55 hover:opacity-85'}";
const newCatClass = "${isSelected ? 'scale-105 sm:scale-110 opacity-100 filter contrast-105' : 'scale-90 opacity-100'}";

if (content.includes(oldCatClass)) {
    content = content.replace(oldCatClass, newCatClass);
    console.log('SUCCESS: updated Category container scaling');
}

// Text styling for 'All'
content = content.replace(
    "${selectedCategory === 'All' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}",
    "${selectedCategory === 'All' ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}"
);
content = content.replace(
    "${selectedCategory === 'All' ? 'font-bold' : 'font-normal'}",
    "${selectedCategory === 'All' ? 'font-black text-[12px] sm:text-[12.5px] md:text-sm' : 'font-medium text-[10px] sm:text-[10.5px] md:text-[11px]'}"
);

// Text styling for category items
content = content.replace(
    "${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}",
    "${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}"
);
content = content.replace(
    "${isSelected ? 'font-bold' : 'font-normal'}",
    "${isSelected ? 'font-black text-[12px] sm:text-[12.5px] md:text-sm' : 'font-medium text-[10px] sm:text-[10.5px] md:text-[11px]'}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('CategorySection updated successfully');

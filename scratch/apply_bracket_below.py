import re

# 1. Update src/utils/titleHelpers.jsx
title_helpers_path = 'src/utils/titleHelpers.jsx'
with open(title_helpers_path, 'r', encoding='utf-8') as f:
    th_code = f.read()

old_logic = """    let tamStr = '';
    let engStr = '';
    let firstPartIsTamil = false;

    if (isPart1Tamil && !isPart2Tamil) {
        tamStr = part1;
        engStr = part2;
        firstPartIsTamil = true;
    } else if (isPart2Tamil && !isPart1Tamil) {
        tamStr = part2;
        engStr = part1;
        firstPartIsTamil = false;
    } else {
        engStr = part1;
        tamStr = part2;
        firstPartIsTamil = false;
    }

    // Determine main and subtitle based on active language preference
    let mainText = '';
    let subText = '';

    if (language === 'ta') {
        mainText = tamStr || engStr;
        subText = tamStr && engStr ? engStr : '';
    } else {
        mainText = engStr || tamStr;
        subText = engStr && tamStr ? tamStr : '';
    }"""

new_logic = """    let mainText = '';
    let subText = '';

    if (isPart1Tamil && !isPart2Tamil) {
        if (language === 'ta') {
            mainText = part1;
            subText = part2;
        } else {
            mainText = part2;
            subText = part1;
        }
    } else if (isPart2Tamil && !isPart1Tamil) {
        if (language === 'ta') {
            mainText = part2;
            subText = part1;
        } else {
            mainText = part1;
            subText = part2;
        }
    } else {
        // Neither or both have Tamil: keep part1 as main, part2 as bracketed subtext below
        mainText = part1;
        subText = part2;
    }"""

if old_logic in th_code:
    th_code = th_code.replace(old_logic, new_logic)
    with open(title_helpers_path, 'w', encoding='utf-8') as f:
        f.write(th_code)
    print("titleHelpers.jsx updated!")
else:
    print("WARNING: old_logic not found in titleHelpers.jsx")

# 2. Update Checkout.jsx
checkout_path = 'src/pages/Checkout.jsx'
with open(checkout_path, 'r', encoding='utf-8') as f:
    checkout_code = f.read()

# Add import if missing
if 'renderBilingualTitle' not in checkout_code:
    checkout_code = checkout_code.replace("import { getStoreName", "import { renderBilingualTitle } from '../utils/titleHelpers';\nimport { getStoreName")

old_checkout_item = """                                                <h4 className={`text-sm font-medium text-gray-900 dark:text-white mb-0.5 ${item.isFromAd ? '' : 'truncate'}`} title={item.adTitle || item.title || item.name}>
                                                    {(() => {
                                                        const fullTitle = t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name;
                                                        if (language !== 'ta') return fullTitle;
                                                        
                                                        const bracketIndex = fullTitle.indexOf('(');
                                                        if (bracketIndex === -1) return fullTitle;

                                                        const part1 = fullTitle.substring(0, bracketIndex).trim();
                                                        const part2 = fullTitle.substring(bracketIndex + 1, fullTitle.length - 1).trim();
                                                        
                                                        const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                                        const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);
                                                        
                                                        if (isPart1Tamil && !isPart2Tamil) return `${part1} (${part2})`;
                                                        if (isPart2Tamil && !isPart1Tamil) return `${part2} (${part1})`;
                                                        return fullTitle;
                                                    })()}
                                                </h4>"""

new_checkout_item = """                                                <div className="mb-0.5" title={item.adTitle || item.title || item.name}>
                                                    {renderBilingualTitle(t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name, language, {
                                                        hideTag: true,
                                                        mainClassName: 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
                                                        subClassName: 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
                                                    })}
                                                </div>"""

if old_checkout_item in checkout_code:
    checkout_code = checkout_code.replace(old_checkout_item, new_checkout_item)
    with open(checkout_path, 'w', encoding='utf-8') as f:
        f.write(checkout_code)
    print("Checkout.jsx updated!")
else:
    print("WARNING: old_checkout_item not found in Checkout.jsx")

# 3. Update OrderConfirmation.jsx
conf_path = 'src/pages/OrderConfirmation.jsx'
with open(conf_path, 'r', encoding='utf-8') as f:
    conf_code = f.read()

if 'renderBilingualTitle' not in conf_code:
    conf_code = conf_code.replace("import { getStoreName", "import { renderBilingualTitle } from '../utils/titleHelpers';\nimport { getStoreName")

old_conf_item = """                                        <h4 className={`text-sm font-medium text-gray-900 dark:text-white mb-0.5 ${item.isFromAd ? '' : 'truncate'}`} title={item.adTitle || item.title}>
                                            {(() => {
                                                const fullTitle = t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name;
                                                if (language !== 'ta') return fullTitle;

                                                const bracketIndex = fullTitle.indexOf('(');
                                                if (bracketIndex === -1) return fullTitle;

                                                const part1 = fullTitle.substring(0, bracketIndex).trim();
                                                const part2 = fullTitle.substring(bracketIndex + 1, fullTitle.length - 1).trim();

                                                const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                                const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);

                                                if (isPart1Tamil && !isPart2Tamil) return `${part1} (${part2})`;
                                                if (isPart2Tamil && !isPart1Tamil) return `${part2} (${part1})`;
                                                return fullTitle;
                                            })()}
                                        </h4>"""

new_conf_item = """                                        <div className="mb-0.5" title={item.adTitle || item.title}>
                                            {renderBilingualTitle(t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name, language, {
                                                hideTag: true,
                                                mainClassName: 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
                                                subClassName: 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
                                            })}
                                        </div>"""

if old_conf_item in conf_code:
    conf_code = conf_code.replace(old_conf_item, new_conf_item)
    with open(conf_path, 'w', encoding='utf-8') as f:
        f.write(conf_code)
    print("OrderConfirmation.jsx updated!")
else:
    print("WARNING: old_conf_item not found in OrderConfirmation.jsx")

# 4. Update OrderDetails.jsx
details_path = 'src/pages/OrderDetails.jsx'
with open(details_path, 'r', encoding='utf-8') as f:
    details_code = f.read()

if 'renderBilingualTitle' not in details_code:
    details_code = details_code.replace("import { getStoreName", "import { renderBilingualTitle } from '../utils/titleHelpers';\nimport { getStoreName")

old_details_item = """                                    <h4 className={`font-medium text-gray-900 dark:text-white text-sm ${item.isFromAd ? '' : 'truncate'} mb-0.5`} title={item.adTitle || item.name}>
                                        {(() => {
                                            const fullTitle = t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title;
                                            if (language !== 'ta') return fullTitle;
                                            
                                            const bracketIndex = fullTitle.indexOf('(');
                                            if (bracketIndex === -1) return fullTitle;

                                            const part1 = fullTitle.substring(0, bracketIndex).trim();
                                            const part2 = fullTitle.substring(bracketIndex + 1, fullTitle.length - 1).trim();
                                            
                                            const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                            const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);
                                            
                                            if (isPart1Tamil && !isPart2Tamil) return `${part1} (${part2})`;
                                            if (isPart2Tamil && !isPart1Tamil) return `${part2} (${part1})`;
                                            return fullTitle;
                                        })()}
                                    </h4>"""

new_details_item = """                                    <div className="mb-0.5" title={item.adTitle || item.name}>
                                        {renderBilingualTitle(t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title, language, {
                                            hideTag: true,
                                            mainClassName: 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
                                            subClassName: 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
                                        })}
                                    </div>"""

if old_details_item in details_code:
    details_code = details_code.replace(old_details_item, new_details_item)
    with open(details_path, 'w', encoding='utf-8') as f:
        f.write(details_code)
    print("OrderDetails.jsx updated!")
else:
    print("WARNING: old_details_item not found in OrderDetails.jsx")

# 5. Update Orders.jsx
orders_path = 'src/pages/Orders.jsx'
with open(orders_path, 'r', encoding='utf-8') as f:
    orders_code = f.read()

if 'renderBilingualTitle' not in orders_code:
    orders_code = orders_code.replace("import { getStoreName", "import { renderBilingualTitle } from '../utils/titleHelpers';\nimport { getStoreName")

old_orders_item = """                                                        <p className={`text-[13px] font-medium leading-tight text-gray-900 dark:text-white ${item.isFromAd ? '' : 'truncate'}`}>
                                                            {(() => {
                                                                const fullTitle = t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title;
                                                                if (language !== 'ta') return fullTitle;
                                                                
                                                                const bracketIndex = fullTitle.indexOf('(');
                                                                if (bracketIndex === -1) return fullTitle;

                                                                const part1 = fullTitle.substring(0, bracketIndex).trim();
                                                                const part2 = fullTitle.substring(bracketIndex + 1, fullTitle.length - 1).trim();
                                                                
                                                                const isPart1Tamil = /[\u0B80-\u0BFF]/.test(part1);
                                                                const isPart2Tamil = /[\u0B80-\u0BFF]/.test(part2);
                                                                
                                                                if (isPart1Tamil && !isPart2Tamil) return `${part1} (${part2})`;
                                                                if (isPart2Tamil && !isPart1Tamil) return `${part2} (${part1})`;
                                                                return fullTitle;
                                                            })()}
                                                        </p>"""

new_orders_item = """                                                        <div className="leading-tight">
                                                            {renderBilingualTitle(t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title, language, {
                                                                hideTag: true,
                                                                mainClassName: 'text-[13px] font-medium leading-tight text-gray-900 dark:text-white',
                                                                subClassName: 'text-[11px] text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
                                                            })}
                                                        </div>"""

if old_orders_item in orders_code:
    orders_code = orders_code.replace(old_orders_item, new_orders_item)
    with open(orders_path, 'w', encoding='utf-8') as f:
        f.write(orders_code)
    print("Orders.jsx updated!")
else:
    print("WARNING: old_orders_item not found in Orders.jsx")

print("Finished applying bracket below across all order pages!")


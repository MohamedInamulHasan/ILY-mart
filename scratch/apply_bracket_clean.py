import os
import re

files_to_update = [
    {
        'path': 'src/pages/Checkout.jsx',
        'import_before': "import { getStoreName",
        'title_expr': "t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name",
        'tag': 'h4',
        'main_class': 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
        'sub_class': 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
    },
    {
        'path': 'src/pages/OrderConfirmation.jsx',
        'import_before': "import { getStoreName",
        'title_expr': "t(item, 'title') || t(item, 'name') || item.adTitle || item.title || item.name",
        'tag': 'h4',
        'main_class': 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
        'sub_class': 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
    },
    {
        'path': 'src/pages/OrderDetails.jsx',
        'import_before': "import { getStoreName",
        'title_expr': "t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title",
        'tag': 'h4',
        'main_class': 'text-sm font-medium text-gray-900 dark:text-white leading-snug',
        'sub_class': 'text-xs text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
    },
    {
        'path': 'src/pages/Orders.jsx',
        'import_before': "import { getStoreName",
        'title_expr': "t(item, 'name') || t(item, 'title') || item.adTitle || item.name || item.title",
        'tag': 'p',
        'main_class': 'text-[13px] font-medium leading-tight text-gray-900 dark:text-white',
        'sub_class': 'text-[11px] text-gray-400 dark:text-gray-500 font-normal leading-tight mt-0.5'
    }
]

for cfg in files_to_update:
    path = cfg['path']
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Ensure import
    if 'renderBilingualTitle' not in c:
        c = c.replace(cfg['import_before'], f"import {{ renderBilingualTitle }} from '../utils/titleHelpers';\n{cfg['import_before']}")

    # Regex to match the whole <h4 or <p block with the IIFE and bracketIndex
    # e.g.:
    # <h4 className=... title=...>
    #   {(() => { ... bracketIndex ... })()}
    # </h4>
    tag = cfg['tag']
    pattern = rf'<{tag}\s+className=[^>]*>(\s*\{{\s*\(\(\)\s*=>\s*\{{.*?bracketIndex.*?\}}\)\(\)\s*\}}\s*)</{tag}>'
    
    # We want to replace the inner content with renderBilingualTitle
    replacement = rf"""<{tag} className="mb-0.5 leading-tight">
                                                    {{renderBilingualTitle({cfg['title_expr']}, language, {{
                                                        hideTag: true,
                                                        mainClassName: '{cfg['main_class']}',
                                                        subClassName: '{cfg['sub_class']}'
                                                    }})}}
                                                </{tag}>"""

    new_c, count = re.subn(pattern, replacement, c, flags=re.DOTALL)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_c)
        print(f"SUCCESS: Replaced {count} occurrences in {path}")
    else:
        print(f"FAILED to match regex in {path}")

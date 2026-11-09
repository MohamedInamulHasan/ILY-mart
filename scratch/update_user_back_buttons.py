import re

# 1. ProductDetails.jsx
with open('src/pages/ProductDetails.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?SwipeActionButton.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate)}",
    content
)
with open('src/pages/ProductDetails.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ProductDetails.jsx")

# 2. CategoryProducts.jsx
with open('src/pages/CategoryProducts.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?SwipeActionButton.*?;|import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate)}",
    content
)
with open('src/pages/CategoryProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated CategoryProducts.jsx")

# 3. MainCategoryProducts.jsx
with open('src/pages/MainCategoryProducts.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate)}",
    content
)
with open('src/pages/MainCategoryProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated MainCategoryProducts.jsx")

# 4. StoreProducts.jsx
with open('src/pages/StoreProducts.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate)}",
    content
)
with open('src/pages/StoreProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated StoreProducts.jsx")

# 5. Shop.jsx
with open('src/pages/Shop.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate)}",
    content
)
with open('src/pages/Shop.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Shop.jsx")

# 6. Cart.jsx
with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"const handleBackNav = \(\) => \{[\s\S]*?\};",
    "const handleBackNav = () => {\n        safeNavigateBack(navigate, '/');\n    };",
    content
)
with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Cart.jsx")

# 7. Checkout.jsx
with open('src/pages/Checkout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/cart')}",
    content
)
with open('src/pages/Checkout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Checkout.jsx")

# 8. OrderDetails.jsx
with open('src/pages/OrderDetails.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/orders')}",
    content
)
with open('src/pages/OrderDetails.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated OrderDetails.jsx")

# 9. Profile.jsx
with open('src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"<button onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "<button onClick={() => safeNavigateBack(navigate, '/')}",
    content
)
with open('src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Profile.jsx")

# 10. Categories.jsx
with open('src/pages/Categories.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/')}",
    content
)
with open('src/pages/Categories.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Categories.jsx")

# 11. SavedProducts.jsx
with open('src/pages/SavedProducts.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/')}",
    content
)
with open('src/pages/SavedProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated SavedProducts.jsx")

# 12. ProductGroupProducts.jsx
with open('src/pages/ProductGroupProducts.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/')}",
    content
)
with open('src/pages/ProductGroupProducts.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ProductGroupProducts.jsx")

# 13. News.jsx
with open('src/pages/News.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/')}",
    content
)
with open('src/pages/News.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated News.jsx")

# 14. PrivacyPolicy.jsx
with open('src/pages/PrivacyPolicy.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/')}",
    content
)
with open('src/pages/PrivacyPolicy.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PrivacyPolicy.jsx")

# 15. EditAddress.jsx
with open('src/pages/EditAddress.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\(-1\)\}",
    "onClick={() => safeNavigateBack(navigate, '/checkout')}",
    content
)
with open('src/pages/EditAddress.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated EditAddress.jsx")

# 16. DeleteAccount.jsx
with open('src/pages/DeleteAccount.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*window\.history\.length\s*>\s*1\s*\?\s*navigate\(-1\)\s*:\s*navigate\('/profile'\)\}",
    "onClick={() => safeNavigateBack(navigate, '/profile')}",
    content
)
with open('src/pages/DeleteAccount.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated DeleteAccount.jsx")

# 17. Orders.jsx
with open('src/pages/Orders.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'safeNavigateBack' not in content:
    content = re.sub(
        r"(import\s+.*?useLanguage.*?;)",
        r"\1\nimport { safeNavigateBack } from '../utils/useBackButton';",
        content,
        count=1
    )
content = re.sub(
    r"onClick=\{\(\)\s*=>\s*navigate\('/',\s*\{\s*replace:\s*true\s*\}\)\}",
    "onClick={() => safeNavigateBack(navigate, '/')}",
    content
)
with open('src/pages/Orders.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Orders.jsx")

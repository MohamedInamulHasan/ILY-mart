with open('src/pages/Home.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

target = """    // Filter categories — only show categories that have at least one product
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

        // Get a Set of categories that have at least one product
        const productCategories = new Set(allProducts.map(p => p.category?.toLowerCase()));

        return raw.filter(cat => {
            if (cat.isHidden) return false;
            // Only show category if it has products
            return productCategories.has(cat.name?.toLowerCase());
        });
    }, [rawCategories, rawProducts]);"""

replacement = """    // Filter categories — show categories immediately once rawCategories appears
    const featuredCategories = useMemo(() => {
        const raw = Array.isArray(rawCategories) ? rawCategories : (rawCategories?.data || []);
        const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

        if (raw.length === 0) return [];
        if (allProducts.length === 0) {
            return raw.filter(cat => !cat.isHidden);
        }

        const productCategories = new Set(allProducts.map(p => p.category?.toLowerCase()));
        const filtered = raw.filter(cat => {
            if (cat.isHidden) return false;
            return productCategories.has(cat.name?.toLowerCase());
        });

        return filtered.length > 0 ? filtered : raw.filter(cat => !cat.isHidden);
    }, [rawCategories, rawProducts]);"""

c = c.replace(target.replace('\r\n', '\n'), replacement)
c = c.replace(target, replacement)

with open('src/pages/Home.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated Home.jsx featuredCategories!')


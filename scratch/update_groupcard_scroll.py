import os

def update_product_card():
    path = 'src/components/ProductCard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    target = """            <Link 
                to={!canClick ? '#' : (product.isGroup ? `/product-group/${encodeURIComponent(product.title)}` : `/product/${productId}`)} 
                className={`flex-1 ${!canClick ? 'cursor-default' : ''}`}
                onClick={(e) => {
                    if (!canClick) {
                        e.preventDefault();
                    }
                }}
            >"""

    replacement = """            <Link 
                to={!canClick ? '#' : (product.isGroup ? `/product-group/${encodeURIComponent(product.title)}` : `/product/${productId}`)} 
                className={`flex-1 ${!canClick ? 'cursor-default' : ''}`}
                onClick={(e) => {
                    if (!canClick) {
                        e.preventDefault();
                    } else if (product.isGroup) {
                        try {
                            const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
                            sessionStorage.setItem('groupCardReturnScroll', String(currentY));
                            sessionStorage.setItem('groupCardReturnPath', window.location.pathname + window.location.search);
                        } catch (err) {}
                    }
                }}
            >"""

    norm_content = content.replace('\r\n', '\n')
    norm_target = target.replace('\r\n', '\n')
    norm_replacement = replacement.replace('\r\n', '\n')

    if norm_target in norm_content:
        norm_content = norm_content.replace(norm_target, norm_replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(norm_content)
        print("ProductCard.jsx updated successfully")
    else:
        print("ProductCard.jsx target NOT found")

def update_simple_product_card():
    path = 'src/components/SimpleProductCard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    target = """                onClick={(e) => {
                    if (!product.anyStoreOpen || !isStoreOpenCheck) {
                        e.preventDefault();
                    }
                }}"""

    replacement = """                onClick={(e) => {
                    if (!product.anyStoreOpen || !isStoreOpenCheck) {
                        e.preventDefault();
                    } else {
                        try {
                            const currentY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
                            sessionStorage.setItem('groupCardReturnScroll', String(currentY));
                            sessionStorage.setItem('groupCardReturnPath', window.location.pathname + window.location.search);
                        } catch (err) {}
                    }
                }}"""

    norm_content = content.replace('\r\n', '\n')
    norm_target = target.replace('\r\n', '\n')
    norm_replacement = replacement.replace('\r\n', '\n')

    if norm_target in norm_content:
        norm_content = norm_content.replace(norm_target, norm_replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(norm_content)
        print("SimpleProductCard.jsx updated successfully")
    else:
        print("SimpleProductCard.jsx target NOT found")

update_product_card()
update_simple_product_card()

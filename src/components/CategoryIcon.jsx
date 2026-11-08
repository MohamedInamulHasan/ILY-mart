import React from 'react';

export const CategoryIcon = ({ category, className = "w-4 h-4", size }) => {
    const raw = String(category || '').toLowerCase().trim();
    const styleClass = size ? `w-[${size}px] h-[${size}px]` : className;

    // 1. Meat, Chicken, Mutton, Fish, Seafood, Non-veg
    if (
        raw.includes('meat') ||
        raw.includes('chicken') ||
        raw.includes('mutton') ||
        raw.includes('beef') ||
        raw.includes('fish') ||
        raw.includes('prawn') ||
        raw.includes('seafood') ||
        raw.includes('poultry') ||
        raw.includes('non-veg') ||
        raw.includes('non veg') ||
        raw.includes('biryani') ||
        raw.includes('kebab') ||
        raw.includes('halal')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                {/* Meat Drumstick / Cutlet */}
                <path
                    d="M16.5 7.5C18.8 5.2 21.2 7.6 18.9 9.9L13.8 15C11.5 17.3 9.1 14.9 11.4 12.6L16.5 7.5Z"
                    fill="#EF5350"
                    stroke="#C62828"
                    strokeWidth="1.2"
                />
                <path
                    d="M12.5 13.7L8.5 17.7"
                    stroke="#ECEFF1"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <circle cx="7" cy="18" r="1.8" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="1" />
                <circle cx="8" cy="19.5" r="1.8" fill="#FFFFFF" stroke="#CFD8DC" strokeWidth="1" />
                <path
                    d="M15 9C16 10 16.5 10.5 15.5 11.5"
                    stroke="#FFCDD2"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            </svg>
        );
    }

    // 2. Fruits, Vegetables, Fresh Produce, Tomato, Greens
    if (
        raw.includes('fruit') ||
        raw.includes('vegetable') ||
        raw.includes('veg') ||
        raw.includes('tomato') ||
        raw.includes('produce') ||
        raw.includes('greens') ||
        raw.includes('fresh') ||
        raw.includes('onion') ||
        raw.includes('potato') ||
        raw.includes('organic') ||
        raw.includes('farm')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                {/* Cute Red Tomato with Green Stem */}
                <ellipse cx="12" cy="13.5" rx="8" ry="7" fill="#F44336" stroke="#D32F2F" strokeWidth="1.2" />
                {/* Tomato glossy highlight */}
                <ellipse cx="9" cy="11.5" rx="2.5" ry="1.5" fill="#FF8A80" opacity="0.65" />
                {/* Green leaves & stem */}
                <path d="M12 6.5V3" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 6.5C10.5 5 8 5.5 8 5.5C9 7 10.5 7 12 6.5Z" fill="#43A047" />
                <path d="M12 6.5C13.5 5 16 5.5 16 5.5C15 7 13.5 7 12 6.5Z" fill="#43A047" />
                <path d="M12 6.5C11.5 8 10 8.5 10 8.5C10.5 7.5 11.2 7 12 6.5Z" fill="#2E7D32" />
                <path d="M12 6.5C12.5 8 14 8.5 14 8.5C13.5 7.5 12.8 7 12 6.5Z" fill="#2E7D32" />
            </svg>
        );
    }

    // 3. Dairy, Milk, Eggs, Cheese, Paneer
    if (
        raw.includes('dairy') ||
        raw.includes('milk') ||
        raw.includes('egg') ||
        raw.includes('cheese') ||
        raw.includes('paneer') ||
        raw.includes('butter') ||
        raw.includes('curd') ||
        raw.includes('ghee') ||
        raw.includes('yogurt')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                {/* Milk Bottle with Cap */}
                <rect x="9.5" y="2.5" width="5" height="2" rx="0.8" fill="#42A5F5" />
                <path
                    d="M10 4.5V7L7.5 10V20C7.5 21.1 8.4 22 9.5 22H14.5C15.6 22 16.5 21.1 16.5 20V10L14 7V4.5H10Z"
                    fill="#FAFAFA"
                    stroke="#B0BEC5"
                    strokeWidth="1.2"
                />
                <rect x="7.8" y="13" width="8.4" height="4.5" rx="0.5" fill="#29B6F6" />
                <path d="M9.5 15.2H14.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    // 4. Snacks, Bakery, Sweets, Biscuits, Cookies, Chips
    if (
        raw.includes('snack') ||
        raw.includes('bakery') ||
        raw.includes('biscuit') ||
        raw.includes('cookie') ||
        raw.includes('sweet') ||
        raw.includes('cake') ||
        raw.includes('chip') ||
        raw.includes('chocolate') ||
        raw.includes('candy') ||
        raw.includes('ice cream') ||
        raw.includes('namkeen')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                {/* Chocolate Chip Cookie */}
                <circle cx="12" cy="12" r="8.5" fill="#FFB74D" stroke="#F57C00" strokeWidth="1.2" />
                <circle cx="9" cy="9.5" r="1.3" fill="#6D4C41" />
                <circle cx="14.5" cy="8.5" r="1.2" fill="#6D4C41" />
                <circle cx="12" cy="13" r="1.4" fill="#6D4C41" />
                <circle cx="8" cy="14.5" r="1.1" fill="#6D4C41" />
                <circle cx="15.5" cy="14" r="1.2" fill="#6D4C41" />
            </svg>
        );
    }

    // 5. Beverages, Drinks, Juice, Tea, Coffee
    if (
        raw.includes('drink') ||
        raw.includes('beverage') ||
        raw.includes('juice') ||
        raw.includes('tea') ||
        raw.includes('coffee') ||
        raw.includes('soda') ||
        raw.includes('water') ||
        raw.includes('cool')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                {/* Juice Cup with Straw */}
                <path d="M6.5 8L8.2 20.2C8.3 21.2 9.2 22 10.2 22H13.8C14.8 22 15.7 21.2 15.8 20.2L17.5 8H6.5Z" fill="#FFA726" stroke="#FB8C00" strokeWidth="1.2" />
                <ellipse cx="12" cy="8" rx="5.5" ry="1.8" fill="#FFE082" stroke="#FB8C00" strokeWidth="1.2" />
                <path d="M12 8L15 2.5H17" stroke="#EF5350" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }

    // 6. Grocery, Staples, Rice, Atta, Dal, Oil, Spices
    if (
        raw.includes('grocery') ||
        raw.includes('grain') ||
        raw.includes('rice') ||
        raw.includes('atta') ||
        raw.includes('dal') ||
        raw.includes('flour') ||
        raw.includes('oil') ||
        raw.includes('masala') ||
        raw.includes('spice') ||
        raw.includes('staple') ||
        raw.includes('provisions')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                {/* Wheat / Grains Ear */}
                <path d="M12 22V10" stroke="#8D6E63" strokeWidth="1.8" strokeLinecap="round" />
                <ellipse cx="9" cy="8" rx="2.5" ry="4" transform="rotate(-30 9 8)" fill="#FFD54F" stroke="#FFA000" strokeWidth="1.2" />
                <ellipse cx="15" cy="8" rx="2.5" ry="4" transform="rotate(30 15 8)" fill="#FFD54F" stroke="#FFA000" strokeWidth="1.2" />
                <ellipse cx="9" cy="14" rx="2.5" ry="4" transform="rotate(-35 9 14)" fill="#FFD54F" stroke="#FFA000" strokeWidth="1.2" />
                <ellipse cx="15" cy="14" rx="2.5" ry="4" transform="rotate(35 15 14)" fill="#FFD54F" stroke="#FFA000" strokeWidth="1.2" />
                <ellipse cx="12" cy="4" rx="2.2" ry="3.8" fill="#FFCA28" stroke="#FFA000" strokeWidth="1.2" />
            </svg>
        );
    }

    // 7. Personal Care, Beauty, Hygiene
    if (
        raw.includes('beauty') ||
        raw.includes('personal') ||
        raw.includes('care') ||
        raw.includes('cosmetic') ||
        raw.includes('soap') ||
        raw.includes('shampoo') ||
        raw.includes('skin') ||
        raw.includes('hair') ||
        raw.includes('pharma')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                <rect x="8" y="7" width="8" height="14" rx="3" fill="#EC407A" stroke="#C2185B" strokeWidth="1.2" />
                <path d="M10 7V4H14V7" stroke="#C2185B" strokeWidth="1.5" />
                <path d="M12 4V2H15" stroke="#C2185B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 11L12.7 13.3L15 14L12.7 14.7L12 17L11.3 14.7L9 14L11.3 13.3L12 11Z" fill="#FFFFFF" />
            </svg>
        );
    }

    // 8. Cleaning & Household
    if (
        raw.includes('clean') ||
        raw.includes('household') ||
        raw.includes('detergent') ||
        raw.includes('home') ||
        raw.includes('wash') ||
        raw.includes('kitchen')
    ) {
        return (
            <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
                <rect x="8" y="11" width="8" height="11" rx="2.5" fill="#26A69A" stroke="#00897B" strokeWidth="1.2" />
                <path d="M10 11V6H14V11" stroke="#00897B" strokeWidth="1.5" />
                <path d="M10 6L7 8" stroke="#00897B" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 6H17" stroke="#00897B" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1.5" fill="#E0F2F1" />
            </svg>
        );
    }

    // 9. All / Default / Store Bag
    return (
        <svg viewBox="0 0 24 24" className={styleClass} fill="none" aria-hidden="true">
            <rect x="4" y="8" width="16" height="13" rx="2" fill="#66BB6A" stroke="#388E3C" strokeWidth="1.2" />
            <path d="M8 8V6C8 3.8 9.8 2 12 2C14.2 2 16 3.8 16 6V8" stroke="#388E3C" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="14" r="2" fill="#FFFFFF" opacity="0.9" />
        </svg>
    );
};

export default CategoryIcon;

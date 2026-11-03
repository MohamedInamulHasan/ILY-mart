import os
import re

# 1. Update Home.jsx
home_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Home.jsx"
with open(home_path, "r", encoding="utf-8") as f:
    home_content = f.read()

# Add X to lucide-react imports if not present
if "import { Search, ListFilter } from 'lucide-react';" in home_content:
    home_content = home_content.replace(
        "import { Search, ListFilter } from 'lucide-react';",
        "import { Search, ListFilter, X } from 'lucide-react';"
    )
elif "from 'lucide-react';" in home_content and "X" not in home_content[:home_content.find("from 'lucide-react';")]:
    # Ensure X is imported
    home_content = re.sub(r"import \{([^}]+)\} from 'lucide-react';", r"import {\1, X } from 'lucide-react';", home_content, count=1)

# Zepto search bar in Home.jsx
old_home_search = """                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search by fresh groceries...')}
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 shadow-sm"
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] transition-colors" size={18} />"""

new_home_search = """                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search by fresh groceries...')}
                                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-[13.5px] sm:text-sm font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={18} />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                        title={t('Clear')}
                                    >
                                        <X size={16} className="stroke-[2.5]" />
                                    </button>
                                )}"""

home_content = home_content.replace(old_home_search.replace("\r\n", "\n"), new_home_search.replace("\r\n", "\n"))
with open(home_path, "w", encoding="utf-8") as f:
    f.write(home_content)
print("Updated Home.jsx")

# 2. Update Shop.jsx (store page)
shop_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Shop.jsx"
with open(shop_path, "r", encoding="utf-8") as f:
    shop_content = f.read()

old_shop_search = """                            <input
                                type="text"
                                placeholder={t('Search by store name or location...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] transition-colors" size={18} />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}"""

new_shop_search = """                            <input
                                type="text"
                                placeholder={t('Search by store name or location...')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-[13.5px] sm:text-sm font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={18} />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                    title={t('Clear')}
                                >
                                    <X size={16} className="stroke-[2.5]" />
                                </button>
                            )}"""

shop_content = shop_content.replace(old_shop_search.replace("\r\n", "\n"), new_shop_search.replace("\r\n", "\n"))
with open(shop_path, "w", encoding="utf-8") as f:
    f.write(shop_content)
print("Updated Shop.jsx")

# 3. Update StoreProducts.jsx (store products page)
sp_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\StoreProducts.jsx"
with open(sp_path, "r", encoding="utf-8") as f:
    sp_content = f.read()

# Add X import if needed
if "import { ArrowLeft, MapPin, Clock, Phone, ChevronRight, AlertCircle, Zap, Search, ListFilter, ShoppingCart } from 'lucide-react';" in sp_content:
    sp_content = sp_content.replace(
        "import { ArrowLeft, MapPin, Clock, Phone, ChevronRight, AlertCircle, Zap, Search, ListFilter, ShoppingCart } from 'lucide-react';",
        "import { ArrowLeft, MapPin, Clock, Phone, ChevronRight, AlertCircle, Zap, Search, ListFilter, ShoppingCart, X } from 'lucide-react';"
    )

old_sp_search = """                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`${t('Search in')} ${store?.name}...`}
                                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all duration-300 shadow-sm"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] transition-colors" size={18} />"""

new_sp_search = """                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`${t('Search in')} ${store?.name}...`}
                                className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-[13.5px] sm:text-sm font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={18} />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                    title={t('Clear')}
                                >
                                    <X size={16} className="stroke-[2.5]" />
                                </button>
                            )}"""

sp_content = sp_content.replace(old_sp_search.replace("\r\n", "\n"), new_sp_search.replace("\r\n", "\n"))
with open(sp_path, "w", encoding="utf-8") as f:
    f.write(sp_content)
print("Updated StoreProducts.jsx")

# 4. Update Services.jsx (service page)
serv_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Services.jsx"
with open(serv_path, "r", encoding="utf-8") as f:
    serv_content = f.read()

old_serv_search = """                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search services...')}
                                    className="w-full pl-10 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300 shadow-sm"
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] transition-colors" size={18} />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={18} /> 
                                    </button>
                                )}"""

new_serv_search = """                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('Search services...')}
                                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-[13.5px] sm:text-sm font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
                                />
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] dark:group-focus-within:text-[#CBF9B2] stroke-[2.2] transition-colors" size={18} />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                        title={t('Clear')}
                                    >
                                        <X size={16} className="stroke-[2.5]" />
                                    </button>
                                )}"""

serv_content = serv_content.replace(old_serv_search.replace("\r\n", "\n"), new_serv_search.replace("\r\n", "\n"))
with open(serv_path, "w", encoding="utf-8") as f:
    f.write(serv_content)
print("Updated Services.jsx")

# 5. Update Orders.jsx (orders page: Zepto search bar AND remove all/active/completed/cancelled pills)
orders_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\Orders.jsx"
with open(orders_path, "r", encoding="utf-8") as f:
    orders_content = f.read()

# Remove activeTab state and effect
orders_content = re.sub(r"const \[activeTab, setActiveTab\] = useState\('All'\);", "", orders_content)
orders_content = re.sub(r"// Auto scroll active tab into view[\s\S]*?\}, \[activeTab\]\);", "", orders_content)
orders_content = re.sub(r"const tabs = \['All', 'Active', 'Completed', 'Cancelled'\];", "", orders_content)

# Update filteredOrders calculation to only search without tabs
old_filtered = """    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            searchQuery === '' ||
            String(order._id || order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.items?.some(item => {
                const itemName = (item.name || item.adTitle || '').toLowerCase();
                const storeName = (item.storeName || item.storeId?.name || getStoreName(item.storeId, stores) || '').toLowerCase();
                const query = searchQuery.toLowerCase();
                return itemName.includes(query) || storeName.includes(query);
            });

        // If searching, ignore tab filter to find orders everywhere
        if (searchQuery !== '') return matchesSearch;

        const matchesTab =
            activeTab === 'All' ? true :
                activeTab === 'Active' ? ['Processing', 'Shipped', 'Out for Delivery'].includes(order.status) :
                    activeTab === 'Completed' ? order.status === 'Delivered' :
                        activeTab === 'Cancelled' ? order.status === 'Cancelled' : true;

        return matchesTab;
    });"""

new_filtered = """    const filteredOrders = orders.filter(order => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            String(order._id || order.id).toLowerCase().includes(query) ||
            order.items?.some(item => {
                const itemName = (item.name || item.adTitle || '').toLowerCase();
                const storeName = (item.storeName || item.storeId?.name || getStoreName(item.storeId, stores) || '').toLowerCase();
                return itemName.includes(query) || storeName.includes(query);
            })
        );
    });"""

orders_content = orders_content.replace(old_filtered.replace("\r\n", "\n"), new_filtered.replace("\r\n", "\n"))

# Update search bar and remove tabs markup in Orders.jsx
old_orders_search_and_tabs = """                    {/* Search Pill */}
                    <div className="relative mb-3.5 sm:mb-4">
                        <input
                            type="text"
                            placeholder={t('Search orders, items...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-full border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none shadow-sm placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Tabs - perfectly fit mobile screen left to right */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-2.5 mb-4 sm:mb-4.5 w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                id={activeTab === tab ? "active-order-tab" : undefined}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full py-2 px-1 text-center rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 shadow-sm ${
                                    activeTab === tab
                                    ? 'bg-black dark:bg-white text-white dark:text-gray-900 shadow-md'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700/60'
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>"""

new_orders_search_no_tabs = """                    {/* Zepto-style Search Bar */}
                    <div className="relative mb-4 sm:mb-5">
                        <input
                            type="text"
                            placeholder={t('Search orders, items...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-[13.5px] sm:text-sm font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 stroke-[2.2]" size={18} />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 active:scale-90 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center cursor-pointer"
                                title={t('Clear')}
                            >
                                <X size={16} className="stroke-[2.5]" />
                            </button>
                        )}
                    </div>"""

orders_content = orders_content.replace(old_orders_search_and_tabs.replace("\r\n", "\n"), new_orders_search_no_tabs.replace("\r\n", "\n"))
with open(orders_path, "w", encoding="utf-8") as f:
    f.write(orders_content)
print("Updated Orders.jsx")

# 6. Also update SortDropdown.jsx to rounded-2xl
sort_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\components\SortDropdown.jsx"
with open(sort_path, "r", encoding="utf-8") as f:
    sort_content = f.read()

sort_content = sort_content.replace("rounded-full border transition-all", "rounded-2xl border transition-all")
with open(sort_path, "w", encoding="utf-8") as f:
    f.write(sort_content)
print("Updated SortDropdown.jsx")


import os

cp_path = r"c:\Users\moham\ILAYANGUDI PROJECT\src\pages\CategoryProducts.jsx"
with open(cp_path, "r", encoding="utf-8") as f:
    cp = f.read()

# Add X to imports
if "import { ArrowLeft, ShoppingCart, Search, MapPin, Store } from 'lucide-react';" in cp:
    cp = cp.replace(
        "import { ArrowLeft, ShoppingCart, Search, MapPin, Store } from 'lucide-react';",
        "import { ArrowLeft, ShoppingCart, Search, MapPin, Store, X } from 'lucide-react';"
    )

old_cp_search = """                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('Search products...')}
                                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm rounded-full border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none transition-all duration-300"
                                    />
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] transition-colors" size={18} />"""

new_cp_search = """                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('Search products...')}
                                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-[13.5px] sm:text-sm font-medium rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2E5A2E]/50 dark:focus:border-[#CBF9B2]/50 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none"
                                    />
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2E5A2E] stroke-[2.2] transition-colors" size={18} />
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

cp = cp.replace(old_cp_search.replace("\r\n", "\n"), new_cp_search.replace("\r\n", "\n"))
with open(cp_path, "w", encoding="utf-8") as f:
    f.write(cp)
print("Updated CategoryProducts.jsx")


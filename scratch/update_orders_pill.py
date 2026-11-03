orders_path = r'src/pages/Orders.jsx'
with open(orders_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update active tab color to black with white text, and increase gaps
old_tab_block = """                    {/* Tabs - perfectly fit mobile screen left to right */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3.5 w-full">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                id={activeTab === tab ? "active-order-tab" : undefined}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full py-2 px-1 text-center rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 shadow-sm ${
                                    activeTab === tab
                                    ? 'bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700/60'
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>"""

new_tab_block = """                    {/* Tabs - perfectly fit mobile screen left to right */}
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

if old_tab_block in content:
    content = content.replace(old_tab_block, new_tab_block)
    print("Replaced tab block cleanly!")
else:
    print("Could not find exact tab block, using replace on parts")
    content = content.replace(
        'grid grid-cols-4 gap-1.5 sm:gap-2 mb-3.5 w-full',
        'grid grid-cols-4 gap-2 sm:gap-2.5 mb-4 sm:mb-4.5 w-full'
    )
    content = content.replace(
        "bg-[#2E5A2E] dark:bg-[#CBF9B2] text-white dark:text-gray-900",
        "bg-black dark:bg-white text-white dark:text-gray-900 shadow-md"
    )

# Search bar margin
content = content.replace(
    'relative mb-3 sm:mb-3.5',
    'relative mb-3.5 sm:mb-4'
)

with open(orders_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Orders.jsx successfully!")


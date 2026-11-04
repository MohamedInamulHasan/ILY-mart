import re

# 1. Update HomeHeader.jsx
with open('src/components/home/HomeHeader.jsx', 'r', encoding='utf-8') as f:
    home_header = f.read()

old_pin = '<MapPin className="text-red-500 dark:text-red-500" size={22} />'
new_pin = '''<svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z" fill="#EF4444" />
                        <circle cx="12" cy="9" r="2.8" fill="white" />
                    </svg>'''

if old_pin in home_header:
    home_header = home_header.replace(old_pin, new_pin)
    with open('src/components/home/HomeHeader.jsx', 'w', encoding='utf-8') as f:
        f.write(home_header)
    print('[OK] HomeHeader.jsx updated with solid red location logo!')
else:
    print('[WARN] Pin pattern not found in HomeHeader.jsx')

# 2. Update Orders.jsx - increase bottom gap
with open('src/pages/Orders.jsx', 'r', encoding='utf-8') as f:
    orders_code = f.read()

orders_code = orders_code.replace(
    'className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200 w-full relative"',
    'className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-20 sm:pb-24 transition-colors duration-200 w-full relative"'
)
orders_code = orders_code.replace(
    '<div className="px-4 mt-0 max-w-3xl mx-auto">',
    '<div className="px-4 mt-0 max-w-3xl mx-auto pb-10 sm:pb-14">'
)
with open('src/pages/Orders.jsx', 'w', encoding='utf-8') as f:
    f.write(orders_code)
print('[OK] Orders.jsx updated with increased bottom gap!')

# 3. Update Shop.jsx - increase bottom gap
with open('src/pages/Shop.jsx', 'r', encoding='utf-8') as f:
    shop_code = f.read()

shop_code = shop_code.replace(
    'className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-8 transition-colors duration-200"',
    'className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-20 sm:pb-24 transition-colors duration-200"'
)
shop_code = shop_code.replace(
    '<div className="max-w-7xl mx-auto px-4 mt-0">',
    '<div className="max-w-7xl mx-auto px-4 mt-0 pb-12 sm:pb-16">'
)
with open('src/pages/Shop.jsx', 'w', encoding='utf-8') as f:
    f.write(shop_code)
print('[OK] Shop.jsx updated with increased bottom gap!')

# 4. Update App.jsx - enable mobile footer bottom padding for profile page
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    app_code = f.read()

app_code = app_code.replace(
    "<main className={`flex-grow flex flex-col ${showMobileFooter && location.pathname !== '/profile' ? 'pb-24 md:pb-0 md:pr-28' : ''}`}",
    "<main className={`flex-grow flex flex-col ${showMobileFooter ? 'pb-24 md:pb-0 md:pr-28' : ''}`}"
)
with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(app_code)
print('[OK] App.jsx updated to include profile in footer padding!')

# 5. Update Profile.jsx - make it scrollable like Orders.jsx
with open('src/pages/Profile.jsx', 'r', encoding='utf-8') as f:
    profile_code = f.read()

# Add PullToRefreshLayout import if not present
if 'PullToRefreshLayout' not in profile_code:
    profile_code = profile_code.replace(
        "import LogoutModal from '../components/LogoutModal';",
        "import LogoutModal from '../components/LogoutModal';\nimport PullToRefreshLayout from '../components/PullToRefreshLayout';"
    )

# Replace the layout structure
# Header becomes fixed, outer div becomes scrollable, wrap content in PullToRefreshLayout + pt-[88px]
old_profile_start = """    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#E8EAEF] dark:bg-gray-900 transition-colors duration-200 w-full relative overflow-hidden overscroll-none select-none">
            
            {/* Logout Modal */}
            <LogoutModal 
                isOpen={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={confirmLogout} 
            />

            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden flex-shrink-0 relative">"""

new_profile_start = """    return (
        <div className="flex-1 bg-[#E8EAEF] dark:bg-gray-900 pb-20 sm:pb-24 transition-colors duration-200 w-full relative select-none">
            
            {/* Logout Modal */}
            <LogoutModal 
                isOpen={showLogoutModal} 
                onClose={() => setShowLogoutModal(false)} 
                onConfirm={confirmLogout} 
            />

            {/* Premium Light Green Header Card / Dark Mode Adjusted */}
            <div className="fixed top-0 left-0 right-0 z-50 w-full bg-[#CBF9B2] dark:bg-[#CBF9B2] rounded-b-[2.5rem] px-4 pt-4 pb-4 shadow-sm overflow-hidden">"""

if old_profile_start in profile_code:
    profile_code = profile_code.replace(old_profile_start, new_profile_start)
    print('[OK] Profile header changed to fixed!')
else:
    print('[WARN] Old profile start not matched directly')

old_content_wrapper = """            {/* Stable Content Container - comfortably fits standard screens without scrolling */}
            <div className="flex-1 overflow-y-auto overscroll-none scrollbar-hide px-4 pt-3 pb-3 sm:pb-5 max-w-3xl mx-auto w-full">"""

new_content_wrapper = """            <PullToRefreshLayout>
                <div className="pt-[88px]">
                <div className="px-4 mt-0 max-w-3xl mx-auto space-y-3 pb-12 sm:pb-16 w-full">"""

if old_content_wrapper in profile_code:
    profile_code = profile_code.replace(old_content_wrapper, new_content_wrapper)
    # Also close the PullToRefreshLayout and pt-[88px] div before WhatsApp button
    profile_code = profile_code.replace(
        """            {/* Floating WhatsApp Button */}""",
        """                </div>
                </div>
            </PullToRefreshLayout>

            {/* Floating WhatsApp Button */}"""
    )
    print('[OK] Profile content wrapped in PullToRefreshLayout with proper scrolling!')
else:
    print('[WARN] Content wrapper not matched directly')

with open('src/pages/Profile.jsx', 'w', encoding='utf-8') as f:
    f.write(profile_code)
print('[DONE] All updates written!')

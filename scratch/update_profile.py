profile_path = r'src/pages/Profile.jsx'
with open(profile_path, 'r', encoding='utf-8') as f:
    p = f.read()

# 1. MenuLink component: py-2.5 px-2, gap-3, w-9 h-9, text-[13.5px] sm:text-[14px], Chevron size={16}
old_menulink = """const MenuLink = ({ icon, title, to, onClick, isRed = false }) => {
    const Wrapper = to ? Link : 'button';
    return (
        <Wrapper 
            to={to} 
            onClick={onClick}
            className={`w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors group ${!to ? 'cursor-pointer focus:outline-none' : ''}`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 ${isRed ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                    {icon}
                </div>
                <span className={`text-[15px] font-medium ${isRed ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {title}
                </span>
            </div>
            <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </Wrapper>
    );
};"""

new_menulink = """const MenuLink = ({ icon, title, to, onClick, isRed = false }) => {
    const Wrapper = to ? Link : 'button';
    return (
        <Wrapper 
            to={to} 
            onClick={onClick}
            className={`w-full flex items-center justify-between py-2.5 px-2 hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors group ${!to ? 'cursor-pointer focus:outline-none' : ''}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 ${isRed ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>
                    {icon}
                </div>
                <span className={`text-[13.5px] sm:text-[14px] font-medium ${isRed ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {title}
                </span>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </Wrapper>
    );
};"""

if old_menulink in p:
    p = p.replace(old_menulink, new_menulink)
    print("Replaced MenuLink")

# 2. Container pt-[100px] -> pt-[88px], px-5 mt-2 -> px-4 mt-1
p = p.replace('pt-[100px]', 'pt-[88px]')
p = p.replace('px-5 mt-2 max-w-3xl mx-auto w-full', 'px-4 mt-1 max-w-3xl mx-auto w-full')

# 3. Profile Widget: rounded-2xl, p-3 sm:p-3.5, mb-3.5 sm:mb-4
old_widget = """                {/* Profile Widget */}
                <div className="bg-white dark:bg-gray-800/80 rounded-[2.5rem] p-4 flex items-center justify-between mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                               <div className="w-[64px] h-[64px] bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                                    {/* Real image if available, else highly stylized fallback */}
                                    {user?.avatar ? (
                                         <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#CBF9B2] to-[#2E5A2E]/10 dark:to-[#CBF9B2]/10 text-[#2E5A2E] dark:text-gray-900">
                                            <User size={32} strokeWidth={1.5} />
                                        </div>
                                    )}
                               </div>

                               {/* Edit Overlay Button */}
                               <button 
                                   onClick={() => setShowAvatarModal(true)}
                                   className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
                               >
                                   <Camera size={14} />
                               </button>
                          </div>
                          <div className="flex-1 min-w-0">
                                {/* Name + Coin inline */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-[17px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight truncate">
                                        {user?.name || 'Guest User'}
                                    </h2>
                                    {Number(user?.coins || 0) > 0 && (
                                        <CartoonCoin count={user?.coins} size={28} />
                                    )}
                                </div>
                                {/* Mobile number */}
                                {user?.mobile && (
                                    <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                        {user.mobile}
                                    </p>
                                )}
                           </div>
                     </div>
                </div>"""

new_widget = """                {/* Profile Widget */}
                <div className="bg-white dark:bg-gray-800/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between mb-3.5 sm:mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                               <div className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px] bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                                    {/* Real image if available, else highly stylized fallback */}
                                    {user?.avatar ? (
                                         <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#CBF9B2] to-[#2E5A2E]/10 dark:to-[#CBF9B2]/10 text-[#2E5A2E] dark:text-gray-900">
                                            <User size={26} strokeWidth={1.5} />
                                        </div>
                                    )}
                               </div>

                               {/* Edit Overlay Button */}
                               <button 
                                   onClick={() => setShowAvatarModal(true)}
                                   className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
                               >
                                   <Camera size={12} />
                               </button>
                          </div>
                          <div className="flex-1 min-w-0">
                                {/* Name + Coin inline */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h2 className="text-[15px] sm:text-[16px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight truncate">
                                        {user?.name || 'Guest User'}
                                    </h2>
                                    {Number(user?.coins || 0) > 0 && (
                                        <CartoonCoin count={user?.coins} size={24} />
                                    )}
                                </div>
                                {/* Mobile number */}
                                {user?.mobile && (
                                    <p className="text-[12px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                        {user.mobile}
                                    </p>
                                )}
                           </div>
                     </div>
                </div>"""

if old_widget in p:
    p = p.replace(old_widget, new_widget)
    print("Replaced Profile Widget")

# 4. Admin summary margin: mb-8 -> mb-3.5 sm:mb-4
p = p.replace('className="grid grid-cols-4 gap-2 mb-8"', 'className="grid grid-cols-4 gap-2 mb-3.5 sm:mb-4"')

# 5. Account Section: title mb-2 px-1 text-[14px] sm:text-[15px], container rounded-2xl p-2, mb-3.5 sm:mb-4
p = p.replace(
    'className="text-[16px] font-bold text-gray-900 dark:text-white mb-4 px-2 tracking-tight"',
    'className="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-white mb-2 px-1 tracking-tight"'
)
p = p.replace(
    'className="bg-white dark:bg-gray-800/50 rounded-[2rem] p-3 flex flex-col items-center shadow-sm border border-gray-100 dark:border-gray-700"',
    'className="bg-white dark:bg-gray-800/50 rounded-2xl p-1.5 sm:p-2 flex flex-col items-center shadow-sm border border-gray-100 dark:border-gray-700"'
)
p = p.replace('className="mb-6"', 'className="mb-3.5 sm:mb-4"')

# Icon size in menu items: 18 -> 16
p = p.replace('<Package size={18} strokeWidth={2} />', '<Package size={16} strokeWidth={2} />')
p = p.replace('<MapPin size={18} strokeWidth={2} />', '<MapPin size={16} strokeWidth={2} />')
p = p.replace('<Heart size={18} strokeWidth={2} />', '<Heart size={16} strokeWidth={2} />')
p = p.replace('<Wrench size={18} strokeWidth={2} />', '<Wrench size={16} strokeWidth={2} />')
p = p.replace('<Store size={18} strokeWidth={2} />', '<Store size={16} strokeWidth={2} />')
p = p.replace('<Truck size={18} strokeWidth={2} />', '<Truck size={16} strokeWidth={2} />')
p = p.replace('<Shield size={18} strokeWidth={2} />', '<Shield size={16} strokeWidth={2} />')
p = p.replace('<HelpCircle size={18} strokeWidth={2} />', '<HelpCircle size={16} strokeWidth={2} />')
p = p.replace('<LogOut size={18} strokeWidth={2} />', '<LogOut size={16} strokeWidth={2} />')

# Settings button
old_settings_btn = """                          {/* Settings Dropdown/Accordion */}
                          <button 
                              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                              className="w-full flex items-center justify-between py-3.5 px-2 hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                                      <Settings size={18} strokeWidth={2} />
                                  </div>
                                  <span className="text-[15px] font-medium text-gray-900 dark:text-white">
                                      {t('Settings')}
                                  </span>
                              </div>
                              <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                          </button>"""

new_settings_btn = """                          {/* Settings Dropdown/Accordion */}
                          <button 
                              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                              className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors group focus:outline-none"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                                      <Settings size={16} strokeWidth={2} />
                                  </div>
                                  <span className="text-[13.5px] sm:text-[14px] font-medium text-gray-900 dark:text-white">
                                      {t('Settings')}
                                  </span>
                              </div>
                              <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`} />
                          </button>"""

if old_settings_btn in p:
    p = p.replace(old_settings_btn, new_settings_btn)
    print("Replaced Settings button")

# Divider line width
p = p.replace('w-[calc(100%-4.5rem)]', 'w-[calc(100%-4rem)]')

# Support Section margin
p = p.replace('className="mb-4"', 'className="mb-3"')

# Avatar modal
p = p.replace('rounded-[2.5rem] w-full max-w-sm', 'rounded-2xl w-full max-w-sm')
p = p.replace('<div className="p-8">', '<div className="p-5 sm:p-6">')
p = p.replace('mb-8', 'mb-4')
p = p.replace('w-20 h-20 rounded-2xl', 'w-16 h-16 rounded-xl')

with open(profile_path, 'w', encoding='utf-8') as f:
    f.write(p)

print("Updated Profile.jsx successfully!")


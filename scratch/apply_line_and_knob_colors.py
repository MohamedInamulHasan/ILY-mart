# 1. Update SwipeActionButton.jsx
with open('src/components/SwipeActionButton.jsx', 'r', encoding='utf-8') as f:
    btn_code = f.read()

old_outline_white = """            case 'outline-white':
            case 'white':
                return {
                    track: 'bg-white border-2 border-black',
                    text: 'text-black',
                    knob: 'text-black',
                    knobBg: 'bg-white border border-gray-300 shadow-sm',
                    sheen: 'via-gray-400/20'
                };"""

new_outline_white = """            case 'outline-white':
            case 'white':
                return {
                    track: 'bg-white border-2 border-black',
                    text: 'text-black',
                    knob: 'text-white',
                    knobBg: 'bg-black shadow-md',
                    sheen: 'via-gray-400/20'
                };"""

btn_code = btn_code.replace(old_outline_white, new_outline_white)

with open('src/components/SwipeActionButton.jsx', 'w', encoding='utf-8') as f:
    f.write(btn_code)
print("Updated SwipeActionButton.jsx: round black knob and white arrow!")

# 2. Update DeliveryDashboard.jsx line to light grey
with open('src/pages/admin/DeliveryDashboard.jsx', 'r', encoding='utf-8') as f:
    dd_code = f.read()

old_line = """                                                        {/* Black line joining the two dots */}
                                                        <div className="w-[2px] flex-1 bg-black dark:bg-gray-400 my-1 min-h-[36px]" />"""

new_line = """                                                        {/* Light grey line joining the two dots */}
                                                        <div className="w-[2px] flex-1 bg-gray-300 dark:bg-gray-600 my-1 min-h-[36px]" />"""

dd_code = dd_code.replace(old_line, new_line)

with open('src/pages/admin/DeliveryDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(dd_code)
print("Updated DeliveryDashboard.jsx: light grey connecting line!")


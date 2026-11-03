with open('src/context/CartContext.jsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add imports
import_stmt = """import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import deliveryCharacterImg from '../assets/delivery-character.png';"""
c = c.replace("import { X } from 'lucide-react';", import_stmt, 1)

# 2. Update character & speech bubble animation
old_bubble = '<div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 max-w-[340px] sm:max-w-[380px] w-full animate-cloud-pop mb-3 z-10">'
new_bubble = """<motion.div 
                            initial={{ scale: 0, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: 0.32, type: 'spring', damping: 20, stiffness: 280 }}
                            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 max-w-[340px] sm:max-w-[380px] w-full mb-3 z-10"
                        >"""
c = c.replace(old_bubble, new_bubble)

# Close bubble tag
old_bubble_end = """                            </div>
                        </div>

                        {/* Delivery Character"""
new_bubble_end = """                            </div>
                        </motion.div>

                        {/* Delivery Character"""
c = c.replace(old_bubble_end, new_bubble_end)

# Update character container and img src
old_char = """                        {/* Delivery Character — Half Screen Swipe-Up from Bottom */}
                        <div className="h-[46vh] sm:h-[50vh] flex justify-center items-end select-none pointer-events-none animate-character-swipe z-0 -mt-2">
                            <img 
                                src="/delivery-character.png" 
                                alt="Delivery Character" 
                                className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-2xl"
                            />
                        </div>"""

new_char = """                        {/* Delivery Character — Swipes up first from bottom */}
                        <motion.div 
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                            className="h-[46vh] sm:h-[50vh] flex justify-center items-end select-none pointer-events-none z-0 -mt-2"
                        >
                            <img 
                                src={deliveryCharacterImg} 
                                alt="Delivery Character" 
                                className="h-full w-auto max-w-full object-contain object-bottom drop-shadow-2xl"
                            />
                        </motion.div>"""

# Also handle without em-dash if normal dash was used
if old_char not in c:
    old_char = old_char.replace('—', '-')

c = c.replace(old_char, new_char)

with open('src/context/CartContext.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated CartContext.jsx successfully!')


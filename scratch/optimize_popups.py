import re

# 1. Update OrderConfirmation.jsx
with open('src/pages/OrderConfirmation.jsx', 'r', encoding='utf-8') as f:
    conf_content = f.read()

# Replace backdrop-blur-md and spring on OrderConfirmation modal
conf_target = '''            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#2E5A2E]/20 dark:bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.4, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 450, damping: 22 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl max-w-sm w-full p-6 sm:p-7 relative overflow-hidden"
                        >'''

conf_replacement = '''            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 transform-gpu"
                    >
                        <motion.div
                            initial={{ scale: 0.88, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.88, opacity: 0, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[2rem] shadow-2xl max-w-sm w-full p-6 sm:p-7 relative overflow-hidden transform-gpu will-change-transform"
                        >'''

if conf_target in conf_content:
    conf_content = conf_content.replace(conf_target, conf_replacement)
    with open('src/pages/OrderConfirmation.jsx', 'w', encoding='utf-8') as f:
        f.write(conf_content)
    print("Successfully optimized OrderConfirmation.jsx modal")
else:
    print("Warning: conf_target not found in OrderConfirmation.jsx")

# 2. Update CartContext.jsx
with open('src/context/CartContext.jsx', 'r', encoding='utf-8') as f:
    cart_content = f.read()

# Replace backdrop-blur-sm and delays/springs
cart_content = cart_content.replace(
    'className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-end overflow-hidden pb-0 px-4 animate-in fade-in duration-300 pointer-events-auto"',
    'className="fixed inset-0 bg-black/70 z-[9999] flex flex-col items-center justify-end overflow-hidden pb-0 px-4 animate-in fade-in duration-150 pointer-events-auto transform-gpu"'
)

cart_content = cart_content.replace(
    '''                        <motion.div 
                            initial={{ scale: 0, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: 0.32, type: 'spring', damping: 20, stiffness: 280 }}
                            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 max-w-[340px] sm:max-w-[380px] w-full mb-3 z-10"''',
    '''                        <motion.div 
                            initial={{ scale: 0.92, opacity: 0, y: 14 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4 sm:p-5 max-w-[340px] sm:max-w-[380px] w-full mb-3 z-10 transform-gpu will-change-transform"'''
)

cart_content = cart_content.replace(
    '''                        <motion.div 
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 240 }}''',
    '''                        <motion.div 
                            initial={{ y: '60%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}'''
)

with open('src/context/CartContext.jsx', 'w', encoding='utf-8') as f:
    f.write(cart_content)
print("Successfully optimized CartContext.jsx popup")


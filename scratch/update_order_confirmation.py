with open('src/pages/OrderConfirmation.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target1 = """    const handleCloseSuccess = () => {
        // Always go to the orders list, as requested
        navigate('/orders');
    };"""

replacement1 = """    const handleCloseSuccess = () => {
        // Navigate to orders replacing confirmation in history so back doesn't return here
        navigate('/orders', { replace: true });
    };

    // Intercept back button when success modal is open to ensure back goes to Home
    useEffect(() => {
        if (!showSuccessModal) return;

        const handlePopState = (e) => {
            e.preventDefault();
            navigate('/', { replace: true });
        };

        window.history.pushState({ modal: 'orderSuccess' }, '');
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [showSuccessModal, navigate]);"""

target2 = """                    <button onClick={() => navigate(-1)} className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-900 dark:text-white transition-transform active:scale-95 border border-gray-100/50">
                        <ArrowLeft size={22} />
                    </button>"""

replacement2 = """                    <button 
                        onClick={() => {
                            if (showSuccessModal || createdOrderId) {
                                navigate('/', { replace: true });
                            } else {
                                navigate(-1);
                            }
                        }} 
                        className="w-[42px] h-[42px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-900 dark:text-white transition-transform active:scale-95 border border-gray-100/50"
                    >
                        <ArrowLeft size={22} />
                    </button>"""

target3 = """                                <button
                                    onClick={handleCloseSuccess}
                                    className="w-full bg-black text-white py-4 px-6 rounded-full font-normal shadow-lg shadow-gray-200 dark:shadow-gray-900/20 active:scale-[0.98] transition-transform"
                                >
                                    {t('Go to Orders')}
                                </button>"""

replacement3 = """                                <button
                                    onClick={handleCloseSuccess}
                                    className="w-full bg-black text-white py-4 px-6 rounded-full font-normal shadow-lg shadow-gray-200 dark:shadow-gray-900/20 active:scale-[0.98] transition-transform"
                                >
                                    {t('Go to Orders')}
                                </button>
                                <button
                                    onClick={() => navigate('/', { replace: true })}
                                    className="w-full mt-3 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-center"
                                >
                                    {t('Back to Home')}
                                </button>"""

# Normalize CRLF for matching
normalized_code = code.replace('\r\n', '\n')
assert target1 in normalized_code, "target1 not found"
assert target2 in normalized_code, "target2 not found"
assert target3 in normalized_code, "target3 not found"

new_code = normalized_code.replace(target1, replacement1).replace(target2, replacement2).replace(target3, replacement3)

with open('src/pages/OrderConfirmation.jsx', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Updated OrderConfirmation.jsx successfully!")

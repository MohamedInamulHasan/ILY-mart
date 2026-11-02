with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = """import useBackButton from './utils/useBackButton';"""
replacement1 = """import useBackButton from './utils/useBackButton';
import { setOverlayAuthToken } from './utils/floatingOverlay';"""

target2 = """    const location = useLocation();
    // Use back button handler for Android navigation
    useBackButton();"""

replacement2 = """    const location = useLocation();
    // Use back button handler for Android navigation
    useBackButton();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            setOverlayAuthToken(token);
        }
    }, [user]);"""

if target1 in text and target2 in text:
    text = text.replace(target1, replacement1, 1)
    text = text.replace(target2, replacement2, 1)
    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(text)
    print('SUCCESS')
else:
    print('FAILED')

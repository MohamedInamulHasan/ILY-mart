import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();
    const prevPathRef = useRef(pathname);

    useEffect(() => {
        const fromGroup = prevPathRef.current.startsWith('/product-group/');
        prevPathRef.current = pathname;

        // For groupcard only: restore scroll position where user was instead of top of page
        if (fromGroup) {
            try {
                const savedScroll = sessionStorage.getItem('groupCardReturnScroll');
                if (savedScroll !== null) {
                    const targetY = parseInt(savedScroll, 10);
                    sessionStorage.removeItem('groupCardReturnScroll');
                    sessionStorage.removeItem('groupCardReturnPath');

                    if (!isNaN(targetY) && targetY > 0) {
                        window.scrollTo(0, targetY);
                        const t1 = setTimeout(() => window.scrollTo(0, targetY), 50);
                        const t2 = setTimeout(() => window.scrollTo(0, targetY), 150);
                        const t3 = setTimeout(() => window.scrollTo(0, targetY), 350);
                        return () => {
                            clearTimeout(t1);
                            clearTimeout(t2);
                            clearTimeout(t3);
                        };
                    }
                }
            } catch (e) {}
        }

        // For all other pages: standard scroll to top
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;

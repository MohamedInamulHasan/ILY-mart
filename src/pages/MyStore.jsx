import { useNavigate } from 'react-router-dom';
import { Store, ArrowLeft, LogOut, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import StoreManagement from './admin/StoreManagement';

const MyStore = () => {
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { cartCount } = useCart();

    // Protection: Redirect if not store_admin
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5A2E]"></div>
            </div>
        );
    }

    const roles = Array.isArray(user?.role) ? user.role : [user?.role || 'customer'];
    if (!user || !roles.includes('store_admin')) {
        // Use useEffect or render Navigate would be better, but return null + navigate is what was there.
        // Let's use Navigate component for cleaner render interrupt
        // But for now, since I can't import Navigate in replace block easily without adding it to existing imports list which is messy in replace,
        // I will keep the imperative navigate but inside useEffect?
        // Actually, returning null is fine if we navigate.
        setTimeout(() => navigate('/'), 0);
        return null;
    }

    return (
        <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 duration-200">
            <div className="pt-2">

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <StoreManagement />
            </div>
            </div>
        </div>
    );
};

export default MyStore;

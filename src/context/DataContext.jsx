import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../utils/api';

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
    // Products State - Always load fresh from database, no localStorage fallback
    const [products, setProducts] = useState([]);

    // Stores State - Always load fresh from database, no localStorage fallback
    const [stores, setStores] = useState([]);

    // Loading and Error States
    const [loading, setLoading] = useState({
        products: false,
        stores: false,
        news: false,
        // Start loading true if we have a token, to prevent empty state flash while effect kicks in
        orders: !!localStorage.getItem('authToken'),
        services: false,
        ads: false,
        categories: false,
        users: false
    });

    const [error, setError] = useState({
        products: null,
        stores: null,
        news: null,
        orders: null,
        services: null,
        ads: null,
        categories: null,
        users: null
    });

    // Orders State - will be populated from backend
    const [orders, setOrders] = useState([]);

    // News State - will be populated from backend
    const [news, setNews] = useState([]);

    // Ads State - always start fresh, fetch from database
    const [ads, setAds] = useState([]);

    // Categories State
    const [categories, setCategories] = useState([]);

    // Users State
    const [users, setUsers] = useState([]);

    // Services State
    const [services, setServices] = useState([]);

    // Saved Products State
    const [savedProducts, setSavedProducts] = useState([]);

    // Settings State
    const [settings, setSettings] = useState({
        deliveryTimes: [],
        deliveryTimingType: 'permanent', // Default to permanent as requested
        maintenanceMode: false, // Default false
        maintenanceMessage: '', // Custom message for maintenance
        allCategoryImage: '', // Virtual "All" category image
        allCategoryName: '' // Custom name for the "All" category
    });

    // Global Fast Purchase Mode State (User-Specific)
    const [fastMode, setFastMode] = useState(false);

    // Global UI visibility state
    const [isFooterHidden, setIsFooterHidden] = useState(false);

    // Global Sort Order State
    const [globalSortOrder, setGlobalSortOrder] = useState('none');

    // Initialize/Update Fast Mode based on User
    useEffect(() => {
        // User requested Fast Mode to be OFF by default on login/signup.
        // We ensure it starts as false and is NOT loaded from persistence.
        setFastMode(false);
        // Reset sort order to default on app load/refresh
        setGlobalSortOrder('none');
    }, []); // Only run on mount to set initial state

    const toggleFastMode = () => {
        setFastMode(prev => !prev);
        // Persistence removed to satisfy "make the fast button in off state first" requirement
    };



    // Initial Loading State - for intro animation
    const [initialLoading, setInitialLoading] = useState(true);

    // Track when component mounts to ensure minimum intro display time
    const [mountTime] = useState(Date.now());

    // Clear stale localStorage on mount
    useEffect(() => {
        // Clear products, ads, and stores cache to ensure fresh data from database
        localStorage.removeItem('products');
        localStorage.removeItem('ads');
        localStorage.removeItem('stores');
        localStorage.removeItem('news');
        localStorage.removeItem('categories');
        localStorage.removeItem('orders');
        console.log('🧹 Cleared all data cache from localStorage to enforce DB loading');
    }, []);

    // Fetch data definitions
    const fetchProducts = async () => {
        console.log('🔄 Starting to fetch products...');
        setLoading(prev => ({ ...prev, products: true }));
        setError(prev => ({ ...prev, products: null }));
        try {
            console.log('📡 Calling API: getProducts({ limit: 50, page: 1 })');
            const response = await apiService.getProducts({ limit: 1000, page: 1 });
            console.log('📦 API Response:', response);
            if (response.success && response.data) {
                setProducts(response.data);
                console.log(`✅ Loaded ${response.data.length} of ${response.total} products from database`);
            } else {
                console.error('❌ API returned unsuccessful response:', response);
                // On error, we still want to hide intro eventually
                setTimeout(() => setInitialLoading(false), 1500);
            }
        } catch (err) {
            console.error('❌ Failed to fetch products:', err);
            setError(prev => ({ ...prev, products: err.message }));
            setTimeout(() => setInitialLoading(false), 1500);
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    };

    const fetchStores = async () => {
        setLoading(prev => ({ ...prev, stores: true }));
        setError(prev => ({ ...prev, stores: null }));
        try {
            const response = await apiService.getStores();
            if (response.success && response.data) {
                setStores(response.data);
                console.log(`✅ Loaded ${response.data.length} stores from database`);
            }
        } catch (err) {
            console.error('Failed to fetch stores:', err);
            setError(prev => ({ ...prev, stores: err.message }));
        } finally {
            setLoading(prev => ({ ...prev, stores: false }));
        }
    };

    const fetchNews = async () => {
        setLoading(prev => ({ ...prev, news: true }));
        setError(prev => ({ ...prev, news: null }));
        try {
            const response = await apiService.getNews();
            if (response.success && response.data) {
                setNews(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch news:', err);
            setError(prev => ({ ...prev, news: err.message }));
        } finally {
            setLoading(prev => ({ ...prev, news: false }));
        }
    };

    // Initial Fetch Effects
    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchStores();
    }, []);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchOrders = async () => {
        setLoading(prev => ({ ...prev, orders: true }));
        setError(prev => ({ ...prev, orders: null }));
        try {
            const response = await apiService.getOrders();
            if (response.success && response.data) {
                setOrders(response.data);
                // localStorage.setItem('orders', JSON.stringify(response.data)); // Disabled due to QuotaExceededError
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            setError(prev => ({ ...prev, orders: err.message }));
            // Keep using localStorage data as fallback
        } finally {
            setLoading(prev => ({ ...prev, orders: false }));
        }
    };

    // Listen for user changes (custom event from AuthContext) to refresh sensitive data
    useEffect(() => {
        const handleUserChange = () => {
            console.log('👤 User changed detected in DataContext. Refreshing user-specific data...');
            // If (and only if) we have a token, fetch the sensitive data. 
            // Otherwise, we skip this to avoid 401 loops.
            if (localStorage.getItem('authToken') || localStorage.getItem('userInfo')) {
                console.log('🔑 User token found. Fetching orders and saved products...');
                fetchOrders();
                fetchSavedProducts();
            } else {
                console.log('🔒 No user token found. Skipping sensitive data fetch.');
                setOrders([]);
                setSavedProducts([]);
            }

            // If user logged out (authToken gone), clear sensitive state
            if (!localStorage.getItem('authToken')) {
                console.log('🔒 User logged out. Clearing sensitive data.');
                setOrders([]);
                setSavedProducts([]);
                setServices([]); // Clear services requests if they are user specific
            }
        };

        window.addEventListener('userChanged', handleUserChange);

        // Initial fetch if user is already logged in
        if (localStorage.getItem('authToken')) {
            fetchOrders();
        }

        return () => {
            window.removeEventListener('userChanged', handleUserChange);
        };
    }, []);

    // Category Management - Define before use
    const fetchCategories = async () => {
        setLoading(prev => ({ ...prev, categories: true }));
        setError(prev => ({ ...prev, categories: null }));
        try {
            console.log('DataContext: Fetching categories...');
            const response = await apiService.categories.getAll();
            console.log('DataContext: Categories response:', response);
            if (response.success && response.data) {
                setCategories(response.data);
                console.log('DataContext: Categories set successfully, count:', response.data.length);
            }
        } catch (err) {
            console.error('DataContext: Failed to fetch categories - Full error:', err);
            setError(prev => ({ ...prev, categories: err.message }));
            // Don't throw, just log - categories are optional
        } finally {
            setLoading(prev => ({ ...prev, categories: false }));
        }
    };

    // User Management
    const fetchUsers = async () => {
        setLoading(prev => ({ ...prev, users: true }));
        setError(prev => ({ ...prev, users: null }));
        try {
            console.log('DataContext: Fetching users...');
            // Assuming isAdmin is determined elsewhere or passed as a prop/context
            // For now, let's assume we always try to fetch users if this function is called.
            const response = await apiService.getAllUsers();
            console.log('DataContext: Users response:', response);
            if (response.success && response.data) {
                setUsers(response.data);
                console.log('DataContext: Users set successfully, count:', response.data.length);
            }
        } catch (err) {
            console.error('DataContext: Failed to fetch users - Full error:', err);
            setError(prev => ({ ...prev, users: err.message }));
            throw err; // Propagate error to component
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    };

    // Fetch Ads
    const fetchAds = async () => {
        setLoading(prev => ({ ...prev, ads: true }));
        setError(prev => ({ ...prev, ads: null }));
        try {
            const response = await apiService.getAds();
            if (response.success && response.data) {
                setAds(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch ads:', err);
            setError(prev => ({ ...prev, ads: err.message }));
        } finally {
            setLoading(prev => ({ ...prev, ads: false }));
        }
    };

    // Fetch Services
    const fetchServices = async () => {
        setLoading(prev => ({ ...prev, services: true }));
        setError(prev => ({ ...prev, services: null }));
        try {
            const response = await apiService.services.getAll();
            if (response.success && response.data) {
                setServices(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch services:', err);
            setError(prev => ({ ...prev, services: err.message }));
        } finally {
            setLoading(prev => ({ ...prev, services: false }));
        }
    };

    const refreshData = async () => {
        console.log('🔄 Refreshing all data...');
        setLoading(prev => ({ ...prev, products: true, stores: true, news: true, ads: true, categories: true, users: true, services: true }));
        setError(prev => ({ ...prev, products: null, stores: null, news: null, ads: null, categories: null, users: null, services: null }));
        try {
            // Check auth status for sensitive data
            const storedUser = localStorage.getItem('userInfo');
            const user = storedUser ? JSON.parse(storedUser) : null;
            const isAdmin = Array.isArray(user?.role) ? user.role.includes('admin') : user?.role === 'admin';

            const [productsRes, storesRes, newsRes, adsRes, categoriesRes, usersRes, servicesRes] = await Promise.all([
                apiService.getProducts({ limit: 1000, page: 1 }).catch(e => { console.error("Failed to fetch products during refresh:", e); return { success: false, data: [] }; }),
                apiService.getStores().catch(e => { console.error("Failed to fetch stores during refresh:", e); return { success: false, data: [] }; }),
                apiService.getNews().catch(e => { console.error("Failed to fetch news during refresh:", e); return { success: false, data: [] }; }),
                apiService.getAds().catch(e => { console.error("Failed to fetch ads during refresh:", e); return { success: false, data: [] }; }),
                apiService.categories.getAll().catch(e => { console.error("Failed to fetch categories during refresh:", e); return { success: false, data: [] }; }),
                isAdmin ? apiService.getAllUsers().catch(e => { console.error("Failed to fetch users during refresh:", e); return { success: false, data: [] }; }) : Promise.resolve({ success: true, data: [] }),
                apiService.services.getAll().catch(e => { console.error("Failed to fetch services during refresh:", e); return { success: false, data: [] }; })
            ]);

            setProducts(productsRes.data || []);
            setStores(storesRes.data || []);
            setNews(newsRes.data || []);
            setAds(adsRes.data || []);
            setCategories(categoriesRes.data || []);
            if (isAdmin) setUsers(usersRes.data || []);
            setServices(servicesRes.data || []);

            console.log('✅ All data refreshed successfully.');
        } catch (e) {
            console.error("Refresh data failed partially:", e);
        } finally {
            setLoading(prev => ({ ...prev, products: false, stores: false, news: false, ads: false, categories: false, users: false, services: false }));
        }
    };

    // Background Refresh (Silent - No Loading Spinners)
    const backgroundRefresh = async () => {
        // console.log('🔄 Silent Background Refresh...'); // Commented out to reduce console noise
        try {
            // Check auth status for sensitive data
            const hasToken = !!localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('userInfo');
            const user = storedUser ? JSON.parse(storedUser) : null;
            const isAdmin = Array.isArray(user?.role) ? user.role.includes('admin') : user?.role === 'admin';

            const [productsRes, storesRes, newsRes, adsRes, categoriesRes, usersRes, servicesRes, ordersRes] = await Promise.all([
                apiService.getProducts({ limit: 1000, page: 1 }).catch(e => ({ success: false, data: [] })),
                apiService.getStores().catch(e => ({ success: false, data: [] })),
                apiService.getNews().catch(e => ({ success: false, data: [] })),
                apiService.getAds().catch(e => ({ success: false, data: [] })),
                apiService.categories.getAll().catch(e => ({ success: false, data: [] })),
                isAdmin ? apiService.getAllUsers().catch(e => ({ success: false, data: [] })) : Promise.resolve({ success: true, data: [] }),
                apiService.services.getAll().catch(e => ({ success: false, data: [] })),
                hasToken ? apiService.getOrders().catch(e => ({ success: false, data: [] })) : Promise.resolve({ success: true, data: [] })
            ]);

            // Only update state if data exists and is different (React handles ref checks, but ensuring non-empty helps)
            if (productsRes.success && productsRes.data) setProducts(productsRes.data);
            if (storesRes.success && storesRes.data) setStores(storesRes.data);
            if (newsRes.success && newsRes.data) setNews(newsRes.data);
            if (adsRes.success && adsRes.data) setAds(adsRes.data);
            if (categoriesRes.success && categoriesRes.data) setCategories(categoriesRes.data);
            if (isAdmin && usersRes.success && usersRes.data) setUsers(usersRes.data);
            if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
            if (hasToken && ordersRes.success && ordersRes.data) setOrders(ordersRes.data);

            // Fetch latest settings silently for instant real-time updates across users
            fetchSettings();

        } catch (e) {
            console.error("Silent background refresh failed:", e);
        }
    };

    // Auto-Refresh Interval
    useEffect(() => {
        // Initial 2s delay to let startup finish
        const initialTimer = setTimeout(() => {
            backgroundRefresh();

            // Start interval loop
            const intervalId = setInterval(() => {
                backgroundRefresh();
            }, 4000); // Poll every 4 seconds for instant real-time settings updates

            // Cleanup
            return () => clearInterval(intervalId);
        }, 5000); // Increased initial delay to 5s

        return () => clearTimeout(initialTimer);
    }, []);

    // Unified database loading check
    useEffect(() => {
        // Only run this check if we are currently loading initially
        if (initialLoading) {
            // Check if ALL data is loaded (finished fetching, success or fail)
            // We verify loading flags are false.
            // Check if ALL data is loaded (finished fetching, success or fail)
            // We verify loading flags are false.
            // OPTIMIZATION: Do NOT wait for orders. Let them load in background.
            // This prevents logged-in users from being stuck on splash screen if backend is slow.
            const allDataLoaded =
                !loading.products &&
                !loading.stores &&
                !loading.news &&
                !loading.ads &&
                !loading.categories &&
                !loading.services;

            // Determine if we are ready to hide intro
            if (allDataLoaded) {
                const elapsedTime = Date.now() - mountTime;
                const minDisplayTime = 1000; // Reduced to 1s
                const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

                console.log('✨ All data loaded. Hiding intro in', remainingTime, 'ms');

                setTimeout(() => {
                    setInitialLoading(false);
                }, remainingTime);
            }
        }

        if (!loading.products && products.length > 0) {
            // Load ads after a short delay (if not already loaded by initial batch)
            if (ads.length === 0 && !loading.ads) {
                setTimeout(() => {
                    fetchAds();
                }, 500);
            }
        }
    }, [loading, initialLoading, mountTime, ads.length, products.length]);

    // Independent fetch for categories
    useEffect(() => {
        fetchCategories();
    }, []);

    // Products and stores are no longer cached in localStorage - always fetch fresh from database

    // useEffect(() => {
    //     localStorage.setItem('orders', JSON.stringify(orders));
    // }, [orders]);

    useEffect(() => {
        try {
            localStorage.setItem('news', JSON.stringify(news));
        } catch (e) {
            console.error('Failed to save news to local storage', e);
        }
    }, [news]);

    // Ads are no longer cached in localStorage - always fetch fresh from database

    // Actions
    const addProduct = async (product) => {
        try {
            const response = await apiService.createProduct(product);
            if (response.success && response.data) {
                setProducts(prev => [...prev, response.data]);
                return response.data;
            }
        } catch (err) {
            console.error('Failed to add product:', err);
            throw err;
        }
    };

    const updateProduct = async (updatedProduct) => {
        try {
            const response = await apiService.updateProduct(updatedProduct._id || updatedProduct.id, updatedProduct);
            if (response.success && response.data) {
                setProducts(prev => prev.map(p => (p._id || p.id) === (response.data._id || response.data.id) ? response.data : p));
                return response.data;
            }
        } catch (err) {
            console.error('Failed to update product:', err);
            throw err;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await apiService.deleteProduct(id);
            setProducts(prev => prev.filter(p => (p._id || p.id) !== id));
        } catch (err) {
            console.error('Failed to delete product:', err);
            throw err;
        }
    };

    const addStore = async (store) => {
        try {
            const response = await apiService.createStore(store);
            if (response.success && response.data) {
                setStores(prev => [...prev, response.data]);
                return response.data;
            }
        } catch (err) {
            console.error('Failed to add store:', err);
            throw err;
        }
    };

    const updateStore = async (updatedStore) => {
        try {
            const response = await apiService.updateStore(updatedStore._id || updatedStore.id, updatedStore);
            if (response.success && response.data) {
                setStores(prev => prev.map(s => (s._id || s.id) === (response.data._id || response.data.id) ? response.data : s));
                return response.data;
            }
        } catch (err) {
            console.error('Failed to update store:', err);
            throw err;
        }
    };

    const addNews = async (newsItem) => {
        try {
            const response = await apiService.createNews(newsItem);
            if (response.success && response.data) {
                setNews(prev => [...prev, response.data]);
                return response.data;
            }
        } catch (err) {
            console.error('Failed to add news:', err);
            throw err;
        }
    };

    const updateNews = async (updatedNews) => {
        try {
            const response = await apiService.updateNews(updatedNews._id || updatedNews.id, updatedNews);
            if (response.success && response.data) {
                setNews(prev => prev.map(n => (n._id || n.id) === (response.data._id || response.data.id) ? response.data : n));
                return response.data;
            }
        } catch (err) {
            console.error('Failed to update news:', err);
            throw err;
        }
    };

    const updateOrder = async (updatedOrder) => {
        try {
            const response = await apiService.updateOrderStatus(updatedOrder._id || updatedOrder.id, updatedOrder.status);
            if (response.success && response.data) {
                setOrders(prev => prev.map(o => (o._id || o.id) === (response.data._id || response.data.id) ? response.data : o));
                return response.data;
            }
        } catch (err) {
            console.error('Failed to update order:', err);
            throw err;
        }
    };

    const addOrder = async (order) => {
        try {
            console.log('🔄 DataContext: Sending order to API...', order);
            const response = await apiService.createOrder(order);
            console.log('📥 DataContext: Received response:', response);
            if (response.success && response.data) {
                setOrders(prev => [response.data, ...prev]);
                return response.data;
            }
        } catch (err) {
            console.error('❌ DataContext: Failed to add order:', err);
            throw err;
        }
    };

    const addAd = async (ad) => {
        try {
            const response = await apiService.createAd(ad);
            if (response.success && response.data) {
                setAds(prev => [response.data, ...prev]);
                return response.data;
            }
        } catch (err) {
            console.error('Failed to add ad:', err);
            throw err;
        }
    };

    const deleteAd = async (id) => {
        try {
            await apiService.deleteAd(id);
            setAds(prev => prev.filter(ad => (ad._id || ad.id) !== id));
        } catch (err) {
            console.error('Failed to delete ad:', err);
            throw err;
        }
    };

    const deleteStore = async (id) => {
        try {
            await apiService.deleteStore(id);
            setStores(prev => prev.filter(s => (s._id || s.id) !== id));
        } catch (err) {
            console.error('Failed to delete store:', err);
            throw err;
        }
    };

    const deleteNews = async (id) => {
        try {
            await apiService.deleteNews(id);
            setNews(prev => prev.filter(n => (n._id || n.id) !== id));
        } catch (err) {
            console.error('Failed to delete news:', err);
            throw err;
        }
    };

    const deleteOrder = async (id) => {
        try {
            await apiService.deleteOrder(id);
            setOrders(prev => prev.filter(o => (o._id || o.id) !== id));
        } catch (err) {
            console.error('Failed to delete order:', err);
            throw err;
        }
    };

    const cancelOrder = async (id) => {
        try {
            const response = await apiService.updateOrderStatus(id, 'Cancelled');
            if (response.success && response.data) {
                setOrders(prev => prev.map(o => (o._id || o.id) === id ? { ...o, status: 'Cancelled' } : o));
                return response.data;
            }
        } catch (err) {
            console.error('Failed to cancel order:', err);
            throw err;
        }
    };

    // Category Management functions (fetchCategories moved earlier)

    const addCategory = async (category) => {
        try {
            console.log('DataContext: Adding category:', category);
            const response = await apiService.createCategory(category);
            console.log('DataContext: Add category response:', response);
            if (response.success && response.data) {
                setCategories(prev => [...prev, response.data]);
                return response.data;
            }
        } catch (err) {
            console.error('DataContext: Failed to add category - Full error:', err);
            throw err;
        }
    };

    const updateCategory = async (updatedCategory) => {
        try {
            const response = await apiService.updateCategory(updatedCategory._id || updatedCategory.id, updatedCategory);
            if (response.success && response.data) {
                setCategories(prev => prev.map(c => (c._id || c.id) === (response.data._id || response.data.id) ? response.data : c));
                return response.data;
            }
        } catch (err) {
            console.error('Failed to update category:', err);
            throw err;
        }
    };

    const deleteCategory = async (id) => {
        try {
            await apiService.deleteCategory(id);
            setCategories(prev => prev.filter(c => (c._id || c.id) !== id));
        } catch (err) {
            console.error('Failed to delete category:', err);
            throw err;
        }
    };

    // User Management
    const updateUser = async (updatedUser) => {
        try {
            const response = await apiService.updateUser(updatedUser._id || updatedUser.id, updatedUser);
            if (response.success && response.data) {
                setUsers(prev => prev.map(u => (u._id || u.id) === (response.data._id || response.data.id) ? response.data : u));
                return response.data;
            }
        } catch (err) {
            console.error('Failed to update user:', err);
            throw err;
        }
    };

    const updateProfile = async (profileData, config = {}) => {
        try {
            const response = await apiService.updateProfile(profileData, config);
            if (response.success && response.data) {
                // If the update was successful, the AuthContext usually handles the main state,
                // but we return the data so components can update locally if needed.
                return response.data;
            }
        } catch (err) {
            console.error('Failed to update profile:', err);
            throw err;
        }
    };

    const deleteUser = async (id) => {
        try {
            await apiService.deleteUser(id);
            setUsers(prev => prev.filter(u => (u._id || u.id) !== id));
        } catch (err) {
            console.error('Failed to delete user:', err);
            throw err;
        }
    };








    useEffect(() => {
        fetchServices();
    }, []);

    const addService = async (serviceData) => {
        setLoading(prev => ({ ...prev, services: true }));
        try {
            const response = await apiService.services.create(serviceData);
            // Backend returns the created object directly or { success: true, data: ... }
            const newService = response.data || response;
            if (newService && (newService._id || newService.id)) {
                setServices(prev => [...prev, newService]);
                return newService;
            }
        } catch (err) {
            setError(prev => ({ ...prev, services: err.message }));
            throw err;
        } finally {
            setLoading(prev => ({ ...prev, services: false }));
        }
    };

    // Service Request Actions
    const requestService = async (serviceId, locationData = {}, items = []) => {
        try {
            const response = await apiService.serviceRequests.create({
                serviceId,
                location: locationData.location,
                coordinates: locationData.coordinates,
                items
            });
            return response.data || response;
        } catch (err) {
            console.error('Failed to create service request:', err);
            throw err;
        }
    };

    const fetchServiceRequests = async () => {
        try {
            const response = await apiService.serviceRequests.getAll();
            return response.data || response;
        } catch (err) {
            console.error('Failed to fetch service requests:', err);
            return [];
        }
    };

    const updateServiceRequestStatus = async (id, status) => {
        try {
            const response = await apiService.serviceRequests.updateStatus(id, status);
            return response.data || response;
        } catch (err) {
            console.error('Failed to update service request status:', err);
            throw err;
        }
    };

    const deleteServiceRequest = async (id) => {
        try {
            await apiService.serviceRequests.delete(id);
            return true;
        } catch (err) {
            console.error('Failed to delete service request:', err);
            throw err;
        }
    };

    const updateService = async (updatedService) => {
        setLoading(prev => ({ ...prev, services: true }));
        try {
            const response = await apiService.services.update(updatedService._id || updatedService.id, updatedService);
            const data = response.data || response;
            if (data && (data._id || data.id)) {
                setServices(prev => prev.map(s => (s._id || s.id) === (data._id || data.id) ? data : s));
                return data;
            }
        } catch (err) {
            setError(prev => ({ ...prev, services: err.message }));
            throw err;
        } finally {
            setLoading(prev => ({ ...prev, services: false }));
        }
    };

    const deleteService = async (id) => {
        setLoading(prev => ({ ...prev, services: true }));
        try {
            await apiService.services.delete(id);
            setServices(prev => prev.filter(s => (s._id || s.id) !== id));
            return true;
        } catch (err) {
            setError(prev => ({ ...prev, services: err.message }));
            throw err;
        } finally {
            setLoading(prev => ({ ...prev, services: false }));
        }
    };

    // Saved Products Management
    const fetchSavedProducts = async () => {
        try {
            const response = await apiService.getSavedProducts();
            if (response.success && response.data) {
                setSavedProducts(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch saved products:', err);
        }
    };

    const toggleSaveProduct = async (productData) => {
        let productId = productData?._id || productData?.id || productData;
        if (!productId) return false;

        // Strip "group-" prefix if present
        productId = productId.toString().replace('group-', '');

        // Optimistic UI Update: Immediately update state for instant feedback
        const isCurrentlySaved = savedProducts.some(p => (p._id || p.id || p) === productId);
        const previousSavedProducts = [...savedProducts];
        
        if (isCurrentlySaved) {
            // Immediately remove from list
            setSavedProducts(prev => prev.filter(p => (p._id || p.id || p) !== productId));
        } else {
            // Search for product details to add back optimistically
            const productToAdd = products.find(p => (p._id || p.id) === productId);
            if (productToAdd) {
                setSavedProducts(prev => [...prev, productToAdd]);
            }
        }

        try {
            const response = await apiService.toggleSavedProduct(productId);
            if (response.success && response.data) {
                // Sync the state with the actual data returned from server
                setSavedProducts(response.data);
                return true;
            } else {
                // Throw error if not success to trigger rollback
                throw new Error('Toggle failed');
            }
        } catch (err) {
            console.error('Failed to toggle saved product:', err);
            // Rollback to previous state on failure
            setSavedProducts(previousSavedProducts);
            return false;
        }
    };

    // Load saved products on initial load or when user changes
    useEffect(() => {
        fetchSavedProducts();
        fetchSettings();
    }, []);

    // Settings Management
    const fetchSettings = async () => {
        try {
            // Fetch ALL settings
            const response = await apiService.settings.get();
            if (response.success && response.data) {
                // Backend returns array: [{ key: 'delivery_times', value: ... }, { key: 'maintenance_mode', value: ... }]
                // Convert to object
                const settingsMap = {
                    deliveryTimes: [],
                    deliveryTimingType: 'permanent',
                    maintenanceMode: false,
                    allCategoryImage: '',
                    allCategoryName: ''
                };

                if (Array.isArray(response.data)) {
                    response.data.forEach(setting => {
                        if (setting.key === 'delivery_times') settingsMap.deliveryTimes = setting.value;
                        if (setting.key === 'delivery_timing_type') settingsMap.deliveryTimingType = setting.value;
                        if (setting.key === 'maintenance_mode') settingsMap.maintenanceMode = setting.value;
                        if (setting.key === 'maintenance_message') settingsMap.maintenanceMessage = setting.value;
                        if (setting.key === 'all_category_image') settingsMap.allCategoryImage = setting.value;
                        if (setting.key === 'all_category_name') settingsMap.allCategoryName = setting.value;
                    });
                }

                setSettings(prev => ({ ...prev, ...settingsMap }));
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    const updateDeliverySettings = async (allowedSlots) => {
        try {
            const response = await apiService.settings.update('delivery_times', allowedSlots);
            if (response.success && response.data) {
                setSettings(prev => ({ ...prev, deliveryTimes: response.data.value }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to update delivery settings:', err);
            throw err;
        }
    };

    const updateMaintenanceMode = async (isActive) => {
        try {
            const response = await apiService.settings.update('maintenance_mode', isActive);
            if (response.success && response.data) {
                setSettings(prev => ({ ...prev, maintenanceMode: response.data.value }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to update maintenance mode:', err);
            throw err;
        }
    };

    const updateDeliveryTimingType = async (type) => {
        try {
            const response = await apiService.settings.update('delivery_timing_type', type);
            if (response.success && response.data) {
                setSettings(prev => ({ ...prev, deliveryTimingType: response.data.value }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to update delivery timing type:', err);
            throw err;
        }
    };

    const updateMaintenanceMessage = async (message) => {
        try {
            const response = await apiService.settings.update('maintenance_message', message);
            if (response.success && response.data) {
                setSettings(prev => ({ ...prev, maintenanceMessage: response.data.value }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to update maintenance message:', err);
            throw err;
        }
    };

    const updateAllCategoryImage = async (url) => {
        try {
            const response = await apiService.settings.update('all_category_image', url);
            if (response.success && response.data) {
                setSettings(prev => ({ ...prev, allCategoryImage: response.data.value }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to update all category image setting:', err);
            throw err;
        }
    };

    const updateAllCategoryName = async (name) => {
        try {
            const response = await apiService.settings.update('all_category_name', name);
            if (response.success && response.data) {
                setSettings(prev => ({ ...prev, allCategoryName: response.data.value }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to update all category name setting:', err);
            throw err;
        }
    };

    const value = {
        products,
        stores,
        orders,
        news,
        ads,
        categories,
        users,
        services,
        loading,
        error,
        initialLoading,
        setInitialLoading, // Exposed for safety timeout in IntroAnimation
        addProduct,
        updateProduct,
        deleteProduct,
        addStore,
        updateStore,

        deleteStore,
        addNews,
        updateNews,
        deleteNews,
        updateOrder,
        addOrder,
        addAd,
        deleteAd,
        deleteOrder,
        cancelOrder,
        refreshOrders: fetchOrders,
        fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        fetchUsers,
        updateUser,
        updateProfile,
        deleteUser,
        fetchServices, // Exporting fetchServices
        addService,
        updateService,
        deleteService,
        requestService,
        fetchServiceRequests,
        updateServiceRequestStatus,
        deleteServiceRequest,
        refreshData, // Exposed for Pull to Refresh
        savedProducts,
        fetchSavedProducts,
        toggleSaveProduct,
        settings,           // Export settings
        updateDeliverySettings, // Export update function
        updateDeliveryTimingType,
        updateMaintenanceMode,
        updateMaintenanceMessage,
        updateAllCategoryImage,
        updateAllCategoryName,
        fetchSettings, // Export fetch function for refresh
        fastMode,
        toggleFastMode,
        isFooterHidden,
        setIsFooterHidden,
        globalSortOrder,
        setGlobalSortOrder
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

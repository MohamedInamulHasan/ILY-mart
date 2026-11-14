import axios from 'axios';

const hostname = window.location.hostname;
const isProduction = import.meta.env.MODE === 'production';

// Directly connect to the Render production backend
export const API_BASE_URL = 'https://homly-backend-aash.onrender.com/api';

if (import.meta.env.DEV) {
    console.log('%c🔗 API Configuration', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('📡 Base URL:', API_BASE_URL);
    console.log('🌍 Environment:', import.meta.env.MODE);
    console.log('---');
}

// In-flight GET request deduplication map to prevent redundant parallel requests
const inFlightRequests = new Map();

// Create primary axios instance with 25s timeout (gracefully handles Render cold starts)
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 25000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Request interceptor - Add Bearer Token and support in-flight deduplication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor with automatic retry on Render cold starts / network blips
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const config = error.config || {};
        config.__retryCount = config.__retryCount || 0;

        const isNetworkOrTimeout = error.code === 'ECONNABORTED' || 
            (error.message && (error.message.includes('timeout') || error.message.includes('Network Error')));
        const isServerColdStart = error.response && [502, 503, 504].includes(error.response.status);
        const isIdempotentMethod = ['get', 'head', 'options', 'put', 'delete'].includes((config.method || '').toLowerCase());

        // Retry automatically up to 2 times for cold starts / transient failures on idempotent methods
        if (isIdempotentMethod && (isNetworkOrTimeout || isServerColdStart) && config.__retryCount < 2) {
            config.__retryCount += 1;
            const backoffDelay = config.__retryCount * 1800; // 1.8s, 3.6s
            console.warn(`⚠️ Network/Cold-start detected (${error.message || error.response?.status}). Retrying (${config.__retryCount}/2) in ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return api(config);
        }

        let message = error.response?.data?.message || error.message || 'An error occurred';
        if (isNetworkOrTimeout) {
            message = 'Connection slow or server waking up. Please check your internet or retry.';
        }

        console.error('API Error Details:', {
            message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: config.url,
            method: config.method,
            retryCount: config.__retryCount
        });

        // Global 401 (Unauthorized) Handler
        const skipUnauthorizedUrls = ['/register-guest', '/login', '/mobile-login', '/register', '/verify-otp', '/send-otp', '/google'];
        const requestUrl = config.url || '';
        const isAuthEndpoint = skipUnauthorizedUrls.some(u => requestUrl.includes(u));
        if (error.response?.status === 401 && !isAuthEndpoint) {
            console.warn('Session expired or unauthorized. Dispatching logout event. URL:', requestUrl);
            window.dispatchEvent(new Event('auth:unauthorized'));
        }

        return Promise.reject({
            message,
            status: error.response?.status,
            data: error.response?.data,
            originalError: error
        });
    }
);

// Helper for cached/deduplicated GET requests
export const deduplicatedGet = (url, config = {}) => {
    const key = `${url}_${JSON.stringify(config.params || {})}`;
    if (inFlightRequests.has(key)) {
        return inFlightRequests.get(key);
    }
    const promise = api.get(url, config).finally(() => {
        inFlightRequests.delete(key);
    });
    inFlightRequests.set(key, promise);
    return promise;
};

// API methods
export const apiService = {
    // Products
    getProducts: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.category) queryParams.append('category', params.category);
        if (params.search) queryParams.append('search', params.search);
        if (params.featured) queryParams.append('featured', params.featured);
        if (params.storeId) queryParams.append('storeId', params.storeId);

        const queryString = queryParams.toString();
        const url = `/products${queryString ? `?${queryString}` : ''}`;
        return deduplicatedGet(url);
    },
    getProduct: (id) => deduplicatedGet(`/products/${id}`),
    createProduct: (data) => api.post('/products', data),
    bulkImportProducts: (data) => api.post('/products/bulk-import', data),
    updateProduct: (id, data) => api.put(`/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/products/${id}`),
    bulkDeleteProducts: (ids) => api.post('/products/bulk-delete', { ids }),
    dedupProducts: () => api.post('/products/dedup'),
    updateProductsOrder: (orderedIds) => api.put('/products/reorder', { orderedIds }),

    // Stores
    getStores: () => deduplicatedGet('/stores'),
    getStore: (id) => deduplicatedGet(`/stores/${id}`),
    createStore: (data) => api.post('/stores', data),
    updateStore: (id, data) => api.put(`/stores/${id}`, data),
    deleteStore: (id) => api.delete(`/stores/${id}`),
    updateStoresOrder: (orderedIds) => api.put('/stores/reorder', { orderedIds }),

    // News
    getNews: () => deduplicatedGet('/news'),
    getNewsItem: (id) => deduplicatedGet(`/news/${id}`),
    createNews: (data) => api.post('/news', data),
    updateNews: (id, data) => api.put(`/news/${id}`, data),
    deleteNews: (id) => api.delete(`/news/${id}`),

    // Ads
    getAds: () => deduplicatedGet('/ads'),
    getAd: (id) => deduplicatedGet(`/ads/${id}`),
    createAd: (data) => api.post('/ads', data),
    updateAd: (id, data) => api.put(`/ads/${id}`, data),
    deleteAd: (id) => api.delete(`/ads/${id}`),
    updateAdsOrder: (orderedIds) => api.put('/ads/reorder', { orderedIds }),

    // Categories
    categories: {
        getAll: () => deduplicatedGet('/categories'),
        getById: (id) => deduplicatedGet(`/categories/${id}`),
        create: (data) => api.post('/categories', data),
        update: (id, data) => api.put(`/categories/${id}`, data),
        delete: (id) => api.delete(`/categories/${id}`),
        sort: (orderedIds) => api.put('/categories/reorder', { orderedIds }),
        updateOrder: (orderedIds) => api.put('/categories/reorder', { orderedIds })
    },
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),

    // Services
    services: {
        getAll: () => deduplicatedGet('/services'),
        getById: (id) => deduplicatedGet(`/services/${id}`),
        getOne: (id) => deduplicatedGet(`/services/${id}`),
        create: (data) => api.post('/services', data),
        update: (id, data) => api.put(`/services/${id}`, data),
        delete: (id) => api.delete(`/services/${id}`),
        sort: (orderedIds) => api.put('/services/reorder', { orderedIds }),
        updateOrder: (orderedIds) => api.put('/services/reorder', { orderedIds })
    },
    serviceItems: {
        getAll: (serviceId, params = {}) => deduplicatedGet(`/services/${serviceId}/items`, { params }),
        create: (serviceId, data) => api.post(`/services/${serviceId}/items`, data),
        update: (itemId, data) => api.put(`/services/items/${itemId}`, data),
        delete: (itemId) => api.delete(`/services/items/${itemId}`),
        sort: (serviceId, orderedIds) => api.put(`/services/${serviceId}/items/reorder`, { orderedIds }),
    },
    serviceRequests: {
        create: (data) => api.post('/service-requests', data),
        getAll: () => deduplicatedGet('/service-requests'),
        updateStatus: (id, status) => api.put(`/service-requests/${id}`, { status }),
        delete: (id) => api.delete(`/service-requests/${id}`)
    },

    // Orders
    getOrders: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params && params.myOrders) queryParams.append('myOrders', 'true');
        if (params && params.mobile) queryParams.append('mobile', params.mobile);
        const qs = queryParams.toString();
        return api.get(`/orders${qs ? `?${qs}` : ''}`);
    },
    getOrder: (id) => api.get(`/orders/${id}`),
    createOrder: (data) => api.post('/orders', data),
    updateOrderStatus: (id, status, deliveredBy) => api.put(`/orders/${id}`, { status, deliveredBy }),
    deleteOrder: (id) => api.delete(`/orders/${id}`),

    // Users & Auth
    register: (data) => api.post('/users/register', data),
    googleAuth: (data) => api.post('/users/google', data),
    login: (data) => api.post('/users/login', data),
    mobileLogin: (data) => api.post('/users/mobile-login', data),
    sendOtp: (data) => api.post('/users/send-otp', data),
    verifyOtp: (data) => api.post('/users/verify-otp', data),
    registerGuest: () => api.post('/users/register-guest'),
    updateGuest: (data) => api.post('/users/update-guest', data),
    checkMobileAuth: (mobile) => api.post('/users/check-mobile-auth', { mobile }),
    logout: () => api.post('/users/logout'),
    forgotPassword: (email) => api.post('/users/forgotpassword', { email }),
    resetPassword: (token, password) => api.put(`/users/resetpassword/${token}`, { password }),
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data, config = {}) => api.put('/users/profile', data, config),
    saveFcmToken: (fcmToken) => api.post('/users/fcm-token', { fcmToken }),
    getSavedProducts: () => api.get('/users/profile/saved-products'),
    toggleSavedProduct: (productId) => api.post('/users/profile/saved-products', { productId }),
    requestDeleteAccount: (data) => api.post('/users/delete-request', data),

    // User Management (Admin)
    getAllUsers: () => deduplicatedGet('/users'),
    getUser: (id) => deduplicatedGet(`/users/${id}`),
    createUser: (data) => api.post('/users', data),
    updateUser: (id, data) => api.put(`/users/${id}`, data),
    deleteUser: (id) => api.delete(`/users/${id}`),

    // Settings
    settings: {
        get: (key) => deduplicatedGet(`/settings${key ? `/${key}` : ''}`),
        update: (key, value) => api.put(`/settings/${key}`, { value })
    }
};

export default api;

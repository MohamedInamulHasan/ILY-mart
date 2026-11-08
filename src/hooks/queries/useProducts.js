import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../utils/api';

// Keys for cache invalidation
export const productKeys = {
    all: ['products'],
    lists: () => [...productKeys.all, 'list'],
    list: (filters) => [...productKeys.lists(), { ...filters }],
    details: () => [...productKeys.all, 'detail'],
    detail: (id) => [...productKeys.details(), id]
};

// 1. Fetch Request hooks
// Stable default params to prevent infinite query loops
const DEFAULT_PARAMS = { limit: 1000, page: 1 };
const PRODUCTS_CACHE_KEY = 'homly_cached_products_v1';

const getCachedProducts = () => {
    try {
        const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {}
    return undefined;
};

const setCachedProducts = (list) => {
    try {
        if (Array.isArray(list) && list.length > 0) {
            // Keep essential product listing fields
            const light = list.map(p => ({
                _id: p._id,
                id: p._id || p.id,
                title: p.title,
                price: p.price,
                category: p.category,
                subcategory: p.subcategory,
                image: p.image,
                unit: p.unit,
                stock: p.stock,
                featured: p.featured,
                isAvailable: p.isAvailable,
                isGold: p.isGold,
                storeId: p.storeId,
                order: p.order,
                salesCount: p.salesCount,
                openingTime: p.openingTime,
                closingTime: p.closingTime,
                useTimeLimit: p.useTimeLimit
            }));
            localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(light));
        }
    } catch (e) {}
};

export const useProducts = (params = DEFAULT_PARAMS) => {
    const isDefaultQuery = !params.category && !params.search && !params.storeId;

    return useQuery({
        queryKey: productKeys.list(params),
        queryFn: async () => {
            const response = await apiService.getProducts(params);
            // Handle both { data: [...] } and direct [...] responses
            const list = response?.data || (Array.isArray(response) ? response : []);
            if (isDefaultQuery && list.length > 0) {
                setCachedProducts(list);
            }
            return list;
        },
        initialData: isDefaultQuery ? getCachedProducts : undefined,
        initialDataUpdatedAt: () => 0, // Immediately stale so it refetches in background
        staleTime: 60 * 1000, 
        refetchInterval: 60000,
        retry: 2, 
        onError: (err) => console.error("❌ useProducts Fetch Error:", err)
    });
};

export const useProduct = (id) => {
    return useQuery({
        queryKey: productKeys.detail(id),
        queryFn: async () => {
            const response = await apiService.getProduct(id);
            return response.data;
        },
        enabled: !!id, // Only run if ID is provided
        refetchInterval: 5000,
    });
};

// 2. Mutation hooks
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newProduct) => apiService.createProduct(newProduct),
        onSuccess: () => {
            try {
                localStorage.removeItem(PRODUCTS_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        }
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => apiService.updateProduct(id, data),
        onSuccess: (data, variables) => {
            try {
                localStorage.removeItem(PRODUCTS_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: productKeys.all });
            if (variables?.id) {
                queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
            }
        }
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => apiService.deleteProduct(id),
        onSuccess: () => {
            try {
                localStorage.removeItem(PRODUCTS_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        }
    });
};

export const useUpdateProductOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderedIds) => apiService.updateProductsOrder(orderedIds),
        onSuccess: () => {
            try {
                localStorage.removeItem(PRODUCTS_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: productKeys.all });
        }
    });
};

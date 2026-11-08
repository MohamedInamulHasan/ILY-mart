import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../utils/api';

export const storeKeys = {
    all: ['stores'],
    lists: () => [...storeKeys.all, 'list'],
    details: () => [...storeKeys.all, 'detail'],
    detail: (id) => [...storeKeys.details(), id]
};

const STORE_CACHE_KEY = 'homly_cached_stores_v1';
const getCachedStores = () => {
    try {
        const raw = localStorage.getItem(STORE_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return undefined;
};
const setCachedStores = (list) => {
    try {
        if (Array.isArray(list) && list.length > 0) {
            localStorage.setItem(STORE_CACHE_KEY, JSON.stringify(list));
        }
    } catch (e) {}
};

export const useStores = () => {
    return useQuery({
        queryKey: storeKeys.lists(),
        queryFn: async () => {
            const response = await apiService.getStores();
            const list = response.data;
            setCachedStores(list);
            return list;
        },
        initialData: getCachedStores,
        initialDataUpdatedAt: () => 0,
        staleTime: 60 * 1000,
        refetchInterval: 60000,
    });
};

export const useStore = (id) => {
    return useQuery({
        queryKey: storeKeys.detail(id),
        queryFn: async () => {
            const response = await apiService.getStore(id);
            return response.data;
        },
        enabled: !!id,
        refetchInterval: 5000,
    });
};

export const useCreateStore = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newStore) => apiService.createStore(newStore),
        onSuccess: () => {
            try {
                localStorage.removeItem(STORE_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: storeKeys.all });
        }
    });
};

export const useUpdateStore = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => apiService.updateStore(id, data),
        onSuccess: (data, variables) => {
            try {
                localStorage.removeItem(STORE_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: storeKeys.all });
            if (variables?.id) {
                queryClient.invalidateQueries({ queryKey: storeKeys.detail(variables.id) });
            }
        }
    });
};

export const useDeleteStore = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => apiService.deleteStore(id),
        onSuccess: () => {
            try {
                localStorage.removeItem(STORE_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: storeKeys.all });
        }
    });
};

export const useUpdateStoreOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderedIds) => apiService.updateStoresOrder(orderedIds),
        onSuccess: () => {
            try {
                localStorage.removeItem(STORE_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: storeKeys.all });
        }
    });
};

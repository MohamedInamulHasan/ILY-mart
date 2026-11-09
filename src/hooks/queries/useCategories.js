import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../utils/api';

export const categoryKeys = {
    all: ['categories'],
    lists: () => [...categoryKeys.all, 'list'],
};

const CAT_CACHE_KEY = 'homly_cached_categories_v3';
const getCachedCategories = () => {
    try {
        const raw = localStorage.getItem(CAT_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {}
    return undefined;
};
const setCachedCategories = (list) => {
    try {
        if (Array.isArray(list) && list.length > 0) {
            localStorage.setItem(CAT_CACHE_KEY, JSON.stringify(list));
        }
    } catch (e) {}
};

export const useCategories = () => {
    return useQuery({
        queryKey: categoryKeys.lists(),
        queryFn: async () => {
            const response = await apiService.categories.getAll();
            const list = response.data;
            setCachedCategories(list);
            return list;
        },
        initialData: getCachedCategories,
        initialDataUpdatedAt: () => 0,
        staleTime: 0,
        refetchInterval: 30000,
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newCategory) => apiService.categories.create(newCategory),
        onSuccess: (res) => {
            try {
                localStorage.removeItem(CAT_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        }
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => apiService.categories.delete(id),
        onSuccess: () => {
            try {
                localStorage.removeItem(CAT_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        }
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => apiService.categories.update(id, data),
        onSuccess: () => {
            try {
                localStorage.removeItem(CAT_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });
};

export const useUpdateCategoryOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderedIds) => apiService.categories.sort(orderedIds),
        onSuccess: () => {
            try {
                localStorage.removeItem(CAT_CACHE_KEY);
            } catch (e) {}
            queryClient.invalidateQueries({ queryKey: categoryKeys.all });
        }
    });
};

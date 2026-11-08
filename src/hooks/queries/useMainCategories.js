import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../utils/api';

export const mainCategoryKeys = {
    all: ['main_categories'],
};

const MAIN_CAT_CACHE_KEY = 'homly_cached_main_categories_v1';

const getCachedMainCategories = () => {
    try {
        const raw = localStorage.getItem(MAIN_CAT_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {}
    return undefined;
};

const setCachedMainCategories = (list) => {
    try {
        if (Array.isArray(list)) {
            localStorage.setItem(MAIN_CAT_CACHE_KEY, JSON.stringify(list));
        }
    } catch (e) {}
};

export const useMainCategories = () => {
    return useQuery({
        queryKey: mainCategoryKeys.all,
        queryFn: async () => {
            try {
                const response = await apiService.settings.get('main_categories');
                const list = response?.data?.value || (Array.isArray(response?.data) ? response.data : []);
                setCachedMainCategories(list);
                return Array.isArray(list) ? list : [];
            } catch (err) {
                console.warn('Could not fetch main_categories setting:', err);
                return getCachedMainCategories() || [];
            }
        },
        initialData: getCachedMainCategories,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};

export const useSaveMainCategories = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (mainCategoriesList) => {
            const response = await apiService.settings.update('main_categories', mainCategoriesList);
            return response;
        },
        onSuccess: (data, variables) => {
            setCachedMainCategories(variables);
            queryClient.invalidateQueries({ queryKey: mainCategoryKeys.all });
        }
    });
};

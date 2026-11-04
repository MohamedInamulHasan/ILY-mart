import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../utils/api';

export const userKeys = {
    all: ['users'],
    lists: () => [...userKeys.all, 'list'],
    details: () => [...userKeys.all, 'detail'],
    profile: () => [...userKeys.all, 'profile']
};

export const useUsers = () => {
    return useQuery({
        queryKey: userKeys.lists(),
        queryFn: async () => {
            const response = await apiService.getAllUsers();
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
        refetchInterval: 5000,
    });
};

export const useUserProfile = () => {
    return useQuery({
        queryKey: userKeys.profile(),
        queryFn: async () => {
            const response = await apiService.getProfile();
            return response.data;
        },
        staleTime: 10 * 1000, // 10s — profile updates should reflect quickly
        refetchInterval: 30 * 1000, // poll every 30s instead of 5s (reduce network load)
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => apiService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(userKeys.lists());
        }
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiService.updateProfile(data),
        onSuccess: (response) => {
            // Immediately update the profile cache with the server response
            const serverUser = response?.data || response;
            if (serverUser && typeof serverUser === 'object') {
                queryClient.setQueryData(userKeys.profile(), serverUser);
                // Also update localStorage so profile page reflects instantly
                try {
                    const existing = JSON.parse(localStorage.getItem('userInfo') || '{}');
                    localStorage.setItem('userInfo', JSON.stringify({ ...existing, ...serverUser }));
                } catch {}
            }
            queryClient.invalidateQueries({ queryKey: userKeys.profile() });
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => apiService.deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries(userKeys.lists());
        }
    });
};

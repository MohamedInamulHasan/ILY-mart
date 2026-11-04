import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../utils/api';

export const orderKeys = {
    all: ['orders'],
    lists: () => [...orderKeys.all, 'list'],
    details: () => [...orderKeys.all, 'detail'],
    detail: (id) => [...orderKeys.details(), id]
};

export const useOrders = () => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
    return useQuery({
        queryKey: orderKeys.lists(),
        queryFn: async () => {
            const response = await apiService.getOrders();
            return response?.data || response || [];
        },
        enabled: hasToken,
        staleTime: 5 * 1000,
        refetchInterval: hasToken ? 3000 : false,
    });
};

export const useOrder = (id) => {
    return useQuery({
        queryKey: orderKeys.detail(id),
        queryFn: async () => {
            const response = await apiService.getOrder(id);
            return response.data;
        },
        enabled: !!id,
        refetchInterval: 5000, // Auto-refresh details every 5 seconds
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newOrder) => apiService.createOrder(newOrder),
        onSuccess: () => {
            queryClient.invalidateQueries(orderKeys.lists());
        }
    });
};

export const useUpdateOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, deliveredBy }) => apiService.updateOrderStatus(id, status, deliveredBy),
        onSuccess: (data, variables) => {
            const updated = data?.data || { _id: variables.id, status: variables.status };
            
            // Immediately sync React Query lists cache
            queryClient.setQueriesData({ queryKey: orderKeys.lists() }, (oldOrders) => {
                if (!Array.isArray(oldOrders)) return oldOrders;
                return oldOrders.map(o => (String(o._id || o.id) === String(variables.id) ? { ...o, ...updated, status: variables.status } : o));
            });

            // Immediately sync single order detail cache
            queryClient.setQueryData(orderKeys.detail(variables.id), (old) => {
                if (!old) return old;
                return { ...old, ...updated, status: variables.status };
            });

            // Broadcast status update event to DataContext and other listeners
            window.dispatchEvent(new CustomEvent('orders:status_updated', {
                detail: { id: variables.id, status: variables.status, order: updated }
            }));

            // Invalidate to fetch latest from server
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
    });
};

export const useDeleteOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => apiService.deleteOrder(id),
        onSuccess: (data, deletedId) => {
            queryClient.setQueriesData({ queryKey: orderKeys.lists() }, (oldOrders) => {
                if (!Array.isArray(oldOrders)) return oldOrders;
                return oldOrders.filter(o => String(o._id || o.id) !== String(deletedId));
            });
            window.dispatchEvent(new CustomEvent('orders:refresh'));
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
    });
};

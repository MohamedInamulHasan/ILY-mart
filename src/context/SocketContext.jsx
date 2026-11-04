import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const queryClient = useQueryClient();
    const { user } = useAuth();

    useEffect(() => {
        // Get root URL for socket (strip /api)
        const socketUrl = API_BASE_URL.replace(/\/api$/, '');
        
        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('🔌 Connected to real-time server');
            
            // Join user-specific room if logged in
            if (user?._id) {
                newSocket.emit('join-user', user._id);
            }
        });

        // System Events
        newSocket.on('system:maintenance', (status) => {
            console.log('⚠️ Maintenance mode update:', status);
            setIsMaintenance(!!status);
            window.dispatchEvent(new CustomEvent('settings:sync', { detail: { maintenanceMode: !!status } }));
        });

        newSocket.on('system:maintenance_message', (msg) => {
            console.log('⚠️ Maintenance message update:', msg);
            window.dispatchEvent(new CustomEvent('settings:sync', { detail: { maintenanceMessage: msg } }));
        });

        newSocket.on('settings:updated', (setting) => {
            if (setting?.key) {
                window.dispatchEvent(new CustomEvent('settings:sync', { detail: { [setting.key]: setting.value } }));
            }
        });

        // Data Update Events
        newSocket.on('order:created', (newOrder) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            window.dispatchEvent(new CustomEvent('orders:refresh', { detail: newOrder }));
        });

        newSocket.on('order:updated', (updatedOrder) => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            if (updatedOrder && (updatedOrder._id || updatedOrder.id)) {
                window.dispatchEvent(new CustomEvent('orders:status_updated', {
                    detail: {
                        id: updatedOrder._id || updatedOrder.id,
                        status: updatedOrder.status,
                        order: updatedOrder
                    }
                }));
            }
            window.dispatchEvent(new CustomEvent('orders:refresh', { detail: updatedOrder }));
        });

        newSocket.on('product:updated', () => {
            queryClient.invalidateQueries(['products']);
        });

        newSocket.on('service:updated', () => {
            queryClient.invalidateQueries(['services']);
        });

        newSocket.on('category:updated', () => {
            queryClient.invalidateQueries(['categories']);
        });

        newSocket.on('ads:updated', () => {
            queryClient.invalidateQueries(['ads']);
        });

        newSocket.on('user:updated', (updatedUser) => {
            console.log('👤 User profile updated via real-time');
            // Invalidate both possible profile query key variants
            queryClient.invalidateQueries({ queryKey: ['users', 'profile'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, [queryClient, user?._id]);

    return (
        <SocketContext.Provider value={{ socket, isMaintenance }}>
            {children}
        </SocketContext.Provider>
    );
};

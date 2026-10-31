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
        newSocket.on('order:updated', () => {
            queryClient.invalidateQueries(['orders']);
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
            queryClient.invalidateQueries(['user-profile']);
            // Optionally update local auth state if needed, but invalidating profile usually triggers a re-fetch
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

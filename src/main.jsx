import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
// import { registerSW } from 'virtual:pwa-register'
// 
// const updateSW = registerSW({
//     onNeedRefresh() {
//         if (confirm('New content available. Reload?')) {
//             updateSW(true)
//         }
//     },
// })

import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes cache: instant screen transitions without reloading
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        }
    }
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider>
                        <LanguageProvider>
                            <DataProvider>
                                <App />
                            </DataProvider>
                        </LanguageProvider>
                    </ThemeProvider>
                </QueryClientProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    </StrictMode>,
)

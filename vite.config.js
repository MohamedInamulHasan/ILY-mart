import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'ILY mart - E-Commerce App',
        short_name: 'ILY mart',
        description: 'Your one-stop shop for all your needs. Browse products, manage orders, and shop with ease.',
        theme_color: '#2E5A2E',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        categories: ['shopping', 'lifestyle'],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Browse Products',
            short_name: 'Shop',
            description: 'Browse all products',
            url: '/store',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'My Orders',
            short_name: 'Orders',
            description: 'View your orders',
            url: '/orders',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Shopping Cart',
            short_name: 'Cart',
            description: 'View your cart',
            url: '/cart',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,mp3}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache public data (Products, News, Ads, Stores, Categories, Services)
            urlPattern: /\/api\/(products|news|ads|stores|categories|services).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'public-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // NEVER cache sensitive user data (Orders, User Profile, Cart, Service Requests)
            urlPattern: /\/api\/(orders|users|service-requests).*/i,
            handler: 'NetworkOnly', // Force network, fail if offline (to protect data)
            options: {
              backgroundSync: {
                name: 'sensitive-data-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for 24 hours
                }
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    host: true, // Listen on all network interfaces
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})

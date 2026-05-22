import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production';
    const base = isProduction ? '/healthwise/' : '/';

    return {
        base,
        server: {
            port: 3700,
            host: '0.0.0.0',
        },
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['icon-192.svg'],
                manifest: {
                    name: 'HealthWise',
                    short_name: 'HealthWise',
                    description: 'Personal health tracker for workouts, meals, fasting, habits, and body measurements.',
                    theme_color: '#059669',
                    background_color: '#f8fafc',
                    display: 'standalone',
                    orientation: 'portrait',
                    start_url: isProduction ? '/healthwise/' : '/',
                    scope: isProduction ? '/healthwise/' : '/',
                    icons: [
                        {
                            src: 'icon-192.svg',
                            sizes: '192x192',
                            type: 'image/svg+xml',
                            purpose: 'any maskable',
                        },
                        {
                            src: 'icon-192.svg',
                            sizes: '512x512',
                            type: 'image/svg+xml',
                            purpose: 'any maskable',
                        },
                    ],
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
                        },
                        {
                            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
                        },
                    ],
                },
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});

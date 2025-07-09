import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SMS Onboarding Portal',
        short_name: 'SMS Onboarding',
        description: 'Professional vessel onboarding system',
        theme_color: '#0F172A',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
      '@app': path.resolve(__dirname, './frontend/src/app'),
      '@features': path.resolve(__dirname, './frontend/src/features'),
      '@components': path.resolve(__dirname, './frontend/src/components'),
      '@hooks': path.resolve(__dirname, './frontend/src/hooks'),
      '@utils': path.resolve(__dirname, './frontend/src/utils'),
      '@services': path.resolve(__dirname, './frontend/src/services'),
      '@store': path.resolve(__dirname, './frontend/src/store'),
      '@types': path.resolve(__dirname, './frontend/src/types'),
      '@api': path.resolve(__dirname, './frontend/src/api'),
      '@config': path.resolve(__dirname, './frontend/src/config'),
      '@assets': path.resolve(__dirname, './frontend/src/assets')
    }
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: '0.0.0.0',
    open: true
  },
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      '.railway.app',
      '.up.railway.app',
      'localhost',
      '127.0.0.1'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          'data-vendor': ['@tanstack/react-query', '@reduxjs/toolkit', 'react-redux'],
          'aws-vendor': ['aws-sdk'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
});
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      // 只在生产环境启用 PWA
      ...(mode === 'production' ? [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icons/*.png', 'icons/*.svg'],
          manifest: {
            name: 'EchoSpeak - 口语练习',
            short_name: 'EchoSpeak',
            description: 'AI 驱动的英语口语跟读训练平台',
            theme_color: '#0F172A',
            background_color: '#F8FAFF',
            display: 'standalone',
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            icons: [
              {
                src: '/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            categories: ['education', 'productivity'],
            shortcuts: [
              {
                name: '继续学习',
                short_name: '继续',
                description: '继续上次的学习进度',
                url: '/continue',
                icons: [{ src: '/icons/continue-96x96.png', sizes: '96x96', type: 'image/png' }]
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'echospeak-api-cache',
                  networkTimeoutSeconds: 3,
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/.*\.youtube\.com\/.*/i,
                handler: 'NetworkOnly',
                options: {
                  cacheName: 'echospeak-youtube-cache',
                  expiration: {
                    maxEntries: 10
                  }
                }
              },
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'echospeak-image-cache',
                  expiration: {
                    maxEntries: 200,
                    maxAgeSeconds: 60 * 60 * 24 * 7
                  }
                }
              },
              {
                urlPattern: /\.(?:woff2|woff|ttf|otf|eot)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'echospeak-font-cache',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  }
                }
              }
            ]
          }
        })
      ] : [])
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});

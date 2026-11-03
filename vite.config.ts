import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable app with an offline shell: the code and the tales are cached
    // on the device, so a reload without internet opens the app instead of
    // the browser's error page. A new version replaces the old one on the
    // next visit by itself.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'shoqan-avatar.*'],
      manifest: {
        name: 'Ertegi English',
        short_name: 'Ertegi',
        description: 'Learn English through Kazakh folklore: tales at five levels, words, quizzes and pronunciation.',
        lang: 'kk',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBF6EE',
        theme_color: '#FBF6EE',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico}'],
        // The speech SDK is large and only needed online; it is cached when first used.
        globIgnores: ['**/microsoft.cognitiveservices.speech.sdk-*.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /\/assets\/microsoft\.cognitiveservices\.speech\.sdk-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'speech-sdk', expiration: { maxEntries: 2 } },
          },
          {
            urlPattern: /\.mp4$/,
            handler: 'CacheFirst',
            options: { cacheName: 'video', rangeRequests: true, expiration: { maxEntries: 4 } },
          },
        ],
      },
    }),
  ],
})

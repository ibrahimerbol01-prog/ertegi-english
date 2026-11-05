import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

// Version stamped on every learning event (src/utils/events.ts): package.json
// version plus the commit Vercel builds from, e.g. "0.0.0+94f5543".
const pkgVersion: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version
const commit = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7)
const appVersion = commit ? `${pkgVersion}+${commit}` : pkgVersion

// The Google Fonts stylesheet in index.html blocks the first paint (Lighthouse:
// render-blocking). In the ordinary build index.html only preloads it, and
// src/loadFonts.ts (imported by main.tsx) turns it into a stylesheet: no inline
// script, so the CSP's script-src 'self' holds (vercel.json). Fonts use
// display=swap. The research build keeps index.html exactly as it is and
// loadFonts does nothing there, so the study's groups get the same page.
export const FONTS_LINK = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap" rel="stylesheet" />'
export function nonBlockingFonts(html: string): string {
  if (!html.includes(FONTS_LINK)) throw new Error('index.html: the Google Fonts link changed; update FONTS_LINK in vite.config.ts')
  const href = FONTS_LINK.match(/href="([^"]+)"/)![1]
  return html.replace(FONTS_LINK, `<link rel="preload" as="style" href="${href}" data-fonts />\n    <noscript>${FONTS_LINK}</noscript>`)
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
// R4 research build (src/research/mode.ts, docs/research-build.md): fixed as
// literals so the ordinary build drops every `if (RESEARCH_MODE)` branch.
const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
const research = env.VITE_RESEARCH_MODE === '1'
return {
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_RESEARCH_MODE': JSON.stringify(research ? '1' : '0'),
    'import.meta.env.VITE_STUDY_ID': JSON.stringify(research ? (env.VITE_STUDY_ID || '') : ''),
    // A bare boolean literal: the bundler inlines it in every module and drops the dead branches.
    __ERTEGI_RESEARCH__: JSON.stringify(research),
  },
  // The ordinary build gets an empty stand-in for the test screen (src/research/testEntry.ts),
  // the research build one for the wordbank (src/components/screens/WordbankScreen.off.tsx).
  resolve: { alias: research
    ? [{ find: /^(.*)\/screens\/WordbankScreen$/, replacement: '$1/screens/WordbankScreen.off' }]
    : [{ find: /^(.*)\/research\/testEntry$/, replacement: '$1/research/testEntry.off' }] },
  plugins: [
    react(),
    tailwindcss(),
    { name: 'ertegi-non-blocking-fonts', transformIndexHtml: (html: string) => (research ? html : nonBlockingFonts(html)) },
    // Installable app with an offline shell: the code and the tales are cached
    // on the device, so a reload without internet opens the app instead of
    // the browser's error page. A new version replaces the old one on the
    // next visit by itself.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'shoqan-avatar.*'],
      manifest: {
        name: research ? 'Ertegi English (study)' : 'Ertegi English',
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
        // The wordbank levels (src/data/wordbank, ~1.1 MB) load only when a learner opens that level.
        globIgnores: ['**/microsoft.cognitiveservices.speech.sdk-*.js', '**/assets/{A1,A2,B1,B2,C1,C2}-*.js'],
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
}
})

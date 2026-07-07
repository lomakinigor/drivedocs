import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'node:child_process'
import { VitePWA } from 'vite-plugin-pwa'

// Версия для отображения в Настройках (F-033) — короткий хэш коммита.
// На Vercel берём из VERCEL_GIT_COMMIT_SHA (надёжнее, чем git в песочнице сборки),
// локально — из `git rev-parse`, если git недоступен — 'dev'.
function resolveCommitHash(): string {
  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA
  if (vercelSha) return vercelSha.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(resolveCommitHash()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' — новый SW ждёт активации через updateServiceWorker(true),
      // юзер видит индикатор «Обновить» и решает сам. autoUpdate + skipWaiting
      // раньше мог применять новую версию в середине сессии, что создавало
      // непредсказуемые баги (mid-session inconsistencies).
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Drivedocs — учёт расходов на авто',
        short_name: 'Drivedocs',
        description: 'Документы и учёт расходов для ИП и ООО, использующих личный автомобиль',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ru',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // skipWaiting: false — новый SW ждёт вызова updateServiceWorker(true)
        // из UI-компонента (PwaUpdatePrompt), не активируется сам.
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages のプロジェクトページ用（例: /kasagatake-zaiko/）
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
      manifest: {
        name: '笠ヶ岳山荘 在庫管理',
        short_name: '山荘在庫',
        description: '笠ヶ岳山荘のリアルタイム在庫管理',
        theme_color: '#1f4d3a',
        background_color: '#f3f6f2',
        display: 'standalone',
        lang: 'ja',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})

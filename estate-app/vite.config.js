import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pdf.png', 'apple-touch-icon.png', 'masked-icon.svg', 'smartes.png', 'sheet.png', 'google-docs.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      manifest: {
        name: 'Simplu Estate - Property Management',
        short_name: 'SimpluEstate',
        description: 'Professional property management and real estate application',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'document-viewers': ['xlsx', 'mammoth']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['xlsx', 'mammoth']
  },
  define: {
    // Default API URL for development
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:3000'),
    // jQuery global pentru Luckysheet
    global: 'globalThis',
  }
})

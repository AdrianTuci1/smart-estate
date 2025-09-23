import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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

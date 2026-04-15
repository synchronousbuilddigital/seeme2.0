import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor'
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }
            return 'vendor'
          }
          
          // Admin pages in separate chunk
          if (id.includes('/pages/admin/')) {
            return 'admin'
          }
          
          // Category pages in separate chunk
          if (id.includes('/pages/') && (
            id.includes('AnarkaliPage') || 
            id.includes('PalazzoPage') || 
            id.includes('StraightCutPage') || 
            id.includes('ShararaPage')
          )) {
            return 'category-pages'
          }
          
          // Below-the-fold components
          if (id.includes('/components/') && (
            id.includes('NewArrivals') ||
            id.includes('Magazine') ||
            id.includes('About') ||
            id.includes('FeaturedCollection')
          )) {
            return 'below-fold'
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: [
        'favicon.ico',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'apple-touch-icon-precomposed.png',
        'images/logoSEEMEE1.png',
        'images/icon-192.png',
        'images/icon-512.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'offline.html'
      ],
      manifest: {
        name: "See Mee - Premium Ethnic Wear",
        short_name: "See Mee",
        description: "Discover handcrafted ethnic wear, Anarkali suits, Sharara sets, and royal bridal couture.",
        start_url: "/",
        scope: "/",
        id: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#FAF9F6",
        theme_color: "#FAF9F6",
        prefer_related_applications: false,
        icons: [
          {
            src: "/images/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/images/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ],
        shortcuts: [
          {
            name: "New Arrivals",
            short_name: "New",
            description: "Explore latest ethnic arrivals",
            url: "/collections",
            icons: [{ src: "/images/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Categories",
            short_name: "Categories",
            description: "Browse by style and category",
            url: "/categories",
            icons: [{ src: "/images/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Wishlist",
            short_name: "Wishlist",
            description: "View saved favorites",
            url: "/wishlist",
            icons: [{ src: "/images/icon-192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*$/,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
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
    outDir: 'dist',
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

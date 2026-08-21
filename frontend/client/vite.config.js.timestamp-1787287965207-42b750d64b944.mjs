// vite.config.js
import { defineConfig } from "file:///S:/SEEMEE/frontend/client/node_modules/vite/dist/node/index.js";
import react from "file:///S:/SEEMEE/frontend/client/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///S:/SEEMEE/frontend/client/node_modules/@tailwindcss/vite/dist/index.mjs";
import { VitePWA } from "file:///S:/SEEMEE/frontend/client/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "apple-touch-icon-precomposed.png",
        "images/logoSEEMEE1.png",
        "images/icon-192.png",
        "images/icon-512.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "offline.html"
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
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*$/,
            handler: "NetworkOnly"
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
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
    port: 3e3,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("framer-motion")) {
              return "animation-vendor";
            }
            return "vendor";
          }
          if (id.includes("/pages/admin/")) {
            return "admin";
          }
          if (id.includes("/pages/") && (id.includes("AnarkaliPage") || id.includes("PalazzoPage") || id.includes("StraightCutPage") || id.includes("ShararaPage"))) {
            return "category-pages";
          }
          if (id.includes("/components/") && (id.includes("NewArrivals") || id.includes("Magazine") || id.includes("About") || id.includes("FeaturedCollection"))) {
            return "below-fold";
          }
        }
      }
    },
    chunkSizeWarningLimit: 1e3,
    minify: "esbuild",
    cssCodeSplit: true,
    sourcemap: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJTOlxcXFxTRUVNRUVcXFxcZnJvbnRlbmRcXFxcY2xpZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJTOlxcXFxTRUVNRUVcXFxcZnJvbnRlbmRcXFxcY2xpZW50XFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9TOi9TRUVNRUUvZnJvbnRlbmQvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gICAgVml0ZVBXQSh7XHJcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxyXG4gICAgICBpbmplY3RSZWdpc3RlcjogJ2F1dG8nLFxyXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXHJcbiAgICAgICAgJ2Zhdmljb24uaWNvJyxcclxuICAgICAgICAnZmF2aWNvbi0zMngzMi5wbmcnLFxyXG4gICAgICAgICdhcHBsZS10b3VjaC1pY29uLnBuZycsXHJcbiAgICAgICAgJ2FwcGxlLXRvdWNoLWljb24tcHJlY29tcG9zZWQucG5nJyxcclxuICAgICAgICAnaW1hZ2VzL2xvZ29TRUVNRUUxLnBuZycsXHJcbiAgICAgICAgJ2ltYWdlcy9pY29uLTE5Mi5wbmcnLFxyXG4gICAgICAgICdpbWFnZXMvaWNvbi01MTIucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi0xOTIucG5nJyxcclxuICAgICAgICAnaWNvbnMvaWNvbi01MTIucG5nJyxcclxuICAgICAgICAnb2ZmbGluZS5odG1sJ1xyXG4gICAgICBdLFxyXG4gICAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgIG5hbWU6IFwiU2VlIE1lZSAtIFByZW1pdW0gRXRobmljIFdlYXJcIixcclxuICAgICAgICBzaG9ydF9uYW1lOiBcIlNlZSBNZWVcIixcclxuICAgICAgICBkZXNjcmlwdGlvbjogXCJEaXNjb3ZlciBoYW5kY3JhZnRlZCBldGhuaWMgd2VhciwgQW5hcmthbGkgc3VpdHMsIFNoYXJhcmEgc2V0cywgYW5kIHJveWFsIGJyaWRhbCBjb3V0dXJlLlwiLFxyXG4gICAgICAgIHN0YXJ0X3VybDogXCIvXCIsXHJcbiAgICAgICAgc2NvcGU6IFwiL1wiLFxyXG4gICAgICAgIGlkOiBcIi9cIixcclxuICAgICAgICBkaXNwbGF5OiBcInN0YW5kYWxvbmVcIixcclxuICAgICAgICBvcmllbnRhdGlvbjogXCJhbnlcIixcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiBcIiNGQUY5RjZcIixcclxuICAgICAgICB0aGVtZV9jb2xvcjogXCIjRkFGOUY2XCIsXHJcbiAgICAgICAgcHJlZmVyX3JlbGF0ZWRfYXBwbGljYXRpb25zOiBmYWxzZSxcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IFwiL2ltYWdlcy9pY29uLTE5Mi5wbmdcIixcclxuICAgICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiBcImFueVwiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6IFwiL2ltYWdlcy9pY29uLTUxMi5wbmdcIixcclxuICAgICAgICAgICAgc2l6ZXM6IFwiNTEyeDUxMlwiLFxyXG4gICAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgICBwdXJwb3NlOiBcImFueVwiXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBzaG9ydGN1dHM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgbmFtZTogXCJOZXcgQXJyaXZhbHNcIixcclxuICAgICAgICAgICAgc2hvcnRfbmFtZTogXCJOZXdcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRXhwbG9yZSBsYXRlc3QgZXRobmljIGFycml2YWxzXCIsXHJcbiAgICAgICAgICAgIHVybDogXCIvY29sbGVjdGlvbnNcIixcclxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogXCIvaW1hZ2VzL2ljb24tMTkyLnBuZ1wiLCBzaXplczogXCIxOTJ4MTkyXCIgfV1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiQ2F0ZWdvcmllc1wiLFxyXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiBcIkNhdGVnb3JpZXNcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQnJvd3NlIGJ5IHN0eWxlIGFuZCBjYXRlZ29yeVwiLFxyXG4gICAgICAgICAgICB1cmw6IFwiL2NhdGVnb3JpZXNcIixcclxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogXCIvaW1hZ2VzL2ljb24tMTkyLnBuZ1wiLCBzaXplczogXCIxOTJ4MTkyXCIgfV1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiV2lzaGxpc3RcIixcclxuICAgICAgICAgICAgc2hvcnRfbmFtZTogXCJXaXNobGlzdFwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJWaWV3IHNhdmVkIGZhdm9yaXRlc1wiLFxyXG4gICAgICAgICAgICB1cmw6IFwiL3dpc2hsaXN0XCIsXHJcbiAgICAgICAgICAgIGljb25zOiBbeyBzcmM6IFwiL2ltYWdlcy9pY29uLTE5Mi5wbmdcIiwgc2l6ZXM6IFwiMTkyeDE5MlwiIH1dXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgY2xpZW50c0NsYWltOiB0cnVlLFxyXG4gICAgICAgIHNraXBXYWl0aW5nOiB0cnVlLFxyXG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyxqc29ufSddLFxyXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6ICcvaW5kZXguaHRtbCcsXHJcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFja0RlbnlsaXN0OiBbL15cXC9hcGkvLCAvXlxcL2FkbWluL10sXHJcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL15cXC9hcGlcXC8uKiQvLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiAnTmV0d29ya09ubHknXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXFwuKD86cG5nfGpwZ3xqcGVnfHN2Z3xnaWZ8d2VicHxhdmlmfGljbykkL2ksXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdTdGFsZVdoaWxlUmV2YWxpZGF0ZScsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdpbWFnZXMtY2FjaGUnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDMwXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuKD86Z29vZ2xlYXBpc3xnc3RhdGljKVxcLmNvbVxcLy4qJC9pLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiAnQ2FjaGVGaXJzdCcsXHJcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdnb29nbGUtZm9udHMnLFxyXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcclxuICAgICAgICAgICAgICAgIG1heEVudHJpZXM6IDMwLFxyXG4gICAgICAgICAgICAgICAgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIF0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XHJcbiAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdmcmFtZXItbW90aW9uJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ2FuaW1hdGlvbi12ZW5kb3InXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQWRtaW4gcGFnZXMgaW4gc2VwYXJhdGUgY2h1bmtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3BhZ2VzL2FkbWluLycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnYWRtaW4nXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ2F0ZWdvcnkgcGFnZXMgaW4gc2VwYXJhdGUgY2h1bmtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3BhZ2VzLycpICYmIChcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0FuYXJrYWxpUGFnZScpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdQYWxhenpvUGFnZScpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdTdHJhaWdodEN1dFBhZ2UnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnU2hhcmFyYVBhZ2UnKVxyXG4gICAgICAgICAgKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2NhdGVnb3J5LXBhZ2VzJ1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEJlbG93LXRoZS1mb2xkIGNvbXBvbmVudHNcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL2NvbXBvbmVudHMvJykgJiYgKFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnTmV3QXJyaXZhbHMnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnTWFnYXppbmUnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnQWJvdXQnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnRmVhdHVyZWRDb2xsZWN0aW9uJylcclxuICAgICAgICAgICkpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdiZWxvdy1mb2xkJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgc291cmNlbWFwOiBmYWxzZVxyXG4gIH1cclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUSxTQUFTLG9CQUFvQjtBQUNsUyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsU0FBUyxlQUFlO0FBRXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGdCQUFnQjtBQUFBLE1BQ2hCLGVBQWU7QUFBQSxRQUNiO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLFFBQ1AsSUFBSTtBQUFBLFFBQ0osU0FBUztBQUFBLFFBQ1QsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsYUFBYTtBQUFBLFFBQ2IsNkJBQTZCO0FBQUEsUUFDN0IsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxVQUNYO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLFVBQ1g7QUFBQSxRQUNGO0FBQUEsUUFDQSxXQUFXO0FBQUEsVUFDVDtBQUFBLFlBQ0UsTUFBTTtBQUFBLFlBQ04sWUFBWTtBQUFBLFlBQ1osYUFBYTtBQUFBLFlBQ2IsS0FBSztBQUFBLFlBQ0wsT0FBTyxDQUFDLEVBQUUsS0FBSyx3QkFBd0IsT0FBTyxVQUFVLENBQUM7QUFBQSxVQUMzRDtBQUFBLFVBQ0E7QUFBQSxZQUNFLE1BQU07QUFBQSxZQUNOLFlBQVk7QUFBQSxZQUNaLGFBQWE7QUFBQSxZQUNiLEtBQUs7QUFBQSxZQUNMLE9BQU8sQ0FBQyxFQUFFLEtBQUssd0JBQXdCLE9BQU8sVUFBVSxDQUFDO0FBQUEsVUFDM0Q7QUFBQSxVQUNBO0FBQUEsWUFDRSxNQUFNO0FBQUEsWUFDTixZQUFZO0FBQUEsWUFDWixhQUFhO0FBQUEsWUFDYixLQUFLO0FBQUEsWUFDTCxPQUFPLENBQUMsRUFBRSxLQUFLLHdCQUF3QixPQUFPLFVBQVUsQ0FBQztBQUFBLFVBQzNEO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLGNBQWM7QUFBQSxRQUNkLGFBQWE7QUFBQSxRQUNiLGNBQWMsQ0FBQyxxQ0FBcUM7QUFBQSxRQUNwRCxrQkFBa0I7QUFBQSxRQUNsQiwwQkFBMEIsQ0FBQyxVQUFVLFVBQVU7QUFBQSxRQUMvQyxnQkFBZ0I7QUFBQSxVQUNkO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsVUFDWDtBQUFBLFVBQ0E7QUFBQSxZQUNFLFlBQVk7QUFBQSxZQUNaLFNBQVM7QUFBQSxZQUNULFNBQVM7QUFBQSxjQUNQLFdBQVc7QUFBQSxjQUNYLFlBQVk7QUFBQSxnQkFDVixZQUFZO0FBQUEsZ0JBQ1osZUFBZSxLQUFLLEtBQUssS0FBSztBQUFBLGNBQ2hDO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxVQUNBO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQSxjQUNoQztBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjLENBQUMsT0FBTztBQUVwQixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsZ0JBQUksR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDbkYscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLGVBQWUsR0FBRztBQUNoQyxxQkFBTztBQUFBLFlBQ1Q7QUFDQSxtQkFBTztBQUFBLFVBQ1Q7QUFHQSxjQUFJLEdBQUcsU0FBUyxlQUFlLEdBQUc7QUFDaEMsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FBSSxHQUFHLFNBQVMsU0FBUyxNQUN2QixHQUFHLFNBQVMsY0FBYyxLQUMxQixHQUFHLFNBQVMsYUFBYSxLQUN6QixHQUFHLFNBQVMsaUJBQWlCLEtBQzdCLEdBQUcsU0FBUyxhQUFhLElBQ3hCO0FBQ0QsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FBSSxHQUFHLFNBQVMsY0FBYyxNQUM1QixHQUFHLFNBQVMsYUFBYSxLQUN6QixHQUFHLFNBQVMsVUFBVSxLQUN0QixHQUFHLFNBQVMsT0FBTyxLQUNuQixHQUFHLFNBQVMsb0JBQW9CLElBQy9CO0FBQ0QsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxJQUN2QixRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsSUFDZCxXQUFXO0FBQUEsRUFDYjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

// vite.config.js
import { defineConfig } from "file:///S:/SEEMEE/frontend/client/node_modules/vite/dist/node/index.js";
import react from "file:///S:/SEEMEE/frontend/client/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///S:/SEEMEE/frontend/client/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss()
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJTOlxcXFxTRUVNRUVcXFxcZnJvbnRlbmRcXFxcY2xpZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJTOlxcXFxTRUVNRUVcXFxcZnJvbnRlbmRcXFxcY2xpZW50XFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9TOi9TRUVNRUUvZnJvbnRlbmQvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gIF0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgcHJveHk6IHtcclxuICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XHJcbiAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVhY3QnKSB8fCBpZC5pbmNsdWRlcygncmVhY3QtZG9tJykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LXJvdXRlcicpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICdyZWFjdC12ZW5kb3InXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdmcmFtZXItbW90aW9uJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ2FuaW1hdGlvbi12ZW5kb3InXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3InXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQWRtaW4gcGFnZXMgaW4gc2VwYXJhdGUgY2h1bmtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3BhZ2VzL2FkbWluLycpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnYWRtaW4nXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ2F0ZWdvcnkgcGFnZXMgaW4gc2VwYXJhdGUgY2h1bmtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3BhZ2VzLycpICYmIChcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0FuYXJrYWxpUGFnZScpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdQYWxhenpvUGFnZScpIHx8XHJcbiAgICAgICAgICAgIGlkLmluY2x1ZGVzKCdTdHJhaWdodEN1dFBhZ2UnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnU2hhcmFyYVBhZ2UnKVxyXG4gICAgICAgICAgKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2NhdGVnb3J5LXBhZ2VzJ1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEJlbG93LXRoZS1mb2xkIGNvbXBvbmVudHNcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL2NvbXBvbmVudHMvJykgJiYgKFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnTmV3QXJyaXZhbHMnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnTWFnYXppbmUnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnQWJvdXQnKSB8fFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnRmVhdHVyZWRDb2xsZWN0aW9uJylcclxuICAgICAgICAgICkpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdiZWxvdy1mb2xkJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgc291cmNlbWFwOiBmYWxzZVxyXG4gIH1cclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxUSxTQUFTLG9CQUFvQjtBQUNsUyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWMsQ0FBQyxPQUFPO0FBRXBCLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixnQkFBSSxHQUFHLFNBQVMsT0FBTyxLQUFLLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGNBQWMsR0FBRztBQUNuRixxQkFBTztBQUFBLFlBQ1Q7QUFDQSxnQkFBSSxHQUFHLFNBQVMsZUFBZSxHQUFHO0FBQ2hDLHFCQUFPO0FBQUEsWUFDVDtBQUNBLG1CQUFPO0FBQUEsVUFDVDtBQUdBLGNBQUksR0FBRyxTQUFTLGVBQWUsR0FBRztBQUNoQyxtQkFBTztBQUFBLFVBQ1Q7QUFHQSxjQUFJLEdBQUcsU0FBUyxTQUFTLE1BQ3ZCLEdBQUcsU0FBUyxjQUFjLEtBQzFCLEdBQUcsU0FBUyxhQUFhLEtBQ3pCLEdBQUcsU0FBUyxpQkFBaUIsS0FDN0IsR0FBRyxTQUFTLGFBQWEsSUFDeEI7QUFDRCxtQkFBTztBQUFBLFVBQ1Q7QUFHQSxjQUFJLEdBQUcsU0FBUyxjQUFjLE1BQzVCLEdBQUcsU0FBUyxhQUFhLEtBQ3pCLEdBQUcsU0FBUyxVQUFVLEtBQ3RCLEdBQUcsU0FBUyxPQUFPLEtBQ25CLEdBQUcsU0FBUyxvQkFBb0IsSUFDL0I7QUFDRCxtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLElBQ3ZCLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxJQUNkLFdBQVc7QUFBQSxFQUNiO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

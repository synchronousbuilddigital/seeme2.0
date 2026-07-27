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
    strictPort: true,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJTOlxcXFxTRUVNRUVcXFxcZnJvbnRlbmRcXFxcY2xpZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJTOlxcXFxTRUVNRUVcXFxcZnJvbnRlbmRcXFxcY2xpZW50XFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9TOi9TRUVNRUUvZnJvbnRlbmQvY2xpZW50L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICB0YWlsd2luZGNzcygpLFxyXG4gIF0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiAzMDAwLFxyXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2VcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIG91dERpcjogJ2Rpc3QnLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xyXG4gICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdub2RlX21vZHVsZXMnKSkge1xyXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0JykgfHwgaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1yb3V0ZXInKSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiAncmVhY3QtdmVuZG9yJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZnJhbWVyLW1vdGlvbicpKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuICdhbmltYXRpb24tdmVuZG9yJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAndmVuZG9yJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBBZG1pbiBwYWdlcyBpbiBzZXBhcmF0ZSBjaHVua1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvcGFnZXMvYWRtaW4vJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuICdhZG1pbidcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gQ2F0ZWdvcnkgcGFnZXMgaW4gc2VwYXJhdGUgY2h1bmtcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3BhZ2VzLycpICYmIChcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0FuYXJrYWxpUGFnZScpIHx8IFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnUGFsYXp6b1BhZ2UnKSB8fCBcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ1N0cmFpZ2h0Q3V0UGFnZScpIHx8IFxyXG4gICAgICAgICAgICBpZC5pbmNsdWRlcygnU2hhcmFyYVBhZ2UnKVxyXG4gICAgICAgICAgKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2NhdGVnb3J5LXBhZ2VzJ1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBCZWxvdy10aGUtZm9sZCBjb21wb25lbnRzXHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9jb21wb25lbnRzLycpICYmIChcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ05ld0Fycml2YWxzJykgfHxcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ01hZ2F6aW5lJykgfHxcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0Fib3V0JykgfHxcclxuICAgICAgICAgICAgaWQuaW5jbHVkZXMoJ0ZlYXR1cmVkQ29sbGVjdGlvbicpXHJcbiAgICAgICAgICApKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnYmVsb3ctZm9sZCdcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcclxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICAgIHNvdXJjZW1hcDogZmFsc2VcclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVEsU0FBUyxvQkFBb0I7QUFDbFMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBRXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjLENBQUMsT0FBTztBQUVwQixjQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDL0IsZ0JBQUksR0FBRyxTQUFTLE9BQU8sS0FBSyxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDbkYscUJBQU87QUFBQSxZQUNUO0FBQ0EsZ0JBQUksR0FBRyxTQUFTLGVBQWUsR0FBRztBQUNoQyxxQkFBTztBQUFBLFlBQ1Q7QUFDQSxtQkFBTztBQUFBLFVBQ1Q7QUFHQSxjQUFJLEdBQUcsU0FBUyxlQUFlLEdBQUc7QUFDaEMsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FBSSxHQUFHLFNBQVMsU0FBUyxNQUN2QixHQUFHLFNBQVMsY0FBYyxLQUMxQixHQUFHLFNBQVMsYUFBYSxLQUN6QixHQUFHLFNBQVMsaUJBQWlCLEtBQzdCLEdBQUcsU0FBUyxhQUFhLElBQ3hCO0FBQ0QsbUJBQU87QUFBQSxVQUNUO0FBR0EsY0FBSSxHQUFHLFNBQVMsY0FBYyxNQUM1QixHQUFHLFNBQVMsYUFBYSxLQUN6QixHQUFHLFNBQVMsVUFBVSxLQUN0QixHQUFHLFNBQVMsT0FBTyxLQUNuQixHQUFHLFNBQVMsb0JBQW9CLElBQy9CO0FBQ0QsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxJQUN2QixRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsSUFDZCxXQUFXO0FBQUEsRUFDYjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

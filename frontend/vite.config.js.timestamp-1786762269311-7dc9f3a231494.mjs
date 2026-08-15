// vite.config.js
import { defineConfig } from "file:///D:/hospital-equipment-management/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///D:/hospital-equipment-management/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    port: 3e3,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },
      "/ws": {
        target: "ws://localhost:5000",
        ws: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          mui: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"]
        }
      }
    }
  },
  preview: {
    port: 4173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxob3NwaXRhbC1lcXVpcG1lbnQtbWFuYWdlbWVudFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcaG9zcGl0YWwtZXF1aXBtZW50LW1hbmFnZW1lbnRcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2hvc3BpdGFsLWVxdWlwbWVudC1tYW5hZ2VtZW50L2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgcHJveHk6IHtcbiAgICAgICAgICAgICcvYXBpJzoge1xuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNlY3VyZTogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnL3VwbG9hZHMnOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MDAwJyxcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgc2VjdXJlOiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICcvd3MnOiB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnd3M6Ly9sb2NhbGhvc3Q6NTAwMCcsXG4gICAgICAgICAgICAgICAgd3M6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICAgICAgICAgICBtdWk6IFsnQG11aS9tYXRlcmlhbCcsICdAbXVpL2ljb25zLW1hdGVyaWFsJywgJ0BlbW90aW9uL3JlYWN0JywgJ0BlbW90aW9uL3N0eWxlZCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBwcmV2aWV3OiB7XG4gICAgICAgIHBvcnQ6IDQxNzNcbiAgICB9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQW1ULFNBQVMsb0JBQW9CO0FBQ2hWLE9BQU8sV0FBVztBQUVsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0gsUUFBUTtBQUFBLFFBQ0osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1o7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNSLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNaO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDSCxRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsTUFDUjtBQUFBLElBQ0o7QUFBQSxFQUNKO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxlQUFlO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDSixjQUFjO0FBQUEsVUFDVixRQUFRLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ2pELEtBQUssQ0FBQyxpQkFBaUIsdUJBQXVCLGtCQUFrQixpQkFBaUI7QUFBQSxRQUNyRjtBQUFBLE1BQ0o7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLEVBQ1Y7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

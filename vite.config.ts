import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://quantum.yunseong.dev",
        changeOrigin: true,
      },
      "/graph-api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/graph-api/, "/graph"),
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy /health and future /api/* calls to the Express backend
      "/health": "http://localhost:5000",
      "/api": "http://localhost:5000",
    },
  },
});

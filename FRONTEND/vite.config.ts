import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const backendTarget = 'http://127.0.0.1:5007';

export default defineConfig({
  plugins: [react()],
  build: {
    // Current bundle intentionally exceeds Vite's default 500kb warning threshold.
    // Keep warning signal useful by setting a project-appropriate limit.
    chunkSizeWarningLimit: 2500,
  },
  server: {
    port: 3001,
    // Ensures Playwright UI E2E (`playwright.config.ts` webServer) always hits the same URL; do not silently fall back to 3002+.
    strictPort: true,
    // Listen on all interfaces so both http://127.0.0.1:3001 (Playwright) and http://localhost:3001 (browsers) work on macOS.
    host: true,
    proxy: {
      '/api': { target: backendTarget, changeOrigin: true },
      '/upload': { target: backendTarget, changeOrigin: true },
      '/uploads': { target: backendTarget, changeOrigin: true },
      '/socket.io': { target: backendTarget, changeOrigin: true, ws: true },
    },
  },
  preview: {
    port: 3001,
    strictPort: true,
    host: true,
    proxy: {
      '/api': { target: backendTarget, changeOrigin: true },
      '/upload': { target: backendTarget, changeOrigin: true },
      '/uploads': { target: backendTarget, changeOrigin: true },
      '/socket.io': { target: backendTarget, changeOrigin: true, ws: true },
    },
  },
});


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    open: false,
    // Bind on all interfaces so Localtunnel can reach the dev server
    host: '0.0.0.0',
    // Accept requests from any host (*.loca.lt, *.ngrok.io, etc.)
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_TUNNEL_URL || 'http://localhost:8000',
        changeOrigin: true,
        headers: {
          'bypass-tunnel-reminder': 'true',
        },
      },
      '/docs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/openapi.json': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

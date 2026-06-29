/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 so phones on the same Wi-Fi (or a tunnel) can reach it
    allowedHosts: true, // accept tunnel domains (*.trycloudflare.com, *.loca.lt, ngrok, …)
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    open: false,
    // Proxy the API through the dev server so the whole app is ONE origin:
    // no CORS needed, and a single tunnel (cloudflared/ngrok) exposes everything.
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
  },
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Backend URL for the dev proxy (only used in local dev; in production VITE_API_URL is set)
  const backendUrl = env.VITE_API_URL || 'http://localhost:8000';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Expose specific env vars that need to be available at build time
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        // Proxy backend API calls during development so the browser never sees localhost
        '/chat': { target: backendUrl, changeOrigin: true },
        '/rag-query': { target: backendUrl, changeOrigin: true },
        '/detect-disease': { target: backendUrl, changeOrigin: true },
        '/health': { target: backendUrl, changeOrigin: true },
        '/docs': { target: backendUrl, changeOrigin: true },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

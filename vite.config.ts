import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Backend URL for the dev proxy (only used in local dev)
  const backendUrl = env.VITE_API_URL || 'http://localhost:8000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        // Core AgriSense AI Proxy
        '/rag-query': { target: backendUrl, changeOrigin: true },
        '/analyze-disease': { target: backendUrl, changeOrigin: true },
        '/api/soil': { target: backendUrl, changeOrigin: true },
        '/health': { target: backendUrl, changeOrigin: true },
        '/models': { target: backendUrl, changeOrigin: true },
        '/docs': { target: backendUrl, changeOrigin: true },
        
        // External Environmental Feeds
        '/weather-api': {
          target: 'https://api.weatherapi.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/weather-api/, ''),
        },
        '/openweather-api': {
          target: 'https://api.openweathermap.org/data/2.5',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/openweather-api/, ''),
        },
      },
      // HMR is disabled in certain environments
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_WEATHER_API_KEY': JSON.stringify(env.VITE_WEATHER_API_KEY),
      'process.env.VITE_OPENWEATHER_API_KEY': JSON.stringify(env.VITE_OPENWEATHER_API_KEY),
    },
  };
});

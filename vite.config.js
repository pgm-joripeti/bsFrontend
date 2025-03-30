// brainsmash-SPA/frontend/vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.', // jouw frontend root is de map zelf
  publicDir: 'public',
  resolve: {
    alias: {
      mathjax: path.resolve(__dirname, 'node_modules/mathjax-full'),
    },
  },
  optimizeDeps: {
    include: ['mathjax-full/js/mathjax.js'],
  },  
  server: {
    fs: {
        strict: false,
        // allowedHosts: ['.loca.lt'] // ✅ alle LocalTunnel subdomeinen toestaan
        host: true, // 👉 laat externe toegang toe
        strictPort: true,
        port: 5173,
        origin: false, // ➕ laat custom origins toe zoals loca.lt
        cors: true, // optioneel, maar handig voor API calls
      },
    port: 5173, // of iets anders
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 👈 jouw Express backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input: './index.html'
    }
  }
});

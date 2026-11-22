import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/ },
            { name: 'vendor-pdf', test: /[\\/]node_modules[\\/](jspdf|jspdf-autotable)[\\/]/ },
            { name: 'vendor-icons', test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
            { name: 'vendor-uuid', test: /[\\/]node_modules[\\/]uuid[\\/]/ },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/ },
          ],
        },
      },
    },
  },
});

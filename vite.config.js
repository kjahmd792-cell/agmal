import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 3000),
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://api:4000',
        changeOrigin: true,
      },
    },
  },
});

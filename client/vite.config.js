import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_SERVER_URL || 'https://whatsapp-task-manager-ai4d.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/predict': 'http://localhost:7860',
      '/breeds': 'http://localhost:7860',
      '/health': 'http://localhost:7860',
      '/version': 'http://localhost:7860',
      '/docs': 'http://localhost:7860',
      '/auth': 'http://localhost:7860',
    },
  },
})

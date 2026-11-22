import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development every /api call is proxied to the API gateway, so the browser
// talks to a single origin and no CORS configuration is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.API_GATEWAY_URL ?? 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
})

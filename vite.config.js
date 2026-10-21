import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (error, _request, response) => {
            console.error(`API proxy error: ${error.message}`)
            if (!response.headersSent) {
              response.writeHead(503, { 'Content-Type': 'application/json' })
            }
            response.end(JSON.stringify({
              error: 'La API Node no está disponible. Inicia el proyecto con npm run dev.',
            }))
          })
        },
      },
    },
  },
})

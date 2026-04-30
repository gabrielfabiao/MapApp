import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/plantnet': {
        target: 'https://my-api.plantnet.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/plantnet/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
             // Remove headers that browsers add, so Pl@ntNet 
             // treats this as a pure server-to-server request
             proxyReq.removeHeader('Origin');
             proxyReq.removeHeader('Referer');
          });
        }
      }
    }
  }
})

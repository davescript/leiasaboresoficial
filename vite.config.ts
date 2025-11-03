import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

// Vite config aligned with Cloudflare Pages output
export default defineConfig({
  plugins: [react(), viteCompression({ algorithm: 'brotliCompress' }), viteCompression({ algorithm: 'gzip' })],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    // Proxy API calls to local Wrangler dev (Workers)
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
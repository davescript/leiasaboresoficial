import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '#functions': path.resolve(__dirname, 'functions'),
    },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
    },
    exclude: [
      'node_modules',
      'tests/e2e/**',
      'tests/playwright/**',
      'dist/**',
    ],
    setupFiles: [],
  },
})

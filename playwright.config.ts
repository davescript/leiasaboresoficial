import { defineConfig } from '@playwright/test'

const pagesPort = Number(process.env.PAGES_PORT || 8787)
const baseURL = process.env.CF_PAGES_URL || `http://127.0.0.1:${pagesPort}`

export default defineConfig({
  use: { baseURL },
  webServer: {
    command: 'npm run dev:pages',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
})

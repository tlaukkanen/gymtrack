import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'
import appManifest from './public/manifest.json'
import { mockApiPlugin } from './src/mocks/server'

const manifest = appManifest as Partial<ManifestOptions>

// Mock development configuration
// Run with: npm run dev:mock
export default defineConfig({
  plugins: [
    react(),
    mockApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'weights.png'],
      manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: 5173,
    // No proxy needed - mock plugin handles /api routes
  },
})

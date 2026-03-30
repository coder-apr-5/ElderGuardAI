import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ElderGuard Family Portal',
        short_name: 'ElderGuard Family',
        description: 'Keep track of your loved ones safety and health from anywhere.',
        theme_color: '#0d9488',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  envDir: path.resolve(__dirname, '../../'),
  server: {
    port: 5175,
    fs: {
      allow: ['../../'],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@elder-nest/shared": path.resolve(__dirname, "../shared/src/index.ts"),
    },
  },
})

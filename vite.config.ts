import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Keep import.meta.url pointing at the real worker/runtime files in development.
  optimizeDeps: {
    exclude: ['@missing-elements/h5p-offline-player', '@missing-elements/h5p-runtime', '@missing-elements/h5p-libraries'],
  },
  assetsInclude: ['**/*.h5p'],
  server: {
    // Meneruskan seluruh permintaan API /api ke server backend Express port 3000
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})

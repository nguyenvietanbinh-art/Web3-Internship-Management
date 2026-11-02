import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Prebundle lazy QR dependencies at startup instead of reloading an active
  // attendance form on its first camera/encoder import in the dev server.
  optimizeDeps: { include: ['qrcode', '@zxing/browser', '@zxing/library'] },
})

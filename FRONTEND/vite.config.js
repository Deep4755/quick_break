import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Build directly into BACKEND/public so Express can serve it
    // without any cross-folder path resolution issues on Hostinger
    outDir: '../BACKEND/public',
    emptyOutDir: true,
  },
})

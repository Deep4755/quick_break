import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // outDir defaults to 'dist' inside FRONTEND — Hostinger build command
  // (cd ../FRONTEND && npm ci && npm run build) puts it at FRONTEND/dist
  // Express serves it via path.resolve(__dirname, '../../FRONTEND/dist')
})

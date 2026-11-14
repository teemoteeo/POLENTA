import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// tests.yaml sta in data/config (fuori da src/web): lo importiamo come testo.
export default defineConfig({
  plugins: [react()],
  server: { fs: { allow: ['../..'] } },
  optimizeDeps: { exclude: ['maplibre-gl'] }, // il worker di maplibre v6 non passa dal pre-bundle di vite
})

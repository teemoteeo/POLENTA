import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// tests.yaml sta in data/config (fuori da src/web): lo importiamo come testo.
export default defineConfig({
  plugins: [react()],
  // /mars-tiles: le tile di Marte su S3 non hanno CORS, passano dal nostro dominio (in produzione: rewrite in vercel.json)
  server: { fs: { allow: ['../..'] }, proxy: { '/mars-tiles': { target: 'https://s3-eu-west-1.amazonaws.com', changeOrigin: true, rewrite: p => p.replace('/mars-tiles', '/whereonmars.cartodb.net/viking_mdim21_global') } } },
  optimizeDeps: { exclude: ['maplibre-gl'] }, // il worker di maplibre v6 non passa dal pre-bundle di vite
})

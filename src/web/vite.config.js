import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

// commit della repo da cui è costruita l'app: finisce nel pacchetto Simulink (data_version), per risalire al codice.
// Su Vercel c'è VERCEL_GIT_COMMIT_SHA; in locale git, con "-dirty" se ci sono modifiche non committate.
function commit() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try {
    const sha = execSync('git rev-parse --short HEAD').toString().trim()
    return execSync('git status --porcelain').toString().trim() ? `${sha}-dirty` : sha
  } catch { return 'unknown' }
}

// tests.yaml sta in data/config (fuori da src/web): lo importiamo come testo.
export default defineConfig({
  plugins: [react()],
  define: { __POLENTA_COMMIT__: JSON.stringify(commit()) },
  // /mars-tiles: le tile di Marte su S3 non hanno CORS, passano dal nostro dominio (in produzione: rewrite in vercel.json)
  server: { fs: { allow: ['../..'] }, proxy: { '/mars-tiles': { target: 'https://s3-eu-west-1.amazonaws.com', changeOrigin: true, rewrite: p => p.replace('/mars-tiles', '/whereonmars.cartodb.net/viking_mdim21_global') },
    '/trek': { target: 'https://trek.nasa.gov', changeOrigin: true, rewrite: p => p.replace('/trek', '/tiles') } } }, // tile della Luna (trekWorker.js)
  optimizeDeps: { exclude: ['maplibre-gl'] }, // il worker di maplibre v6 non passa dal pre-bundle di vite
})

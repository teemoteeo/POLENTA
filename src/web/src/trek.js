// La Luna usa lo stesso meccanismo di Terra e Marte: una sorgente raster MapLibre a tile che si affina con lo zoom.
// Ma le tile web si fermano a 85° e i siti sono a 85–87°S: la Luna è ruotata con il Polo Sud sull'equatore della mappa,
// e ogni tile 'trek://moon/z/x/y' è ridisegnata da trekWorker.js, fuori dal thread principale, dalle mosaiche LRO WAC di NASA Moon Trek.
import { addProtocol } from 'maplibre-gl'

const D = Math.PI / 180

// Rotazione della Luna: reale (x, y, z) → mappa (-z, y, x). Polo Sud → lon 0, lat 0 sulla mappa; lon 0 reale in alto.
export function toView(lon, lat) {
  const c = Math.cos(lat * D), x = c * Math.cos(lon * D), y = c * Math.sin(lon * D), z = Math.sin(lat * D)
  return [Math.atan2(y, -z) / D, Math.asin(Math.max(-1, Math.min(1, x))) / D]
}

const worker = new Worker(new URL('./trekWorker.js', import.meta.url), { type: 'module' })
const calls = new Map()
let seq = 0
worker.onmessage = ({ data }) => {
  const c = calls.get(data.id)
  calls.delete(data.id)
  if (data.error) c[1](new Error(data.error)); else c[0](data.result)
}
// tile della Luna ruotata come ImageBitmap: la usa la mappa e la schedina dei siti (orbitImg in App.jsx)
export const trekTile = (z, x, y) => new Promise((res, rej) => {
  calls.set(++seq, [res, rej])
  worker.postMessage({ tile: `trek://moon/${z}/${x}/${y}`, id: seq })
})
addProtocol('trek', ({ url }) => trekTile(...url.slice(12).split('/')).then(d => ({ data: d })))

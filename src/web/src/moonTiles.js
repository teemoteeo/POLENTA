// La Luna usa lo stesso meccanismo della Terra: una sorgente raster MapLibre a tile che si affina con lo zoom.
// Problema: le tile web si fermano a 85° e i siti Artemis sono a 84–88°S. Soluzione: la Luna è ruotata,
// con il Polo Sud sull'equatore della mappa, e ogni tile 'moon://z/x/y' è ridisegnata al volo
// dalle mosaiche LRO WAC di NASA Moon Trek: stereografica polare sotto i -61°, equirettangolare globale sopra.
import { addProtocol } from 'maplibre-gl'

const D = Math.PI / 180, R = 1737400 // raggio lunare, m
const TREK = 'https://trek.nasa.gov/tiles/Moon'
const SP = `${TREK}/SP/LRO_WAC_Mosaic_SPole60_100m_v02/1.0.0/default/default028mm` // 100 m/px, livelli 0–5, png
const EQ = `${TREK}/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm` // 303 px/grado, livelli 0–8, jpg
const HALF = 1095930 // semilato della griglia stereografica, m (WMTSCapabilities)

// Rotazione: reale (x, y, z) → mappa (-z, y, x). Polo Sud reale → lon 0, lat 0 sulla mappa; lon 0 reale in alto.
export function toView(lon, lat) {
  const c = Math.cos(lat * D), x = c * Math.cos(lon * D), y = c * Math.sin(lon * D), z = Math.sin(lat * D)
  return [Math.atan2(y, -z) / D, Math.asin(Math.max(-1, Math.min(1, x))) / D]
}

// il mosaico al polo è scuro (sole radente): curva che apre le ombre e schiarisce
const LUT = Uint8ClampedArray.from({ length: 256 }, (_, v) => 255 * Math.min(1, 1.2 * (v / 255) ** 0.75))

// tile sorgente decodificate, al massimo 8 download insieme
const cache = new Map()
let active = 0
const waiting = []
async function limited(fn) {
  while (active >= 8) await new Promise(r => waiting.push(r))
  active++
  try { return await fn() } finally { active--; waiting.shift()?.() }
}
function source(url) {
  if (!cache.has(url)) {
    if (cache.size > 600) cache.delete(cache.keys().next().value) // ponytail: FIFO, LRU se servisse
    cache.set(url, limited(async () => {
      const r = await fetch(url)
      if (!r.ok) return null // fuori copertura: resta trasparente
      const bmp = await createImageBitmap(await r.blob())
      const g = new OffscreenCanvas(256, 256).getContext('2d', { willReadFrequently: true })
      g.drawImage(bmp, 0, 0)
      return g.getImageData(0, 0, 256, 256).data
    }).catch(() => { cache.delete(url); return null })) // errore di rete: si riprova alla prossima richiesta
  }
  return cache.get(url)
}

const level = (srcMpp, mpp, max) => Math.max(0, Math.min(max, Math.ceil(Math.log2(srcMpp / mpp))))

addProtocol('moon', async ({ url }) => {
  const [z, tx, ty] = url.slice(7).split('/').map(Number)
  const n = 256 * 2 ** z
  // metri per pixel al centro della tile → livello delle sorgenti appena più fine
  const mpp = ((2 * Math.PI * R) / n) * Math.cos(Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 0.5)) / 2 ** z))))
  const ls = level((2 * HALF) / 256, mpp, 5), le = level((Math.PI * R) / 256, mpp, 8)
  const size = (2 * HALF) / 2 ** ls, span = Math.PI / 2 ** le
  const urls = [], ids = new Map(), which = new Uint16Array(65536), at = new Int32Array(65536)
  for (let py = 0; py < 256; py++) {
    const la = Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty * 256 + py + 0.5)) / n)))
    const cl = Math.cos(la), sl = Math.sin(la)
    for (let px = 0; px < 256; px++) {
      const lo = (2 * Math.PI * (tx * 256 + px + 0.5)) / n - Math.PI
      // mappa (x', y', z') → reale (z', y', -x')
      const lat = Math.asin(-cl * Math.cos(lo)), lon = Math.atan2(cl * Math.sin(lo), sl)
      let fx, fy, u
      if (lat < -61 * D) { // stereografica polare sud: lon 0 in alto
        const rho = 2 * R * Math.tan(Math.PI / 4 + lat / 2)
        fx = (HALF + rho * Math.sin(lon)) / size; fy = (HALF - rho * Math.cos(lon)) / size
        u = `${SP}/${ls}/${fy | 0}/${fx | 0}.png`
      } else { // equirettangolare: 2^(l+1) colonne × 2^l righe, riga 0 a nord
        fx = (lon + Math.PI) / span; fy = (Math.PI / 2 - lat) / span
        u = `${EQ}/${le}/${fy | 0}/${fx | 0}.jpg`
      }
      let id = ids.get(u)
      if (id === undefined) { id = urls.length; ids.set(u, id); urls.push(u) }
      const i = py * 256 + px
      which[i] = id
      at[i] = ((Math.min(255, ((fy % 1) * 256) | 0) * 256) + Math.min(255, ((fx % 1) * 256) | 0)) * 4
    }
  }
  const src = await Promise.all(urls.map(source))
  const out = new Uint8ClampedArray(65536 * 4)
  for (let i = 0; i < 65536; i++) {
    const s = src[which[i]]
    if (!s) continue
    const v = LUT[s[at[i]]], o = i * 4
    out[o] = out[o + 1] = out[o + 2] = v
    out[o + 3] = s[at[i] + 3]
  }
  return { data: await createImageBitmap(new ImageData(out, 256, 256)) }
})

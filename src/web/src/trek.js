// Luna e Marte usano lo stesso meccanismo della Terra: una sorgente raster MapLibre a tile che si affina con lo zoom.
// Ogni tile 'trek://<corpo>/z/x/y' è ridisegnata al volo dalle mosaiche di NASA Moon/Mars Trek.
// Luna: le tile web si fermano a 85° e i siti sono a 85–87°S, quindi la Luna è ruotata con il Polo Sud
// sull'equatore della mappa; sotto i -61° si legge la mosaica stereografica polare, sopra quella globale.
import { addProtocol } from 'maplibre-gl'

const D = Math.PI / 180
const TREK = 'https://trek.nasa.gov/tiles'
const TMS = '1.0.0/default/default028mm'
export const LAYERS = {
  moonEq: [`${TREK}/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/${TMS}`, 'jpg', 8], // LRO WAC 100 m/px
  moonSp: [`${TREK}/Moon/SP/LRO_WAC_Mosaic_SPole60_100m_v02/${TMS}`, 'png', 5], // stessa camera, stereografica polare
  marsEq: [`${TREK}/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/${TMS}`, 'jpg', 7], // Viking a colori, 232 m/px
  marsTopo: [`${TREK}/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/${TMS}`, 'jpg', 7], // MOLA, quota a colori (puntini)
}
const BODIES = {
  moon: { R: 1737400, rotate: true, eq: LAYERS.moonEq, sp: LAYERS.moonSp },
  mars: { R: 3389500, rotate: false, eq: LAYERS.marsEq },
}
const HALF = 1095930 // semilato della griglia stereografica della Luna, m (WMTSCapabilities)

// Rotazione della Luna: reale (x, y, z) → mappa (-z, y, x). Polo Sud → lon 0, lat 0 sulla mappa; lon 0 reale in alto.
export function toView(lon, lat) {
  const c = Math.cos(lat * D), x = c * Math.cos(lon * D), y = c * Math.sin(lon * D), z = Math.sin(lat * D)
  return [Math.atan2(y, -z) / D, Math.asin(Math.max(-1, Math.min(1, x))) / D]
}

// il mosaico lunare al polo è scuro (sole radente): curva che apre le ombre e schiarisce
const BRIGHT = Uint8ClampedArray.from({ length: 256 }, (_, v) => 255 * Math.min(1, 1.2 * (v / 255) ** 0.75))
const SAME = Uint8ClampedArray.from({ length: 256 }, (_, v) => v)

// tile sorgente decodificate (RGBA), al massimo 8 download insieme
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
      for (let k = 0; k < 4; k++) { // Trek sotto carico risponde a volte con errori: si riprova con attesa crescente
        const r = await fetch(url).catch(() => null)
        if (r?.status === 404) return null // fuori copertura: resta trasparente
        if (r?.ok) {
          const bmp = await createImageBitmap(await r.blob())
          const g = new OffscreenCanvas(256, 256).getContext('2d', { willReadFrequently: true })
          g.drawImage(bmp, 0, 0)
          return g.getImageData(0, 0, 256, 256).data
        }
        await new Promise(res => setTimeout(res, 500 * 2 ** k))
      }
      throw new Error('Trek non risponde: ' + url)
    }).catch(e => { cache.delete(url); throw e })) // la tile della mappa fallisce invece di restare con un buco
  }
  return cache.get(url)
}

// mosaico equirettangolare intero a un livello basso → (lon, lat) in gradi → luminosità 0–1 (per i puntini)
export async function sampler([url, ext], level) {
  const cols = 2 ** (level + 1), rows = 2 ** level
  const tiles = await Promise.all(Array.from({ length: cols * rows }, (_, i) => source(`${url}/${level}/${(i / cols) | 0}/${i % cols}.${ext}`).catch(() => null)))
  return (lon, lat) => {
    const fx = Math.min(cols - 1e-6, ((((lon + 540) % 360) / 360) * cols)), fy = Math.min(rows - 1e-6, ((90 - lat) / 180) * rows)
    const t = tiles[(fy | 0) * cols + (fx | 0)]
    if (!t) return 0
    const o = (((fy % 1) * 256) | 0) * 1024 + (((fx % 1) * 256) | 0) * 4
    return (t[o] + t[o + 1] + t[o + 2]) / 765
  }
}

const level = (srcMpp, mpp, max) => Math.max(0, Math.min(max, Math.ceil(Math.log2(srcMpp / mpp))))

addProtocol('trek', async ({ url }) => {
  const [name, ...zxy] = url.slice(7).split('/'), [z, tx, ty] = zxy.map(Number), body = BODIES[name], R = body.R
  const n = 256 * 2 ** z
  // metri per pixel al centro della tile → livello delle sorgenti appena più fine
  const mpp = ((2 * Math.PI * R) / n) * Math.cos(Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 0.5)) / 2 ** z))))
  const le = level((Math.PI * R) / 256, mpp, body.eq[2]), span = Math.PI / 2 ** le
  const ls = body.sp ? level((2 * HALF) / 256, mpp, body.sp[2]) : 0, size = (2 * HALF) / 2 ** ls
  const urls = [], ids = new Map(), which = new Uint16Array(65536), at = new Int32Array(65536)
  for (let py = 0; py < 256; py++) {
    const la = Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty * 256 + py + 0.5)) / n)))
    const cl = Math.cos(la), sl = Math.sin(la)
    for (let px = 0; px < 256; px++) {
      const lo = (2 * Math.PI * (tx * 256 + px + 0.5)) / n - Math.PI
      // Luna: mappa (x', y', z') → reale (z', y', -x'); Marte: nessuna rotazione
      const lat = body.rotate ? Math.asin(-cl * Math.cos(lo)) : la, lon = body.rotate ? Math.atan2(cl * Math.sin(lo), sl) : lo
      let fx, fy, u
      if (body.sp && lat < -61 * D) { // stereografica polare sud: lon 0 in alto
        const rho = 2 * R * Math.tan(Math.PI / 4 + lat / 2)
        fx = (HALF + rho * Math.sin(lon)) / size; fy = (HALF - rho * Math.cos(lon)) / size
        u = `${body.sp[0]}/${ls}/${fy | 0}/${fx | 0}.${body.sp[1]}`
      } else { // equirettangolare: 2^(l+1) colonne × 2^l righe, riga 0 a nord
        fx = (lon + Math.PI) / span; fy = (Math.PI / 2 - lat) / span
        u = `${body.eq[0]}/${le}/${fy | 0}/${fx | 0}.${body.eq[1]}`
      }
      let id = ids.get(u)
      if (id === undefined) { id = urls.length; ids.set(u, id); urls.push(u) }
      const i = py * 256 + px
      which[i] = id
      at[i] = ((Math.min(255, ((fy % 1) * 256) | 0) * 256) + Math.min(255, ((fx % 1) * 256) | 0)) * 4
    }
  }
  const src = await Promise.all(urls.map(source)), lut = name === 'moon' ? BRIGHT : SAME
  const out = new Uint8ClampedArray(65536 * 4)
  for (let i = 0; i < 65536; i++) {
    const s = src[which[i]], o = i * 4, a = at[i]
    if (!s) continue
    out[o] = lut[s[a]]; out[o + 1] = lut[s[a + 1]]; out[o + 2] = lut[s[a + 2]]; out[o + 3] = s[a + 3]
  }
  return { data: await createImageBitmap(new ImageData(out, 256, 256)) }
})

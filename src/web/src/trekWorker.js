// Worker: scarica le mosaiche LRO WAC da NASA Moon Trek e ridisegna le tile della Luna
// fuori dal thread principale, così zoom e volo restano fluidi. Vedi trek.js per la geometria.
const D = Math.PI / 180, HALF = 1095930 // semilato della griglia stereografica della Luna, m (WMTSCapabilities)
const TREK = 'https://trek.nasa.gov/tiles', TMS = '1.0.0/default/default028mm'
const R = 1737400 // raggio lunare, m
// griglie equirettangolari (2^(l+1) colonne × 2^l righe, riga 0 a nord) o stereografica polare sud
const LAYERS = {
  moonEq: { size: 256, max: 8, url: (l, r, c) => `${TREK}/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/${TMS}/${l}/${r}/${c}.jpg` }, // LRO WAC 100 m/px
  moonSp: { size: 256, max: 5, polar: true, url: (l, r, c) => `${TREK}/Moon/SP/LRO_WAC_Mosaic_SPole60_100m_v02/${TMS}/${l}/${r}/${c}.png` },
}

// il mosaico lunare al polo è scuro (sole radente): curva che apre le ombre e schiarisce
const BRIGHT = Uint8ClampedArray.from({ length: 256 }, (_, v) => 255 * Math.min(1, 1.2 * (v / 255) ** 0.75))

// Download: al massimo 6 per server (HTTP/1.1), prima i più recenti (la vista attuale).
// Le tile scaricate restano nella Cache Storage del browser: al secondo caricamento arrivano subito.
const store = self.caches ? caches.open('trek-v1').catch(() => null) : Promise.resolve(null)
const slots = {}
async function limited(host, fn) {
  const s = (slots[host] ||= { active: 0, waiting: [] })
  while (s.active >= 6) await new Promise(r => s.waiting.push(r))
  s.active++
  try { return await fn() } finally { s.active--; s.waiting.pop()?.() }
}
const mem = new Map()
function source(url, size) {
  if (!mem.has(url)) {
    if (mem.size > 800) mem.delete(mem.keys().next().value) // ponytail: FIFO, LRU se servisse
    mem.set(url, (async () => {
      const cache = await store
      let res = await cache?.match(url)
      if (!res) res = await limited(new URL(url).host, async () => {
        for (let k = 0; k < 4; k++) { // sotto carico i server rispondono a volte con errori: si riprova con attesa crescente
          const r = await fetch(url).catch(() => null)
          if (r?.status === 404) return null // fuori copertura: resta trasparente
          if (r?.ok) { cache?.put(url, r.clone()).catch(() => {}); return r }
          await new Promise(w => setTimeout(w, 500 * 2 ** k))
        }
        throw new Error('il server non risponde: ' + url)
      })
      if (!res) return null
      const g = new OffscreenCanvas(size, size).getContext('2d', { willReadFrequently: true })
      g.drawImage(await createImageBitmap(await res.blob()), 0, 0, size, size)
      return g.getImageData(0, 0, size, size).data
    })().catch(e => { mem.delete(url); throw e })) // la tile della mappa fallisce invece di restare con un buco
  }
  return mem.get(url)
}

// livello della sorgente: pixel al massimo 1,4 volte più grandi di quelli richiesti (fino a 4 volte meno tile che con il più fine)
const level = (layer, R, mpp) => Math.max(0, Math.min(layer.max, Math.round(Math.log2((layer.polar ? 2 * HALF : Math.PI * R) / layer.size / mpp))))

// punto (lat, lon in radianti) → tile sorgente (P.r, P.c) e posizione dentro, in pixel della sorgente (P.u, P.v)
const P = { r: 0, c: 0, u: 0, v: 0 }
function at(layer, l, R, lat, lon) {
  let fx, fy
  if (layer.polar) { const m = (2 * HALF) / 2 ** l, rho = 2 * R * Math.tan(Math.PI / 4 + lat / 2); fx = (HALF + rho * Math.sin(lon)) / m; fy = (HALF - rho * Math.cos(lon)) / m }
  else { const span = Math.PI / 2 ** l; fx = (lon + Math.PI) / span; fy = (Math.PI / 2 - lat) / span }
  P.c = fx | 0; P.r = fy | 0; P.u = (fx - P.c) * layer.size; P.v = (fy - P.r) * layer.size
}

// lettura bilineare dentro la tile sorgente (canale ch); -1 se non c'è il dato
function read(s, S, u, v, ch) {
  if (!s) return -1
  const x = Math.min(S - 1.001, Math.max(0, u - 0.5)), y = Math.min(S - 1.001, Math.max(0, v - 0.5))
  const x0 = x | 0, y0 = y | 0, ax = x - x0, ay = y - y0, o = (y0 * S + x0) * 4 + ch, row = S * 4
  return (s[o] * (1 - ax) + s[o + 4] * ax) * (1 - ay) + (s[o + row] * (1 - ax) + s[o + row + 4] * ax) * ay
}

const cancelled = new Set()
async function tile(id, z, tx, ty) {
  const n = 256 * 2 ** z, LL = [0, 0]
  // pixel della tile (anche frazionario) → lat, lon reali; la Luna è ruotata: mappa (x', y', z') → reale (z', y', -x')
  const ll = (px, py) => {
    const la = Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty * 256 + py)) / n))), lo = (2 * Math.PI * (tx * 256 + px)) / n - Math.PI, cl = Math.cos(la)
    LL[0] = Math.asin(-cl * Math.cos(lo)); LL[1] = Math.atan2(cl * Math.sin(lo), Math.sin(la))
    return LL
  }
  const mpp = ((2 * Math.PI * R) / n) * Math.cos(Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 0.5)) / 2 ** z)))) // m/px al centro
  // sotto i -61° la mosaica polare, sopra quella globale
  const plan = [[LAYERS.moonSp, level(LAYERS.moonSp, R, mpp)], [LAYERS.moonEq, level(LAYERS.moonEq, R, mpp)]]
  const pick = la => (la < -61 * D ? 0 : 1), key = (k, r, c) => (k * 16384 + r) * 16384 + c

  // 1) sorgenti necessarie, da una griglia di 33×33 punti (le tile sorgente coprono sempre più di 8 pixel)
  const needed = new Map()
  for (let gy = 0; gy <= 256; gy += 8) for (let gx = 0; gx <= 256; gx += 8) {
    const [la, lo] = ll(gx, gy), k = pick(la), [layer, l] = plan[k]
    at(layer, l, R, la, lo)
    const kk = key(k, P.r, P.c)
    if (!needed.has(kk)) needed.set(kk, source(layer.url(l, P.r, P.c), layer.size))
  }
  const got = await Promise.all(needed.values()), data = new Map([...needed.keys()].map((k, i) => [k, got[i]]))
  if (cancelled.has(id)) throw new Error('annullata') // niente calcolo per una tile uscita dalla vista

  // 2) pixel
  const out = new Uint8ClampedArray(65536 * 4)
  for (let py = 0; py < 256; py++) for (let px = 0; px < 256; px++) {
    const [la, lo] = ll(px + 0.5, py + 0.5), k = pick(la), [layer, l] = plan[k], o = (py * 256 + px) * 4
    at(layer, l, R, la, lo)
    const s = data.get(key(k, P.r, P.c)), g = read(s, layer.size, P.u, P.v, 0)
    if (g < 0) continue
    out[o] = out[o + 1] = out[o + 2] = BRIGHT[g | 0]; out[o + 3] = read(s, layer.size, P.u, P.v, 3)
  }
  return createImageBitmap(new ImageData(out, 256, 256))
}

self.onmessage = async ({ data: m }) => {
  if (m.cancel) return cancelled.add(m.cancel)
  try {
    const [z, x, y] = m.tile.slice(12).split('/') // 'trek://moon/z/x/y'
    const bmp = await tile(m.id, +z, +x, +y)
    self.postMessage({ id: m.id, result: bmp }, [bmp])
  } catch (e) {
    self.postMessage({ id: m.id, error: String(e.message || e) })
  } finally { cancelled.delete(m.id) }
}

// Tile della Luna (LRO WAC, 100 m/px) da NASA Moon Trek, griglia equirettangolare:
// livello z = 2^(z+1) colonne × 2^z righe, riga 0 in alto. Le tile web standard si fermano a 85°, queste arrivano al polo.
const TREK = 'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm'
const cache = new Map() // 'z/r/c' → ImageBitmap | 'loading' | 'err'

const bounds = (z, r, c) => { const d = 180 / 2 ** z; return [-180 + c * d, 90 - (r + 1) * d, -180 + (c + 1) * d, 90 - r * d] }

// coda: massimo 6 richieste insieme, prima le più recenti (la vista attuale); 
const queue = []
let active = 0
function pump() {
  while (active < 6 && queue.length) {
    const [key, onReady] = queue.pop()
    active++
    fetch(`${TREK}/${key}.jpg`).then(r => (r.ok ? r.blob() : Promise.reject(r.status))).then(createImageBitmap)
      .then(bmp => { // il mosaico al polo è scuro: lo schiariamo un po'
        const cv = new OffscreenCanvas(bmp.width, bmp.height), g = cv.getContext('2d')
        g.filter = 'brightness(1.5) contrast(1.08)'; g.drawImage(bmp, 0, 0)
        return createImageBitmap(cv)
      })
      .then(b => { cache.set(key, b); onReady() }, () => cache.delete(key)) // in errore si riprova alla prossima vista
      .finally(() => { active--; pump() })
  }
}
function load(key, onReady) {
  if (cache.has(key)) return
  cache.set(key, 'loading')
  queue.push([key, onReady])
  pump()
}

// Set fisso, più fine verso il Polo Sud dove si zooma (nessuna sovrapposizione tra livelli):
// z2 fino a -45°, z3 fino a -67,5°, z4 fino a -78,75°, z5 (0,66 km/px) sulla calotta dei siti Artemis.
const SET = [[2, [0, 1, 2]], [3, [6]], [4, [14]], [5, [30, 31]]].flatMap(([z, rows]) =>
  rows.flatMap(r => Array.from({ length: 2 ** (z + 1) }, (_, c) => [z, r, c])))

// calotta prima: è quella che si vede da vicino
export function preloadMoon(onReady) {
  for (const [z, r, c] of SET) load(`${z}/${r}/${c}`, onReady) // la coda è LIFO: l'ultimo livello (z5) parte per primo
}

export function moonTiles() {
  return SET.flatMap(([z, r, c]) => {
    const key = `${z}/${r}/${c}`, v = cache.get(key)
    return v instanceof ImageBitmap ? [{ key, image: v, bounds: bounds(z, r, c) }] : []
  })
}

export const moonLoaded = () => moonTiles().length / SET.length

// Genera public/earth-dots.json: punti di Fibonacci sulla sfera che cadono sulle terre emerse.
// Uso: node scripts/earth-dots.mjs <ne_110m_land.geojson> [N]
import { readFileSync, writeFileSync } from 'node:fs'

const [file, n = 60000] = process.argv.slice(2)
const rings = JSON.parse(readFileSync(file, 'utf8')).features.flatMap(f =>
  f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map(p => p[0]))

const inside = (x, y, r) => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

const out = [], g = Math.PI * (3 - Math.sqrt(5))
for (let i = 0; i < n; i++) {
  const y = 1 - (2 * (i + 0.5)) / n, lat = (Math.asin(y) * 180) / Math.PI
  const lon = ((((i * g * 180) / Math.PI) % 360) + 540) % 360 - 180
  if (lat < -60) continue // niente Antartide: non è un posto dove testare
  if (rings.some(r => inside(lon, lat, r))) out.push([+lon.toFixed(2), +lat.toFixed(2)])
}
// controllo minimo: Torino è terra, il centro dell'Atlantico no
const near = (lo, la) => out.some(([x, y]) => Math.abs(x - lo) < 1.2 && Math.abs(y - la) < 1.2)
console.assert(near(7.7, 45.1) && !near(-35, 30), 'maschera terra sbagliata')
writeFileSync(new URL('../public/earth-dots.json', import.meta.url), JSON.stringify(out))
console.log(out.length, 'punti')

import { cellToLatLng } from 'h3-js'
import { getResults, loadCells, TESTS, knownReason } from './data.js'
import { plan, haversineKm } from './campaign.js'
import { coord } from './format.js'
import { RADIUS_KM } from './homes.js'

// Full files from the pipeline (data/export/near/<home>__<site>__<test>.json): lazy, the folder may not exist yet
const NEAR = import.meta.glob('../../../data/export/near/*.json', { import: 'default' })
const PICKS = 5, APART_KM = 60

// midpoint on the sphere, for the camera
export function middle(a, b) {
  const R = Math.PI / 180, v = p => [Math.cos(p.lat * R) * Math.cos(p.lon * R), Math.cos(p.lat * R) * Math.sin(p.lon * R), Math.sin(p.lat * R)]
  const s = v(a).map((x, i) => x + v(b)[i]), n = Math.hypot(...s) || 1
  return [Math.atan2(s[1], s[0]) / R, Math.asin(s[2] / n) / R]
}

export async function loadNear(home, siteId, testId, radius = RADIUS_KM) {
  const top = getResults(siteId, testId)?.results[0]?.score ?? null
  const file = NEAR[`../../../data/export/near/${home.id}__${siteId}__${testId}.json`]
  let results, source, bestOnEarth = top
  const j = file && await file()
  const byRadius = j?.results_by_radius?.[radius] // un elenco per raggio (1500, 3000, 5000), oppure un solo raggio in radius_km
  if (byRadius || (j && (j.radius_km ?? RADIUS_KM) === radius)) {
    const w = TESTS[testId].requisiti
    results = (byRadius || j.results || []).slice(0, PICKS).map(r => ({ ...r, plan: plan(r, w, home), known: knownReason(r) }))
    bestOnEarth = j.best_on_earth ?? top
    source = 'export'
  } else {
    // fallback: walk the heat-map cells (sorted by score) and keep the best ones inside the radius, at least 60 km apart
    const picked = []
    for (const c of await loadCells(siteId, testId)) {
      const [lat, lon] = cellToLatLng(c.h3)
      const km_home = haversineKm(home, { lat, lon })
      if (km_home > radius || picked.some(p => haversineKm(p, { lat, lon }) < APART_KM)) continue
      picked.push({ id: 'n0' + (picked.length + 1), name: `${coord(lat, 'N', 'S')} ${coord(lon, 'E', 'W')}`, lat, lon, score: c.score, h3_cells: [c.h3], km_home, partial: true, known: knownReason({ lat, lon }) })
      if (picked.length === PICKS) break
    }
    results = picked
    source = 'cells'
  }
  return { results, easiest: -1, hidden: 0, zones: results.flatMap((r, i) => r.h3_cells.map(h3 => ({ h3, rank: i + 1 }))), bestOnEarth, source, home }
}

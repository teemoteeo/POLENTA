import { ScatterplotLayer } from '@deck.gl/layers'
import { cellToLatLng } from 'h3-js'
import './heat.css'

// centri e peso 0-1 calcolati una volta per file caricato (le celle arrivano già ordinate per voto)
const cache = new WeakMap()
function prep(cells) {
  let p = cache.get(cells)
  if (!p) {
    const lo = cells[cells.length - 1]?.score ?? 0, span = (cells[0]?.score ?? 1) - lo || 1
    p = cells.map(c => { const [lat, lon] = cellToLatLng(c.h3); return [lon, lat, (c.score - lo) / span] })
    cache.set(cells, p)
  }
  return p
}

export function heatLayer({ cells, accent }) {
  return new ScatterplotLayer({
    id: 'heat', data: prep(cells), getPosition: d => d, radiusUnits: 'pixels', radiusMinPixels: 2,
    getRadius: d => 2 + 2.2 * d[2], getFillColor: d => [...accent, 70 + 185 * d[2] ** 1.2],
    pickable: false,
  })
}

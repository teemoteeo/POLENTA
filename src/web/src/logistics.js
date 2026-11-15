import { PathLayer } from '@deck.gl/layers'
import { TURIN } from './campaign.js'
import { facilityName, label } from './i18n.js'
import './logistics.css'

const R = Math.PI / 180
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const kmBetween = (a, b) => { // haversine
  const h = Math.sin((b.lat - a.lat) * R / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin((b.lon - a.lon) * R / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

// great-circle polyline split at the antimeridian: [[[lon,lat],...], ...]
function route(a, b, n = 64) {
  const v = p => [Math.cos(p.lat * R) * Math.cos(p.lon * R), Math.cos(p.lat * R) * Math.sin(p.lon * R), Math.sin(p.lat * R)]
  const A = v(a), B = v(b)
  const w = Math.acos(Math.min(1, Math.max(-1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])))
  if (w < 1e-6) return []
  const segs = []; let cur = []; let prev = null
  for (let i = 0; i <= n; i++) {
    const t = i / n, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w)
    const x = s1 * A[0] + s2 * B[0], y = s1 * A[1] + s2 * B[1], z = s1 * A[2] + s2 * B[2]
    const pt = [Math.atan2(y, x) / R, Math.asin(z) / R]
    if (prev && Math.abs(pt[0] - prev[0]) > 180) { // crossed: close both pieces at +-180
      const side = prev[0] > 0 ? 180 : -180
      const f = (side - prev[0]) / (pt[0] + (prev[0] > 0 ? 360 : -360) - prev[0])
      const lat = prev[1] + f * (pt[1] - prev[1])
      cur.push([side, lat]); segs.push(cur); cur = [[-side, lat]]
    }
    cur.push(pt); prev = pt
  }
  segs.push(cur)
  return segs
}

// distinct facility locations (rounded to 2 decimals), facilities within 15 km of Turin merge into home
function groups(result) {
  const out = []
  const home = []
  for (const f of result.campaign?.facilities || []) {
    if (kmBetween(TURIN, f) < 15) { home.push(f); continue }
    const key = f.lat.toFixed(2) + ',' + f.lon.toFixed(2)
    let g = out.find(x => x.key === key)
    if (!g) out.push(g = { key, lat: f.lat, lon: f.lon, facs: [] })
    g.facs.push(f)
  }
  return { out, home }
}
const covers = facs => [...new Set(facs.flatMap(f => f.covers || []))].map(label).join(', ')
const short = f => facilityName(f.name).replace(/\s*\(.*?\)/g, '').split(/ (?:and|e) /)[0]

export function logisticsLayers({ result, accent, theme }) {
  const { out } = groups(result)
  const neutral = theme === 'light' ? [20, 20, 20, 130] : [255, 255, 255, 150]
  const mk = (id, a, b, color, w) => new PathLayer({
    id, data: route(a, b).map(path => ({ path })), getPath: d => d.path, getColor: color,
    widthUnits: 'pixels', getWidth: w, capRounded: true, pickable: false,
  })
  const layers = out.map(g => mk('logi-fac-' + g.key, TURIN, g, neutral, 1.5))
  if (result.lat != null) layers.push(mk('logi-site', TURIN, result, [...accent, 235], 3))
  return layers
}

export function logisticsMarkers(result) {
  const { out, home } = groups(result)
  const n = home.length
  const ms = [{
    lngLat: [TURIN.lon, TURIN.lat], className: 'logi logi-home',
    html: `<i></i><span>Turin · you${n ? ` · ${n} ${n > 1 ? 'facilities' : 'facility'} here` : ''}</span>`,
    title: n ? home.map(short).join(', ') + ' · closes: ' + covers(home) : 'Customer',
  }]
  for (const g of out) {
    ms.push({
      lngLat: [g.lon, g.lat], className: 'logi logi-fac',
      html: `<i></i><span>${esc(g.facs.map(short).join(' + '))}</span>`,
      title: 'Closes: ' + covers(g.facs),
    })
  }
  return ms
}

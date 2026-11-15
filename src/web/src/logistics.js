import { PathLayer } from '@deck.gl/layers'
import { TURIN } from './campaign.js'
import { facilityName, label, placeName } from './i18n.js'
import './logistics.css'

const R = Math.PI / 180
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

// the customer base of a result: Turin unless the plan was built for another base
const baseOf = r => r.plan?.home || TURIN
export const badge = h => (h.name === 'Turin' ? 'T' : 'H') // facilities use A, B, C...

// distinct facility locations (rounded to 2 decimals), facilities within 15 km of the base merge into home
function groups(result) {
  const base = baseOf(result)
  const out = []
  const home = []
  for (const f of result.campaign?.facilities || []) {
    if (kmBetween(base, f) < 15) { home.push(f); continue }
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
  const { out } = groups(result), base = baseOf(result)
  const neutral = [255, 255, 255, 150]
  const mk = (id, a, b, color, w) => new PathLayer({
    id, data: route(a, b).map(path => ({ path })), getPath: d => d.path, getColor: color,
    widthUnits: 'pixels', getWidth: w, capRounded: true, pickable: false,
  })
  // ponytail: no dash (PathStyleExtension not installed): facility routes thin and faint, the site route is the main one
  const layers = out.map(g => mk('logi-fac-' + g.key, base, g, neutral, 1.5))
  if (result.lat != null) layers.push(mk('logi-site', base, result, [...accent, 235], 3))
  return layers
}

export function homeMarker(n = 0, title = 'Customer', home = TURIN) {
  return {
    lngLat: [home.lon, home.lat], className: 'logi logi-home',
    html: badge(home), title: n ? `${n} ${n > 1 ? 'facilities' : 'facility'} here · ${title}` : title,
  }
}

// stops sorted by distance from the base: letter A, B, C... ; home = short names of facilities in Turin
export function stops(result) {
  const { out, home } = groups(result), base = baseOf(result)
  return {
    home: home.map(short),
    out: out.map(g => ({ g, km: Math.round(kmBetween(base, g)) })).sort((a, b) => a.km - b.km).map(({ g, km }, i) => ({
      g, km, letter: String.fromCharCode(65 + i), names: g.facs.map(short).join(' + '), city: placeName(g.facs[0].place).split(',')[0],
    })),
  }
}

export function logisticsMarkers(result) {
  const { out, home } = stops(result)
  const all = groups(result).home
  return [homeMarker(all.length, all.length ? home.join(', ') + ' · closes: ' + covers(all) : 'Customer', baseOf(result)),
    ...out.map(s => ({
      lngLat: [s.g.lon, s.g.lat], className: 'logi logi-fac', html: s.letter,
      title: `${s.names}, ${s.city} · ${s.km.toLocaleString('en')} km from ${baseOf(result).name} · closes: ${covers(s.g.facs)}`,
    }))]
}

// camera pose showing the base, the site and all facilities: spherical centroid + zoom from the widest angle
export function campaignPose(result) {
  const pts = [baseOf(result), ...(result.lat != null ? [result] : []), ...groups(result).out]
  const v = p => [Math.cos(p.lat * R) * Math.cos(p.lon * R), Math.cos(p.lat * R) * Math.sin(p.lon * R), Math.sin(p.lat * R)]
  const c = [0, 0, 0]
  for (const p of pts) v(p).forEach((x, i) => { c[i] += x })
  const n = Math.hypot(...c) || 1
  const center = [Math.atan2(c[1], c[0]) / R, Math.asin(c[2] / n) / R]
  const cv = v({ lon: center[0], lat: center[1] })
  const deg = Math.max(...pts.map(p => Math.acos(Math.min(1, Math.max(-1, v(p).reduce((s, x, i) => s + x * cv[i], 0)))) / R))
  // globe radius ~ 180 * 2^zoom px: keep the farthest point inside the right half (R sin(deg) <= ~255)
  const zoom = Math.min(2.7, Math.log2(1.4 / Math.sin(Math.min(deg, 85) * R)))
  return { center, zoom, pitch: 0, bearing: 0 }
}

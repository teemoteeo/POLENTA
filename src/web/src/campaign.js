// Logica della campagna sul campo: pura, nessun import.
export const TURIN = { name: 'Turin', lat: 45.0703, lon: 7.6869 }
export const HOLDS = 0.5 // un parametro "regge sul campo" da questo voto in su
export const BREAKS = 0.3 // sotto si rompe (come break_below della pipeline)

export function haversineKm(a, b) {
  const r = x => (x * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)))
}

// lon/lat in gradi → versore sulla sfera
export function unit(p) {
  const R = Math.PI / 180
  return [Math.cos(p.lat * R) * Math.cos(p.lon * R), Math.cos(p.lat * R) * Math.sin(p.lon * R), Math.sin(p.lat * R)]
}

export function plan(result, weights, home = TURIN) {
  // tutti i parametri con peso > 0 nel test: quelli senza dato restano visibili come 'nodata' (è il motivo di κ < 1)
  const rows = Object.entries(weights).filter(([, w]) => w > 0).map(([p, w]) => {
    const s = result.params[p]
    return { p, s: s ?? null, w, state: s == null ? 'nodata' : s >= HOLDS ? 'holds' : s >= BREAKS ? 'partial' : 'breaks' }
  }).sort((a, b) => b.w - a.w)
  const tot = rows.reduce((t, r) => t + r.w, 0) || 1
  const share = st => rows.filter(r => r.state === st).reduce((t, r) => t + r.w, 0) / tot
  // km_client comes from the pipeline, computed from Turin: for another base recompute it here
  const facilities = home === TURIN ? result.campaign.facilities : result.campaign.facilities.map(f => ({ ...f, km_client: haversineKm(home, f) }))
  const byPlace = new Map(facilities.map(f => [f.place, f.km_client])) // un luogo si conta una volta
  const kmSite = haversineKm(home, result)
  const kmIndoor = [...byPlace.values()].reduce((t, k) => t + k, 0)
  const d = result.dossier
  const low = rows.find(r => r.p === 'low_sun_frac')
  return {
    rows, fieldShare: share('holds'), partialShare: share('partial'), brokenShare: share('breaks'), nodataShare: share('nodata'),
    facilities, nFacilities: facilities.length, nStops: byPlace.size,
    home, kmSite, kmIndoor, kmTotal: kmSite + kmIndoor,
    inTurin: facilities.filter(f => f.km_client <= 50),
    uncovered: result.campaign.uncovered,
    fixedGaps: result.breaks.filter(b => !(b.param in result.params)),
    sunHint: low && low.state !== 'holds' && d.low_sun_hours >= 1 ? d.low_sun_hours : null,
    warnings: [
      d.valid_share != null && d.valid_share < 0.15 && 'bare',
      d.protected_area && 'permit',
      d.terrain_src !== '30m' && 'terrain_est',
      d.snow_free_months <= 3 && 'season',
    ].filter(Boolean),
    // ostacoli che fermano una campagna vera: poco suolo nudo nell'esagono, finestra senza neve di 3 mesi o meno
    blockers: (d.valid_share != null && d.valid_share < 0.15 ? 1 : 0) + (d.snow_free_months <= 3 ? 1 : 0),
  }
}

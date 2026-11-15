// valori fisici dell'export: [unità, moltiplicatore, decimali] (params.csv). grain_proxy: inerzia termica, si confronta per percentile
export const UNIT = {
  slope_p90: ['°', 1, 1], roughness: [' m', 1, 1], crater_density: ['/km²', 1, 2], rock_cover: ['%', 100, 1], low_sun_frac: ['%', 100, 0],
  albedo: ['', 1, 2], grain_proxy: ['', 1, 3], bulk_density_0_5: [' g/cm³', 1, 2], permafrost_share: ['%', 100, 0],
}
export const num = (v, d = 1) => (v == null ? '—' : v.toLocaleString('en-US', { maximumFractionDigits: d })) // la pipeline lascia null dove non ha il dato
// un valore o un intervallo [min, max] con la sua unità; '—' se la pipeline non ha il dato
export function phys(p, v) {
  if (v == null) return '—'
  if (typeof v === 'string') return v
  const [u, k, d] = UNIT[p] || ['', 1, 2]
  return (Array.isArray(v) ? [...new Set(v.map(x => num(x * k, d)))].join('–') : num(v * k, d)) + u
}
export const coord = (v, pos, neg) => num(Math.abs(v), 2) + '°' + (v < 0 ? neg : pos)
export const pct = s => Math.round(s * 100)
export const H3_KM2 = 253 // area media di un esagono H3 a risoluzione 5
export const km = v => Math.round(v).toLocaleString('en-US') // distanze con separatore
// ostacoli di una campagna (poco suolo nudo, poca finestra senza neve): testo breve e lungo
export const blockNotes = r => {
  const d = r.dossier
  return r.plan.warnings.filter(w => w === 'bare' || w === 'season').map(w => w === 'bare'
    ? { short: `${pct(d.valid_share)}% bare`, long: `only ${pct(d.valid_share)}% bare ground (MODIS NDVI)` }
    : { short: `${d.snow_free_months} mo/yr`, long: `${d.snow_free_months} snow-free ${d.snow_free_months === 1 ? 'month' : 'months'} (MODIS snow)` })
}

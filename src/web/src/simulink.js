// Export MATLAB / Simulink della card di un posto: un unico generatore, nel browser, dagli stessi dati che la card mostra.
// Così il file corrisponde sempre al posto che si sta guardando, anche in Unexplored e Near you (dove l'indice in classifica cambia).
//
// Un pacchetto .zip per sito × test × posto (cartella polenta_<sito>__<test>__<posto>/):
//   polenta_<sito>__<test>__<posto>.mat   variabili target, analogue, target_range, info, meta (flatten, sotto)
//   init_polenta.m                        carica il .mat, fa di info una table e stampa il confronto
//   README.txt                            variabili, unità, campi, uso in Simulink
//   SOURCES.txt                           fonte di ogni campo, per il sito e per la Terra
//
// Schema polenta-simulink-3 (20/11, Rocco: "troppe struct una dentro l'altra"): struct piatte, un livello solo.
// target e analogue hanno gli stessi campi, solo numeri, con l'unità nel nome (slope_p90_deg, soil_cohesion_Pa): si passano
// così come sono a Simulink. Unità SI, angoli in gradi; frazioni 0-1 senza suffisso. Testo e fonti stanno in info e meta.
// buildTarget / buildAnalogue restano il modello interno (lo usa anche il report): flatten lo porta nel formato del .mat.

import { matFile } from './matfile.js'
import { zipFiles } from './zip.js'
import { PARAM_EN } from './names.js'

export const SCHEMA = 'polenta-simulink-3'
export const UNITS_CONVENTION = 'SI units; angles in degrees; dimensionless fractions 0-1 have unit 1'

// corpo celeste: gravità superficiale, raggio medio, riferimento delle quote
export const BODY = {
  moon: { gravity: 1.62, radius: 1737400, solar_day: 29.53 * 86400, datum: 'LOLA reference sphere of radius 1737.4 km',
    source: 'NASA NSSDCA Moon Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html): surface gravity 1.62 m/s^2, volumetric mean radius 1737.4 km, synodic period (solar day) 29.53 days' },
  mars: { gravity: 3.71, radius: 3389500, solar_day: 24.6597 * 3600, datum: 'MGS MOLA areoid',
    source: 'NASA NSSDCA Mars Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html): surface gravity 3.71 m/s^2, volumetric mean radius 3389.5 km, length of day (solar day) 24.6597 h' },
  earth: { gravity: 9.80665, radius: 6371000, solar_day: 86400, datum: 'EGM96 geoid (about mean sea level): NASADEM below 60 N, JAXA AW3D30 above',
    source: 'standard gravity 9.80665 m/s^2 (3rd CGPM, 1901); volumetric mean radius 6371.0 km and length of day 24.0000 h, NASA NSSDCA Earth Fact Sheet' },
}
const COORDINATES = 'planetocentric latitude and east-positive longitude (-180..180), degrees'
const POLAR = new Set(['malapert_massif', 'haworth', 'nobile_rim_1'])

// unità di params.csv → [unità SI, fattore, offset]. Un'unità che non è qui fa fallire il test: va aggiunta con la sua conversione.
// ATI = inerzia termica apparente (1 - albedo) / ΔT, quindi K^-1 (surface.py).
export const SI = {
  deg: ['deg', 1], m: ['m', 1], 'n/km2': ['m^-2', 1e-6], 'frac 0-1': ['1', 1], ATI: ['K^-1', 1], 'g/cm3': ['kg m^-3', 1000],
  '%': ['1', 0.01], '°C': ['K', 1, 273.15], '-1..1': ['1', 1], 'g/kg': ['1', 1e-3],
}

// grandezze fisiche: campo → [chiave nella card di targets.json, chiave nel dossier della Terra, unità SI, conversione, chiave delle fonti]
const PHYSICAL = {
  thermal_inertia: ['thermal_inertia_si', null, 'J m^-2 K^-1 s^-0.5', x => x, 'grain_proxy'],
  rock_cover: ['rock_cover_pct', null, '1', x => x / 100, 'rock_cover'],
  subsurface_ice: ['subsurface_ice_wt_pct', null, '1', x => x / 100, 'subsurface_ice'], // solo informativo: il voto usa permafrost_share
  t_mean: ['t_mean_c', 'lst_mean_c', 'K', x => x + 273.15, 'temperature'],
  t_half_range: ['t_range_c', 'lst_half_range_c', 'K', x => x, 'temperature'],
  bulk_density_0_2m: ['density_profile_0_2m', 'bulk_density_0_2m', 'kg m^-3', x => x * 1000, 'density_profile_0_2m'],
  feo: ['feo_wt_pct', null, '1', x => x / 100, 'rock_class'],
  elevation: ['elevation', 'elevation_m', 'm', x => x, 'elevation'],
  air_density: ['air_density_kgm3', 'air_density_kgm3', 'kg m^-3', x => x, 'atmosphere_wind'],
  wind: ['wind_ms', 'wind_10m', 'm s^-1', x => x, 'atmosphere_wind'],
}
const PHYSICAL_NOTE = {
  rock_cover: 'area fraction covered by rocks and boulders',
  subsurface_ice: 'water ice mass fraction (information only: the match uses permafrost_share)',
  t_mean: 'mean surface temperature',
  t_half_range: 'half of the surface temperature excursion (mean +/- this value)',
  feo: 'FeO mass fraction of the regolith',
  elevation: 'height above the body datum: Moon, Mars and Earth heights are not comparable',
}

// Bekker-Wong: campo → [parametro in soil_mechanics.csv, unità nel CSV, unità SI, fattore]
const SOIL = {
  cohesion: ['cohesion_kPa', 'kPa', 'Pa', 1000],
  friction_angle: ['friction_angle_deg', 'deg', 'deg', 1],
  kc: ['kc', 'kN/m^(n+1)', 'N m^-(n+1)', 1000],
  kphi: ['kphi', 'kN/m^(n+2)', 'N m^-(n+2)', 1000],
  n: ['n', '-', '1', 1],
  K: ['K_cm', 'cm', 'm', 0.01],                         // modulo di scorrimento (Janosi-Hanamoto): serve per trazione e slittamento
  grain_density: ['grain_density_g_cm3', 'g/cm3', 'kg m^-3', 1000],   // densità dei grani (specific gravity × densità dell'acqua)
  d50: ['d50_um', 'um', 'm', 1e-6],                     // diametro mediano dei grani
}
export const SOIL_CSV_UNITS = Object.fromEntries(Object.values(SOIL).map(([k, u]) => [k, u]))
const CATEGORICAL = new Set(['rock_class'])

const COMPARISON_ONLY = {
  grain_proxy: 'index for percentile matching only (target and Earth use different instruments): use physical.thermal_inertia',
  rock_cover: 'target: boulder abundance (Diviner / HiRISE); Earth: coarse fragments in the top 5 cm of soil (SoilGrids cfvo). Not the same quantity',
}
// Marte: pendenza, rugosità e crateri sono valori di letteratura (DTM HiRISE/CTX), non ricalcolati da noi con la definizione
// della Terra come per la Luna (LOLA, lunar.py): il confronto è indicativo (TODO [16]).
const MARS_TERRAIN = 'Mars: literature value from HiRISE/CTX terrain models, with a resolution and definition different from the Earth '
  + 'calculation (30 m DEM); not recomputed with the Earth definition as done for the Moon (LOLA). Treat the match as indicative'
const MARS_TERRAIN_PARAMS = new Set(['slope_p90', 'roughness', 'crater_density'])
const noteFor = (p, world) => [COMPARISON_ONLY[p], world === 'mars' && MARS_TERRAIN_PARAMS.has(p) ? MARS_TERRAIN : ''].filter(Boolean).join('. ')

// params.csv → { param: unità }. Solo le prime tre colonne: le successive sono testo libero.
export function parseUnits(csv) {
  return Object.fromEntries(csv.trim().split('\n').slice(1).map(l => l.split(',')).map(c => [c[0], c[2]]))
}

// CSV con campi tra virgolette (le fonti contengono virgole)
export function parseCsv(text) {
  const rows = [[]]
  let f = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { f += '"'; i++ } else if (c === '"') q = false; else f += c
    } else if (c === '"') q = true
    else if (c === ',') { rows.at(-1).push(f); f = '' }
    else if (c === '\n') { rows.at(-1).push(f); f = ''; rows.push([]) }
    else if (c !== '\r') f += c
  }
  rows.at(-1).push(f)
  return rows.filter(r => r.some(x => x !== ''))
}

// soil_mechanics.csv → { world: { site: { value, range, unit, source, status } } }; site '*' = tutto il pianeta
export function parseSoil(csv) {
  const [head, ...rows] = parseCsv(csv)
  const out = {}
  const n = x => (x === '' || x == null ? NaN : Number(x))
  for (const r of rows) {
    const { world, site, param, value, lo, hi, unit, source, status } = Object.fromEntries(head.map((h, i) => [h, r[i]]))
    const s = ((out[world] ??= {})[site] ??= { value: {}, range: {}, unit: {}, source: {}, status: {} })
    s.value[param] = n(value)
    s.range[param] = [n(lo), n(hi)]
    s.unit[param] = unit
    s.source[param] = source
    s.status[param] = status
  }
  return out
}

const num = x => (typeof x === 'number' && Number.isFinite(x) ? x : NaN)
// 6 cifre significative: toglie il rumore della virgola mobile (2.3499999999999996 → 2.35)
const round = x => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN)
const asRange = x => (Array.isArray(x) ? [num(x[0]), num(x[1])] : [num(x), num(x)])
const field = p => p.replace(/[^A-Za-z0-9_]/g, '_')
const map = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v, k)]))

export function toSI(unit, x) {
  const [u, k, o = 0] = SI[unit] || [unit, 1, 0]
  return [u, round(num(x) * k + o)]
}

export const slug = s => s.normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'place'

// Le Reference della matrice coprono più siti ("Moon: …; Mars: …; Aristarchus: …"; prima dell'export del 19/11 in italiano): nel pacchetto resta solo la parte del
// sito, più il testo senza etichetta (definizioni comuni, es. "computed by POLENTA ... Literature: Moon: …").
// Solo se non resta niente si tiene tutto il testo.
const LABEL = /(?:^|;\s*)(Polar Moon|Moon|Mars|Aristarchus|Phoenix|Gale|Luna polare|Luna|Marte)\b[^:;]{0,40}:\s*/g
export function sourceFor(text, siteId, world) {
  if (!text) return ''
  const cuts = [...text.matchAll(LABEL)]
  if (!cuts.length) return text
  const parts = []
  if (cuts[0].index > 0) parts.push({ label: null, text: text.slice(0, cuts[0].index) })
  cuts.forEach((m, i) => parts.push({ label: m[1], text: text.slice(m.index + m[0].length, i + 1 < cuts.length ? cuts[i + 1].index : text.length) }))
  const has = l => parts.some(p => p.label === l)
  const want = world === 'mars' ? ['Mars', 'Marte', siteId === 'phoenix' ? 'Phoenix' : 'Gale']
    : siteId === 'aristarchus_plateau' ? (has('Aristarchus') ? ['Aristarchus'] : ['Moon', 'Luna'])
      : (has('Polar Moon') || has('Luna polare') ? ['Polar Moon', 'Luna polare'] : ['Moon', 'Luna'])
  const kept = parts.filter(p => p.label === null || want.includes(p.label))
  if (!kept.length) return text                      // nessuna parte pertinente: meglio tutto il testo che niente
  return kept.map(p => (p.label ? `${p.label}: ` : '') + p.text.trim().replace(/;$/, '')).join('; ')
}

// Classe di tessitura USDA da sabbia e argilla (%; limo = resto). Regole del triangolo USDA: Soil Science Division Staff
// (2017), Soil Survey Manual, USDA Handbook 18, cap. 3. Dati mancanti → ''.
export function textureClass(sand, clay) {
  if (!Number.isFinite(sand) || !Number.isFinite(clay)) return ''
  const silt = 100 - sand - clay
  if (silt + 1.5 * clay < 15) return 'sand'
  if (silt + 2 * clay < 30) return 'loamy sand'
  if (clay >= 40) return sand > 45 ? 'sandy clay' : silt >= 40 ? 'silty clay' : 'clay'
  if (clay >= 35 && sand > 45) return 'sandy clay'
  if (clay >= 27) return sand > 45 ? 'sandy clay loam' : sand > 20 ? 'clay loam' : 'silty clay loam'
  if (clay >= 20 && silt < 28 && sand > 45) return 'sandy clay loam'
  if (silt >= 80 && clay < 12) return 'silt'
  if (silt >= 50) return 'silt loam'
  if (clay >= 7 && silt >= 28 && sand <= 52) return 'loam'
  return 'sandy loam'
}

// soil_by_texture.csv → { usda: { cls, value, range, unit, source, status } }: Bekker-Wong per classe di tessitura (Terra)
export function parseTexture(csv) {
  const [head, ...rows] = parseCsv(csv)
  const out = {}
  const n = x => (x === '' || x == null ? NaN : Number(x))
  for (const r of rows) {
    const { texture_class, usda_classes, param, value, lo, hi, unit, source, status } = Object.fromEntries(head.map((h, i) => [h, r[i]]))
    for (const u of usda_classes.split(';').map(x => x.trim())) {
      const s = (out[u] ??= { cls: texture_class, value: {}, range: {}, unit: {}, source: {}, status: {} })
      s.value[param] = n(value); s.range[param] = [n(lo), n(hi)]; s.unit[param] = unit; s.source[param] = source; s.status[param] = status
    }
  }
  return out
}

const EARTH_SOIL_NOTE = 'Estimated from the soil texture class, not measured at this place. The reference soils were moist (moisture 18-62%), '
  + 'the analogues are dry, and kc, kphi depend strongly on moisture: for more precision measure on site (bevameter, shear test) '
  + 'and replace these values with your own dataset.'

// per ogni parametro: la riga del sito se c'è, altrimenti quella del pianeta ('*'), altrimenti NaN.
// Terra: stima dalla classe di tessitura (texture = { sand, clay, table }), se c'è; altrimenti NaN.
function soilFor(world, siteId, soil, texture) {
  let rows = soil[world] || {}, order = [siteId, '*'], basis = ''
  let none = world === 'earth' ? 'not measured: no Bekker-Wong data for this Earth place, measure on site (bevameter, shear vane)'
    : 'missing in soil_mechanics.csv'
  if (world === 'earth') {
    const cls = textureClass(texture?.sand, texture?.clay)
    const t = cls && texture.table?.[cls]
    basis = cls ? `USDA texture class ${cls} (SoilGrids 0-5 cm: sand ${texture.sand}%, clay ${texture.clay}%, USDA Soil Survey Manual 2017 triangle)` : ''
    rows = { texture: t, '*': soil.earth?.['*'] }; order = ['texture', '*']
    if (!t && cls) none = `not measured: ${basis} has no measured reference soil in Wong (2010); measure on site (bevameter, shear vane)`
  }
  const pick = k => order.map(o => rows[o]).find(s => s && k in s.value)
  const by = f => map(SOIL, ([k, , , m], name) => f(pick(k), k, m, name))
  return {
    ...by((s, k, m) => (s ? round(num(s.value[k]) * m) : NaN)),
    range: by((s, k, m) => (s ? s.range[k].map(x => round(num(x) * m)) : [NaN, NaN])),
    units: map(SOIL, ([, , u]) => u),
    source: by((s, k) => (s ? (world === 'earth' && s === rows.texture ? `${basis} -> ${s.source[k]} ${EARTH_SOIL_NOTE}` : s.source[k]) : none)),
    status: by((s, k) => (s ? s.status[k] : 'not measured')),
  }
}

// che cosa rappresenta l'intervallo di ogni parametro del target
function rangeType(p, source, siteId) {
  if (/^(computed by POLENTA|calcolato da noi)/i.test(source)) return 'computed by POLENTA from LOLA at 30 m (same definition as on Earth) +/- fixed tolerance'
  if (p === 'permafrost_share' && POLAR.has(siteId)) return 'median over the USGS Artemis landing region (point value); p10-p90 spread in the source'
  if (p === 'grain_proxy') return 'literature thermal inertia +/- uncertainty, converted to the Earth index (comparison only)'
  return 'literature value +/- stated uncertainty'
}

function core({ role, site, testId, name, world, lat, lon, params, raw, units, soil, texture, exportedAt, dataVersion = '', rockName = c => c,
  physical = {}, physicalSource = {}, sources = {}, earth = false }) {
  const numeric = params.filter(p => !CATEGORICAL.has(p))
  const si = p => SI[units[p]] ? SI[units[p]][0] : units[p] || ''
  const range = Object.fromEntries(numeric.map(p => [field(p), asRange(raw[p]).map(x => toSI(units[p], x)[1])]))
  const body = BODY[world]
  const out = {
    schema: SCHEMA, role, site_id: site.id, test_id: testId, name, world,
    lat_deg: round(num(lat)), lon_deg: round(num(lon)), coordinates: COORDINATES,
    gravity_m_s2: body.gravity, body_radius_m: body.radius, solar_day_s: round(body.solar_day), body_source: body.source,
    units_convention: UNITS_CONVENTION, data_export: exportedAt || '', data_version: dataVersion,
    values: map(range, ([a, b]) => round((a + b) / 2)),
    range,
    units: Object.fromEntries(numeric.map(p => [field(p), si(p)])),
    range_type: Object.fromEntries(numeric.map(p => [field(p), earth ? 'single value measured on the Earth hexagon (range = [v v])'
      : rangeType(p, sources[p] || '', site.id)])),
    source: Object.fromEntries(numeric.map(p => [field(p), earth ? 'POLENTA pipeline (Google Earth Engine), see SOURCES.txt'
      : sourceFor(sources[p], site.id, world) || 'missing'])),
    rock_class: typeof raw.rock_class === 'string' ? raw.rock_class : '',
    rock_class_name: typeof raw.rock_class === 'string' ? rockName(raw.rock_class) : '',
    soil: soilFor(world, site.id, soil, texture),
    physical: map(PHYSICAL, ([c, d, , f]) => round(f(num(physical[earth ? d : c])))),
    physical_units: map(PHYSICAL, ([, , u]) => u),
    physical_source: map(PHYSICAL, ([c, d, , , src]) => (earth ? (d ? physicalSource[src] || '' : 'not measured for Earth hexagons')
      : sourceFor(physicalSource[src], site.id, world))),
    physical_notes: map(PHYSICAL, (_, k) => PHYSICAL_NOTE[k] || ''),
    elevation_datum: body.datum,
    notes: Object.fromEntries(params.filter(p => noteFor(p, site.world)).map(p => [field(p), noteFor(p, site.world)])),
  }
  // porosità 0-2 m ricavata: n = 1 - densità apparente / densità dei grani (Lunar Sourcebook §9.1.4 p.483)
  const gd = out.soil.grain_density
  out.physical.porosity_0_2m = round(1 - out.physical.bulk_density_0_2m / gd)
  out.physical_units.porosity_0_2m = '1'
  out.physical_source.porosity_0_2m = Number.isFinite(out.physical.porosity_0_2m) ? POROSITY_SOURCE : ''
  out.physical_notes.porosity_0_2m = 'void fraction of the soil, derived from bulk_density_0_2m and soil grain_density'
  return out
}
const POROSITY_SOURCE = 'derived: porosity = 1 - bulk density / grain density (relation in Carrier Olhoeft & Mendell (1991) Lunar Sourcebook '
  + 'ch. 9, sec. 9.1.4 p.483), with bulk_density_0_2m and soil grain_density of this site'

// result: un posto della card (data.results[i], con plan); site: SITES[i]; ctx: { units, soil, exportedAt, targets, rockName }
export function buildTarget(site, testId, result, ctx) {
  const params = result.plan.rows.map(r => r.p)
  const t = ctx.targets?.[site.id] || {}
  // la matrice dà la temperatura in K: se l'export ha il valore in K lo usiamo, così il °C arrotondato non sposta di 0,05 K
  const card = { ...(t.card || {}) }
  if (typeof card.t_mean_k === 'number') card.t_mean_c = card.t_mean_k - 273.15
  return core({ role: 'target', site, testId, name: site.name, world: site.world, lat: site.lat, lon: site.lon, params, raw: result.target || {},
    ...ctx, physical: card, physicalSource: t.sources || {}, sources: t.sources || {} })
}

// Terra: grandezze fisiche dal dossier del posto (pipeline: export.physical e surface.site_dossier). Inerzia termica SI,
// massi, ghiaccio e FeO non hanno un equivalente misurato sulla Terra: restano NaN.
export const EARTH_SOURCE = {
  atmosphere_wind: 'MERRA-2 2023 (Gelaro et al. 2017, doi:10.1175/JCLI-D-16-0758.1), the 00 UTC hour of every day: mean wind speed at 10 m; air density = PS / (287.05 * T2M), dry air',
  elevation: 'NASADEM (below 60 N) and JAXA AW3D30 (above), heights above the EGM96 geoid, mean over the hexagon (30 m where computed, else 90 m or 500 m)',
  temperature: 'MODIS MOD11A2 2021-2023 land surface temperature: mean = (median day + median night) / 2; half range = (max day - min night) / 2',
  density_profile_0_2m: 'SoilGrids 2.0 bdod (Poggio et al. 2021, doi:10.5194/soil-7-217-2021), 6 layers 0-200 cm weighted by thickness, 250 m pixel',
}
const SITE_UNITS = { valid_share: '1', snow_free_months: 'month', best_month: 'month number (1-12)', low_sun_hours: 'h/day',
  wind_10m: 'm s^-1', night_lights: 'nW cm^-2 sr^-1' }

export function buildAnalogue(site, testId, result, displayName, ctx) {
  const params = result.plan.rows.map(r => r.p)
  const d = result.dossier || {}
  return {
    ...core({ role: 'analogue', site, testId, name: displayName, world: 'earth', lat: result.lat, lon: result.lon, params, raw: result.values || {},
      ...ctx, physical: d, physicalSource: EARTH_SOURCE, earth: true,
      texture: { sand: num(d.sand_pct), clay: num(d.clay_pct), table: ctx.soilTexture } }),
    match: {
      score: num(result.score), kappa: num(result.kappa),
      s: Object.fromEntries(result.plan.rows.map(r => [field(r.p), num(r.s)])),
      state: Object.fromEntries(result.plan.rows.map(r => [field(r.p), r.state])),
      weight: Object.fromEntries(result.plan.rows.map(r => [field(r.p), num(r.w)])),
    },
    site: {
      country: result.country || '',
      h3_cells: (result.h3_cells || []).join(' '),
      known: result.known?.text || '',
      terrain_src: d.terrain_src || '',
      valid_share: num(d.valid_share), snow_free_months: num(d.snow_free_months), best_month: num(d.best_month),
      low_sun_hours: num(d.low_sun_hours), wind_10m: num(d.wind_10m), night_lights: num(d.night_lights),
      protected_area: d.protected_area ? (d.protected_area_name || 'yes') : '',
    },
    site_units: SITE_UNITS,
  }
}

// la stessa struct con i soli numeri (e vettori di numeri): niente testo, così Simulink la accetta così com'è
export function numericOnly(x) {
  if (typeof x === 'number') return x
  if (Array.isArray(x)) return x.every(v => typeof v === 'number') ? x : undefined
  if (x && typeof x === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(x)) { const n = numericOnly(v); if (n !== undefined) out[k] = n }
    return Object.keys(out).length ? out : undefined
  }
  return undefined
}

export const fileNames = (site, testId, displayName) => {
  const base = `polenta_${site.id}__${testId}__${slug(displayName)}`
  return { mat: `${base}.mat`, init: 'init_polenta.m', readme: 'README.txt', sources: 'SOURCES.txt', zip: `${base}.zip`, folder: base }
}

// Testo dei .mat solo ASCII: MATLAB legge l'UTF-16, ma Octave, scipy e le console Windows non sempre (Martínez → Mart?nez).
const ASCII = { '±': '+/-', '°': ' deg', '§': 'sec. ', '→': '->', '–': '-', '—': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '×': 'x',
  '²': '^2', '³': '^3', '⁻': '^-', '¹': '1', '½': '1/2', 'µ': 'u', 'Δ': 'delta ' }
export const asciiText = s => s.replace(/[^\x00-\x7f]/g, c => ASCII[c] ?? c.normalize('NFKD').replace(/[^\x00-\x7f]/g, '') ?? '')
const asciiDeep = x => (typeof x === 'string' ? asciiText(x) : Array.isArray(x) ? x.map(asciiDeep) : x && typeof x === 'object' ? map(x, asciiDeep) : x)

// --- Il pacchetto (schema polenta-simulink-3): un .mat con struct piatte, un livello solo -------------------------------
// target, analogue   un campo per grandezza, solo numeri, stessi nomi; l'unità è nel nome (slope_p90_deg, soil_cohesion_Pa)
// target_range       [min max] di ogni campo del target, stessi nomi
// info               una riga per campo (struct array; in MATLAB init_polenta lo trasforma in table): unità, valori, voto,
//                    peso, stato, fonti, note
// meta               testo e logistica: sito, test, posto, data dell'export, riferimenti delle quote, roccia, campo
// Così in Simulink: Constant = target.soil_kc; Simulink.Bus.createObject(target) per un bus.

// unità SI → suffisso del nome del campo; '' dove l'unità è 1 o dipende da n (kc, kphi)
const SUFFIX = { deg: '_deg', m: '_m', 'm^-2': '_per_m2', K: '_K', 'kg m^-3': '_kg_m3', Pa: '_Pa', 'm s^-1': '_m_s', 'm s^-2': '_m_s2',
  'K^-1': '_per_K', 'J m^-2 K^-1 s^-0.5': '_tiu', s: '_s', 1: '', 'N m^-(n+1)': '', 'N m^-(n+2)': '' }
export const fieldName = (key, u) => {
  if (!(u in SUFFIX)) throw new Error(`unità senza suffisso: ${u} (${key})`)
  return checkName(`${key}${SUFFIX[u]}`)
}
// grandezze fisiche: nome nel .mat e nome per esteso. rock_cover fisico = massi (il rock_cover del voto è un indice)
export const PHYSICAL_NAME = {
  thermal_inertia: ['thermal_inertia', 'Thermal inertia'], rock_cover: ['boulder_cover', 'Boulder cover'],
  subsurface_ice: ['subsurface_ice', 'Subsurface water ice (mass fraction)'], t_mean: ['t_mean', 'Mean surface temperature'],
  t_half_range: ['t_half_range', 'Surface temperature half range'], bulk_density_0_2m: ['bulk_density_0_2m', 'Bulk density, 0-2 m'],
  feo: ['feo', 'FeO (mass fraction)'], elevation: ['elevation', 'Elevation'], air_density: ['air_density', 'Air density'], wind: ['wind', 'Wind speed'],
  porosity_0_2m: ['porosity_0_2m', 'Porosity, 0-2 m (derived)'],
}
export const SOIL_NAME = { cohesion: 'Soil cohesion c', friction_angle: 'Soil internal friction angle phi', kc: 'Bekker cohesive modulus kc',
  kphi: 'Bekker frictional modulus kphi', n: 'Bekker sinkage exponent n', K: 'Shear deformation modulus K (Janosi-Hanamoto)',
  grain_density: 'Grain density (specific gravity x water density)', d50: 'Median grain size D50' }
export const INFO_COLUMNS = ['field', 'group', 'quantity', 'unit', 'target', 'target_min', 'target_max', 'analogue', 'analogue_min', 'analogue_max',
  'weight', 'similarity', 'state', 'target_status', 'analogue_status', 'range_type', 'target_source', 'analogue_source', 'note']
const TERRAIN_30M = new Set(['slope_p90', 'slope_trav_p90', 'trav_share', 'roughness', 'crater_density'])
const MAT_NAME_MAX = 31
const checkName = n => { if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(n) || n.length > MAT_NAME_MAX) throw new Error(`nome non valido: ${n}`); return n }

// dal modello interno (buildTarget / buildAnalogue) alle variabili del .mat
export function flatten(site, testId, result, t, a, ctx) {
  const rows = []
  // colonne di info, in quest'ordine (le colonne della table in MATLAB)
  const add = r => {
    const x = { target_min: r.target, target_max: r.target, analogue_min: r.analogue, analogue_max: r.analogue, weight: NaN, similarity: NaN,
      state: '', target_status: '', analogue_status: '', range_type: '', target_source: '', analogue_source: '', note: '', ...r }
    rows.push(Object.fromEntries(INFO_COLUMNS.map(c => [c, x[c]])))
  }
  const loc = (field, quantity, unit, tv, av, ts = '', as = '') => add({ field, group: 'location', quantity, unit, target: tv, analogue: av, target_source: ts, analogue_source: as })
  loc('lat_deg', 'Latitude (planetocentric)', 'deg', t.lat_deg, a.lat_deg)
  loc('lon_deg', 'Longitude (east-positive, -180..180)', 'deg', t.lon_deg, a.lon_deg)
  loc('gravity_m_s2', 'Surface gravity', 'm s^-2', t.gravity_m_s2, a.gravity_m_s2, t.body_source, a.body_source)
  loc('radius_m', 'Mean body radius', 'm', t.body_radius_m, a.body_radius_m, t.body_source, a.body_source)
  loc('solar_day_s', 'Length of the solar day', 's', t.solar_day_s, a.solar_day_s, t.body_source, a.body_source)

  const plan = Object.fromEntries(result.plan.rows.map(r => [r.p, r]))
  const terrain = a.site?.terrain_src === '30m' ? 'exact (30 m)' : a.site?.terrain_src ? 'estimated from 500 m (calibrated)' : ''
  for (const p of Object.keys(t.values)) {
    const r = plan[p] || {}
    const es = ctx.earthSource?.(p)
    add({ field: fieldName(p, t.units[p]), group: 'matched', quantity: PARAM_EN[p] || p, unit: t.units[p],
      target: t.values[p], target_min: t.range[p][0], target_max: t.range[p][1], analogue: a.values[p],
      weight: num(r.w), similarity: num(r.s), state: r.state || '', range_type: t.range_type[p],
      analogue_status: TERRAIN_30M.has(p) ? (p === 'crater_density' && a.site?.terrain_src !== '30m' ? 'computed at 30 m only' : terrain) : '',
      target_source: t.source[p], analogue_source: es || a.source[p], note: t.notes[p] || '' })
  }
  for (const k of Object.keys(t.physical)) {
    const [key, q] = PHYSICAL_NAME[k] || [k, k]
    add({ field: fieldName(key, t.physical_units[k]), group: 'physical', quantity: q, unit: t.physical_units[k],
      target: t.physical[k], analogue: a.physical[k], target_source: t.physical_source[k], analogue_source: a.physical_source[k],
      note: [t.physical_notes[k], k === 'elevation' ? `target datum: ${t.elevation_datum}; Earth datum: ${a.elevation_datum}` : ''].filter(Boolean).join('. ') })
  }
  for (const k of Object.keys(t.soil.units)) {
    add({ field: fieldName(`soil_${k}`, t.soil.units[k]), group: 'soil', quantity: SOIL_NAME[k], unit: t.soil.units[k],
      target: t.soil[k], target_min: t.soil.range[k][0], target_max: t.soil.range[k][1],
      analogue: a.soil[k], analogue_min: a.soil.range[k][0], analogue_max: a.soil.range[k][1],
      target_status: t.soil.status[k], analogue_status: a.soil.status[k], target_source: t.soil.source[k], analogue_source: a.soil.source[k],
      note: k === 'kc' || k === 'kphi' || k === 'n' ? 'kc, kphi and n come from one pressure-sinkage fit: use them together'
        : k === 'K' ? 'shear stress tau = (c + p tan phi) (1 - exp(-j/K)), j = shear displacement: with c and phi gives thrust and slip' : '' })
  }
  if (new Set(rows.map(r => r.field)).size !== rows.length) throw new Error('nomi di campo ripetuti nel .mat')

  const by = f => Object.fromEntries(rows.map(r => [r.field, f(r)]))
  const d = result.dossier || {}
  const meta = {
    schema: SCHEMA, site: t.name, site_id: site.id, site_world: t.world, test: testId, place: a.name, place_country: a.site.country,
    similarity_score: a.match.score, kappa: a.match.kappa,
    units: `${UNITS_CONVENTION}. The unit is in each field name: _deg, _m, _s, _per_m2, _K, _kg_m3, _Pa, _m_s, _m_s2, _per_K, _tiu (J m^-2 K^-1 s^-0.5); no suffix = dimensionless, except soil_kc (N m^-(n+1)) and soil_kphi (N m^-(n+2))`,
    nan: 'NaN means no data, never zero',
    coordinates: COORDINATES, target_elevation_datum: t.elevation_datum, analogue_elevation_datum: a.elevation_datum,
    target_rock_class: t.rock_class_name, analogue_rock_class: a.rock_class_name,
    data_export: t.data_export, data_version: t.data_version,
    h3_cells: a.site.h3_cells, terrain_30m: terrain, known_test_site: a.site.known || 'no',
    snow_free_months: a.site.snow_free_months, best_month: a.site.best_month, low_sun_h_per_day: a.site.low_sun_hours,
    bare_ground_share: a.site.valid_share, night_lights_nW_cm2_sr: a.site.night_lights, protected_area: a.site.protected_area || 'no',
    snow_free_mask: d.snow_free_mask || '',
  }
  return { target: by(r => r.target), analogue: by(r => r.analogue), target_range: by(r => [r.target_min, r.target_max]), info: rows, meta }
}

export const packageMat = (f, t) => matFile({ target: f.target, analogue: f.analogue, target_range: f.target_range, info: asciiDeep(f.info), meta: asciiDeep(f.meta) },
  `POLENTA ${SCHEMA} ${t.site_id} ${t.test_id}`)

const mstr = s => `'${String(s).replace(/'/g, "''")}'`

export function initScript(names, f) {
  const m = f.meta
  return `% init_polenta.m - POLENTA (${SCHEMA})
% ${asciiText(m.site)} (${m.site_world}) vs ${asciiText(m.place)} (Earth), test ${m.test}. Data export ${m.data_export}.
% Run it next to ${names.mat}. It loads five variables:
%   target, analogue   one field per quantity, numbers only, same names; the unit is in the name (soil_cohesion_Pa)
%   target_range       [min max] of each target field
%   info               one row per field: unit, values, similarity, weight, state, sources, notes (a table in MATLAB)
%   meta               site, test, place, datums, rock class, field logistics
% In Simulink: Constant block value target.soil_kc, analogue.t_mean_K ...; Simulink.Bus.createObject(target) for a bus.
% NaN means no data, never zero.

here = fileparts(mfilename('fullpath'));
if isempty(here), here = pwd; end
mat = fullfile(here, ${mstr(names.mat)});
if exist(mat, 'file') ~= 2, error('POLENTA:missing', 'Missing %s next to init_polenta.m', mat); end
load(mat, 'target', 'analogue', 'target_range', 'info', 'meta');
tbl = exist('struct2table', 'file') > 0;   % MATLAB R2013b+: info becomes a table; in Octave it stays a struct array
if tbl, info = struct2table(info(:)); end

fprintf('\\nPOLENTA  %s (%s)  vs  %s (Earth)  |  test %s  |  similarity %.0f/100, data on %.0f%% of the weight\\n', ...
    meta.site, meta.site_world, meta.place, meta.test, 100 * meta.similarity_score, 100 * meta.kappa);
fprintf('%-26s %-20s %12s %25s %12s %6s  %s\\n', 'field', 'unit', 'target', '[min max]', 'analogue', 's', 'state');
f = fieldnames(target);
for i = 1:numel(f)
    k = f{i}; r = target_range.(k);
    if tbl, row = info(strcmp(info.field, k), :); u = row.unit{1}; s = row.similarity; st = row.state{1};
    else, row = info(strcmp({info.field}, k)); u = row.unit; s = row.similarity; st = row.state; end
    fprintf('%-26s %-20s %12.4g [%11.4g %11.4g] %12.4g %6.2f  %s\\n', k, u, target.(k), r(1), r(2), analogue.(k), s, st);
end
fprintf('Rock class: target %s; analogue %s\\n', meta.target_rock_class, meta.analogue_rock_class);
fprintf('Sources and notes: info (e.g. info(strcmp(info.field, ''soil_kc''), :)) and SOURCES.txt\\n\\n');
clear here mat tbl f i k r row u s st
`
}

export function readme(names, f) {
  const m = f.meta
  const rows = f.info.map(r => `  ${r.field.padEnd(26)} ${r.unit.padEnd(20)} ${r.quantity}`).join('\n')
  return asciiText(`POLENTA - MATLAB / Simulink package (${SCHEMA})
Site: ${m.site} (${m.site_world}) | Test: ${m.test} | Earth analogue: ${m.place}${m.place_country ? `, ${m.place_country}` : ''}
Data export: ${m.data_export}

FILES
  ${names.mat}   all the data (five variables, below)
  init_polenta.m   loads the file, turns info into a table and prints the comparison
  README.txt       this file
  SOURCES.txt      the source of every number

QUICK START
  Unzip, open MATLAB in this folder, run init_polenta. Then:
    target.slope_p90_deg            a number (the centre of the target range)
    target_range.slope_p90_deg      [min max]
    analogue.slope_p90_deg          the value at the place on Earth
    info                            one row per field: unit, values, similarity, weight, state, sources, notes
  In Simulink use target and analogue directly: they hold numbers only, one level deep.
    Constant block value: target.soil_kc, analogue.t_mean_K, target.gravity_m_s2
    Bus: Simulink.Bus.createObject(target)

VARIABLES
  target         one field per quantity of the ${m.site_world} site. Numbers only.
  analogue       the same fields for the place on Earth. Numbers only.
  target_range   [min max] of each target field (literature uncertainty, computed tolerance or median: see info.range_type).
  info           one row per field (struct array; a table after init_polenta): field, group (location, matched, physical,
                 soil), quantity, unit, target, target_min, target_max, analogue, analogue_min, analogue_max, weight and
                 similarity (0-1, matched parameters only), state (holds, partial, breaks), target_status and
                 analogue_status, range_type, target_source, analogue_source, note.
  meta           text and field logistics: site, test, place, similarity score, kappa (share of the weight with data),
                 elevation datums, rock classes, H3 cells, terrain source, snow-free months, best month, low-angle Sun
                 hours, bare-ground share, night lights, protected area.

UNITS
  ${UNITS_CONVENTION}. The unit is in the field name:
  _deg degrees, _m metres, _s seconds, _per_m2 per square metre, _K kelvin, _kg_m3 kg m^-3, _Pa pascal, _m_s m s^-1, _m_s2 m s^-2,
  _per_K K^-1, _tiu thermal inertia units (J m^-2 K^-1 s^-0.5). No suffix: dimensionless (fractions 0-1), except
  soil_kc in N m^-(n+1) and soil_kphi in N m^-(n+2), whose units depend on the sinkage exponent soil_n.

NaN
  NaN means no data. It is never a zero. Check isnan() before using a value.

FIELDS
${rows}

NOTES
  - Matched parameters are those of the chosen test; rock_cover and grain_proxy are matching indices (see info.note):
    for physics use boulder_cover and thermal_inertia_tiu.
  - Earth soil (soil_*) is estimated from the soil texture class, not measured: for design values measure on site
    (bevameter, shear test) and replace them.
  - Elevations of different bodies use different datums (meta) and cannot be compared.
  - Earth values are means over the H3 cells of the place (resolution 5, about 253 km^2 each; meta.h3_cells).
`)
}

export function sourcesText(f) {
  const m = f.meta
  const by = g => f.info.filter(r => r.group === g).map(r => `  ${r.field}\n    ${m.site}: ${r.target_source || '-'}\n    Earth: ${r.analogue_source || '-'}`).join('\n')
  return asciiText([
    `POLENTA - sources (${SCHEMA}). Site: ${m.site}; Earth analogue: ${m.place}`,
    'Full references with all sites: data/config/siti_e_pesi.csv and data/config/soil_mechanics.csv in the POLENTA repository.',
    '', 'LOCATION AND BODY', by('location'), '', 'MATCHED PARAMETERS', by('matched'), '', 'PHYSICAL QUANTITIES', by('physical'),
    '', 'SOIL MECHANICS', by('soil'), '',
  ].join('\n'))
}

// il pacchetto completo: un .zip con quattro file in una cartella. target e analogue (modello interno) servono anche al report
export function buildPackage(site, testId, result, displayName, ctx) {
  const names = fileNames(site, testId, displayName)
  const t = buildTarget(site, testId, result, ctx)
  const a = buildAnalogue(site, testId, result, displayName, ctx)
  const flat = flatten(site, testId, result, t, a, ctx)
  const files = [
    { name: names.mat, data: packageMat(flat, t) },
    { name: names.init, data: initScript(names, flat) },
    { name: names.readme, data: readme(names, flat) },
    { name: names.sources, data: sourcesText(flat) },
  ]
  return { names, target: t, analogue: a, flat, files, zip: zipFiles(files.map(f => ({ name: `${names.folder}/${f.name}`, data: f.data }))) }
}

// scarica bytes o testo come file
export function download(name, data, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

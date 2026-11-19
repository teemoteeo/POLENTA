// Export MATLAB / Simulink della card di un posto: un unico generatore, nel browser, dagli stessi dati che la card mostra.
// Così il file corrisponde sempre al posto che si sta guardando, anche in Unexplored e Near you (dove l'indice in classifica cambia).
//
// Un pacchetto .zip per sito × test × posto (cartella polenta_<sito>__<test>__<posto>/):
//   polenta_<sito>__<test>__target.mat     variabili polenta_target   e polenta_target_num   (Luna o Marte)
//   polenta_<sito>__<test>__<posto>.mat    variabili polenta_analogue e polenta_analogue_num (esagono sulla Terra)
//   init_polenta.m                         carica i due file e stampa il confronto, con le unità
//   README.txt                             campi, unità, significato di NaN e degli intervalli, uso in Simulink
//   SOURCES.txt                            fonte di ogni numero (pagina e tabella dove le abbiamo verificate)
//
// Unità (schema polenta-simulink-2): tutto in SI, angoli in gradi; frazioni adimensionali 0-1 con unità '1'.
// Ogni gruppo di numeri ha accanto la struct delle unità (units, soil.units, physical_units, site_units).
// polenta_*_num è la stessa struct con i soli numeri: si può passare direttamente a Simulink (Constant, bus).
// Target e analogue hanno lo stesso schema, campo per campo; solo l'analogue ha in più match e site.

import { matFile } from './matfile.js'
import { zipFiles } from './zip.js'

export const SCHEMA = 'polenta-simulink-2'
export const UNITS_CONVENTION = 'SI units; angles in degrees; dimensionless fractions 0-1 have unit 1'

// corpo celeste: gravità superficiale, raggio medio, riferimento delle quote
export const BODY = {
  moon: { gravity: 1.62, radius: 1737400, datum: 'LOLA reference sphere of radius 1737.4 km',
    source: 'NASA NSSDCA Moon Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html): surface gravity 1.62 m/s^2, volumetric mean radius 1737.4 km' },
  mars: { gravity: 3.71, radius: 3389500, datum: 'MGS MOLA areoid',
    source: 'NASA NSSDCA Mars Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html): surface gravity 3.71 m/s^2, volumetric mean radius 3389.5 km' },
  earth: { gravity: 9.80665, radius: 6371000, datum: 'EGM96 geoid (about mean sea level): NASADEM below 60 N, JAXA AW3D30 above',
    source: 'standard gravity 9.80665 m/s^2 (3rd CGPM, 1901); volumetric mean radius 6371.0 km, NASA NSSDCA Earth Fact Sheet' },
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
  elevation: 'height above the body datum (see elevation_datum): Moon, Mars and Earth heights are not comparable',
}

// Bekker-Wong: campo → [parametro in soil_mechanics.csv, unità nel CSV, unità SI, fattore]
const SOIL = {
  cohesion: ['cohesion_kPa', 'kPa', 'Pa', 1000],
  friction_angle: ['friction_angle_deg', 'deg', 'deg', 1],
  kc: ['kc', 'kN/m^(n+1)', 'N m^-(n+1)', 1000],
  kphi: ['kphi', 'kN/m^(n+2)', 'N m^-(n+2)', 1000],
  n: ['n', '-', '1', 1],
}
export const SOIL_CSV_UNITS = Object.fromEntries(Object.values(SOIL).map(([k, u]) => [k, u]))
const CATEGORICAL = new Set(['rock_class'])

const COMPARISON_ONLY = {
  grain_proxy: 'index for percentile matching only (target and Earth use different instruments): use physical.thermal_inertia',
  rock_cover: 'target: boulder abundance (Diviner / HiRISE); Earth: coarse fragments in the top 5 cm of soil (SoilGrids cfvo). Not the same quantity',
}

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
    if (t) { rows = { earth: t }; order = ['earth'] }
    else if (cls) none = `not measured: ${basis} has no measured reference soil in Wong (2010); measure on site (bevameter, shear vane)`
  }
  const pick = k => order.map(o => rows[o]).find(s => s && k in s.value)
  const by = f => map(SOIL, ([k, , , m], name) => f(pick(k), k, m, name))
  return {
    ...by((s, k, m) => (s ? round(num(s.value[k]) * m) : NaN)),
    range: by((s, k, m) => (s ? s.range[k].map(x => round(num(x) * m)) : [NaN, NaN])),
    units: map(SOIL, ([, , u]) => u),
    source: by((s, k) => (s ? (world === 'earth' ? `${basis} -> ${s.source[k]} ${EARTH_SOIL_NOTE}` : s.source[k]) : none)),
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
  return {
    schema: SCHEMA, role, site_id: site.id, test_id: testId, name, world,
    lat_deg: round(num(lat)), lon_deg: round(num(lon)), coordinates: COORDINATES,
    gravity_m_s2: body.gravity, body_radius_m: body.radius, body_source: body.source,
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
    notes: Object.fromEntries(params.filter(p => COMPARISON_ONLY[p]).map(p => [field(p), COMPARISON_ONLY[p]])),
  }
}

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
  const base = `polenta_${site.id}__${testId}`
  return { target: `${base}__target.mat`, analogue: `${base}__${slug(displayName)}.mat`, init: 'init_polenta.m',
    readme: 'README.txt', sources: 'SOURCES.txt', zip: `${base}__${slug(displayName)}.zip`, folder: `${base}__${slug(displayName)}` }
}

// Testo dei .mat solo ASCII: MATLAB legge l'UTF-16, ma Octave, scipy e le console Windows non sempre (Martínez → Mart?nez).
const ASCII = { '±': '+/-', '°': ' deg', '§': 'sec. ', '→': '->', '–': '-', '—': '-', '’': "'", '‘': "'", '“': '"', '”': '"', '×': 'x',
  '²': '^2', '³': '^3', '⁻': '^-', '¹': '1', '½': '1/2', 'µ': 'u', 'Δ': 'delta ' }
export const asciiText = s => s.replace(/[^\x00-\x7f]/g, c => ASCII[c] ?? c.normalize('NFKD').replace(/[^\x00-\x7f]/g, '') ?? '')
const asciiDeep = x => (typeof x === 'string' ? asciiText(x) : Array.isArray(x) ? x : x && typeof x === 'object' ? map(x, asciiDeep) : x)

export const targetMat = t => matFile({ polenta_target: asciiDeep(t), polenta_target_num: numericOnly(t) }, `POLENTA ${SCHEMA} target ${t.site_id} ${t.test_id}`)
export const analogueMat = a => matFile({ polenta_analogue: asciiDeep(a), polenta_analogue_num: numericOnly(a) }, `POLENTA ${SCHEMA} analogue ${a.site_id} ${a.test_id}`)

const mstr = s => `'${String(s).replace(/'/g, "''")}'`

export function initScript(names, target, analogue) {
  return `% init_polenta.m - generated by POLENTA (${SCHEMA})
% Site: ${target.name} (${target.world}) | Test: ${target.test_id} | Earth analogue: ${analogue.name}
% Data export: ${target.data_export}
% Units: ${UNITS_CONVENTION}. Every group of numbers has its units next to it (units, soil.units, physical_units).
% NaN means no data: check it before using a value. Field list and meaning: README.txt. Sources: SOURCES.txt.
% Put this script next to the two .mat files and run it.

target_file   = ${mstr(names.target)};
analogue_file = ${mstr(names.analogue)};
here = fileparts(mfilename('fullpath'));
if isempty(here), here = pwd; end
if exist(fullfile(here, target_file), 'file') ~= 2,   error('POLENTA:missing', 'Missing %s next to init_polenta.m', target_file);   end
if exist(fullfile(here, analogue_file), 'file') ~= 2, error('POLENTA:missing', 'Missing %s next to init_polenta.m', analogue_file); end
load(fullfile(here, target_file),   'polenta_target',   'polenta_target_num');
load(fullfile(here, analogue_file), 'polenta_analogue', 'polenta_analogue_num');
if ~strcmp(polenta_target.schema, polenta_analogue.schema) || ~strcmp(polenta_target.test_id, polenta_analogue.test_id)
    error('POLENTA:mismatch', 'Target and analogue come from different exports or tests.');
end

fprintf('\\nPOLENTA  %s (%s, g = %.4g m/s^2)  vs  %s (Earth, g = %.6g m/s^2)\\n', polenta_target.name, polenta_target.world, ...
    polenta_target.gravity_m_s2, polenta_analogue.name, polenta_analogue.gravity_m_s2);
fprintf('Similarity %.0f/100, data on %.0f%% of the weight. Units: %s\\n\\n', 100 * polenta_analogue.match.score, ...
    100 * polenta_analogue.match.kappa, polenta_target.units_convention);

fprintf('Matched parameters\\n%-16s %-9s %25s %12s %6s  %s\\n', 'parameter', 'unit', 'target [min max]', 'analogue', 's', 'state');
p = fieldnames(polenta_target.values);
for i = 1:numel(p)
    k = p{i};
    r = polenta_target.range.(k);
    fprintf('%-16s %-9s [%11.4g %11.4g] %12.4g %6.2f  %s\\n', k, polenta_target.units.(k), r(1), r(2), ...
        polenta_analogue.values.(k), polenta_analogue.match.s.(k), polenta_analogue.match.state.(k));
end
if isfield(polenta_analogue.match.s, 'rock_class')
    fprintf('%-16s %-9s %25s   %s (s = %.2f, %s)\\n', 'rock_class', '-', polenta_target.rock_class_name, polenta_analogue.rock_class_name, ...
        polenta_analogue.match.s.rock_class, polenta_analogue.match.state.rock_class);
end

fprintf('\\nBekker-Wong soil\\n  %-15s %-11s %27s %27s\\n', 'parameter', 'unit', 'target  value [min max]', 'analogue  value [min max]');
b = fieldnames(polenta_target.soil.units);
for i = 1:numel(b)
    k = b{i};
    r = polenta_target.soil.range.(k); ra = polenta_analogue.soil.range.(k);
    fprintf('  %-15s %-11s %9.4g [%7.4g %7.4g] %9.4g [%7.4g %7.4g]\\n', k, polenta_target.soil.units.(k), polenta_target.soil.(k), r(1), r(2), ...
        polenta_analogue.soil.(k), ra(1), ra(2));
end
fprintf('  status: target %s; analogue %s\\n', polenta_target.soil.status.kc, polenta_analogue.soil.status.kc);

fprintf('\\nPhysical quantities\\n%-18s %-20s %12s %12s\\n', 'quantity', 'unit', 'target', 'analogue');
q = fieldnames(polenta_target.physical);
for i = 1:numel(q)
    k = q{i};
    fprintf('%-18s %-20s %12.4g %12.4g\\n', k, polenta_target.physical_units.(k), polenta_target.physical.(k), polenta_analogue.physical.(k));
end
fprintf('Elevation datum: target %s; analogue %s\\n', polenta_target.elevation_datum, polenta_analogue.elevation_datum);
n = fieldnames(polenta_target.notes);
for i = 1:numel(n), fprintf('Note on %s: %s\\n', n{i}, polenta_target.notes.(n{i})); end
fprintf('\\n');
clear target_file analogue_file here p b q n i k r   % only the four polenta_* variables stay in the workspace

% In Simulink, numbers only (no text fields), same names and units as above:
%   Constant block value: polenta_target_num.soil.kphi, polenta_target_num.gravity_m_s2, polenta_analogue_num.physical.t_mean ...
%   Bus: Simulink.Bus.createObject(polenta_target_num) creates a bus object from the struct.
`
}

// README del pacchetto: campi, unità e significato, generati dalle struct vere (così non possono andare fuori sincrono)
export function readme(names, t, a) {
  const pad = (s, n) => String(s).padEnd(n)
  const rows = (keys, unit, note = () => '') => keys.map(k => `  ${pad(k, 20)} ${pad(unit(k), 20)} ${note(k)}`.trimEnd()).join('\n')
  return `POLENTA - MATLAB / Simulink package (${SCHEMA})
Site: ${t.name} (${t.world}) | Test: ${t.test_id} | Earth analogue: ${a.name} (${a.lat_deg}, ${a.lon_deg})
Data export: ${t.data_export}

FILES
  ${names.target}   variables polenta_target, polenta_target_num (the site on the ${t.world})
  ${names.analogue}   variables polenta_analogue, polenta_analogue_num (the place on Earth)
  init_polenta.m   loads both files and prints the comparison with units
  README.txt       this file
  SOURCES.txt      the source of every number

QUICK START
  1. Unzip, open MATLAB in this folder, run init_polenta.
  2. Use polenta_target / polenta_analogue to read values with their units, sources and notes.
  3. In Simulink use polenta_target_num / polenta_analogue_num: same structure, numbers only
     (Constant block value e.g. polenta_target_num.soil.kphi; Simulink.Bus.createObject for a bus).

UNITS
  ${UNITS_CONVENTION}.
  Every number has its unit in the struct next to it: units.<p>, soil.units.<p>, physical_units.<p>, site_units.<p>.
  Temperatures are in kelvin. Densities in kg m^-3. Cohesion in Pa. Bekker-Wong kc and kphi in N m^-(n+1) and N m^-(n+2),
  where n is the sinkage exponent: their units depend on n, use the three together.

NaN
  NaN means no data. It is never a zero. Check isnan() before using a value.

STRUCT FIELDS (same in target and analogue)
  schema, role, site_id, test_id, name, world
  lat_deg, lon_deg       ${t.coordinates}
  gravity_m_s2           surface gravity (m s^-2), body_radius_m mean radius (m), body_source their source
  values.<p>             value of each matched parameter (target: centre of range; analogue: measured value)
  range.<p>              [min max] (analogue: [v v])
  units.<p>              unit of values and range
  range_type.<p>         what the range means (literature uncertainty, computed tolerance, median ...)
  source.<p>             where the number comes from (full list in SOURCES.txt)
  notes.<p>              warnings: parameters that are only matching indices, not physical quantities
  rock_class, rock_class_name   lithology (target) or GLiM class (Earth)
  soil                   Bekker-Wong parameters: value, soil.range, soil.units, soil.source, soil.status
                         status: measured | inferred (model fit to rover data) | literature | literature [NV] (not yet
                         checked against the source) | estimated (texture class, Earth only) | not measured
  physical.<q>           physical quantities for models, physical_units, physical_source, physical_notes
  elevation_datum        reference surface of physical.elevation (differs between bodies)

  analogue only:
  match                  score (0-1), kappa (share of the weight with data), s.<p> per-parameter similarity,
                         state.<p>, weight.<p>
  site                   field logistics (country, H3 cells, snow-free months, ...), units in site_units

MATCHED PARAMETERS (${t.test_id})
${rows(Object.keys(t.values), k => t.units[k], k => t.range_type[k])}

BEKKER-WONG SOIL (target)
${rows(Object.keys(t.soil.units), k => t.soil.units[k], k => `${t.soil[k]} [${t.soil.range[k].join(' ')}] ${t.soil.status[k]}`)}

BEKKER-WONG SOIL (analogue)
${rows(Object.keys(a.soil.units), k => a.soil.units[k], k => `${a.soil[k]} [${a.soil.range[k].join(' ')}] ${a.soil.status[k]}`)}
  Earth values are estimated from the soil texture class (sand and clay from SoilGrids, USDA triangle) using the bevameter
  and shear tests of Wong (2010) on moist soils: see SOURCES.txt. NaN when the texture is missing or no reference soil exists.

PHYSICAL QUANTITIES
${rows(Object.keys(t.physical), k => t.physical_units[k], k => t.physical_notes[k])}

LIMITS
  - The Earth analogue Bekker-Wong parameters are estimates by soil texture class, not measurements: for more precision measure\n    on site (bevameter, shear test) and replace them with your own dataset. kc and kphi depend strongly on moisture.
  - Parameters listed in notes are matching indices: target and Earth are measured with different instruments.
  - Elevations of different bodies use different datums and cannot be compared.
  - Earth values are means over the H3 cells of the place (resolution 5, about 253 km^2 each; list in site.h3_cells)
    or over the pixels of the stated product.
`
}

// SOURCES.txt: tutte le fonti del pacchetto, raggruppate
export function sourcesText(t, a) {
  const block = (title, o) => `${title}\n` + Object.entries(o).map(([k, s]) => `  ${k}: ${s || 'missing'}`).join('\n')
  const earthPhys = Object.fromEntries(Object.entries(a.physical_source).filter(([, s]) => s && !s.startsWith('not measured')))
  return [
    `POLENTA - sources (${SCHEMA}). Site: ${t.name}; Earth analogue: ${a.name}`,
    'Full references with all sites: data/config/siti_e_pesi.csv and data/config/soil_mechanics.csv in the POLENTA repository.',
    '',
    block('BODY CONSTANTS', { [t.world]: t.body_source, earth: a.body_source }),
    '',
    block(`MATCHED PARAMETERS - ${t.name}`, t.source),
    '',
    block(`BEKKER-WONG SOIL - ${t.name}`, map(t.soil.source, (s, k) => `[${t.soil.status[k]}] ${s}`)),
    '',
    block(`PHYSICAL QUANTITIES - ${t.name}`, t.physical_source),
    '',
    block(`PHYSICAL QUANTITIES - ${a.name} (Earth)`, earthPhys),
    '',
    block(`BEKKER-WONG SOIL - ${a.name} (Earth)`, map(a.soil.source, (s, k) => `[${a.soil.status[k]}] ${s}`)),
    '',
    block('EARTH MATCHED PARAMETERS', { all: 'POLENTA pipeline on Google Earth Engine: per-parameter products and methods in the repository README and data/config/params.csv' }),
    '',
  ].join('\n')
}

// il pacchetto completo: un .zip con i cinque file in una cartella
export function buildPackage(site, testId, result, displayName, ctx) {
  const names = fileNames(site, testId, displayName)
  const t = buildTarget(site, testId, result, ctx)
  const a = buildAnalogue(site, testId, result, displayName, ctx)
  const files = [
    { name: names.target, data: targetMat(t) },
    { name: names.analogue, data: analogueMat(a) },
    { name: names.init, data: initScript(names, t, a) },
    { name: names.readme, data: readme(names, t, a) },
    { name: names.sources, data: sourcesText(t, a) },
  ]
  return { names, target: t, analogue: a, files, zip: zipFiles(files.map(f => ({ name: `${names.folder}/${f.name}`, data: f.data }))) }
}

// scarica bytes o testo come file
export function download(name, data, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

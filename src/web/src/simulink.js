// Export MATLAB / Simulink della card di un posto: un unico generatore, nel browser, dagli stessi dati che la card mostra.
// Così il file corrisponde sempre al posto che si sta guardando, anche in Unexplored e Near you (dove l'indice in classifica cambia).
//
// Tre file per sito × test × posto:
//   polenta_<sito>__<test>__target.mat     variabile `polenta_target`   (corpo celeste: Luna o Marte)
//   polenta_<sito>__<test>__<posto>.mat    variabile `polenta_analogue` (esagono sulla Terra)
//   init_polenta.m                         carica i due file sopra (nomi esatti) e stampa il confronto
//
// Le due struct hanno lo stesso schema (SCHEMA), così si confrontano campo per campo:
//   schema, role, site_id, test_id, name, world, lat_deg, lon_deg, gravity_m_s2, data_export
//   values.<param>  valore unico (per il target: centro dell'intervallo di letteratura/LOLA)
//   range.<param>   [min max] (per il posto sulla Terra: [v v])
//   units.<param>   unità di params.csv
//   rock_class      classe di roccia (target: litologia; Terra: codice GLiM), rock_class_name il nome leggibile
//   soil            Bekker-Wong da data/config/soil_mechanics.csv: c, phi, kc, kphi, n + source.<k> e status (Terra: NaN, non misurato)
//   physical        grandezze fisiche in unità SI o note (PHYSICAL), da usare nei modelli; target: card di targets.json,
//                   Terra: solo il vento (dossier), il resto NaN. physical_units e physical_source accanto.
//   notes.<param>   avviso per i parametri che sono solo indici di confronto (COMPARISON_ONLY): non usarli come grandezze fisiche
// Solo `polenta_analogue` ha in più `match` (punteggi della card) e `site` (dossier di campo).
// I parametri sono quelli del test (pesi > 0 in tests.yaml): gli stessi righi della card, nello stesso ordine.

import { matFile } from './matfile.js'

export const SCHEMA = 'polenta-simulink-1'
const GRAVITY = { moon: 1.62, mars: 3.71, earth: 9.81 } // m/s²
const SOIL_KEYS = ['cohesion_kPa', 'friction_angle_deg', 'kc', 'kphi', 'n']
const CATEGORICAL = new Set(['rock_class'])

// campo → [chiave nella card di targets.json, unità, chiave in targets.json sources]
const PHYSICAL = {
  thermal_inertia_si: ['thermal_inertia_si', 'J m^-2 K^-1 s^-1/2', 'grain_proxy'],
  rock_cover_pct: ['rock_cover_pct', '%', 'rock_cover'],
  subsurface_ice_wt_pct: ['subsurface_ice_wt_pct', 'wt%', 'subsurface_ice'], // solo informativo: il voto usa permafrost_share
  t_mean_c: ['t_mean_c', 'degC', 'temperature'],
  t_range_c: ['t_range_c', 'degC', 'temperature'],
  bulk_density_0_2m: ['density_profile_0_2m', 'g/cm3', 'density_profile_0_2m'],
  feo_wt_pct: ['feo_wt_pct', 'wt%', 'rock_class'],
  elevation_m: ['elevation', 'm', 'elevation'],
  air_density_kg_m3: ['air_density_kgm3', 'kg/m3', 'atmosphere_wind'],
  wind_m_s: ['wind_ms', 'm/s', 'atmosphere_wind'],
}
const COMPARISON_ONLY = {
  grain_proxy: 'index for percentile matching only (target and Earth use different instruments and units); use physical.thermal_inertia_si',
  rock_cover: 'target: boulder abundance (Diviner / HiRISE); Earth: coarse fragments in the top 5 cm of soil (SoilGrids cfvo). Not the same quantity',
}

// params.csv → { param: unità }. Solo le prime tre colonne: le successive sono testo libero.
export function parseUnits(csv) {
  return Object.fromEntries(csv.trim().split('\n').slice(1).map(l => l.split(',')).map(c => [c[0], c[2]]))
}

// soil_mechanics.csv → { world: { cohesion_kPa, ..., source: { param: fonte }, status } }
export function parseSoil(csv) {
  const out = {}
  for (const l of csv.trim().split('\n').slice(1)) {
    const [world, param, value, , source, status] = l.split(',')
    const w = (out[world] ??= { source: {}, status: [] })
    w[param] = value === '' ? NaN : Number(value)
    w.source[param] = source
    if (!w.status.includes(status)) w.status.push(status)
  }
  for (const w of Object.values(out)) w.status = w.status.join(' ')
  return out
}

const num = x => (typeof x === 'number' && Number.isFinite(x) ? x : NaN)
const asRange = x => (Array.isArray(x) ? [num(x[0]), num(x[1])] : [num(x), num(x)])
const mid = ([a, b]) => (a + b) / 2
const field = p => p.replace(/[^A-Za-z0-9_]/g, '_')

export const slug = s => s.normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'place'

function soilFor(world, soil) {
  const s = soil[world]
  const none = 'not measured: no Bekker-Wong data for Earth hexagons, measure on site (bevameter, shear vane)'
  if (!s) return { ...Object.fromEntries(SOIL_KEYS.map(k => [k, NaN])), source: Object.fromEntries(SOIL_KEYS.map(k => [k, none])), status: 'missing' }
  return { ...Object.fromEntries(SOIL_KEYS.map(k => [k, num(s[k])])), source: Object.fromEntries(SOIL_KEYS.map(k => [k, s.source[k] || ''])), status: s.status }
}

function core({ role, site, testId, name, world, lat, lon, params, raw, units, soil, exportedAt, rockName = c => c, physical = {}, physicalSource = {} }) {
  const numeric = params.filter(p => !CATEGORICAL.has(p))
  const ranges = Object.fromEntries(numeric.map(p => [field(p), asRange(raw[p])]))
  return {
    schema: SCHEMA, role, site_id: site.id, test_id: testId, name, world,
    lat_deg: num(lat), lon_deg: num(lon), gravity_m_s2: GRAVITY[world] ?? NaN, data_export: exportedAt || '',
    values: Object.fromEntries(Object.entries(ranges).map(([k, r]) => [k, mid(r)])),
    range: ranges,
    units: Object.fromEntries(numeric.map(p => [field(p), units[p] || ''])),
    rock_class: typeof raw.rock_class === 'string' ? raw.rock_class : '',
    rock_class_name: typeof raw.rock_class === 'string' ? rockName(raw.rock_class) : '',
    soil: soilFor(world, soil),
    physical: Object.fromEntries(Object.entries(PHYSICAL).map(([k, [c]]) => [k, num(physical[c])])),
    physical_units: Object.fromEntries(Object.entries(PHYSICAL).map(([k, [, u]]) => [k, u])),
    physical_source: Object.fromEntries(Object.entries(PHYSICAL).map(([k, [, , src]]) => [k, physicalSource[src] || ''])),
    notes: Object.fromEntries(params.filter(p => COMPARISON_ONLY[p]).map(p => [field(p), COMPARISON_ONLY[p]])),
  }
}

// result: un posto della card (data.results[i], con plan); site: SITES[i]; ctx: { units, soil, exportedAt }
export function buildTarget(site, testId, result, ctx) {
  const params = result.plan.rows.map(r => r.p)
  const t = ctx.targets?.[site.id] || {}
  return core({ role: 'target', site, testId, name: site.name, world: site.world, lat: site.lat, lon: site.lon, params, raw: result.target || {}, ...ctx, physical: t.card || {}, physicalSource: t.sources || {} })
}

export function buildAnalogue(site, testId, result, displayName, ctx) {
  const params = result.plan.rows.map(r => r.p)
  const d = result.dossier || {}
  return {
    ...core({ role: 'analogue', site, testId, name: displayName, world: 'earth', lat: result.lat, lon: result.lon, params, raw: result.values || {}, ...ctx,
      physical: { wind_ms: d.wind_10m }, physicalSource: { atmosphere_wind: 'MERRA-2 wind at 10 m (pipeline dossier)' } }),
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
      low_sun_hours: num(d.low_sun_hours), wind_10m_m_s: num(d.wind_10m), night_lights: num(d.night_lights),
      protected_area: d.protected_area ? (d.protected_area_name || 'yes') : '',
    },
  }
}

export const fileNames = (site, testId, displayName) => ({
  target: `polenta_${site.id}__${testId}__target.mat`,
  analogue: `polenta_${site.id}__${testId}__${slug(displayName)}.mat`,
  init: 'init_polenta.m',
})

export const targetMat = t => matFile({ polenta_target: t }, `POLENTA ${SCHEMA} target ${t.site_id} ${t.test_id}`)
export const analogueMat = a => matFile({ polenta_analogue: a }, `POLENTA ${SCHEMA} analogue ${a.site_id} ${a.test_id}`)

const mstr = s => `'${String(s).replace(/'/g, "''")}'`

export function initScript(names, target, analogue) {
  return `% init_polenta.m - generated by POLENTA (${SCHEMA})
% Site: ${target.name} (${target.world}) | Test: ${target.test_id} | Earth analogue: ${analogue.name}
% Data export: ${target.data_export}
% Put this script next to the two .mat files and run it.

target_file   = ${mstr(names.target)};
analogue_file = ${mstr(names.analogue)};
here = fileparts(mfilename('fullpath'));
if isempty(here), here = pwd; end
if exist(fullfile(here, target_file), 'file') ~= 2,   error('POLENTA:missing', 'Missing %s next to init_polenta.m', target_file);   end
if exist(fullfile(here, analogue_file), 'file') ~= 2, error('POLENTA:missing', 'Missing %s next to init_polenta.m', analogue_file); end
load(fullfile(here, target_file),   'polenta_target');
load(fullfile(here, analogue_file), 'polenta_analogue');
if ~strcmp(polenta_target.schema, polenta_analogue.schema) || ~strcmp(polenta_target.test_id, polenta_analogue.test_id)
    error('POLENTA:mismatch', 'Target and analogue come from different exports or tests.');
end

fprintf('\\nPOLENTA  %s (%s, g = %.2f m/s^2)  vs  %s (Earth)\\n', polenta_target.name, polenta_target.world, polenta_target.gravity_m_s2, polenta_analogue.name);
fprintf('Similarity %.0f/100, data on %.0f%% of the weight\\n\\n', 100 * polenta_analogue.match.score, 100 * polenta_analogue.match.kappa);
fprintf('%-18s %-12s %21s %12s %6s  %s\\n', 'parameter', 'unit', 'target [min max]', 'analogue', 's', 'state');
p = fieldnames(polenta_target.values);
for i = 1:numel(p)
    k = p{i};
    r = polenta_target.range.(k);
    fprintf('%-18s %-12s [%9.4g %9.4g] %12.4g %6.2f  %s\\n', k, polenta_target.units.(k), r(1), r(2), ...
        polenta_analogue.values.(k), polenta_analogue.match.s.(k), polenta_analogue.match.state.(k));
end
if isfield(polenta_analogue.match.s, 'rock_class')
    fprintf('%-18s %-12s %21s   %s (s = %.2f, %s)\\n', 'rock_class', '-', polenta_target.rock_class_name, polenta_analogue.rock_class_name, ...
        polenta_analogue.match.s.rock_class, polenta_analogue.match.state.rock_class);
end
fprintf('\\nBekker-Wong (target): c = %g kPa, phi = %g deg, kc = %g, kphi = %g, n = %g  [%s]\\n', ...
    polenta_target.soil.cohesion_kPa, polenta_target.soil.friction_angle_deg, polenta_target.soil.kc, ...
    polenta_target.soil.kphi, polenta_target.soil.n, polenta_target.soil.status);
fprintf('Bekker-Wong (analogue): %s\\n\\n', polenta_analogue.soil.source.kc);

fprintf('Target physical: thermal inertia %g SI, rocks %g %%, ice %g wt%%, T mean %g degC (range %g), density 0-2 m %g g/cm3\\n', ...
    polenta_target.physical.thermal_inertia_si, polenta_target.physical.rock_cover_pct, polenta_target.physical.subsurface_ice_wt_pct, ...
    polenta_target.physical.t_mean_c, polenta_target.physical.t_range_c, polenta_target.physical.bulk_density_0_2m);
n = fieldnames(polenta_target.notes);
for i = 1:numel(n), fprintf('Note on %s: %s\\n', n{i}, polenta_target.notes.(n{i})); end
fprintf('\\n');

% In Simulink: Constant block = polenta_target.values.<param>, polenta_target.gravity_m_s2, polenta_target.soil.kphi ...
% NaN means no data: check it before using a value.
`
}

// scarica bytes o testo come file
export function download(name, data, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

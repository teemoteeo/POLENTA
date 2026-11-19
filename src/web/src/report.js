// Report dei dati di un posto (TODO [11]): il sito scelto (Luna o Marte) e il suo analogo sulla Terra, in un documento
// HTML essenziale (cifre chiave, 5 tabelle, note, bibliografia numerata), da leggere nel browser o stampare in PDF.
// Niente commit né metodo (decisione di Rocco, 19/11). Gli stessi numeri del pacchetto Simulink (buildTarget / buildAnalogue): SI, angoli in gradi.
import { buildTarget, buildAnalogue, sourceFor, UNITS_CONVENTION, slug } from './simulink.js'

const STATE = { holds: 'holds', partial: 'partial', breaks: 'breaks', nodata: 'no data' }
const TERRAIN = new Set(['slope_p90', 'slope_trav_p90', 'trav_share', 'roughness', 'crater_density'])
const WORLD = { moon: 'Moon', mars: 'Mars', earth: 'Earth' }
const PHYS_NAME = {
  thermal_inertia: 'Thermal inertia', rock_cover: 'Rock (boulder) cover', subsurface_ice: 'Subsurface water ice',
  t_mean: 'Mean surface temperature', t_half_range: 'Surface temperature half range', bulk_density_0_2m: 'Bulk density, 0-2 m',
  feo: 'FeO', elevation: 'Elevation', air_density: 'Air density', wind: 'Wind speed', porosity_0_2m: 'Porosity, 0-2 m (derived)', pressure: 'Surface pressure (daily mean)',
}
const SOIL_NAME = { cohesion: ['Cohesion', '<i>c</i>'], friction_angle: ['Internal friction angle', 'φ'], kc: ['Cohesive modulus', '<i>k</i><sub>c</sub>'],
  kphi: ['Frictional modulus', '<i>k</i><sub>φ</sub>'], n: ['Sinkage exponent', '<i>n</i>'], K: ['Shear deformation modulus', '<i>K</i>'],
  grain_density: ['Grain density', 'ρ<sub>s</sub>'], d50: ['Median grain size', '<i>D</i><sub>50</sub>'],
  Kw: ['Shear displacement at peak (loams)', '<i>K</i><sub>w</sub>'], Kr: ['Residual / peak shear ratio (loams)', '<i>K</i><sub>r</sub>'] }

export const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
// unità SI scritte come nel pacchetto ('kg m^-3', 'N m^-(n+1)') → con apici; '1' (adimensionale) → trattino
export const unit = u => (u === '1' ? '–' : esc(u).replace(/\^(-?\([^)]*\)|-?[\w.]+)/g, (_, e) => `<sup>${e.replace(/^\((.*)\)$/, '$1').replace(/^-/, '−')}</sup>`))
// numeri: 4 cifre significative; molto piccoli o grandi in notazione scientifica; NaN → n/a
export function fmt(x) {
  if (typeof x !== 'number' || !Number.isFinite(x)) return '<span class="na">n/a</span>'
  if (x === 0) return '0'
  const a = Math.abs(x)
  if (a < 1e-3 || a >= 1e6) {
    const e = Math.floor(Math.log10(a)), m = Number((x / 10 ** e).toPrecision(3))
    return `${String(m).replace(/^-/, '−')} × 10<sup>${e < 0 ? '−' + -e : e}</sup>`
  }
  return String(Number(x.toPrecision(4))).replace(/^-/, '−')
}
const range = ([lo, hi]) => (Number.isFinite(lo) && Number.isFinite(hi) && lo !== hi ? `${fmt(lo)} – ${fmt(hi)}` : fmt(lo))
const latlon = (lat, lon) => `${fmt(Math.abs(lat))}° ${lat < 0 ? 'S' : 'N'}, ${fmt(Math.abs(lon))}° ${lon < 0 ? 'W' : 'E'}`
const doi = s => esc(s).replace(/DOI:\s*(10\.\d{4,9}\/[^\s;,)]+)/gi, (_, d) => `<a href="https://doi.org/${d}">doi:${d}</a>`)

// bibliografia: ogni testo di fonte diverso è una voce numerata, nell'ordine in cui compare
function refs() {
  const list = []
  const cite = (...texts) => {
    const n = texts.filter(t => t && !/^(missing|not measured)/.test(t)).map(t => {
      let i = list.indexOf(t)
      if (i < 0) { list.push(t); i = list.length - 1 }
      return i + 1
    })
    return n.length ? `<span class="cite">[${[...new Set(n)].sort((a, b) => a - b).join(', ')}]</span>` : ''
  }
  return { list, cite }
}

function table(n, caption, head, rows, notes = []) {
  return `<figure class="tab"><figcaption><b>Table ${n}.</b> ${caption}</figcaption>
<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('\n')}</tbody></table>
${notes.length ? `<p class="tnote">${notes.join('<br>')}</p>` : ''}</figure>`
}

// ctx: SIMULINK_CTX più label, placeName, earthSource (sensore della Terra per parametro)
export function buildReport(site, testId, testName, result, ctx) {
  const name = ctx.placeName(result.name)
  const t = buildTarget(site, testId, result, ctx)
  const a = buildAnalogue(site, testId, result, name, ctx)
  const d = result.dossier || {}, plan = result.plan
  const { list, cite } = refs()
  const field = p => p.replace(/[^A-Za-z0-9_]/g, '_')
  const terrain = d.terrain_src === '30m' ? 'computed at 30 m' : 'estimated from the 500 m screening (calibrated model)'
  const tot = plan.rows.reduce((x, r) => x + r.w, 0) || 1
  const share = st => Math.round(100 * plan.rows.filter(r => r.state === st).reduce((x, r) => x + r.w, 0) / tot)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const tgtWorld = WORLD[site.world]

  // Tabella 1: luoghi
  const t1 = table(1, 'Locations (planetocentric latitude, east-positive longitude).', ['', `${esc(site.name)} (${tgtWorld})`, `${esc(name)} (Earth)`], [
    ['Coordinates', latlon(t.lat_deg, t.lon_deg), latlon(a.lat_deg, a.lon_deg)],
    ['Surface gravity (m s<sup>−2</sup>)', `${fmt(t.gravity_m_s2)} ${cite(t.body_source)}`, `${fmt(a.gravity_m_s2)} ${cite(a.body_source)}`],
    ['Mean radius (m)', String(t.body_radius_m), String(a.body_radius_m)],          // intero: il raggio ha 5 cifre significative
    ['Solar day (s)', String(t.solar_day_s), String(a.solar_day_s)],
    ['Elevation datum', esc(t.elevation_datum), esc(a.elevation_datum)],
    ['Area', '–', `${(result.h3_cells || []).length} H3 cells, resolution 5 (~253 km<sup>2</sup> each)${result.country ? `; ${esc(result.country)}` : ''}`],
  ])

  // Tabella 2: parametri del confronto
  const notes = [], mark = {}
  const noteMark = f => {
    const txt = t.notes[f]
    if (!txt) return ''
    if (!mark[txt]) { mark[txt] = String.fromCharCode(97 + notes.length); notes.push(`<sup>${mark[txt]}</sup> ${esc(txt.replace('use physical.thermal_inertia', 'see thermal inertia in Table 3'))}.`) }
    return `<sup>${mark[txt]}</sup>`
  }
  const t2rows = plan.rows.map(r => {
    const f = field(r.p), cat = r.p === 'rock_class'
    const es = ctx.earthSource(r.p)
    const eTxt = es && TERRAIN.has(r.p) ? `${es}; ${r.p === 'crater_density' && d.terrain_src !== '30m' ? 'computed at 30 m only' : terrain}` : es
    const tSrc = cat ? sourceFor(ctx.targets?.[site.id]?.sources?.rock_class, site.id, site.world) : t.source[f]
    return [
      `${esc(ctx.label(r.p))}${noteMark(f)}`,
      cat ? 'class' : unit(t.units[f]),
      fmt(r.w),
      `${cat ? esc(t.rock_class_name) : range(t.range[f])} ${cite(tSrc)}`,
      `${r.state === 'nodata' ? fmt(NaN) : cat ? esc(a.rock_class_name) : fmt(a.values[f])} ${cite(eTxt)}`,
      r.state === 'nodata' ? fmt(NaN) : fmt(r.s),
      `<span class="st ${r.state}">${STATE[r.state]}</span>`,
    ]
  })
  const t2 = table(2, `Matched parameters. <i>w</i> = weight, <i>s</i> = similarity (0–1).`,
    ['Parameter', 'Unit', '<i>w</i>', esc(site.name), esc(name), '<i>s</i>', ''], t2rows, notes)

  // Tabella 3: grandezze fisiche
  const t3 = table(3, 'Physical properties.', ['Quantity', 'Unit', esc(site.name), esc(name)],
    Object.keys(t.physical).map(k => [
      PHYS_NAME[k] || esc(k),
      unit(t.physical_units[k]),
      `${fmt(t.physical[k])} ${Number.isFinite(t.physical[k]) ? cite(t.physical_source[k]) : ''}`,
      `${fmt(a.physical[k])} ${Number.isFinite(a.physical[k]) ? cite(a.physical_source[k]) : ''}`,
    ]))

  // Tabella 4: suolo (Bekker-Wong)
  const soilCell = (s, k) => `${fmt(s[k])}${Number.isFinite(s.range[k][0]) && s.range[k][0] !== s.range[k][1] ? ` <small>[${range(s.range[k])}]</small>` : ''} ${Number.isFinite(s[k]) ? cite(s.source[k]) : ''}<br><small>${esc(s.status[k])}</small>`
  const t4 = table(4, 'Soil mechanics (Bekker–Wong): central value [range] and status.', ['Parameter', 'Unit', esc(site.name), esc(name)],
    Object.keys(t.soil.units).map(k => [`${SOIL_NAME[k][0]}, ${SOIL_NAME[k][1]}`, unit(t.soil.units[k]), soilCell(t.soil, k), soilCell(a.soil, k)]),
    ['Earth values are estimated from the soil texture class (Wong 2010), not measured. <i>k</i><sub>c</sub>, <i>k</i><sub>φ</sub> and <i>n</i> belong to one fit.'])

  // Tabella 5: condizioni di campo
  const months = d.snow_free_mask ? 'JFMAMJJASOND'.split('').map((m, i) => (d.snow_free_mask[i] === '1' ? m : '·')).join(' ') : ''
  const t5 = table(5, `Field conditions at ${esc(name)}.`, ['Quantity', 'Unit', 'Value'], [
    ['Snow-free months', 'month', `${fmt(d.snow_free_months)}${months ? ` <small>${months}</small>` : ''}`, ctx.earthSource('snow_free_months')],
    ['Best month', 'month number', fmt(d.best_month), ctx.earthSource('low_sun_hours')],
    ['Low-angle Sun (0–7°)', 'h day<sup>−1</sup>', fmt(d.low_sun_hours), ctx.earthSource('low_sun_hours')],
    ['Bare ground', '–', fmt(d.valid_share), ctx.earthSource('valid_share')],
    ['Wind at 10 m', 'm s<sup>−1</sup>', fmt(d.wind_10m), ctx.earthSource('wind_10m')],
    ['Night lights', 'nW cm<sup>−2</sup> sr<sup>−1</sup>', fmt(d.night_lights), ctx.earthSource('night_lights')],
    ['Protected area', '–', d.protected_area ? esc(d.protected_area_name || 'yes') : 'no', ctx.earthSource('protected_area')],
    ['Terrain', '–', esc(terrain), ''],
  ].map(([q, u, v, s]) => [q, u, `${v} ${cite(s)}`]))

  const stat = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`
  const body = `
<header>
<h1>${esc(name)}</h1>
<p class="meta">Earth analogue of ${esc(site.name)} (${tgtWorld}) · ${esc(testName)} · ${today}</p>
</header>

<div class="stats">
${stat(fmt(result.score), 'similarity')}${stat(`${Math.round(100 * result.kappa)}%`, 'weight with data')}${stat(`${share('holds')}%`, 'holds')}${stat(`${share('partial')}%`, 'partial')}${stat(`${share('breaks')}%`, 'breaks')}
</div>

${t1}
${t2}
${t3}
${t4}
${t5}

<section class="notes"><h2>Notes</h2><ul>
<li>${esc(UNITS_CONVENTION)}; n/a = no data, never zero.</li>
<li>Earth values are means over ~253 km<sup>2</sup> hexagons from 30 m terrain and ~1 km satellite products: verify on site.</li>
<li>Reduced gravity, vacuum, electrostatic dust and the engine plume in vacuum are always tested indoors.</li>
${site.world === 'mars' ? '<li>Mars terrain values (slope, roughness, craters) are from the literature, with a definition different from the Earth one.</li>\n' : ''}${site.id === 'aristarchus_plateau' ? '<li>Aristarchus terrain values are from the literature, not recomputed from a DEM.</li>\n' : ''}</ul></section>

<section class="refs"><h2>References</h2><ol>
${list.map(s => `<li>${doi(s)}</li>`).join('\n')}
</ol></section>`

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} · ${esc(site.name)}</title>
<style>
:root{--ink:#16181c;--mute:#6b7078;--line:#e4e6ea;--accent:#ff5a1f}
*{box-sizing:border-box}
body{margin:0 auto;max-width:860px;padding:48px 24px 64px;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;color:var(--ink);background:#fff}
h1{font-size:26px;font-weight:600;letter-spacing:-.01em;margin:0 0 4px}
h2{font-size:13px;font-weight:600;margin:32px 0 8px}
.meta{color:var(--mute);margin:0}
.stats{display:flex;flex-wrap:wrap;gap:32px;margin:28px 0 8px;padding:16px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.stats div{display:flex;flex-direction:column}.stats b{font-size:20px;font-weight:600}.stats span{font-size:12px;color:var(--mute)}
figure.tab{margin:32px 0 0;overflow-x:auto}
figcaption{font-size:13px;margin-bottom:8px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;font-weight:500;color:var(--mute);border-bottom:1px solid var(--ink);padding:6px 8px 6px 0;vertical-align:bottom}
td{padding:6px 8px 6px 0;vertical-align:top;border-bottom:1px solid var(--line)}
td small{color:var(--mute)}
.cite{color:var(--mute);font-size:11px;white-space:nowrap}
.na{color:var(--mute)}
.st{white-space:nowrap;color:var(--mute)}.st.breaks{color:var(--accent)}
.tnote{font-size:12px;color:var(--mute);margin:8px 0 0}
.notes ul{margin:0;padding-left:18px;color:var(--mute)}
.refs ol{font-size:12px;color:var(--mute);padding-left:22px}.refs li{margin-bottom:3px;word-break:break-word}
a{color:inherit}
@media print{body{padding:0;max-width:none;font-size:10pt}figure.tab,tr{break-inside:avoid}a{text-decoration:none}}
</style></head><body>${body}
</body></html>
`
}

export const reportName = (site, testId, displayName) => `polenta_report_${site.id}__${testId}__${slug(displayName)}.html`

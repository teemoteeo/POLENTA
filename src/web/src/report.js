// Report dei dati di un posto (TODO [11]): il sito scelto (Luna o Marte) e il suo analogo sulla Terra, in un documento
// HTML in stile articolo (sezioni numerate, tabelle con didascalia, bibliografia numerata), da leggere nel browser o
// stampare in PDF. Gli stessi numeri del pacchetto Simulink (buildTarget / buildAnalogue): SI, angoli in gradi.
import { buildTarget, buildAnalogue, sourceFor, UNITS_CONVENTION, slug } from './simulink.js'

const STATE = { holds: 'holds', partial: 'partial', breaks: 'breaks', nodata: 'no data' }
const TERRAIN = new Set(['slope_p90', 'slope_trav_p90', 'trav_share', 'roughness', 'crater_density'])
const WORLD = { moon: 'Moon', mars: 'Mars', earth: 'Earth' }
const PHYS_NAME = {
  thermal_inertia: 'Thermal inertia', rock_cover: 'Rock (boulder) cover', subsurface_ice: 'Subsurface water ice',
  t_mean: 'Mean surface temperature', t_half_range: 'Surface temperature half range', bulk_density_0_2m: 'Bulk density, 0-2 m',
  feo: 'FeO', elevation: 'Elevation', air_density: 'Air density', wind: 'Wind speed',
}
const SOIL_NAME = { cohesion: ['Cohesion', '<i>c</i>'], friction_angle: ['Internal friction angle', 'φ'], kc: ['Cohesive modulus', '<i>k</i><sub>c</sub>'],
  kphi: ['Frictional modulus', '<i>k</i><sub>φ</sub>'], n: ['Sinkage exponent', '<i>n</i>'] }

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

// ctx: SIMULINK_CTX più label, placeName, earthSource (sensore della Terra per parametro), rules (tau, break_below, kappa_min, holds)
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
  const today = new Date().toISOString().slice(0, 10)
  const tgtWorld = WORLD[site.world]
  const test = testName.charAt(0).toLowerCase() + testName.slice(1)

  // Tabella 1: luoghi
  const t1 = table(1, 'Locations. Planetocentric latitude, east-positive longitude.', ['', `${esc(site.name)} (${tgtWorld})`, `${esc(name)} (Earth)`], [
    ['Coordinates', latlon(t.lat_deg, t.lon_deg), latlon(a.lat_deg, a.lon_deg)],
    ['Surface gravity (m s<sup>−2</sup>)', `${fmt(t.gravity_m_s2)} ${cite(t.body_source)}`, `${fmt(a.gravity_m_s2)} ${cite(a.body_source)}`],
    ['Mean radius (m)', String(t.body_radius_m), String(a.body_radius_m)],          // intero: il raggio ha 5 cifre significative
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
      `${esc(ctx.label(r.p))}${noteMark(f)}<br><code>${esc(r.p)}</code>`,
      cat ? 'class' : unit(t.units[f]),
      fmt(r.w),
      `${cat ? esc(t.rock_class_name) : range(t.range[f])} ${cite(tSrc)}`,
      `${r.state === 'nodata' ? fmt(NaN) : cat ? esc(a.rock_class_name) : fmt(a.values[f])} ${cite(eTxt)}`,
      r.state === 'nodata' ? fmt(NaN) : fmt(r.s),
      `<span class="st ${r.state}">${STATE[r.state]}</span>`,
    ]
  })
  const t2 = table(2, `Matched parameters of the ${esc(test)} test. Weight <i>w</i> from the test definition; target given as the range used for matching; <i>s</i> = per-parameter similarity (0–1).`,
    ['Parameter', 'Unit', '<i>w</i>', esc(site.name), esc(name), '<i>s</i>', 'State'], t2rows, notes)

  // Tabella 3: grandezze fisiche
  const t3 = table(3, 'Physical properties, for models (not in the score unless listed in Table 2). n/a = no data, never zero.',
    ['Quantity', 'Unit', esc(site.name), esc(name)],
    Object.keys(t.physical).map(k => [
      `${PHYS_NAME[k] || esc(k)}${t.physical_notes[k] ? `<br><small>${esc(t.physical_notes[k])}</small>` : ''}`,
      unit(t.physical_units[k]),
      `${fmt(t.physical[k])} ${Number.isFinite(t.physical[k]) ? cite(t.physical_source[k]) : ''}`,
      `${fmt(a.physical[k])} ${Number.isFinite(a.physical[k]) ? cite(a.physical_source[k]) : ''}`,
    ]))

  // Tabella 4: suolo (Bekker-Wong)
  const soilCell = (s, k) => `${fmt(s[k])}${Number.isFinite(s.range[k][0]) && s.range[k][0] !== s.range[k][1] ? ` <small>[${range(s.range[k])}]</small>` : ''}<br><small>${esc(s.status[k])}</small> ${Number.isFinite(s[k]) ? cite(s.source[k]) : ''}`
  const t4 = table(4, 'Soil mechanics: Bekker pressure–sinkage <i>p</i> = (<i>k</i><sub>c</sub>/<i>b</i> + <i>k</i><sub>φ</sub>) <i>z</i><sup><i>n</i></sup> (<i>b</i> = smaller dimension of the contact area, <i>z</i> = sinkage) and Mohr–Coulomb shear strength τ<sub>max</sub> = <i>c</i> + σ tan φ. Central value, [range] and status.',
    ['Parameter', 'Unit', esc(site.name), esc(name)],
    Object.keys(t.soil.units).map(k => [`${SOIL_NAME[k][0]}, ${SOIL_NAME[k][1]}`, unit(t.soil.units[k]), soilCell(t.soil, k), soilCell(a.soil, k)]),
    ['Status: measured = in situ at the site; inferred = model fit to rover data at the site; literature = checked against the source; literature [NV] = not yet checked; estimated (texture class) = Earth value from the USDA texture class of the SoilGrids sand and clay (top 5 cm) with the reference soils of Wong (2010), which were moist: measure on site for design values. <i>k</i><sub>c</sub>, <i>k</i><sub>φ</sub> and <i>n</i> come from one fit and must be used together.'])

  // Tabella 5: condizioni di campo
  const months = d.snow_free_mask ? 'JFMAMJJASOND'.split('').map((m, i) => (d.snow_free_mask[i] === '1' ? m : '·')).join(' ') : ''
  const t5 = table(5, `Field conditions at ${esc(name)}.`, ['Quantity', 'Unit', 'Value'], [
    ['Snow-free months', 'month', `${fmt(d.snow_free_months)}${months ? ` <small>(${months})</small>` : ''}`, ctx.earthSource('snow_free_months')],
    ['Best month (lowest Sun without snow)', 'month number', fmt(d.best_month), ctx.earthSource('low_sun_hours')],
    ['Low-angle Sun, 0–7° above the horizon', 'h day<sup>−1</sup>', fmt(d.low_sun_hours), ctx.earthSource('low_sun_hours')],
    ['Bare-ground share of the area', '–', fmt(d.valid_share), ctx.earthSource('valid_share')],
    ['Wind speed at 10 m', 'm s<sup>−1</sup>', fmt(d.wind_10m), ctx.earthSource('wind_10m')],
    ['Night lights', 'nW cm<sup>−2</sup> sr<sup>−1</sup>', fmt(d.night_lights), ctx.earthSource('night_lights')],
    ['Protected area', '–', d.protected_area ? esc(d.protected_area_name || 'yes') : 'no', ctx.earthSource('protected_area')],
    ['Terrain values', '–', esc(terrain), ''],
  ].map(([q, u, v, s]) => [q, u, `${v} ${cite(s)}`]))

  const r = ctx.rules
  const body = `
<header>
<p class="kicker">POLENTA · Earth analogue data report</p>
<h1>${esc(name)} as a terrestrial analogue of ${esc(site.name)} (${tgtWorld}) for ${esc(test)}</h1>
<p class="meta">Data: ${esc(t.data_version)} · pipeline export ${esc(t.data_export)} · report generated ${today}</p>
</header>

<section class="abstract"><h2>Summary</h2>
<p>This report lists the data used to match ${esc(name)}${result.country ? ` (${esc(result.country)})` : ''}, at ${latlon(a.lat_deg, a.lon_deg)}, to ${esc(site.name)} on the ${tgtWorld}, at ${latlon(t.lat_deg, t.lon_deg)}, for the ${esc(test)} test.
The similarity is <i>S</i> = ${fmt(result.score)} on a 0–1 scale, with data on κ = ${fmt(result.kappa)} of the weight.
By weight, ${share('holds')}% of the parameters hold in the field (<i>s</i> ≥ ${r.holds}), ${share('partial')}% are partial and ${share('breaks')}% break (<i>s</i> &lt; ${r.break_below})${share('nodata') ? `; ${share('nodata')}% have no data` : ''}.
Terrain values at the analogue are ${esc(terrain)}. ${esc(UNITS_CONVENTION)}.</p></section>

<section><h2>1. Locations</h2>${t1}</section>

<section><h2>2. Matched parameters</h2>
<p>Each parameter of the test is compared with the target range of ${esc(site.name)}. Parameters that break are assigned to indoor facilities in the campaign plan.</p>
${t2}</section>

<section><h2>3. Physical properties</h2>${t3}</section>

<section><h2>4. Soil mechanics</h2>${t4}</section>

<section><h2>5. Field conditions</h2>${t5}</section>

<section><h2>6. Method</h2>
<p>Earth is divided into H3 hexagons at resolution 5 (~253 km<sup>2</sup>); oceans, vegetation (median NDVI of the snow-free months ≥ 0.2), farmland and cities are excluded.
For each parameter <i>i</i>, <i>D</i><sub><i>i</i></sub> is the distance of the hexagon from the target range in Earth percentiles (in physical units for the ground-ice share), and the similarity is
<i>s</i><sub><i>i</i></sub> = exp[−(<i>D</i><sub><i>i</i></sub>/τ)<sup>2</sup>] with τ = ${r.tau}.
The total similarity is the weighted geometric mean <i>S</i> = exp(Σ <i>w</i><sub><i>i</i></sub> ln <i>s</i><sub><i>i</i></sub> / Σ <i>w</i><sub><i>i</i></sub>) over the parameters with data; κ is the share of the weight with data, and a place is ranked only if κ ≥ ${r.kappa_min}.
A parameter holds for <i>s</i> ≥ ${r.holds}, is partial for ${r.break_below} ≤ <i>s</i> &lt; ${r.holds} and breaks for <i>s</i> &lt; ${r.break_below}.
Slope, roughness and crater density use the same definitions on Earth and on the Moon (30 m baseline; lunar values computed from LOLA); on Earth they are exact where the 30 m terrain was computed, otherwise estimated from the 500 m screening with a calibrated model.
Code and configuration: github.com/teemoteeo/POLENTA, ${esc(t.data_version)}.</p></section>

<section><h2>7. Limitations</h2><ul>
<li>Model output, not a site survey: Earth values are means over ~253 km<sup>2</sup> hexagons from 30 m terrain and ~1 km satellite products. Verify on site before planning a campaign.</li>
<li>Earth never reproduces the reduced gravity, the vacuum, the electrostatic dust or the engine plume in vacuum: these are always tested indoors.</li>
<li>Earth soil mechanics are estimates by texture class, not measurements.</li>
<li>Earth ground ice is a MODIS temperature proxy (mean annual surface temperature below −1 °C); rock type comes from GLiM (~55 km cells).</li>
${site.world === 'mars' ? '<li>Mars slope, roughness and crater density are literature values (HiRISE/CTX terrain models) with a definition different from the Earth one.</li>\n' : ''}${site.id === 'aristarchus_plateau' ? '<li>Aristarchus terrain values are literature values, not recomputed from a DEM with the Earth definition.</li>\n' : ''}</ul></section>

<section class="refs"><h2>References</h2><ol>
${list.map(s => `<li>${doi(s)}</li>`).join('\n')}
</ol></section>`

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>POLENTA report · ${esc(name)} · ${esc(site.name)}</title>
<style>
:root{--ink:#111;--mute:#555;--line:#cfcfcf;--accent:#ff5a1f}
*{box-sizing:border-box}
body{margin:0 auto;max-width:880px;padding:40px 24px 64px;font:15px/1.55 Georgia,'Times New Roman',serif;color:var(--ink);background:#fff}
h1{font-size:24px;line-height:1.25;margin:4px 0 8px;font-weight:600}
h2{font-size:16px;margin:28px 0 8px;font-weight:600;border-bottom:1px solid var(--line);padding-bottom:3px}
.kicker{font:600 11px/1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0}
.meta{font:12px/1.4 system-ui,sans-serif;color:var(--mute);margin:0}
.abstract{background:#f6f6f6;border-left:3px solid var(--accent);padding:2px 16px 8px;margin-top:20px}
.abstract h2{border:0;margin-top:12px}
figure.tab{margin:12px 0 20px;overflow-x:auto}
figcaption{font-size:13px;margin-bottom:6px}
table{width:100%;border-collapse:collapse;font:12.5px/1.4 system-ui,sans-serif;border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink)}
th{text-align:left;font-weight:600;border-bottom:1px solid var(--ink);padding:5px 6px;vertical-align:bottom}
td{padding:5px 6px;vertical-align:top;border-bottom:1px solid #eee}
td small{color:var(--mute)}
code{font-size:11px;color:var(--mute)}
.cite{color:var(--mute);white-space:nowrap}
.na{color:var(--mute)}
.st{white-space:nowrap}.st.breaks{color:var(--accent);font-weight:600}.st.holds{color:#1d7a46}
.tnote{font:11.5px/1.4 system-ui,sans-serif;color:var(--mute);margin:6px 0 0}
.refs ol{font-size:12.5px;padding-left:24px}.refs li{margin-bottom:4px;word-break:break-word}
a{color:inherit}
@media print{body{padding:0;max-width:none;font-size:10.5pt}figure.tab,tr{break-inside:avoid}h2{break-after:avoid}a{text-decoration:none}}
</style></head><body>${body}
</body></html>
`
}

export const reportName = (site, testId, displayName) => `polenta_report_${site.id}__${testId}__${slug(displayName)}.html`

import { Fragment } from 'react'
import './sheets.css'
import { SITES, TESTS, getResults, MANIFEST, VALIDATION, knownReason } from './data.js'
import { TEST_EN, placeName, facilityName } from './i18n.js'
import { pct, H3_KM2 } from './format.js'
import { HOLDS, BREAKS } from './campaign.js'

const TEST_IDS = Object.keys(TEST_EN).filter(t => TESTS[t])
const top = (s, t) => getResults(s, t, true)?.results?.[0] ?? null // posti nuovi (siti di test noti esclusi)

function Bar({ plan }) {
  const seg = [['holds', plan.fieldShare], ['partial', plan.partialShare], ['breaks', plan.brokenShare]]
  return <span className="sbar" aria-hidden>{seg.map(([k, v]) => <i key={k} className={k} style={{ width: `${v * 100}%` }} />)}</span>
}

const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]
const TOPN = 4
const SHORT = { rover_mobility: 'Rover', flight_hda_lidar: 'Lidar landing', isru_subsurface: 'ISRU' }

// onOpen(siteId, testId): apre la scheda di quella coppia
export function Benchmark({ onOpen }) {
  const pairs = SITES.flatMap(s => TEST_IDS.map(t => ({ s, t, r: top(s.id, t) })))
  const ok = pairs.filter(p => p.r)
  const share = p => pct(p.r.plan.fieldShare)
  const nNew = ok.filter(p => !knownReason(p.r)).length
  const count = {}
  ok.forEach(p => new Set(p.r.plan.facilities.map(f => f.name)).forEach(n => (count[n] = (count[n] || 0) + 1)))
  const maxN = Math.max(0, ...Object.values(count))
  const facs = Object.keys(count).filter(n => count[n] === maxN).map(facilityName)
  // coppie a pari merito (stessa % arrotondata), raggruppate per sito, al massimo TOPN gruppi
  const tied = v => {
    const by = new Map()
    ok.filter(p => share(p) === v).forEach(p => by.set(p.s, [...(by.get(p.s) || []), p]))
    const g = [...by].map(([s, ps]) => ps.length === TEST_IDS.length ? `${s.name} (all ${ps.length} tests)` : `${s.name} × ${ps.map(p => TEST_EN[p.t].name).join(', ')}`)
    return list(g.length > TOPN ? [...g.slice(0, TOPN), `${g.length - TOPN} more`] : g)
  }
  const vals = ok.map(share).sort((a, b) => a - b)
  const [lo, hi] = [vals[0], vals[vals.length - 1]]
  const med = vals.length ? (vals[(vals.length - 1) >> 1] + vals[vals.length >> 1]) / 2 : 0
  const nTurin = ok.filter(p => p.r.plan.inTurin.length > 0).length
  const tn = t => SHORT[t] || TEST_EN[t].name
  return <>
    <h2>Benchmark: {SITES.length} sites × {TEST_IDS.length} tests</h2>
    <p className="sh-intro">For every pair, the most similar new place on Earth (well-studied analogue regions and known test sites excluded) and its campaign. Click a cell to open it.</p>
    <table className="bm">
      <thead><tr><th />{TEST_IDS.map(t => <th key={t} title={TEST_EN[t].name}>{tn(t)}</th>)}</tr></thead>
      <tbody>{['moon', 'mars'].map(w => <Fragment key={w}>
        <tr className="grp"><th colSpan={TEST_IDS.length + 1} className="lbl">{w === 'moon' ? 'Moon' : 'Mars'}</th></tr>
        {SITES.filter(s => s.world === w).map(s => <tr key={s.id}>
          <th scope="row" title={s.name}>{s.name}</th>
          {TEST_IDS.map(t => {
            const r = top(s.id, t)
            return <td key={t}>{r ? <button className="cell" onClick={() => onOpen(s.id, t)}>
              <span className="pl" title={placeName(r.name)}>{placeName(r.name)}</span>
              <span className="row2"><span className="fig big">{pct(r.plan.fieldShare)}%</span><Bar plan={r.plan} /></span>
              <span className="mute small ln">{r.plan.nFacilities} {r.plan.nFacilities === 1 ? 'facility' : 'facilities'} · sim {pct(r.score)}</span>
            </button> : <span className="mute">—</span>}</td>
          })}
        </tr>)}
      </Fragment>)}</tbody>
    </table>
    <div className="legend small mute"><span className="sbar"><i className="holds" style={{ width: '100%' }} /></span>holds<span className="sbar"><i className="partial" style={{ width: '100%' }} /></span>partial<span className="sbar"><i className="breaks" style={{ width: '100%' }} /></span>breaks<span className="lg-note">% = share of the test covered in the field</span></div>
    <h3 className="lbl">What the matrix says</h3>
    {ok.length ? <ul className="sh-list">
      <li>Covered best in the field ({hi}%): {tied(hi)}.</li>
      <li>Hardest ({lo}%): {tied(lo)}.</li>
      <li>Median field share over the {ok.length} pairs: {Math.round(med)}%.</li>
      <li>{nTurin} of {ok.length} campaigns use a facility in Turin.</li>
      <li>{nNew} of {ok.length} top places are new, {ok.length - nNew} are in well-studied analogue regions or near known test sites.</li>
      {maxN > 0 && <li>Most used facility: {list(facs)}, in {maxN} of {ok.length} campaigns.</li>}
    </ul> : <p className="mute">No results yet.</p>}
  </>
}

// nome nel manifest -> [NASA?, uso]; compare solo se il nome è nella stringa MANIFEST.datasets
const DATA = [
  ['NASADEM', 1, 'Terrain on Earth up to 60°N: slope, roughness, craters (30 m)'],
  ['MOD44W', 1, 'MODIS land/water mask'],
  ['MOD13A3', 1, 'MODIS NDVI: keeps bare ground only'],
  ['MOD11A2', 1, 'MODIS land temperature: thermal inertia (grain proxy), extremes'],
  ['MCD43A3', 1, 'MODIS albedo'],
  ['MOD10A2', 1, 'MODIS snow cover: snow-free months'],
  ['MERRA-2', 1, 'Wind at 10 m'],
  ['LRO LOLA', 1, 'Lunar terrain (LDEM 80S 20 m, PDS) for the south-pole sites'],
  ['VIIRS DNB', 1, 'Night lights: excludes cities'],
  ['AW3D30', 0, 'JAXA terrain above 60°N'],
  ['JRC Global Surface Water', 0, 'Excludes lakes from crater counts'],
  ['SoilGrids', 0, 'Rock fraction, soil density and texture'],
  ['WDPA', 0, 'Protected areas (permit warning)'],
  ['GLiM', 0, 'Rock type (coarse, ~55 km cells)'],
].filter(([k]) => (MANIFEST.datasets || '').includes(k))

const LIMITS = [
  'Gale × lidar: top scores are close to 1.0. Gale values are ordinary for Earth, so many hexagons match.',
  'Lunar ISRU scores are low (~0.25): lunar regolith density and boulders exist on no Earth soil. They break everywhere, and the campaign closes them with simulant pits.',
  'The 3 polar sites give similar rankings: their values are very close, so one campaign on Earth serves all three.',
  'Some hexagons have only 6-10% bare ground (farmland, or volcanoes like Etna where the real site is small). See the bare-ground warning.',
  'The lidar heat map is sparse (~3,800 hexagons): craters only exist where we computed exact 30 m terrain. The top places still come from all over the Earth.',
  'Mars and Aristarchus terrain values come from the literature.',
  'Rover slopes are those of the drivable ground: the 90th percentile of the slope below 20° (the Artemis rover requirement) and the share of drivable area, computed the same way on LOLA and on Earth. The lidar test keeps the slope of the whole region. Aristarchus and Mars: derived from their slope (below 20°, so at least 90% drivable).',
  'Ground ice is the share of area with stable ice within 1 m of the surface. Polar Moon: within 10 km of the landing point (Artemis rover range), from LRO Diviner, as the median over the USGS landing region. Earth: MODIS proxy (mean annual temperature below −1 °C), an approximation of ice within 1 m. ISRU test: when the site has ice, Earth places without permafrost are excluded; more ice than the site is penalised too (we look for analogues, not for the most ice).',
  'Rock type (GLiM) is coarse: ~55 km cells, so Etna or the Eifel do not show.',
  'No Antarctica: MODIS NDVI does not cover it.',
  'Some facility entries are still to be verified.',
]

const TESTS_ORDER = ['flight_hda_lidar', 'rover_mobility', 'isru_subsurface']
const TEST_SHORT = { flight_hda_lidar: 'Lidar landing', rover_mobility: 'Rover', isru_subsurface: 'ISRU' }
// per ogni sito noto: mediana del percentile sui 4 siti lunari, per test
function valRows() {
  const moon = ['malapert_massif', 'haworth', 'nobile_rim_1', 'aristarchus_plateau']
  const by = new Map()
  for (const t of TESTS_ORDER) for (const s of moon) for (const k of VALIDATION[s]?.[t] || []) {
    if (!by.has(k.id)) by.set(k.id, { id: k.id, name: k.name, v: {} })
    if (k.percentile != null) (by.get(k.id).v[t] ||= []).push(k.percentile)
  }
  const med = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)] }
  return [...by.values()].map(r => ({ id: r.id, name: r.name, ...Object.fromEntries(TESTS_ORDER.map(t => [t, r.v[t] ? med(r.v[t]) : null])) }))
    .filter(r => TESTS_ORDER.some(t => r[t] != null))
}

export function Method() {
  const nasa = DATA.filter(d => d[1]), other = DATA.filter(d => !d[1])
  const row = ([k, , u]) => <li key={k}><b>{k}</b> <span className="mute">{u}</span></li>
  return <>
    <h2>Method &amp; data</h2>
    <h3 className="lbl">What the score is</h3>
    <ul className="sh-list">
      <li>Unit: one Earth hexagon of bare ground (H3 resolution 5, ~{H3_KM2} km²).</li>
      <li>Per parameter: <span className="fig">s = exp(−(D/τ)²)</span>, with D the distance in Earth percentiles.</li>
      <li>Total: weighted geometric mean, using the weights of the chosen test. A parameter with s &lt; {BREAKS} breaks.</li>
    </ul>
    <h3 className="lbl">How a campaign is built</h3>
    <ul className="sh-list">
      <li>A parameter holds in the field from {HOLDS}, is partial between {BREAKS} and {HOLDS}, and breaks below {BREAKS}.</li>
      <li>Share covered in the field = weight of the parameters that hold.</li>
      <li>The indoor facilities are the smallest set that closes every gap, chosen by the pipeline: most gaps covered first, then nearest to Turin.</li>
      <li>Places are ranked by similarity to the target site. The campaign (share in the field, facilities, km from Turin) is shown for each place; the simplest one is tagged, but it does not change the order.</li>
      <li>“New” means outside well-studied analogue regions (US Southwest, Iceland, Atacama, Hawaii, Canary Islands, Svalbard, Canadian High Arctic, Antarctica) and more than 150 km from any known test site. These can be hidden and the next places move up.</li>
      <li>Low-angle sunlight that the site only offers for a few hours a day is flagged as covered by timing, not by a facility.</li>
      <li>No cost figures: we have no solid source for them.</li>
    </ul>
    <h3 className="lbl">MATLAB / Simulink export</h3>
    <ul className="sh-list">
      <li>Each place card exports one <code>.zip</code> package: one <code>.mat</code> file, <code>init_polenta.m</code> (loads it and prints the comparison), <code>README.txt</code> (every field and its unit) and <code>SOURCES.txt</code>.</li>
      <li>The <code>.mat</code> holds flat structs, one level deep: <code>target</code> and <code>analogue</code> with the same fields, numbers only, ready for a Simulink Constant block or bus; <code>target_range</code> with [min max]; <code>info</code>, one row per field with unit, similarity, weight, state, sources and notes (a table in MATLAB); <code>meta</code> with site, test, place and field logistics.</li>
      <li>Units: SI throughout, angles in degrees, fractions 0-1. The unit is in the field name: <code>slope_p90_deg</code>, <code>t_mean_K</code>, <code>bulk_density_0_2m_kg_m3</code>, <code>soil_cohesion_Pa</code>.</li>
      <li>Values, ranges and sources are those of the card: the parameters of the chosen test, from the same pipeline export. Elevations of different bodies use different datums and are not comparable.</li>
      <li>Bekker-Wong soil parameters (<code className="fig">cohesion</code>, <code className="fig">friction_angle</code>, <code className="fig">kc</code>, <code className="fig">kphi</code>, <code className="fig">n</code>): per site, with range, unit, source and status. Mars: Phoenix measured by the lander arm, Gale inferred from Curiosity drives; <code className="fig">kc</code>, <code className="fig">kphi</code>, <code className="fig">n</code> and <code className="fig">K</code> from other Martian soils (Opportunity drives at Meridiani, Zhou et al. 2014), not measured at the site. Moon: Apollo rover trafficability set (Lunar Sourcebook Table 9.14); Aristarchus uses the friction angle of pyroclastic deposits. Earth: estimated from the soil texture class (SoilGrids sand and clay, USDA triangle) with the bevameter and shear tests of Wong (2010) on moist soils; clays stay <code>NaN</code>. For more precision, measure on site and use your own dataset.</li>
    </ul>
    <h3 className="lbl">Data</h3>
    <p className="small mute">Earth data are processed in Google Earth Engine. Moon and Mars targets: LOLA plus literature values.</p>
    <p className="lbl nasa">NASA</p>
    <ul className="sh-list">{nasa.map(row)}</ul>
    <p className="lbl">Other sources</p>
    <ul className="sh-list">{other.map(row)}</ul>
    <h3 className="lbl">Validation: do real test sites come out on top?</h3>
    <p className="small mute">Percentile of each known test site among all scored Earth hexagons (100 = best), for the tests it is used for.</p>
    <table className="val-table"><thead><tr><th>Known test site</th>{TESTS_ORDER.map(t => <th key={t}>{TEST_SHORT[t]}</th>)}</tr></thead>
      <tbody>{valRows().map(r => <tr key={r.id}><td>{r.name}</td>{TESTS_ORDER.map(t => <td key={t} className="fig">{r[t] == null ? '' : `top ${100 - r[t]}%`}</td>)}</tr>)}</tbody></table>
    <p className="small mute">Median over the four lunar sites. Empty: the site is not used for that test, or its hexagon is filtered out (too little bare ground, city lights, farmland).</p>
    <h3 className="lbl">Where the analogy never holds</h3>
    <p>Always indoor or not reproducible on Earth:</p>
    <ul className="sh-list"><li>1/6 gravity</li><li>vacuum</li><li>electrostatic dust</li><li>engine plume in vacuum</li><li>lunar agglutinates</li></ul>
    <h3 className="lbl">Known limits</h3>
    <ul className="sh-list">{LIMITS.map(l => <li key={l}>{l}</li>)}</ul>
    <h3 className="lbl">AI use</h3>
    <p>Built with AI assistance (code and data pipeline); all numbers come from the pipeline export, none are generated by a language model.</p>
    <p className="small mute">Export generated <span className="fig">{MANIFEST.generated_at}</span></p>
  </>
}

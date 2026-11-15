import { Fragment } from 'react'
import './sheets.css'
import { SITES, TESTS, getResults, MANIFEST } from './data.js'
import { TEST_EN, placeName, facilityName } from './i18n.js'
import { pct, H3_KM2 } from './format.js'
import { HOLDS, BREAKS } from './campaign.js'

const TEST_IDS = Object.keys(TEST_EN).filter(t => TESTS[t])
const top = (s, t) => getResults(s, t)?.results?.[0] ?? null

function Bar({ plan }) {
  const seg = [['holds', plan.fieldShare], ['partial', plan.partialShare], ['breaks', plan.brokenShare]]
  return <span className="sbar" aria-hidden>{seg.map(([k, v]) => <i key={k} className={k} style={{ width: `${v * 100}%` }} />)}</span>
}

// onOpen(siteId, testId): apre la scheda di quella coppia
export function Benchmark({ onOpen }) {
  const pairs = SITES.flatMap(s => TEST_IDS.map(t => ({ s, t, r: top(s.id, t) })))
  const ok = pairs.filter(p => p.r)
  const byField = [...ok].sort((a, b) => b.r.plan.fieldShare - a.r.plan.fieldShare)
  const name = p => `${p.s.name} × ${TEST_EN[p.t].name}`
  const nNew = ok.filter(p => p.r.new).length
  const count = {}
  ok.forEach(p => new Set(p.r.plan.facilities.map(f => f.name)).forEach(n => (count[n] = (count[n] || 0) + 1)))
  const [fac, n] = Object.entries(count).sort((a, b) => b[1] - a[1])[0] || []
  const line = p => `${name(p)} (${pct(p.r.plan.fieldShare)}% in the field)`
  return <>
    <h2>Benchmark: {SITES.length} sites × {TEST_IDS.length} tests</h2>
    <p className="sh-intro">For every pair, the simplest campaign found on Earth.</p>
    <div className="bm-scroll"><table className="bm">
      <thead><tr><th />{TEST_IDS.map(t => <th key={t}>{TEST_EN[t].name}</th>)}</tr></thead>
      <tbody>{['moon', 'mars'].map(w => <Fragment key={w}>
        <tr className="grp"><th colSpan={TEST_IDS.length + 1} className="lbl">{w === 'moon' ? 'Moon' : 'Mars'}</th></tr>
        {SITES.filter(s => s.world === w).map(s => <tr key={s.id}>
          <th scope="row">{s.name}</th>
          {TEST_IDS.map(t => {
            const r = top(s.id, t)
            return <td key={t}>{r ? <button onClick={() => onOpen(s.id, t)}>
              <span className="pl">{placeName(r.name)}</span>
              <span className="mute small">{r.country}</span>
              <span className="fig big">{pct(r.plan.fieldShare)}% field</span>
              <span className="small">{r.plan.nFacilities} {r.plan.nFacilities === 1 ? 'facility' : 'facilities'}</span>
              <span className="mute small">similarity <span className="fig">{pct(r.score)}/100</span></span>
              <Bar plan={r.plan} />
            </button> : <span className="mute">—</span>}</td>
          })}
        </tr>)}
      </Fragment>)}</tbody>
    </table></div>
    <div className="legend small mute"><span className="sbar"><i className="holds" style={{ width: '100%' }} /></span> holds <span className="sbar"><i className="partial" style={{ width: '100%' }} /></span> partial <span className="sbar"><i className="breaks" style={{ width: '100%' }} /></span> breaks</div>
    <h3 className="lbl">What the matrix says</h3>
    {ok.length ? <ul className="sh-list">
      <li>Best pair: {line(byField[0])}.</li>
      <li>Hardest pair: {line(byField[byField.length - 1])}.</li>
      <li>{nNew} of {ok.length} top places are new, {ok.length - nNew} are known test sites.</li>
      {fac && <li>Most used facility: {facilityName(fac)}, in {n} of {ok.length} campaigns.</li>}
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
  'The lidar heat map is sparse (~3,300 hexagons): craters only exist where we computed exact 30 m terrain. The top places still come from all over the Earth.',
  'Mars and Aristarchus terrain values come from the literature.',
  'Ground ice on Earth is estimated from a MODIS proxy (mean annual temperature below −1 °C).',
  'Rock type (GLiM) is coarse: ~55 km cells, so Etna or the Eifel do not show.',
  'No Antarctica: MODIS NDVI does not cover it.',
  'Some facility entries are still to be verified.',
]

export function Method() {
  const nasa = DATA.filter(d => d[1]), other = DATA.filter(d => !d[1])
  const row = ([k, , u]) => <li key={k}><b>{k}</b> <span className="mute">{u}</span></li>
  return <>
    <h2>Method &amp; data</h2>
    <h3 className="lbl">What the score is</h3>
    <p>Every Earth hexagon of bare ground (H3 resolution 5, ~{H3_KM2} km²) gets a similarity per parameter, <span className="fig">s = exp(−(D/τ)²)</span>, with D the distance in Earth percentiles. The total is a weighted geometric mean, using the weights of the chosen test. A parameter with s &lt; {BREAKS} breaks.</p>
    <h3 className="lbl">How a campaign is built</h3>
    <ul className="sh-list">
      <li>A parameter holds in the field from {HOLDS}, is partial between {BREAKS} and {HOLDS}, and breaks below {BREAKS}.</li>
      <li>Share covered in the field = weight of the parameters that hold.</li>
      <li>The indoor facilities are the smallest set that closes every gap, chosen by the pipeline: most gaps covered first, then nearest to Turin.</li>
      <li>Places are ranked by workability first (at least 15% bare ground in the hexagon and more than 3 snow-free months a year), then share covered in the field, then total km from Turin, then similarity.</li>
      <li>No cost figures: we have no solid source for them.</li>
    </ul>
    <h3 className="lbl">Data</h3>
    <p className="small mute">Earth data are processed in Google Earth Engine. Moon and Mars targets: LOLA plus literature values.</p>
    <p className="lbl nasa">NASA datasets</p>
    <ul className="sh-list">{nasa.map(row)}</ul>
    <p className="lbl">Other datasets</p>
    <ul className="sh-list">{other.map(row)}</ul>
    <h3 className="lbl">Where the analogy never holds</h3>
    <p>1/6 gravity, vacuum, electrostatic dust, engine plume in vacuum and lunar agglutinates are always indoor or not reproducible on Earth.</p>
    <h3 className="lbl">Known limits</h3>
    <ul className="sh-list">{LIMITS.map(l => <li key={l}>{l}</li>)}</ul>
    <h3 className="lbl">AI use</h3>
    <p>Built with AI assistance (code and data pipeline); all numbers come from the pipeline export, none are generated by a language model.</p>
    <p className="small mute">Export generated <span className="fig">{MANIFEST.generated_at}</span></p>
  </>
}

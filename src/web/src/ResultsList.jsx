import './card.css'
import { pct, km, blockNotes } from './format.js'
import { placeName, label } from './i18n.js'
import { HOMES, RADII } from './homes.js'
import { SIMULINK_CTX, sensor } from './data.js'
import { download } from './simulink.js'
import { reportRows, reportCsv, reportName } from './report.js'

// report di trade-off (TODO [11]): la lista che si sta guardando, in CSV, con pesi, voti, valori SI e fonti
function getReport(site, testId, testName, data, list) {
  const rows = reportRows(site, testId, testName, data, list, { ...SIMULINK_CTX, label, placeName, earthSource: p => sensor(p, 'earth')?.full })
  download(reportName(site, testId, list), reportCsv(rows), 'text/csv;charset=utf-8')
}

export default function ResultsList({ site, testId, testName, data, mode, onMode, home, onHome, onPick, onPeek, onLeave, radius, onRadius }) {
  const near = mode === 'near'
  const base = home.name
  return (<div className="reslist">
    <h2>{near ? `Near ${base}` : mode === 'new' ? 'Unexplored places' : 'Where to run it on Earth'}</h2>
    <div className="seg" role="group" aria-label="Mode">
      {[['earth', 'Best on Earth'], ['new', 'Unexplored'], ['near', 'Near you']].map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} aria-pressed={mode === k} onClick={() => onMode(k)}>{l}</button>)}
    </div>
    {near && <div className="near-ctl">
      <span className="lbl">Base</span>
      <span className="seg" role="group" aria-label="Base">
        {HOMES.map(h => <button key={h.id} className={h.id === home.id ? 'on' : ''} aria-pressed={h.id === home.id} onClick={() => onHome(h)}>{h.name}</button>)}
      </span>
      <span className="lbl">Within</span>
      <span className="seg" role="group" aria-label="Radius">
        {RADII.map(r => <button key={r} className={r === radius ? 'on' : ''} aria-pressed={r === radius} onClick={() => onRadius(r)}>{r.toLocaleString('en')} km</button>)}
      </span></div>}
    {near && !data && <p className="lbl">Loading places near {base}...</p>}
    {near && data && !data.results.length && <p className="lbl">No bare-ground hexagon within {radius.toLocaleString('en')} km of {base} is among the 10,000 most similar for this test.</p>}
    {near && data && data.results.length > 0 && <p className="lbl">The best places within {radius.toLocaleString('en')} km of {base}, and how much similarity you give up against the best place on Earth ({data.bestOnEarth != null ? pct(data.bestOnEarth) : 'n/a'}/100).</p>}
    {data && <>
    {mode === 'new' && <p className="lbl">{data.results.length ? 'The most similar places that nobody tests in yet: outside well-studied analogue regions and more than 150 km from any known test site.' : 'None of the 20 most similar places for this test is outside the well-studied analogue regions.'}</p>}
    {mode === 'earth' && <p className="lbl">Ranked by similarity to the target site. Each place also shows its campaign: share of the test that holds in the field, partner facilities for the rest, distance from {base}.</p>}
    <ul className="sites res" onMouseLeave={onLeave}>
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className="data" onClick={() => onPick(i)} onMouseEnter={e => onPeek(i, e)} onFocus={e => onPeek(i, e)}>
            <b className="fig">{i + 1}</b><span>{placeName(r.name)}</span>
            <small className="fig" title="Weighted similarity over the test parameters">{pct(r.score)}/100</small>
          </button>
        </li>
      ))}
    </ul>
    {data.results.length > 0 && <p className="copy-row report-row">
      <button type="button" className="tag copy" onClick={() => getReport(site, testId, testName, data, { mode, base: home, radius })}
        title="One row per place and parameter: weight, similarity, place value and target range in SI units, sources">Trade-off table (.csv)</button>
    </p>}
    </>}
    <p className="lbl disclaimer">Model output, not a site survey: 30 m terrain and ~1 km satellite data averaged over ~250 km² hexagons; lunar and Martian values from literature and LOLA. Check the place before planning a campaign. See Method & data for limits.</p>
  </div>)
}

// schedina accanto alla lista al passaggio su un posto: foto satellitare e i dettagli che prima stavano nella riga
const esri = r => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${r.lon - 0.3},${r.lat - 0.18},${r.lon + 0.3},${r.lat + 0.18}&bboxSR=4326&imageSR=3857&size=600,338&format=jpg&f=image`
export function ResultPeek({ data, i, mode, base, pos }) {
  const r = data.results[i], near = mode === 'near'
  return (<aside className="peek glass" style={pos} aria-live="polite">
    <figure><img src={esri(r)} alt={`Satellite view of ${placeName(r.name)}`} /><figcaption>Esri World Imagery</figcaption></figure>
    <p className="lbl">{r.country}{!near && i === 0 ? ' · most similar' : ''}{!near && i === data.easiest ? ' · simplest campaign' : ''}</p>
    <h3>{i + 1} · {placeName(r.name)}</h3>
    <dl>
      <div><dt>Similarity</dt><dd className="fig">{pct(r.score)}/100</dd></div>
      {r.plan && <div><dt>In the field</dt><dd className="fig">{pct(r.plan.fieldShare)}% of the test</dd></div>}
      {r.plan && <div><dt>Partner facilities</dt><dd className="fig">{r.plan.nFacilities}</dd></div>}
      {r.plan && <div><dt>From {r.plan.home.name}</dt><dd className="fig">{km(r.plan.kmSite)} km</dd></div>}
    </dl>
    {near && <p className="lbl">{km(r.km_home)} km from {base} · {pct(data.bestOnEarth) - pct(r.score) > 0 ? `best on Earth ${pct(data.bestOnEarth)} (−${pct(data.bestOnEarth) - pct(r.score)})` : 'as good as the best on Earth'}</p>}
    {r.plan?.blockers > 0 && <p className="lbl">Watch out: {blockNotes(r).map(n => n.long).join(', ')}</p>}
    <p className="lbl"><em className={'tag use' + (r.known ? ' used' : ' free')}>{r.known ? 'Already used for tests' : 'Not used for tests yet'}</em> {r.known?.text}</p>
  </aside>)
}

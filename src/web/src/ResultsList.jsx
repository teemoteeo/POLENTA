import './card.css'
import { pct, km, blockNotes } from './format.js'
import { placeName } from './i18n.js'
import { HOMES, RADII } from './homes.js'

export default function ResultsList({ data, mode, onMode, home, onHome, onPick, radius, onRadius, hideKnown, onHideKnown, showAgencies, onShowAgencies }) {
  const near = mode === 'near'
  const base = home.name
  return (<div className="reslist">
    <h2>{near ? `Near ${base}` : mode === 'new' ? 'Unexplored places' : 'Where to run it on Earth'}</h2>
    <div className="seg" role="group" aria-label="Mode">
      {[['earth', 'Best on Earth'], ['new', 'Unexplored'], ['near', 'Near you']].map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} aria-pressed={mode === k} onClick={() => onMode(k)}>{l}</button>)}
    </div>
    {near && <p className="lbl near-ctl">Base
      <span className="seg" role="group" aria-label="Base">
        {HOMES.map(h => <button key={h.id} className={h.id === home.id ? 'on' : ''} aria-pressed={h.id === home.id} onClick={() => onHome(h)}>{h.name}</button>)}
      </span>within
      <span className="seg" role="group" aria-label="Radius">
        {RADII.map(r => <button key={r} className={r === radius ? 'on' : ''} aria-pressed={r === radius} onClick={() => onRadius(r)}>{r.toLocaleString('en')} km</button>)}
      </span></p>}
    {near && !data && <p className="lbl">Loading places near {base}...</p>}
    {near && data && !data.results.length && <p className="lbl">No bare-ground hexagon within {radius.toLocaleString('en')} km of {base} is among the 10,000 most similar for this test.</p>}
    {near && data && data.results.length > 0 && <p className="lbl">The best places within {radius.toLocaleString('en')} km of {base}, and how much similarity you give up against the best place on Earth ({data.bestOnEarth != null ? pct(data.bestOnEarth) : 'n/a'}/100).</p>}
    {data && <>
    {mode === 'new' && <p className="lbl">{data.results.length ? 'The most similar places that nobody tests in yet: outside well-studied analogue regions and more than 150 km from any known test site.' : 'None of the 20 most similar places for this test is outside the well-studied analogue regions.'}</p>}
    {mode === 'earth' && <p className="lbl">Ranked by similarity to the target site. Each place also shows its campaign: share of the test that holds in the field, partner facilities for the rest, distance from {base}.</p>}
    <ol className="list">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className="res" onClick={() => onPick(i)}>
            {!near && (i === 0 || i === data.easiest) && <span className="res-tags">
              {i === 0 && <em className="tag rec res-rec">most similar</em>}
              {i === data.easiest && <em className="tag res-rec">simplest campaign</em>}
            </span>}
            <span className="res-top">
              <b className="fig">{i + 1}</b><span className="res-name">{placeName(r.name)}</span>
              <span className="res-share fig" title="Weighted similarity over the test parameters; each parameter's sensor is listed in the place card">{pct(r.score)}<small>/100 similar</small></span>
            </span>
            {near && <small className="lbl res-sub">{km(r.km_home)} km from {base} · sim {pct(r.score)} · {pct(data.bestOnEarth) - pct(r.score) > 0 ? `best on Earth ${pct(data.bestOnEarth)} (−${pct(data.bestOnEarth) - pct(r.score)})` : 'as good as the best on Earth'}</small>}
            {r.plan && <small className="lbl res-sub">{r.country} · campaign: {pct(r.plan.fieldShare)}% in the field + {r.plan.nFacilities} {r.plan.nFacilities === 1 ? 'facility' : 'facilities'} · {km(r.plan.kmSite)} km from {r.plan.home.name}</small>}
            {r.plan?.blockers > 0 && <small className="lbl res-sub">Watch out: {blockNotes(r).map(n => n.long).join(', ')}</small>}
            <span className="res-flag"><em className={'tag use' + (r.known ? ' used' : ' free')} title={r.known ? r.known.text : 'Outside well-studied analogue regions and more than 150 km from any known test site'}>{r.known ? 'Already used for tests' : 'Not used for tests yet'}</em>
              {r.known && <small className="lbl">{r.known.text}</small>}</span>
          </button>
        </li>
      ))}
    </ol>
    </>}
    <p className="lbl disclaimer">Model output, not a site survey: 30 m terrain and ~1 km satellite data averaged over ~250 km² hexagons; lunar and Martian values from literature and LOLA. Check the place before planning a campaign. See Method & data for limits.</p>
  </div>)
}

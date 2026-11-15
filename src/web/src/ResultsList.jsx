import './card.css'
import { pct, km, blockNotes } from './format.js'
import { placeName } from './i18n.js'
import { HOMES, RADIUS_KM } from './homes.js'

export default function ResultsList({ data, mode, onMode, home, onHome, onPick, hideKnown, onHideKnown, showAgencies, onShowAgencies }) {
  const near = mode === 'near'
  const base = home.name
  return (<div className="reslist">
    <h2>{near ? `Near ${base}` : 'Where to run it on Earth'}</h2>
    <div className="seg" role="group" aria-label="Mode">
      {[['earth', 'Best on Earth'], ['near', 'Near you']].map(([k, l]) => <button key={k} className={mode === k ? 'on' : ''} aria-pressed={mode === k} onClick={() => onMode(k)}>{l}</button>)}
    </div>
    {near && <p className="lbl near-ctl">Base
      <span className="seg" role="group" aria-label="Base">
        {HOMES.map(h => <button key={h.id} className={h.id === home.id ? 'on' : ''} aria-pressed={h.id === home.id} onClick={() => onHome(h)}>{h.name}</button>)}
      </span>within {RADIUS_KM.toLocaleString('en')} km</p>}
    {near && !data && <p className="lbl">Loading places near {base}...</p>}
    {near && data && !data.results.length && <p className="lbl">No bare-ground hexagon within {RADIUS_KM.toLocaleString('en')} km of {base} is among the 10,000 most similar for this test.</p>}
    {near && data && data.results.length > 0 && <p className="lbl">The best places within {RADIUS_KM.toLocaleString('en')} km of {base}, and how much similarity you give up against the best place on Earth ({data.bestOnEarth != null ? pct(data.bestOnEarth) : 'n/a'}/100).</p>}
    {data && <>
    {!near && <p className="lbl">Ranked by similarity to the target site. Each place also shows its campaign: share of the test that holds in the field, partner facilities for the rest, distance from {base}.</p>}
    <div className="toggles">
      {!near && <label className="switch"><input type="checkbox" checked={hideKnown} onChange={e => onHideKnown(e.target.checked)} /><i />
        <span>Hide well-studied analogue regions and known test sites (≤150 km){hideKnown && data.hidden > 0 ? ` · ${data.hidden} of the top 5 hidden` : ''}</span></label>}
      <label className="switch"><input type="checkbox" checked={showAgencies} onChange={e => onShowAgencies(e.target.checked)} /><i />
        <span>Show space agency centers</span></label>
    </div>
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
            {near && <small className="lbl res-sub">{km(r.km_home)} km from {base} · sim {pct(r.score)} · best on Earth {pct(data.bestOnEarth)} (−{pct(data.bestOnEarth) - pct(r.score)})</small>}
            {r.plan && <small className="lbl res-sub">{r.country} · campaign: {pct(r.plan.fieldShare)}% in the field + {r.plan.nFacilities} {r.plan.nFacilities === 1 ? 'facility' : 'facilities'} · {km(r.plan.kmSite)} km from {r.plan.home.name}</small>}
            {r.plan?.blockers > 0 && <small className="lbl res-sub">Watch out: {blockNotes(r).map(n => n.long).join(', ')}</small>}
            <small className={'lbl res-sub' + (r.known ? '' : ' new')}>{r.known ? `Not new: ${r.known.text}` : 'New site: outside well-studied analogue regions'}</small>
          </button>
        </li>
      ))}
    </ol>
    </>}
    <p className="lbl disclaimer">Model output, not a site survey: 30 m terrain and ~1 km satellite data averaged over ~250 km² hexagons; lunar and Martian values from literature and LOLA. Check the place before planning a campaign. See Method & data for limits.</p>
  </div>)
}

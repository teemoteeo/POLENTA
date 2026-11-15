import './card.css'
import { pct, km, blockNotes } from './format.js'
import { placeName } from './i18n.js'

export default function ResultsList({ data, onPick, hideKnown, onHideKnown, showAgencies, onShowAgencies }) {
  return (<div className="reslist">
    <h2>Where to run it on Earth</h2>
    <p className="lbl">Ranked by similarity to the target site. Each place also shows its campaign: share of the test that holds in the field, partner facilities for the rest, distance from Turin.</p>
    <div className="toggles">
      <label className="switch"><input type="checkbox" checked={hideKnown} onChange={e => onHideKnown(e.target.checked)} /><i />
        <span>Hide well-studied analogue regions and known test sites (≤150 km){hideKnown && data.hidden > 0 ? ` · ${data.hidden} of the top 5 hidden` : ''}</span></label>
      <label className="switch"><input type="checkbox" checked={showAgencies} onChange={e => onShowAgencies(e.target.checked)} /><i />
        <span>Show space agency centers</span></label>
    </div>
    <ol className="list">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className="res" onClick={() => onPick(i)}>
            {(i === 0 || i === data.easiest) && <span className="res-tags">
              {i === 0 && <em className="tag rec res-rec">most similar</em>}
              {i === data.easiest && <em className="tag res-rec">simplest campaign</em>}
            </span>}
            <span className="res-top">
              <b className="fig">{i + 1}</b><span className="res-name">{placeName(r.name)}</span>
              <span className="res-share fig">{pct(r.score)}<small>/100 similar</small></span>
            </span>
            <small className="lbl res-sub">{r.country} · campaign: {pct(r.plan.fieldShare)}% in the field + {r.plan.nFacilities} {r.plan.nFacilities === 1 ? 'facility' : 'facilities'} · {km(r.plan.kmSite)} km from Turin</small>
            {r.plan.blockers > 0 && <small className="lbl res-sub">Watch out: {blockNotes(r).map(n => n.long).join(', ')}</small>}
            <small className={'lbl res-sub' + (r.known ? '' : ' new')}>{r.known ? `Not new: ${r.known.text}` : 'New site: outside well-studied analogue regions'}</small>
          </button>
        </li>
      ))}
    </ol>
    <p className="lbl disclaimer">Model output, not a site survey: 30 m terrain and ~1 km satellite data averaged over ~250 km² hexagons; lunar and Martian values from literature and LOLA. Check the place before planning a campaign. See Method & data for limits.</p>
  </div>)
}

import './card.css'
import { pct, km, blockNotes } from './format.js'
import { placeName } from './i18n.js'

export default function ResultsList({ data, onPick }) {
  return (<div className="reslist">
    <h2>Where to run it on Earth</h2>
    <p className="lbl">Ranked by simplest campaign: workable places first, then share of the test covered in the field, then km from Turin.</p>
    <ol className="list">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className="res" onClick={() => onPick(i)}>
            {i === 0 && <em className="tag rec res-rec">simplest campaign</em>}
            <span className="res-top">
              <b className="fig">{i + 1}</b><span className="res-name">{placeName(r.name)}</span>
              <span className="res-share fig">{pct(r.plan.fieldShare)}%<small>field</small></span>
            </span>
            <small className="lbl res-sub">{r.country} · {r.plan.nFacilities} {r.plan.nFacilities === 1 ? 'facility' : 'facilities'} · {km(r.plan.kmSite)} km · sim {pct(r.score)}</small>
            {r.plan.blockers > 0 && <small className="lbl res-sub">Ranks lower: {blockNotes(r).map(n => n.long).join(', ')}</small>}
          </button>
        </li>
      ))}
    </ol>
  </div>)
}

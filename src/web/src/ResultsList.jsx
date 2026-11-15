import './card.css'
import { pct } from './format.js'
import { placeName } from './i18n.js'

export default function ResultsList({ data, onPick }) {
  return (<>
    <h2>Where to run it on Earth</h2>
    <p className="lbl">Ranked by simplest campaign: most of the test covered in the field, then fewest km from Turin.</p>
    <ol className="list">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className="row res" onClick={() => onPick(i)}>
            <span><b className="fig">{i + 1}</b> {placeName(r.name)}<small> · {r.country}</small></span>
            <span className="res-meta">
              <span className="fig">{pct(r.plan.fieldShare)}% field · {r.plan.nFacilities} facilities · {r.plan.kmTotal.toLocaleString('en-US')} km</span>
              <small className="lbl">similarity {pct(r.score)}</small>
            </span>
          </button>
        </li>
      ))}
    </ol>
  </>)
}

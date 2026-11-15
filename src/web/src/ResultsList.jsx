import './card.css'
import { pct, km } from './format.js'
import { placeName } from './i18n.js'

export default function ResultsList({ data, onPick }) {
  return (<>
    <h2>Where to run it on Earth</h2>
    <p className="lbl">Ranked by simplest campaign: places you can actually work in first (bare ground, more than 3 snow-free months), then most of the test covered in the field, then fewest km from Turin.</p>
    <ol className="list">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className="row res" onClick={() => onPick(i)}>
            <span><b className="fig">{i + 1}</b> {placeName(r.name)}<small> · {r.country}</small>
              {i === 0 && <em className="tag rec">simplest campaign</em>}</span>
            <span className="res-meta">
              <span className="fig">{pct(r.plan.fieldShare)}% field · {r.plan.nFacilities} facilities · {km(r.plan.kmTotal)} km</span>
              <small className="lbl">similarity {pct(r.score)}</small>
            </span>
          </button>
        </li>
      ))}
    </ol>
  </>)
}

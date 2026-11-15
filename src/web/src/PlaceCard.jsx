import './card.css'
import { coord, num, pct, phys, H3_KM2 } from './format.js'
import { label, placeName, facilityName, whyEN } from './i18n.js'
import { BREAKS } from './campaign.js'

export default function PlaceCard({ data, picked, site, test, testId, onJump }) {
  const result = data.results[picked]
  const rows = result.plan.rows
  const names = l => l.map(r => label(r.p).toLowerCase()).join(', ')
  const good = rows.filter(r => r.s >= 0.7), bad = rows.filter(r => r.s < BREAKS)
  const d = result.dossier
  return (<>
    <ol className="places">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className={i === picked ? 'on' : ''} onClick={() => onJump(i)} aria-current={i === picked}>
            <b className="fig">{i + 1}</b><span>{placeName(r.name)}</span><span className="fig score">{pct(r.score)}</span>
          </button>
        </li>
      ))}
    </ol>
    <h2>{placeName(result.name)}</h2>
    <p className="lbl">{result.country} · <span className="fig">{coord(result.lat, 'N', 'S')} {coord(result.lon, 'E', 'W')}</span> ·{' '}
      <a href={`https://www.google.com/maps/@${result.lat},${result.lon},40000m/data=!3m1!1e3`} target="_blank" rel="noreferrer">satellite view</a></p>
    <p className="verdict"><b className="fig">{pct(result.score)}</b><span>out of 100: how closely it matches {site.name} for {test.name.toLowerCase()}</span></p>
    <p className="chips">
      <span className="tag">{result.new ? 'new site' : 'known test site'}</span>
      <span className="tag">{result.h3_cells.length === 1 ? '1 hexagon' : result.h3_cells.length + ' hexagons'} · ~{num(result.h3_cells.length * H3_KM2, 0)} km²</span>
      <span className="tag">data on {pct(result.kappa)}% of the weight</span>
    </p>

    <h3>Why here</h3>
    <p className="lbl">
      {good.length ? `Matches ${site.name} on ${names(good)}.` : `No parameter matches ${site.name} fully: this is the least distant place.`}
      {bad.length ? ` Breaks on ${names(bad)}.` : ''}
    </p>
    <ul className="bars">
      {rows.map(({ p, s, w }) => (
        <li key={p} className={s < BREAKS ? 'brk' : ''}>
          <span>{label(p)}</span>
          <i><b style={{ width: pct(s) + '%' }} /></i>
          <span className="fig">{s < BREAKS ? 'breaks' : pct(s)}</span>
          <small className="lbl">weight {pct(w)}% · here {phys(p, result.values[p])} · {site.name} {phys(p, result.target[p])}</small>
        </li>
      ))}
    </ul>

    <h3>Where the analogy breaks</h3>
    <ul className="cover">
      {result.breaks.map(b => (
        <li key={b.param}><span>{label(b.param)} <small className="lbl">· {whyEN(b.why)}</small></span>
          <span className="lbl">→ {b.covered_by.map(facilityName).join(' · ') || 'no facility listed'}</span></li>
      ))}
    </ul>

    <h3>On site</h3>
    <dl className="facts">
      <dt>Snow-free months</dt><dd className="fig">{d.snow_free_months} of 12</dd>
      <dt>Low-angle sun (0–7°)</dt><dd className="fig">{num(d.low_sun_hours)} h per day</dd>
      {d.wind_10m != null && <><dt>Wind at 10 m</dt><dd className="fig">{num(d.wind_10m)} m/s</dd></>}
      <dt>Night lights</dt><dd className="fig">{num(d.night_lights, 2)} <small className="lbl">(city: above 5)</small></dd>
      <dt>Protected area</dt><dd>{d.protected_area ? d.protected_area_name || 'yes' : 'no'}</dd>
      <dt>Terrain</dt><dd>{d.terrain_src === '30m' ? 'measured at 30 m' : 'estimated from 500 m'}</dd>
    </dl>
  </>)
}

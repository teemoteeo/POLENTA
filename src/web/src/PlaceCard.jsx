import './card.css'
import { coord, num, pct, phys, km, H3_KM2, blockNotes } from './format.js'
import { label, dimension, placeName, facilityName, rock } from './i18n.js'

const val = (p, v) => p === 'rock_class' && v != null ? [].concat(v).map(rock).join(', ') : phys(p, v)
const join = l => l.length ? l.join(', ') : ''
const names = rows => join(rows.map(r => label(r.p).toLowerCase()))

const short = f => {
  const n = facilityName(f.name).replace(/\s*\(.*?\)/g, '').trim()
  const [a, ...b] = n.split(', ')
  const the = /^(?:\d|[A-Z][a-z]+ (?:[a-z]|[A-Z][a-z]+ [a-z])|Mars Terrain|Rock Yard|Chamber|Neutral|Flat|Lunar Lab|Lunar Surface)/.test(a) || /^[A-Z]+ [a-z]/.test(a) ? 'the ' : ''
  return `${the}${a} ${b.length ? 'at ' + b.join(', ') : 'in ' + placeName(f.place).split(',')[0]}`
}
const list = l => l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`
const where = fs => {
  const s = [...fs].sort((x, y) => x.km_client - y.km_client)
  return s.length > 3 ? `${s.slice(0, 2).map(short).join(', ')} and ${s.length - 2} more partner facilities` : list(s.map(short))
}

export function verdict(result, site, test) {
  const { plan } = result, d = result.dossier, f = plan.facilities
  const t = test.name.charAt(0).toLowerCase() + test.name.slice(1)
  const whole = plan.fieldShare >= 0.995 && !plan.rows.some(r => r.state === 'breaks')
  const sun = plan.sunHint != null ? ', low-angle sunlight by timing the runs' : ''
  const out = whole
    ? `Run ${t} for ${site.name} here: the whole test holds in the field${sun}.${f.length ? ` Only what Earth never reproduces goes indoors, at ${where(f)}.` : ''}`
    : `Run ${t} for ${site.name} here: ${pct(plan.fieldShare)}% of the test holds in the field${sun}.${f.length ? ` Close the rest at ${where(f)}.` : ''}`
  const lim = [plan.warnings.includes('season') && `${d.snow_free_months} snow-free ${d.snow_free_months === 1 ? 'month' : 'months'} a year`, plan.warnings.includes('bare') && `only ${pct(d.valid_share)}% of the hexagon is bare ground`].filter(Boolean)
  return plan.blockers > 0 && lim.length ? `${out} Access is the limit: ${lim.join(', ')}.` : out
}

function Step({ n, title, children }) {
  return <h3 className="step"><b className="fig">{n}</b>{title}</h3>
}

export default function PlaceCard({ data, picked, site, test, onJump }) {
  const result = data.results[picked]
  const { plan } = result
  const { rows } = plan
  const d = result.dossier
  const holds = rows.filter(r => r.state === 'holds'), partial = rows.filter(r => r.state === 'partial'), broken = rows.filter(r => r.state === 'breaks')
  const sentence = [
    !broken.length && !partial.length ? 'Nothing breaks in the field.' : '',
    holds.length ? `Holds: ${names(holds)}.` : 'Nothing holds fully here.',
    partial.length ? `Partial: ${names(partial)}.` : '',
    broken.length ? `Breaks: ${names(broken)}.` : '',
  ].filter(Boolean).join(' ')
  const groups = []
  for (const r of rows) {
    const g = dimension(r.p) || 'Other'
    let grp = groups.find(x => x.g === g)
    if (!grp) groups.push(grp = { g, rows: [] })
    grp.rows.push(r)
  }
  const warn = {
    bare: () => `only ${pct(d.valid_share)}% of the hexagon is bare ground`,
    permit: () => `protected area: permit needed${d.protected_area_name ? ` (${d.protected_area_name})` : ''}`,
    terrain_est: () => 'terrain estimated from 500 m data',
    season: () => `${d.snow_free_months} snow-free ${d.snow_free_months === 1 ? 'month' : 'months'} a year`,
  }
  const sims = (result.campaign?.simulants || []).map(s => s.name.replace(/\s*\(.*?\)/g, ''))
  const bar = [['holds', plan.fieldShare], ['partial', plan.partialShare], ['breaks', plan.brokenShare]]
  const facs = [...plan.facilities].sort((x, y) => x.km_client - y.km_client)
  return (<div className="campaign">
    <ol className="places">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className={i === picked ? 'on' : ''} onClick={() => onJump(i)} aria-current={i === picked}>
            <b className="fig">{i + 1}</b>
            <span>{placeName(r.name)}{r.plan.blockers > 0 && <small> · {blockNotes(r).map(n => n.short).join(', ')}</small>}</span>
            <span className="fig score">{pct(r.plan.fieldShare)}%</span>
          </button>
        </li>
      ))}
    </ol>

    <p className="lbl eyebrow">{test.name} campaign for {site.name}</p>
    <h2>{placeName(result.name)}</h2>
    <p className="lbl">{result.country} · <span className="fig">{coord(result.lat, 'N', 'S')} {coord(result.lon, 'E', 'W')}</span> ·{' '}
      <a href={`https://www.google.com/maps/@${result.lat},${result.lon},40000m/data=!3m1!1e3`} target="_blank" rel="noreferrer">satellite view</a></p>

    <p className="verdict-line">{verdict(result, site, test)}</p>

    <div className="heads">
      <p><b className="fig key">{pct(plan.fieldShare)}%</b><span>of the test, in field</span></p>
      <p><b className="fig">{plan.nFacilities}</b><span>partner {plan.nFacilities === 1 ? 'facility' : 'facilities'}</span></p>
      <p><b className="fig">{km(plan.kmSite)}</b><span>km from Turin</span></p>
    </div>
    <div className="stack" role="img" aria-label={bar.map(([k, v]) => `${k} ${pct(v)}%`).join(', ')}>
      {bar.map(([k, v]) => <i key={k} className={k} style={{ width: v * 100 + '%' }} />)}
    </div>
    <p className="lbl legend">{bar.map(([k, v]) => <span key={k}><i className={k} />{k} {pct(v)}%</span>)}</p>

    {plan.warnings.length > 0 && <p className="chips">{plan.warnings.map(w => <span className="tag warn" key={w}>{warn[w]()}</span>)}</p>}

    <Step n="1" title="In the field" />
    <p className="lbl">{sentence}</p>
    {groups.map(({ g, rows }) => (
      <div key={g}>
        <p className="lbl grp">{g}</p>
        <ul className="bars">
          {rows.map(({ p, s, state }) => {
            const timing = p === 'low_sun_frac' && plan.sunHint != null && state === 'breaks'
            return (
              <li key={p} className={state === 'breaks' && !timing ? 'brk' : ''}>
                <span title={label(p)}>{label(p)}</span>
                <i><b style={{ width: pct(s) + '%' }} /></i>
                <span className="fig">{timing ? 'by timing' : state === 'breaks' ? 'breaks' : state === 'partial' ? 'partial' : pct(s)}</span>
              </li>
            )
          })}
        </ul>
        <details className="vals">
          <summary>Show values</summary>
          <ul>{rows.map(({ p, w }) => (
            <li key={p}><b>{label(p)}</b> weight {pct(w)}% · here {val(p, result.values?.[p])} · {site.name} {val(p, result.target?.[p])}</li>
          ))}</ul>
        </details>
      </div>
    ))}
    {plan.sunHint != null && <p className="note">Low-angle sunlight: this site has {num(plan.sunHint)} h a day of Sun at 0–7°. Schedule the runs then and this is covered in the field.</p>}
    <dl className="facts">
      <dt>Snow-free months</dt><dd className="fig">{d.snow_free_months} of 12</dd>
      <dt>Low-angle sun (0–7°)</dt><dd className="fig">{num(d.low_sun_hours)} h per day</dd>
      {d.wind_10m != null && <><dt>Wind at 10 m</dt><dd className="fig">{num(d.wind_10m)} m/s</dd></>}
      {d.night_lights != null && <><dt>Night lights</dt><dd className="fig">{num(d.night_lights, 2)} <small className="lbl">(city: above 5)</small></dd></>}
      <dt>Protected area</dt><dd>{d.protected_area ? d.protected_area_name || 'yes' : 'no'}</dd>
      <dt>Terrain</dt><dd>{d.terrain_src === '30m' ? 'measured at 30 m' : 'estimated from 500 m'}</dd>
    </dl>
    <p className="lbl">similarity {pct(result.score)}/100 · {result.new ? 'new site' : 'known test site'} · {result.h3_cells.length} {result.h3_cells.length === 1 ? 'hexagon' : 'hexagons'} ~{num(result.h3_cells.length * H3_KM2, 0)} km² · data on {pct(result.kappa)}% of the weight</p>

    <Step n="2" title="Indoors, partner facilities" />
    <p className="lbl">{plan.inTurin.length} in Turin · {plan.nFacilities} {plan.nFacilities === 1 ? 'facility' : 'facilities'} in {plan.nStops} {plan.nStops === 1 ? 'location' : 'locations'}</p>
    {facs.map(f => (
      <div className="fac" key={f.id}>
        <p><b>{facilityName(f.name)}</b>
          <span className="tag">{f.km_client <= 50 ? 'in Turin' : `${km(f.km_client)} km`}</span></p>
        <p className="lbl">{placeName(f.place)}
          {typeof f.source === 'string' && f.source.startsWith('http') && <> · <a href={f.source} target="_blank" rel="noreferrer">source</a></>}</p>
        <p className="lbl">closes: {join(f.covers.map(c => label(c).toLowerCase()))}</p>
      </div>
    ))}
    {plan.fixedGaps.length > 0 && <p className="lbl">Earth never reproduces: {join(plan.fixedGaps.map(g => label(g.param).toLowerCase()))}. These are always indoor.</p>}

    <Step n="3" title="Still open" />
    {plan.uncovered.length
      ? <ul className="open">{plan.uncovered.map(u => <li key={u.param}>{label(u.param)}</li>)}</ul>
      : <p className="lbl">Nothing: every gap has a facility.</p>}

    {sims.length > 0 && <p className="lbl">Regolith simulants for this terrain: {join(sims)}</p>}
    <p className="lbl">No cost figures: the plan counts what can be measured — share covered, facilities, km.</p>
  </div>)
}

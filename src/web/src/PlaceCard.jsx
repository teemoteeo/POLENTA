import './card.css'
import { coord, num, pct, km, H3_KM2, blockNotes } from './format.js'
import { label, dimension, placeName, facilityName } from './i18n.js'
import { val, join, names, verdict, brief, warnText } from './brief.js'
import { useState } from 'react'
import { sensor, SIMULINK_CTX } from './data.js'
import { buildPackage, download } from './simulink.js'
import { buildReport, reportName } from './report.js'

export { brief, verdict }

// la fonte di un dato: sensore breve, nome completo al passaggio del mouse
function Src({ p, world }) {
  const s = sensor(p, world)
  return s ? <span className="src" title={s.full}>{s.short}</span> : null
}

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function copy(text) {
  try {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).then(() => true, () => false)
    const t = document.createElement('textarea')
    t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(t); t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return Promise.resolve(ok)
  } catch { return Promise.resolve(false) }
}

function CopyBrief({ text }) {
  const [done, setDone] = useState(false)
  return (<p className="copy-row">
    <button type="button" className="tag copy" onClick={() => copy(text).then(ok => { if (!ok) return; setDone(true); setTimeout(() => setDone(false), 1500) })}>Copy brief</button>
    <span className="lbl" aria-live="polite">{done ? 'Copied' : ''}</span>
  </p>)
}

// Download del posto mostrato: il pacchetto MATLAB / Simulink (.zip: i due .mat, init_polenta.m, README e fonti) e il
// report dei dati in stile articolo (report.js). Si costruiscono al clic, non a ogni render della card.
function Downloads({ site, testId, testName, result }) {
  const name = placeName(result.name)
  const zip = () => { const p = buildPackage(site, testId, result, name, SIMULINK_CTX); download(p.names.zip, p.zip, 'application/zip') }
  const report = () => {
    const html = buildReport(site, testId, testName, result, { ...SIMULINK_CTX, label, placeName,
      earthSource: p => sensor(p, 'earth')?.full })
    download(reportName(site, testId, name), html, 'text/html;charset=utf-8')
  }
  return (<>
    <p className="lbl">Data for {site.name} and this place: a report with tables and references (opens in the browser, prints to PDF), and a MATLAB / Simulink package with the same values in SI units.</p>
    <p className="copy-row">
      <button type="button" className="tag copy dl" onClick={report}>Data report (.html)</button>
      <button type="button" className="tag copy dl" onClick={zip}>Simulink package (.zip)</button>
    </p>
  </>)
}

function Step({ n, title, children }) {
  return <h3 className="step"><b className="fig">{n}</b>{title}</h3>
}

function Places({ data, picked, onJump }) {
  return (
    <ol className="places">
      {data.results.map((r, i) => (
        <li key={r.id}>
          <button className={i === picked ? 'on' : ''} onClick={() => onJump(i)} aria-current={i === picked}>
            <b className="fig">{i + 1}</b>
            <span>{placeName(r.name)}{r.plan?.blockers > 0 && <small> · {blockNotes(r).map(n => n.short).join(', ')}</small>}</span>
            <span className="fig score">{pct(r.score)}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

export default function PlaceCard({ data, picked, site, test, testId, onJump }) {
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
  const sims = (result.campaign?.simulants || []).map(s => s.name.replace(/\s*\(.*?\)/g, ''))
  const bar = [['holds', plan.fieldShare], ['partial', plan.partialShare], ['breaks', plan.brokenShare], ['no data', plan.nodataShare]].filter(([, v]) => v > 0)
  const facs = [...plan.facilities].sort((x, y) => x.km_client - y.km_client)
  return (<div className="campaign">
    <Places data={data} picked={picked} onJump={onJump} />

    <p className="lbl eyebrow">{test.name} campaign for {site.name}</p>
    <h2>{placeName(result.name)}</h2>
    <p className="lbl">{result.country} · <span className="fig">{coord(result.lat, 'N', 'S')} {coord(result.lon, 'E', 'W')}</span> ·{' '}
      <a href={`https://www.google.com/maps/@${result.lat},${result.lon},40000m/data=!3m1!1e3`} target="_blank" rel="noreferrer">satellite view</a></p>

    <p className="verdict-line">{verdict(result, site, test)}</p>
    <CopyBrief text={brief(result, site, test)} />

    <div className="heads">
      <p><b className="fig key">{pct(result.score)}</b><span>similarity /100</span></p>
      <p><b className="fig">{pct(plan.fieldShare)}%</b><span>of the test, in field</span></p>
      <p><b className="fig">{plan.nFacilities}</b><span>partner {plan.nFacilities === 1 ? 'facility' : 'facilities'}</span></p>
      <p><b className="fig">{km(plan.kmSite)}<small> km</small></b><span>from {plan.home.name}</span></p>
    </div>
    {data.bestOnEarth != null && result.km_home != null && <p className="lbl">Near {plan.home.name}: {km(result.km_home)} km away, similarity {pct(result.score)} against {pct(data.bestOnEarth)} for the best place on Earth.</p>}
    <div className="stack" role="img" aria-label={bar.map(([k, v]) => `${k} ${pct(v)}%`).join(', ')}>
      {bar.map(([k, v]) => <i key={k} className={k.replace(' ', '')} style={{ width: v * 100 + '%' }} />)}
    </div>
    <p className="lbl legend">{bar.map(([k, v]) => <span key={k}><i className={k.replace(' ', '')} />{k} {pct(v)}%</span>)}<span>· data on {pct(result.kappa)}% of the weight (κ)</span></p>

    {plan.warnings.length > 0 && <p className="chips">{plan.warnings.map(w => <span className="tag warn" key={w}>{warnText(w, d)}</span>)}</p>}

    <Step n="1" title="In the field" />
    <p className="lbl">{sentence}</p>
    {groups.map(({ g, rows }) => (
      <div key={g}>
        <p className="lbl grp">{g}</p>
        <ul className="vals">
          {rows.map(({ p, s, state }) => {
            const timing = p === 'low_sun_frac' && plan.sunHint != null && state === 'breaks'
            const tgt = val(p, result.target?.[p])
            return (
              <li key={p} className={state === 'breaks' && !timing ? 'brk' : ''} title={`${site.name}: ${tgt}`}>
                <span className="vl">{label(p)} <Src p={p} world="earth" /></span>
                <span className="fig vv">{val(p, result.values?.[p])}</span>
                <span className={'fig vm' + (s != null && state !== 'nodata' && pct(s) >= 85 ? ' hi' : '')}>{state === 'nodata' || s == null ? 'no data' : pct(s) + '% match'}</span>
                <small className="vt">{site.name}: <span className="fig">{tgt}</span> <Src p={p} world={site.world} /></small>
              </li>
            )
          })}
        </ul>
      </div>
    ))}
    <p className="lbl">For each parameter: the sensor or dataset it comes from, its value at this place, how closely it matches {site.name}, and below the value at {site.name} with its own sensor.</p>
    {plan.sunHint != null && <p className="note">Low-angle sunlight: this site has {num(plan.sunHint)} h a day of Sun at 0–7°. Schedule the runs then and this is covered in the field.</p>}
    {d.snow_free_mask && <div className="window">
      <p className="lbl">Test window: snow-free months{d.best_month ? <>, best month <b>{MONTHS_LONG[d.best_month - 1]}</b> (lowest Sun without snow)</> : ''} <Src p="snow_free_months" world="earth" /> <Src p="low_sun_hours" world="earth" /></p>
      <ol className="months">{MONTHS.map((m, i) => <li key={i} className={(d.snow_free_mask[i] === '1' ? 'ok' : '') + (d.best_month === i + 1 ? ' best' : '')} title={MONTHS_LONG[i]}>{m}</li>)}</ol>
    </div>}
    <dl className="facts">
      <dt>Snow-free months</dt><dd className="fig">{d.snow_free_months} of 12 <Src p="snow_free_months" world="earth" /></dd>
      <dt>Low-angle sun (0–7°)</dt><dd className="fig">{num(d.low_sun_hours)} h per day <Src p="low_sun_hours" world="earth" /></dd>
      {d.wind_10m != null && <><dt>Wind at 10 m</dt><dd className="fig">{num(d.wind_10m)} m/s <Src p="wind_10m" world="earth" /></dd></>}
      {d.night_lights != null && <><dt>Night lights</dt><dd className="fig">{num(d.night_lights, 2)} <small className="lbl">(city: above 3.5)</small> <Src p="night_lights" world="earth" /></dd></>}
      <dt>Protected area</dt><dd>{d.protected_area ? d.protected_area_name || 'yes' : 'no'} <Src p="protected_area" world="earth" /></dd>
      {d.valid_share != null && <><dt>Bare ground</dt><dd className="fig">{pct(d.valid_share)}% of the hexagon <Src p="valid_share" world="earth" /></dd></>}
      <dt>Terrain</dt><dd>{d.terrain_src === '30m' ? 'measured at 30 m' : 'estimated from 500 m'} <Src p="terrain_src" world="earth" /></dd>
    </dl>
    <p className="lbl">similarity {pct(result.score)}/100 · {result.known ? `not new: ${result.known.text}` : 'new site (outside well-studied analogue regions)'} · {result.h3_cells.length} {result.h3_cells.length === 1 ? 'hexagon' : 'hexagons'} ~{num(result.h3_cells.length * H3_KM2, 0)} km² · data on {pct(result.kappa)}% of the weight</p>

    <Step n="2" title="Indoors, partner facilities" />
    <p className="lbl">{plan.inTurin.length} in {plan.home.name} · {plan.nFacilities} {plan.nFacilities === 1 ? 'facility' : 'facilities'} in {plan.nStops} {plan.nStops === 1 ? 'location' : 'locations'}</p>
    {facs.map(f => (
      <div className="fac" key={f.id}>
        <p><b>{facilityName(f.name)}</b>
          <span className="tag">{f.km_client <= 50 ? `in ${plan.home.name}` : `${km(f.km_client)} km`}</span></p>
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
    <Downloads site={site} testId={testId} testName={test.name} result={result} />
    <p className="lbl disclaimer">Limits: values are averages over a ~250 km² hexagon from 30 m terrain and ~1 km satellite data; Earth ground ice is a MODIS temperature proxy; rock type is coarse (GLiM, ~55 km); Mars and Aristarchus terrain come from literature; Antarctica is not covered. Verify on site before planning.</p>
  </div>)
}

import { coord, num, pct, phys, km } from './format.js'
import { label, placeName, facilityName, rock } from './i18n.js'

export const val = (p, v) => p === 'rock_class' && v != null ? [].concat(v).map(rock).join(', ') : phys(p, v)
export const join = l => l.length ? l.join(', ') : ''
export const names = rows => join(rows.map(r => label(r.p).toLowerCase()))

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


export const warnText = (w, d) => ({
  bare: `only ${pct(d.valid_share)}% of the hexagon is bare ground`,
  permit: `protected area: permit needed${d.protected_area_name ? ` (${d.protected_area_name})` : ''}`,
  terrain_est: 'terrain estimated from 500 m data',
  season: `${d.snow_free_months} snow-free ${d.snow_free_months === 1 ? 'month' : 'months'} a year`,
})[w]

// Plain-text brief of the campaign plan, from the same data as the card.
export function brief(result, site, test) {
  const { plan } = result, d = result.dossier, rows = plan.rows
  const st = s => names(rows.filter(r => r.state === s))
  const ln = (k, v) => v ? `- ${k}: ${v}` : null
  const win = [d.snow_free_months != null && `${d.snow_free_months} snow-free ${d.snow_free_months === 1 ? 'month' : 'months'} a year`, d.wind_10m != null && `wind ${num(d.wind_10m)} m/s at 10 m`].filter(Boolean).join('; ')
  const access = `${d.protected_area ? `${d.protected_area_name || 'protected area'}: permit needed` : 'no protected area'}; terrain ${d.terrain_src === '30m' ? 'measured at 30 m' : 'estimated from 500 m'}`
  const facs = [...plan.facilities].sort((x, y) => x.km_client - y.km_client).map(f =>
    `- ${facilityName(f.name)}, ${placeName(f.place)} (${f.km_client <= 50 ? `in ${plan.home.name}` : `${km(f.km_client)} km from ${plan.home.name}`}): ${join(f.covers.map(c => label(c).toLowerCase()))}`)
  const [lat, lon] = [result.lat, result.lon]
  return [
    'FVG Station — campaign brief',
    `${test.name} for ${site.name} (${coord(site.lat, 'N', 'S')} ${coord(site.lon, 'E', 'W')})`,
    `Field site: ${placeName(result.name)}, ${result.country} (${lat}, ${lon})`,
    `https://www.google.com/maps/@${lat},${lon},40000m/data=!3m1!1e3`,
    '',
    verdict(result, site, test),
    '',
    `In the field (${pct(plan.fieldShare)}% of the test weight holds)`,
    ln('holds', st('holds')), ln('partial', st('partial')), ln('breaks', st('breaks')),
    plan.sunHint != null ? `- low-angle sunlight: ${num(plan.sunHint)} h/day at 0–7°, covered by timing` : null,
    ln('window', win), ln('access', access),
    ln('caveats', join(plan.warnings.map(w => warnText(w, d)))),
    '',
    'Indoors, partner facilities',
    ...facs,
    plan.fixedGaps.length ? `Earth never reproduces: ${join(plan.fixedGaps.map(g => label(g.param).toLowerCase()))}` : null,
    `Still open: ${plan.uncovered.length ? join(plan.uncovered.map(u => label(u.param).toLowerCase())) : 'nothing'}`,
    '',
    `Similarity to ${site.name}: ${pct(result.score)}/100, data on ${pct(result.kappa)}% of the weight.`,
    'Source: FVG Station model on NASA, ESA and JAXA open data. No cost figures: only measurable quantities.',
  ].filter(l => l != null).join('\n')
}

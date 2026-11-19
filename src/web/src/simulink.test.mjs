// Controllo dell'export MATLAB / Simulink: node src/simulink.test.mjs (da src/web) stampa "ok".
// Con OUT=<cartella> scrive anche il pacchetto .zip di ogni sito × test, per aprirlo in MATLAB o con scipy.io.loadmat.
import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { load } from 'js-yaml'
import { plan } from './campaign.js'
import { ROCK } from './names.js'
import { parseUnits, parseSoil, parseTexture, textureClass, asciiText, buildPackage, numericOnly, sourceFor, SI, SOIL_CSV_UNITS, BODY, SCHEMA, INFO_COLUMNS, fieldName } from './simulink.js'
import { crc32 } from './zip.js'
import { buildReport, reportName, fmt, unit } from './report.js'

const root = '../../data'
const tests = load(fs.readFileSync(`${root}/config/tests.yaml`, 'utf8')).tests
const targets = JSON.parse(fs.readFileSync(`${root}/export/targets.json`))
const units = parseUnits(fs.readFileSync(`${root}/config/params.csv`, 'utf8'))
const soilCsv = parseSoil(fs.readFileSync(`${root}/config/soil_mechanics.csv`, 'utf8'))
const soilTexture = parseTexture(fs.readFileSync(`${root}/config/soil_by_texture.csv`, 'utf8'))
const ctx = { units, soil: soilCsv, soilTexture, exportedAt: 'test', dataVersion: 'test', rockName: c => ROCK[c] || c, targets: Object.fromEntries(targets.map(t => [t.id, t])) }
const out = process.env.OUT
const keys = o => Object.keys(o).sort().join(',')
const NAME_MAX = 31

// unità ammesse: solo SI (angoli in gradi), più quelle di calendario e indice del dossier di campo
const SI_UNITS = new Set(['deg', 'm', 's', 'm s^-2', 'm^-2', '1', 'K^-1', 'kg m^-3', 'K', 'Pa', 'N m^-(n+1)', 'N m^-(n+2)', 'J m^-2 K^-1 s^-0.5', 'm s^-1'])
const SITE_UNITS = new Set(['1', 'month', 'month number (1-12)', 'h/day', 'm s^-1', 'nW cm^-2 sr^-1'])

// le unità del CSV del suolo sono quelle che la conversione si aspetta
for (const w of Object.values(soilCsv)) for (const s of Object.values(w)) for (const [k, u] of Object.entries(s.unit)) {
  assert.equal(u, SOIL_CSV_UNITS[k], `soil_mechanics.csv: unità di ${k} = ${u}, la conversione in SI si aspetta ${SOIL_CSV_UNITS[k]}`)
}

// testo ASCII nei .mat
assert.equal(asciiText('Martínez ± 2° §3 → kN/m⁻²'), 'Martinez +/- 2 deg sec. 3 -> kN/m^-^2')

// triangolo USDA: un punto per classe (sabbia %, argilla %)
for (const [sand, clay, cls] of [[90, 5, 'sand'], [80, 5, 'loamy sand'], [65, 10, 'sandy loam'], [40, 20, 'loam'], [20, 15, 'silt loam'],
  [5, 5, 'silt'], [30, 35, 'clay loam'], [10, 30, 'silty clay loam'], [60, 25, 'sandy clay loam'], [50, 45, 'sandy clay'],
  [5, 50, 'silty clay'], [20, 60, 'clay']]) assert.equal(textureClass(sand, clay), cls, `tessitura ${sand}/${clay}`)
assert.equal(textureClass(NaN, 10), '')
// tabella per tessitura: unità attese, valori nell'intervallo, ogni classe con i 5 parametri di Bekker più K (Janosi-Hanamoto)
for (const [u, t] of Object.entries(soilTexture)) {
  for (const [k, unit] of Object.entries(t.unit)) assert.equal(unit, SOIL_CSV_UNITS[k], `soil_by_texture ${u} ${k}`)
  for (const [k, v] of Object.entries(t.value)) assert(Number.isNaN(v) ? t.status[k] === 'not measured' : t.range[k][0] <= v && v <= t.range[k][1], `soil_by_texture ${u} ${k} fuori intervallo`)
  assert.deepEqual(Object.keys(t.value).sort(), ['K_cm', 'cohesion_kPa', 'friction_angle_deg', 'kc', 'kphi', 'n'].sort(), `soil_by_texture ${u}: parametri mancanti`)
}

// i nomi dei campi MATLAB stanno nei 31 caratteri e non hanno simboli
function names(o, where) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return
  for (const [k, v] of Object.entries(o)) {
    assert(/^[A-Za-z][A-Za-z0-9_]*$/.test(k) && k.length <= NAME_MAX, `${where}: nome di campo non valido ${k}`)
    names(v, `${where}.${k}`)
  }
}
// numeri senza rumore di virgola mobile (al massimo 6 cifre significative)
function clean(o, where) {
  if (typeof o === 'number') { if (Number.isFinite(o)) assert.equal(o, Number(o.toPrecision(6)), `${where}: ${o} non arrotondato`); return }
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) clean(v, `${where}.${k}`)
}
const onlyNumbers = o => (typeof o === 'number' ? true : Array.isArray(o) ? o.every(x => typeof x === 'number') : Object.values(o).every(onlyNumbers))

// sourceFor: tiene solo la parte del sito
assert.equal(sourceFor('Moon: A; Mars: B; Aristarchus: C', 'haworth', 'moon'), 'Moon: A')
assert.equal(sourceFor('Polar Moon: A; Aristarchus: C; Mars: D', 'haworth', 'moon'), 'Polar Moon: A')
assert.equal(sourceFor('Luna: A; Marte: B', 'haworth', 'moon'), 'Luna: A')
assert.equal(sourceFor('Moon: A; Mars: B; Aristarchus: C', 'aristarchus_plateau', 'moon'), 'Aristarchus: C')
assert.equal(sourceFor('Moon: A; Mars: B', 'aristarchus_plateau', 'moon'), 'Moon: A')
assert.equal(sourceFor('Def X; Polar Moon: A; Phoenix: B; Gale: C; Mars: D', 'gale', 'mars'), 'Def X; Gale: C; Mars: D')
assert.equal(sourceFor('senza etichette', 'gale', 'mars'), 'senza etichette')
// testo calcolato da noi con la letteratura dopo: resta il preambolo, la parte di Marte va via
assert.equal(sourceFor('computed by POLENTA: X. Literature: Moon: A; Mars: B', 'haworth', 'moon'), 'computed by POLENTA: X. Literature: Moon: A')

let n = 0
for (const site of targets) {
  for (const testId of Object.keys(tests)) {
    const f = `${root}/export/sites/${site.id}__${testId}.json`
    if (!fs.existsSync(f)) continue
    const r = JSON.parse(fs.readFileSync(f)).results[0]
    const result = { ...r, plan: plan(r, tests[testId].requisiti) }
    const pkg = buildPackage(site, testId, result, r.name, ctx)
    const { target: t, analogue: a } = pkg
    const where = `${site.id} ${testId}`

    // stesso schema: stessi campi, stessi parametri, stesse unità
    assert.equal(t.schema, SCHEMA)
    const { match, site: field, site_units, ...core } = a
    assert.equal(keys(core), keys(t), 'campi diversi tra target e analogue')
    for (const k of ['values', 'range', 'units', 'range_type', 'source', 'soil', 'physical', 'physical_units', 'physical_source', 'notes'])
      assert.equal(keys(t[k]), keys(a[k]), `${k}: ${where}`)
    assert.equal(keys(match.s), keys(Object.fromEntries(result.plan.rows.map(x => [x.p, 0]))), 'match: non sono i righi della card')
    assert.equal(keys(t.values), keys(Object.fromEntries(result.plan.rows.filter(x => x.p !== 'rock_class').map(x => [x.p, 0]))))
    names(t, where); names(a, where); clean(t, where); clean(a, where)

    // unità: ogni numero ha un'unità SI; i valori sono nell'intervallo
    for (const [k, [lo, hi]] of Object.entries(t.range)) {
      assert(SI[units[k]], `${k}: unità "${units[k]}" di params.csv senza conversione in SI`)
      assert(SI_UNITS.has(t.units[k]) && t.units[k] === a.units[k], `${where} ${k}: unità ${t.units[k]}`)
      assert(lo <= hi || Number.isNaN(lo), `${where} ${k}: intervallo rovesciato`)
      assert(Number.isNaN(t.values[k]) || (t.values[k] >= lo && t.values[k] <= hi))
      assert(t.range_type[k] && t.source[k] && t.source[k] !== 'missing', `${where} ${k}: tipo di intervallo o fonte mancante`)
      assert(!/Marte|Mars:|Phoenix|Gale/.test(t.source[k]) || site.world === 'mars' || /^(calcolato|computed by POLENTA|Definizione|Definition)/.test(t.source[k]), `${where} ${k}: fonte di Marte su un sito lunare`)
    }
    for (const [k, u] of Object.entries(t.physical_units)) assert(SI_UNITS.has(u), `physical ${k}: unità ${u}`)
    for (const [k, u] of Object.entries(t.soil.units)) assert(SI_UNITS.has(u), `soil ${k}: unità ${u}`)
    for (const [k, u] of Object.entries(site_units)) assert(SITE_UNITS.has(u) && k in field, `site ${k}: unità ${u}`)
    for (const k of ['slope_p90', 'roughness', 'crater_density'].filter(k => k in t.values))
      assert.equal(site.world === 'mars', /Mars: literature value/.test(t.notes[k] || ''), `${where} ${k}: nota su Marte`)
    assert.equal(t.gravity_m_s2, BODY[site.world].gravity)
    assert.equal(a.gravity_m_s2, 9.80665)
    assert(t.elevation_datum && a.elevation_datum && t.elevation_datum !== a.elevation_datum)

    // conversioni: temperature in kelvin, densità in kg/m3, frazioni 0-1, coesione in Pa
    const card = ctx.targets[site.id].card
    assert(Math.abs(t.physical.t_mean - (card.t_mean_k ?? card.t_mean_c + 273.15)) < 0.06, `${where}: temperatura non in K`)
    assert(t.physical.t_mean > 0 && t.physical.t_half_range >= 0)
    assert(t.physical.bulk_density_0_2m > 500 && t.physical.bulk_density_0_2m < 4000, `${where}: densità non in kg/m3`)
    for (const k of ['rock_cover', 'subsurface_ice', 'feo']) assert(t.physical[k] >= 0 && t.physical[k] <= 1, `${where} ${k}: non è una frazione`)
    if ('bulk_density_0_5' in t.values) assert(t.values.bulk_density_0_5 > 500, `${where}: bulk_density_0_5 non in kg/m3`)
    if ('rock_cover' in t.values) assert(t.values.rock_cover <= 1)

    // suolo: SI, valori nell'intervallo, NaN solo se non misurato, fonte presente
    // Terra: suolo stimato dalla classe di tessitura se il dossier ha sabbia e argilla, altrimenti NaN
    const cls = textureClass(r.dossier?.sand_pct, r.dossier?.clay_pct)
    if (cls && soilTexture[cls]) {
      assert(Number.isFinite(a.soil.kc) && a.soil.status.kc === 'estimated (texture class)' && a.soil.source.kc.includes(cls), `${where}: suolo stimato mancante`)
      assert(a.soil.source.n.includes('Wong J.Y. (2010)') && a.soil.source.n.includes('measure on site'))
    } else assert(Number.isNaN(a.soil.kc) && a.soil.status.kc === 'not measured', `${where}: suolo senza tessitura non NaN`)
    for (const k of ['range', 'units', 'source', 'status']) assert.equal(keys(t.soil[k]), keys(a.soil[k]), `soil.${k}`)
    for (const [k, [lo, hi]] of Object.entries(t.soil.range)) {
      if (Number.isNaN(t.soil[k])) { assert.equal(t.soil.status[k], 'not measured', `${site.id} ${k}: NaN senza stato`); continue }
      assert(lo <= t.soil[k] && t.soil[k] <= hi, `${site.id} soil ${k}: valore fuori intervallo`)
      assert(t.soil.source[k].length > 20, `${site.id} soil ${k}: fonte mancante`)
    }
    if (site.world === 'moon') assert(t.soil.cohesion >= 100 && t.soil.kphi >= 1e5, `${site.id}: suolo non in Pa e N/m^(n+2)`)
    if (site.world === 'mars') assert(Number.isFinite(t.soil.cohesion) && Number.isFinite(t.soil.friction_angle), `${site.id}: c e phi mancanti`)
    if (site.id === 'aristarchus_plateau') assert.equal(t.soil.friction_angle, 31)
    // K, densità dei grani, D50 (Lunar Sourcebook cap. 9), porosità ricavata, giorno solare (NSSDCA)
    if (site.world === 'moon') {
      assert(t.soil.K === 0.018 && t.soil.grain_density === 3100 && t.soil.d50 === 7e-5, `${where}: K, densità dei grani o D50 della Luna`)
      assert.deepEqual(t.soil.range.grain_density, [2300, 3200]); assert.deepEqual(t.soil.range.d50, [4e-5, 1.3e-4])
      // controllo incrociato: Lunar Sourcebook Tabella 9.5 p.492, porosità 30-60 cm 44%, 0-60 cm 46%
      assert(Math.abs(t.physical.porosity_0_2m - (1 - t.physical.bulk_density_0_2m / 3100)) < 1e-5 && t.physical.porosity_0_2m > 0.40 && t.physical.porosity_0_2m < 0.48)
    } else {
      // Marte: densità dei grani come ipotesi dichiarata (Moore 1991, USGS OFR 91-568 Tab. 6); D50 ancora senza fonte
      assert(t.soil.grain_density === 2800 && t.soil.status.grain_density === 'assumed' && t.soil.source.grain_density.includes('DECLARED ASSUMPTION'))
      // kc, kphi, n: suolo 1 di Zhou et al. 2014 Tab. III (Reece) convertito in Bekker con b = 0,16 m e g di Marte
      const reece = (c, kc_, kp_, n, rho, g, b) => [c * kc_ * b ** (1 - n), rho * g * kp_ * b ** (1 - n)]
      const [kc1, kp1] = reece(1500, 100, 1000, 1.1, 1600, 3.71, 0.16)
      assert(Math.abs(t.soil.kc - kc1) / kc1 < 1e-3 && Math.abs(t.soil.kphi - kp1) / kp1 < 1e-3 && t.soil.n === 1.1, `${where}: kc, kphi di Marte`)
      // la stessa conversione riproduce i valori di Bekker misurati sul simulante MMS (Agarwal et al., arXiv:1901.10667 Tab. 1: 846 e 6708 kN)
      const [kcM, kpM] = reece(600, 677.5, 212.2, 1.4, 1550, 9.81, 0.16)
      assert(Math.abs(kcM / 1000 - 846) < 1 && Math.abs(kpM / 1000 - 6708) / 6708 < 0.002)
      // K di Janosi-Hanamoto da altri suoli marziani (Zhou et al. 2014, Tab. III: Opportunity a Meridiani), stesso modello della Luna
      assert(t.soil.K === 0.015 && t.soil.range.K[0] === 0.012 && t.soil.range.K[1] === 0.025 && t.soil.source.K.includes('NOT measured at this site'))
      assert(t.physical.porosity_0_2m > 0.3 && t.physical.porosity_0_2m < 0.6)
    }
    assert(a.soil.grain_density === 2700 && a.soil.status.grain_density === 'literature' && !a.soil.source.grain_density.includes('texture class'), `${where}: densità dei grani della Terra`)
    if (Number.isFinite(a.physical.bulk_density_0_2m)) assert(a.physical.porosity_0_2m > 0 && a.physical.porosity_0_2m < 1)
    assert.equal(t.solar_day_s, { moon: 2551390, mars: 88774.9 }[site.world]); assert.equal(a.solar_day_s, 86400)

    // Terra: ogni grandezza del dossier finisce nel .mat, convertita
    assert(Number.isNaN(a.physical.thermal_inertia) && Number.isNaN(a.physical.feo) && a.physical.wind >= 0)
    const d = r.dossier || {}
    for (const [k, dk, conv] of [['elevation', 'elevation_m', x => x], ['t_mean', 'lst_mean_c', x => x + 273.15],
      ['t_half_range', 'lst_half_range_c', x => x], ['bulk_density_0_2m', 'bulk_density_0_2m', x => x * 1000], ['air_density', 'air_density_kgm3', x => x]]) {
      if (typeof d[dk] === 'number') assert(Math.abs(a.physical[k] - conv(d[dk])) < 1e-6, `${k}: dossier non riportato`)
      else assert(Number.isNaN(a.physical[k]))
      assert(a.physical_source[k], `${k}: fonte mancante`)
    }
    assert.notEqual(a.rock_class_name, a.rock_class, `${where}: nome della roccia mancante (${a.rock_class})`)

    // struct per Simulink: solo numeri, stessa struttura
    const tn = numericOnly(t)
    assert(onlyNumbers(tn) && Object.is(tn.soil.kphi, t.soil.kphi) && Object.is(tn.physical.t_mean, t.physical.t_mean) && !('name' in tn))

    // pacchetto (schema 3): struct piatte, stessi campi, solo numeri, unità nel nome
    const F = pkg.flat
    assert.deepEqual(Object.keys(F.target), Object.keys(F.analogue), `${where}: campi diversi tra target e analogue`)
    assert.deepEqual(Object.keys(F.target), Object.keys(F.target_range))
    assert.deepEqual(F.info.map(x => x.field), Object.keys(F.target), `${where}: info non è una riga per campo`)
    for (const x of F.info) assert.deepEqual(Object.keys(x), INFO_COLUMNS, `${where}: colonne di info`)
    for (const [k, v] of Object.entries(F.target)) {
      assert(typeof v === 'number' && typeof F.analogue[k] === 'number', `${where} ${k}: non è un numero`)
      assert(/^[A-Za-z][A-Za-z0-9_]*$/.test(k) && k.length <= NAME_MAX, `${where}: nome ${k}`)
      const [lo, hi] = F.target_range[k]
      assert(Number.isNaN(v) || (lo <= v && v <= hi), `${where} ${k}: fuori intervallo`)
    }
    for (const x of F.info) {
      assert(SI_UNITS.has(x.unit), `${where} ${x.field}: unità ${x.unit}`)
      assert.equal(x.field, fieldName(x.field.replace(/_(deg|m|s|per_m2|K|kg_m3|Pa|m_s|m_s2|per_K|tiu)$/, ''), x.unit), `${where} ${x.field}: suffisso dell'unità`)
      if (x.group === 'matched') assert(x.weight > 0 && x.target_source && x.analogue_source && x.range_type, `${where} ${x.field}: peso o fonti`)
      if (Number.isFinite(x.target) && x.group !== 'location') assert(x.target_source, `${where} ${x.field}: fonte del target`)
    }
    // stessi numeri del modello interno: gravità, suolo, temperatura, valori del voto
    assert.equal(F.target.gravity_m_s2, t.gravity_m_s2); assert.equal(F.analogue.gravity_m_s2, 9.80665)
    assert(Object.is(F.target.soil_kc, t.soil.kc) && Object.is(F.analogue.soil_kc, a.soil.kc) && Object.is(F.target.t_mean_K, t.physical.t_mean))
    assert(Object.is(F.analogue.boulder_cover, a.physical.rock_cover) && 'thermal_inertia_tiu' in F.target)
    for (const p of Object.keys(t.values)) assert(Object.is(F.analogue[fieldName(p, t.units[p])], a.values[p]), `${where} ${p}`)
    assert(F.meta.site === t.name && F.meta.test === testId && F.meta.similarity_score === r.score && F.meta.target_rock_class)
    names(F.target, where); names(F.meta, where); clean(F.target, where); clean(F.analogue, where)

    // file: un .mat valido, script e README coerenti, zip con quattro file
    const files = Object.fromEntries(pkg.files.map(x => [x.name, x.data]))
    const b = files[pkg.names.mat]
    assert.equal(b.length % 8, 0)
    assert.equal(String.fromCharCode(b[126], b[127]), 'IM')
    const m = files['init_polenta.m']
    assert(m.includes(pkg.names.mat) && m.includes('struct2table') && !m.includes('polenta_target'))
    const rd = files['README.txt']
    for (const k of Object.keys(F.target)) assert(rd.includes(k), `README: manca ${k}`)
    assert(/^[\x00-\x7f]*$/.test(rd) && /^[\x00-\x7f]*$/.test(files['SOURCES.txt']), `${where}: testo non ASCII`)
    assert(files['SOURCES.txt'].includes(asciiText(t.body_source)) && files['SOURCES.txt'].includes(asciiText(a.soil.source.kc)))
    const z = pkg.zip, zv = new DataView(z.buffer)
    assert.equal(zv.getUint32(0, true), 0x04034b50)
    const eocd = z.length - 22
    assert.equal(zv.getUint32(eocd, true), 0x06054b50)
    assert.equal(zv.getUint16(eocd + 10, true), 4)
    // primo file: CRC e dati corrispondono
    const nameLen = zv.getUint16(26, true), size = zv.getUint32(18, true)
    assert.equal(crc32(z.subarray(30 + nameLen, 30 + nameLen + size)), zv.getUint32(14, true))

    if (out) {
      fs.mkdirSync(out, { recursive: true })
      fs.writeFileSync(path.join(out, pkg.names.zip), z)
    }
    n++
  }
}
assert.equal(n, 18, `coppie sito × test: ${n}`)

// Terra con tessitura nel dossier (come dal prossimo export): franco sabbioso e argilla
{
  const site = targets[0], testId = 'rover_mobility'
  const r = JSON.parse(fs.readFileSync(`${root}/export/sites/${site.id}__${testId}.json`)).results[0]
  const with_ = (sand, clay) => buildPackage(site, testId, { ...r, dossier: { ...r.dossier, sand_pct: sand, clay_pct: clay }, plan: plan(r, tests[testId].requisiti) }, r.name, ctx).analogue.soil
  const sl = with_(65, 10)
  assert.equal(sl.n, 0.65); assert.equal(sl.kc, 10500); assert.equal(sl.kphi, 880000); assert.equal(sl.cohesion, 3000); assert.equal(sl.friction_angle, 29.45)
  assert.deepEqual(sl.range.kc, [3300, 259000])
  assert.equal(sl.status.kphi, 'estimated (texture class)')
  assert(sl.source.kc.includes('sandy loam') && sl.source.kc.includes('sand 65%'))
  // K di Janosi-Hanamoto: solo la sabbia (Wong 2010 Tab. 5.1); i franchi hanno Kw e Kr di un'altra equazione (Tab. 5.2): NaN dichiarato
  const sa = with_(90, 5)
  assert(sa.K === 0.0114 && sa.status.K === 'estimated (texture class)' && sa.source.K.includes('Table 5.1 p.124'))
  assert(Number.isNaN(sl.K) && sl.status.K === 'not measured' && sl.source.K.includes('Kw and Kr'))
  assert(sl.grain_density === 2700)
  const cl = with_(20, 60)
  assert(Number.isNaN(cl.kc) && cl.status.kc === 'not measured' && cl.source.kc.includes('clay'))
}
// Report dei dati (report.js): per ogni sito × test, il primo posto. HTML ben formato, ogni parametro con le sue fonti,
// solo SI, niente fonti dell'altro corpo celeste, bibliografia numerata senza voci mancanti.
assert.equal(fmt(5.4e-8), '5.4 × 10<sup>−8</sup>'); assert.equal(fmt(0.308), '0.308'); assert.equal(fmt(-12.345678), '−12.35')
assert(fmt(NaN).includes('n/a'))
assert.equal(unit('kg m^-3'), 'kg m<sup>−3</sup>'); assert.equal(unit('N m^-(n+1)'), 'N m<sup>−(n+1)</sup>'); assert.equal(unit('1'), '–')
{
  const sensors = JSON.parse(fs.readFileSync(`${root}/config/sensors.json`))
  const rctx = { ...ctx, label: p => p, placeName: n => n, earthSource: p => sensors[p]?.earth }
  for (const site of targets) for (const testId of Object.keys(tests)) {
    const r = JSON.parse(fs.readFileSync(`${root}/export/sites/${site.id}__${testId}.json`)).results[0]
    const result = { ...r, plan: plan(r, tests[testId].requisiti) }
    const html = buildReport(site, testId, 'Rover mobility', result, rctx)
    const where = `report ${site.id} ${testId}`
    assert(reportName(site, testId, r.name).endsWith('.html'))
    assert(html.startsWith('<!doctype html>') && html.trim().endsWith('</html>'), `${where}: documento`)
    for (const tag of ['table', 'tr', 'td', 'section', 'figure', 'ol', 'ul', 'sup', 'sub', 'div'])
      assert.equal((html.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length, (html.match(new RegExp(`</${tag}>`, 'g')) || []).length, `${where}: <${tag}> non chiuso`)
    assert(!/undefined|NaN|\[object/.test(html.replace(/<span class="na">n\/a<\/span>/g, '')), `${where}: valore non formattato`)
    for (const p of result.plan.rows.map(x => x.p)) assert(html.includes(`<tr><td>${p}`), `${where}: manca ${p}`)
    assert(!/commit|Method/.test(html), `${where}: niente commit né metodo`)
    for (let n = 1; n <= 5; n++) assert(html.includes(`<b>Table ${n}.</b>`), `${where}: tabella ${n}`)
    // ogni citazione [n] ha la sua voce in bibliografia, e ogni voce è citata
    const refs = (html.split('<section class="refs">')[1].match(/<li>/g) || []).length
    const cited = new Set([...html.matchAll(/class="cite">\[([\d, ]+)\]/g)].flatMap(m => m[1].split(', ').map(Number)))
    assert(refs > 0 && cited.size === refs && Math.max(...cited) === refs, `${where}: bibliografia ${refs} voci, ${cited.size} citate`)
    const bib = html.split('<section class="refs">')[1]
    if (site.world === 'moon') assert(!/(^|; |<li>)(Mars|Marte|Phoenix|Gale):/.test(bib), `${where}: fonte di Marte su un sito lunare`)
    if (site.world === 'mars') assert(!/(^|; |<li>)(Moon|Luna|Polar Moon|Aristarchus):/.test(bib), `${where}: fonte della Luna su Marte`)
    // colonna Unit delle tabelle 2-5: solo unità SI (angoli in gradi) o di calendario
    const ok = new Set([...SI_UNITS, ...SITE_UNITS, 'class', 'month number', 'h/day', 'nW cm^-2 sr^-1'].map(unit).concat(['h day<sup>−1</sup>', 'nW cm<sup>−2</sup> sr<sup>−1</sup>', 'm s<sup>−1</sup>']))
    for (const tab of html.split('<b>Table ').slice(2)) for (const m of tab.split('</table>')[0].matchAll(/<tr><td>.*?<\/td><td>(.*?)<\/td>/g))
      assert(ok.has(m[1]), `${where}: unità ${m[1]}`)
  }
}
console.log('ok')

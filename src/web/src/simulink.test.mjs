// Controllo dell'export MATLAB / Simulink: node src/simulink.test.mjs (da src/web) stampa "ok".
// Con OUT=<cartella> scrive anche il pacchetto .zip di ogni sito × test, per aprirlo in MATLAB o con scipy.io.loadmat.
import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { load } from 'js-yaml'
import { plan } from './campaign.js'
import { ROCK } from './names.js'
import { parseUnits, parseSoil, parseTexture, textureClass, asciiText, buildPackage, numericOnly, sourceFor, SI, SOIL_CSV_UNITS, BODY, SCHEMA } from './simulink.js'
import { crc32 } from './zip.js'
import { reportRows, reportCsv, reportName, COLUMNS, STATE } from './report.js'
import { parseCsv, toSI } from './simulink.js'

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
const SI_UNITS = new Set(['deg', 'm', 'm^-2', '1', 'K^-1', 'kg m^-3', 'K', 'Pa', 'N m^-(n+1)', 'N m^-(n+2)', 'J m^-2 K^-1 s^-0.5', 'm s^-1'])
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
// tabella per tessitura: unità attese, valori nell'intervallo, ogni classe con i 5 parametri
for (const [u, t] of Object.entries(soilTexture)) {
  for (const [k, unit] of Object.entries(t.unit)) assert.equal(unit, SOIL_CSV_UNITS[k], `soil_by_texture ${u} ${k}`)
  for (const [k, v] of Object.entries(t.value)) assert(t.range[k][0] <= v && v <= t.range[k][1], `soil_by_texture ${u} ${k} fuori intervallo`)
  assert.equal(Object.keys(t.value).length, 5, `soil_by_texture ${u}: parametri mancanti`)
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

    // pacchetto: cinque file, .mat validi, script e README coerenti, zip leggibile
    const files = Object.fromEntries(pkg.files.map(x => [x.name, x.data]))
    for (const b of [files[pkg.names.target], files[pkg.names.analogue]]) {
      assert.equal(b.length % 8, 0)
      assert.equal(String.fromCharCode(b[126], b[127]), 'IM')
    }
    const m = files['init_polenta.m']
    assert(m.includes(pkg.names.target) && m.includes(pkg.names.analogue) && m.includes('polenta_target_num'))
    const rd = files['README.txt']
    for (const k of [...Object.keys(t.values), ...Object.keys(t.physical), ...Object.keys(t.soil.units)]) assert(rd.includes(k), `README: manca ${k}`)
    assert(files['SOURCES.txt'].includes(t.body_source))
    assert(files['SOURCES.txt'].includes(`BEKKER-WONG SOIL - ${a.name} (Earth)`) && files['SOURCES.txt'].includes(a.soil.source.kc))
    const z = pkg.zip, zv = new DataView(z.buffer)
    assert.equal(zv.getUint32(0, true), 0x04034b50)
    const eocd = z.length - 22
    assert.equal(zv.getUint32(eocd, true), 0x06054b50)
    assert.equal(zv.getUint16(eocd + 10, true), 5)
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
  const cl = with_(20, 60)
  assert(Number.isNaN(cl.kc) && cl.status.kc === 'not measured' && cl.source.kc.includes('clay'))
}
// Report di trade-off (report.js): per ogni sito × test, i primi 5 di Best on Earth e di Near Turin (3000 km)
{
  const sensors = JSON.parse(fs.readFileSync(`${root}/config/sensors.json`))
  const rctx = { ...ctx, label: p => p, placeName: n => n, earthSource: p => sensors[p]?.earth }
  const TURIN = { id: 'turin', name: 'Turin', lat: 45.0703, lon: 7.6869 }
  const toSIu = (p, x) => toSI(units[p], x)[1]
  let n = 0
  for (const site of targets) for (const testId of Object.keys(tests)) {
    const w = tests[testId].requisiti
    const best = JSON.parse(fs.readFileSync(`${root}/export/sites/${site.id}__${testId}.json`)).results.slice(0, 5)
    const nearF = `${root}/export/near/turin__${site.id}__${testId}.json`
    const near = fs.existsSync(nearF) ? (JSON.parse(fs.readFileSync(nearF)).results_by_radius?.['3000'] || []).slice(0, 5) : []
    for (const [list, rs] of [[{ mode: 'earth', base: TURIN, radius: 3000 }, best], [{ mode: 'near', base: TURIN, radius: 3000 }, near]]) {
      if (!rs.length) continue
      const data = { results: rs.map(r => ({ ...r, plan: plan(r, w) })) }
      const rows = reportRows(site, testId, 'Test', data, list, rctx)
      const where = `report ${site.id} ${testId} ${list.mode}`
      const nParams = Object.values(w).filter(x => x > 0).length
      assert.equal(rows.length, rs.length * nParams, `${where}: righe`)
      // CSV: BOM, intestazione, ogni riga con tutte le colonne, ritorno identico dopo la lettura
      const csv = reportCsv(rows)
      assert(csv.startsWith('﻿') && reportName(site, testId, list).endsWith('.csv'))
      const back = parseCsv(csv.slice(1))
      assert.deepEqual(back[0], COLUMNS, `${where}: intestazione`)
      assert.equal(back.length, rows.length + 1)
      for (const b of back) assert.equal(b.length, COLUMNS.length, `${where}: colonne`)
      for (const [i, r] of rows.entries()) {
        const at = `${where} #${r.rank} ${r.param}`
        assert.equal(back[i + 1][COLUMNS.indexOf('target_source')], String(r.target_source ?? ''), `${at}: virgolette`)
        assert(Object.values(STATE).includes(r.state), `${at}: stato ${r.state}`)
        assert(r.unit === 'class' || SI_UNITS.has(r.unit), `${at}: unità ${r.unit}`)
        assert(r.earth_source, `${at}: fonte Terra`)
        assert(r.target_source && r.target_source !== 'missing', `${at}: fonte del target`)
        if (site.world === 'moon') assert(!/(^|; )(Mars|Marte|Phoenix|Gale)\b/.test(r.target_source), `${at}: fonte di Marte su un sito lunare`)
        if (site.world === 'mars') assert(!/(^|; )(Moon|Luna|Polar Moon|Aristarchus)\b/.test(r.target_source), `${at}: fonte della Luna su Marte`)
        if (r.unit !== 'class') {
          assert(r.target_min <= r.target_max, `${at}: intervallo`)
          const raw = rs[r.rank - 1].values[r.param]
          if (r.state !== STATE.nodata && typeof raw === 'number') assert(Math.abs(r.place_value - toSIu(r.param, raw)) <= 1e-9 * Math.max(1, Math.abs(r.place_value)), `${at}: valore SI`)
        }
        if (r.state !== STATE.nodata) assert(r.similarity >= 0 && r.similarity <= 1, `${at}: voto`)
      }
      // i pesi di ogni posto sommano a 1, come in tests.yaml
      for (const rank of new Set(rows.map(r => r.rank))) {
        const tot = rows.filter(r => r.rank === rank).reduce((t, r) => t + r.weight, 0)
        assert(Math.abs(tot - 1) < 1e-9, `${where} #${rank}: pesi ${tot}`)
      }
      n += rows.length
    }
  }
  assert(n > 0)
}
console.log('ok')

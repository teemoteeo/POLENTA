// Controllo dell'export MATLAB / Simulink: node src/simulink.test.mjs (da src/web) stampa "ok".
// Con OUT=<cartella> scrive anche i tre file di ogni sito × test, per aprirli in MATLAB o con scipy.io.loadmat.
import fs from 'fs'
import path from 'path'
import assert from 'assert'
import { load } from 'js-yaml'
import { plan } from './campaign.js'
import { parseUnits, parseSoil, buildTarget, buildAnalogue, fileNames, targetMat, analogueMat, initScript, SCHEMA } from './simulink.js'

const root = '../../data'
const tests = load(fs.readFileSync(`${root}/config/tests.yaml`, 'utf8')).tests
const targets = JSON.parse(fs.readFileSync(`${root}/export/targets.json`))
const ctx = { units: parseUnits(fs.readFileSync(`${root}/config/params.csv`, 'utf8')), soil: parseSoil(fs.readFileSync(`${root}/config/soil_mechanics.csv`, 'utf8')), exportedAt: 'test', targets: Object.fromEntries(targets.map(t => [t.id, t])) }
const out = process.env.OUT
const keys = o => Object.keys(o).sort().join(',')

let n = 0
for (const site of targets) {
  for (const testId of Object.keys(tests)) {
    const f = `${root}/export/sites/${site.id}__${testId}.json`
    if (!fs.existsSync(f)) continue
    const r = JSON.parse(fs.readFileSync(f)).results[0]
    const result = { ...r, plan: plan(r, tests[testId].requisiti) }
    const t = buildTarget(site, testId, result, ctx)
    const a = buildAnalogue(site, testId, result, r.name, ctx)

    // stesso schema: stessi campi, stessi parametri, stesse unità
    assert.equal(t.schema, SCHEMA)
    const { match, site: field, ...core } = a
    assert.equal(keys(core), keys(t), 'campi diversi tra target e analogue')
    for (const k of ['values', 'range', 'units', 'soil']) assert.equal(keys(t[k]), keys(a[k]), `${k}: ${site.id} ${testId}`)
    assert.equal(keys(match.s), keys(Object.fromEntries(result.plan.rows.map(x => [x.p, 0]))), 'match: non sono i righi della card')
    assert.equal(keys(t.values), keys(Object.fromEntries(result.plan.rows.filter(x => x.p !== 'rock_class').map(x => [x.p, 0]))))
    for (const [k, [lo, hi]] of Object.entries(t.range)) {
      assert(lo <= hi || Number.isNaN(lo), `${site.id} ${k}: intervallo rovesciato`)
      assert(Number.isNaN(t.values[k]) || (t.values[k] >= lo && t.values[k] <= hi))
      assert(t.units[k], `${k}: unità mancante in params.csv`)
    }
    assert.equal(t.gravity_m_s2, { moon: 1.62, mars: 3.71 }[site.world])
    assert(Number.isNaN(a.soil.kc), 'la Terra non ha Bekker-Wong misurato')
    for (const k of ['range', 'source', 'status']) assert.equal(keys(t.soil[k]), keys(a.soil[k]), `soil.${k}`)
    for (const [k, [lo, hi]] of Object.entries(t.soil.range)) {
      if (Number.isNaN(t.soil[k])) { assert.equal(t.soil.status[k], 'not measured', `${site.id} ${k}: NaN senza stato`); continue }
      assert(lo <= t.soil[k] && t.soil[k] <= hi, `${site.id} soil ${k}: valore fuori intervallo`)
      assert(t.soil.source[k].length > 20, `${site.id} soil ${k}: fonte mancante`)
    }
    if (site.world === 'mars') assert(Number.isFinite(t.soil.cohesion_kPa) && Number.isFinite(t.soil.friction_angle_deg), `${site.id}: c e phi mancanti`)
    for (const k of ['physical', 'physical_units', 'physical_source', 'notes']) assert.equal(keys(t[k]), keys(a[k]), `${k}: ${site.id} ${testId}`)
    assert(t.physical.thermal_inertia_si > 0 && Number.isFinite(t.physical.t_mean_c), `physical mancante: ${site.id}`)
    assert(Number.isNaN(a.physical.thermal_inertia_si) && Number.isNaN(a.physical.feo_wt_pct) && a.physical.wind_m_s >= 0)
    // Terra: ogni grandezza del dossier finisce nel .mat (NaN finché l'export non la contiene)
    const d = r.dossier || {}
    for (const [k, dk] of [['elevation_m', 'elevation_m'], ['t_mean_c', 'lst_mean_c'], ['t_range_c', 'lst_half_range_c'],
      ['bulk_density_0_2m', 'bulk_density_0_2m'], ['air_density_kg_m3', 'air_density_kgm3']]) {
      if (typeof d[dk] === 'number') assert.equal(a.physical[k], d[dk], `${k}: dossier non riportato`)
      else assert(Number.isNaN(a.physical[k]))
      assert(a.physical_source[k], `${k}: fonte mancante`)
    }

    const names = fileNames(site, testId, r.name)
    const mt = targetMat(t), ma = analogueMat(a), m = initScript(names, t, a)
    for (const b of [mt, ma]) {
      assert.equal(b.length % 8, 0)
      assert.equal(String.fromCharCode(b[126], b[127]), 'IM')
    }
    assert(m.includes(names.target) && m.includes(names.analogue))
    if (out) {
      const dir = path.join(out, `${site.id}__${testId}`)
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, names.target), mt)
      fs.writeFileSync(path.join(dir, names.analogue), ma)
      fs.writeFileSync(path.join(dir, names.init), m)
    }
    n++
  }
}
assert.equal(n, 18, `coppie sito × test: ${n}`)
console.log('ok')

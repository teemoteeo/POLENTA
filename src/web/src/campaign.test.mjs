import fs from 'fs'
import assert from 'assert'
import { load } from 'js-yaml'
import { plan, rankByCampaign } from './campaign.js'

const results = JSON.parse(fs.readFileSync('../../data/export/sites/haworth__rover_mobility.json')).results.slice(0, 5)
const w = load(fs.readFileSync('../../data/config/tests.yaml', 'utf8')).tests.rover_mobility.requisiti
const ps = results.map(r => plan(r, w))
for (const p of ps) {
  assert(p.fieldShare >= 0 && p.fieldShare <= 1)
  assert(Math.abs(p.fieldShare + p.partialShare + p.brokenShare - 1) < 1e-9)
  assert(p.sunHint === null || typeof p.sunHint === 'number')
  assert(Array.isArray(p.warnings) && p.warnings.every(x => typeof x === 'string'))
}
const nv = results.findIndex(r => /Winnemucca/.test(r.name))
assert(nv >= 0 && Math.abs(ps[nv].kmSite - 9000) <= 600, 'kmSite Nevada ' + ps[nv]?.kmSite)
const ranked = rankByCampaign(results, w)
assert.deepStrictEqual(ranked.map(r => r.id).sort(), results.map(r => r.id).sort())
for (let i = 1; i < ranked.length; i++) {
  const a = ranked[i - 1].plan, b = ranked[i].plan
  assert.ok(a.blockers <= b.blockers)
  if (a.blockers !== b.blockers) continue
  assert(a.fieldShare - b.fieldShare >= -0.005, 'order')
  if (Math.abs(a.fieldShare - b.fieldShare) < 0.005) assert(a.kmTotal <= b.kmTotal)
}
console.log('ok')

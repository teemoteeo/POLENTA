import { getResults, TESTS, knownReason } from './data.js'
import { plan, unit } from './campaign.js'

// Full files from the pipeline (data/export/near/<home>__<site>__<test>.json), lazy
const NEAR = import.meta.glob('../../../data/export/near/*.json', { import: 'default' })
const PICKS = 5

// midpoint on the sphere, for the camera
export function middle(a, b) {
  const R = Math.PI / 180, s = unit(a).map((x, i) => x + unit(b)[i]), n = Math.hypot(...s) || 1
  return [Math.atan2(s[1], s[0]) / R, Math.asin(s[2] / n) / R]
}

export async function loadNear(home, siteId, testId, radius) {
  const top = getResults(siteId, testId)?.results[0]?.score ?? null
  const j = await NEAR[`../../../data/export/near/${home.id}__${siteId}__${testId}.json`]?.()
  const w = TESTS[testId].requisiti
  // un elenco per raggio (1500, 3000, 5000); senza file per questa sede la lista è vuota
  const results = (j?.results_by_radius?.[radius] || []).slice(0, PICKS).map(r => ({ ...r, plan: plan(r, w, home), known: knownReason(r) }))
  return { results, easiest: -1, zones: results.flatMap((r, i) => r.h3_cells.map(h3 => ({ h3, rank: i + 1 }))), bestOnEarth: j?.best_on_earth ?? top, home }
}

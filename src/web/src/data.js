import { load as loadYaml } from 'js-yaml'
// catalogo dei test: quello della pipeline (Edo e Rocco), stessi id dei file di export
import testsRaw from '../../../data/config/tests.yaml?raw'
import manifest from '../../../data/export/manifest.json'
import labels from '../../../data/export/labels.json'
import facilities from '../../../data/export/facilities.json'
import benchmark from '../../../data/export/benchmark.json'
import targets from '../../../data/export/targets.json'
import { toView } from './trek.js'
import { plan, rankByCampaign } from './campaign.js'

export const TESTS = loadYaml(testsRaw).tests
export const EXPORTED_AT = manifest.generated_at
export const LABELS = labels
export const FACILITIES = facilities
export const BENCHMARK = benchmark
export const MANIFEST = manifest
export const TARGETS = targets

// Siti scelti dal team: human_docs/coordinate_6_siti_frontend.csv (stessi id di data/export/targets.json).
// Coordinate planetocentriche, longitudine est positiva in -180/+180 (Phoenix: 234,2508°E = -125,7492).
// pos: dove sta il sito sulla mappa (la Luna è ruotata, vedi trek.js); tag: dove va l'etichetta in px (i siti lunari sono vicinissimi)
export const SITES = [
  { id: 'malapert_massif', world: 'moon', name: 'Malapert Massif', lat: -85.98, lon: -1.67, tag: [0, -34] },
  { id: 'haworth', world: 'moon', name: 'Haworth', lat: -86.8, lon: -22, tag: [-34, 20] },
  { id: 'nobile_rim_1', world: 'moon', name: 'Nobile Rim 1', lat: -85.4, lon: 37, tag: [34, 12] },
  { id: 'aristarchus_plateau', world: 'moon', name: 'Aristarchus Plateau', lat: 25, lon: -51.5, tag: [16, 0] },
  { id: 'phoenix', world: 'mars', name: 'Phoenix', lat: 68.2188, lon: -125.7492, tag: [16, 0] },
  { id: 'gale', world: 'mars', name: 'Gale', lat: -4.5895, lon: 137.4417, tag: [16, 0] },
].map(s => ({ ...s, pos: s.world === 'moon' ? toView(s.lon, s.lat) : [s.lon, s.lat] }))

// Modelli NASA 3D Resources (github.com/nasa/NASA-3D-Resources) in public/models
export const MODELS = {
  rover_mobility: { src: '/models/rover.glb', name: 'Rover Perseverance' },
  flight_hda_lidar: { src: '/models/lander.glb', name: 'Lander lunare Apollo' },
  isru_subsurface: { src: '/models/suit.glb', name: 'Tuta EVA' },
}

// Pianeti a puntini [lon, lat, peso], precalcolati una volta su 50–59.000 punti di Fibonacci (il generatore è nella storia git, commit 67e90bc).
// Luna: albedo LRO + ombreggiatura dal DEM LOLA (NASA CGI Moon Kit), più fitta sulla calotta sud, già ruotata come la mappa (trek.js).
// Marte: quota MOLA a colori (Mars Trek): Tharsis e gli altopiani pieni, Hellas e le pianure del nord quasi vuote.
// Terra: terre emerse Natural Earth (scripts/earth-dots.mjs).
export const loadDots = world => fetch(`/${world}-dots.json`).then(r => r.json())

// Export della pipeline (docs/backend_spec.md §2): un file per sito × test. Nel bundle entra solo `results`
// (gli esagoni `cells` della mappa di calore, 10.000 per file, restano fuori).
const EXPORT = import.meta.glob('../../../data/export/sites/*.json', { eager: true, import: 'results' })
const TOP = 5 // i posti mostrati per ogni sito × test: i primi della classifica della pipeline (già ordinata per voto)

// null se la pipeline non ha ancora girato per questa coppia (oggi: Aristarchus Plateau)
export function getResults(siteId, testId) {
  const top = EXPORT[`../../../data/export/sites/${siteId}__${testId}.json`]?.slice(0, TOP)
  // i primi 5 per somiglianza, poi riordinati per campagna più semplice (campaign.js)
  const w = TESTS[testId].requisiti
  const results = top && rankByCampaign(top.map(r => ({ ...r, plan: plan(r, w) })), w)
  // zones: gli esagoni H3 di ogni posto (zona = esagoni che si toccano); rank = posto in classifica
  return results ? { results, zones: results.flatMap((r, i) => r.h3_cells.map(h3 => ({ h3, rank: i + 1 }))) } : null
}

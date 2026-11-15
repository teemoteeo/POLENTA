import { load as loadYaml } from 'js-yaml'
// catalogo dei test: quello della pipeline (Edo e Rocco), stessi id dei file di export
import testsRaw from '../../../data/config/tests.yaml?raw'
import manifest from '../../../data/export/manifest.json'
import labels from '../../../data/export/labels.json'
import facilities from '../../../data/export/facilities.json'
import benchmark from '../../../data/export/benchmark.json'
import targets from '../../../data/export/targets.json'
import validation from '../../../data/export/validation.json'
import { gridDisk, latLngToCell } from 'h3-js'
import knownAnalogues from '../../../data/config/excluded_known_analogues.json'
import agencies from '../../../data/config/space_agencies_top10.json'
import { toView } from './trek.js'
import { plan } from './campaign.js'

export const TESTS = loadYaml(testsRaw).tests
export const EXPORTED_AT = manifest.generated_at
export const LABELS = labels
export const FACILITIES = facilities
export const BENCHMARK = benchmark
export const MANIFEST = manifest
export const TARGETS = targets
export const VALIDATION = validation // percentile dei siti di test noti per sito × test (pipeline)
export const KNOWN_ANALOGUES = knownAnalogues // siti di test già usati (Rocco, data/config)
export const AGENCIES = agencies // sedi delle 10 principali agenzie spaziali (Rocco, data/config)

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
  isru_subsurface: { src: '/models/rover.glb', name: 'Rover Perseverance (scavo e prelievo)' },
}

// Pianeti a puntini [lon, lat, peso], precalcolati una volta su 50–59.000 punti di Fibonacci (il generatore è nella storia git, commit 67e90bc).
// Luna: albedo LRO + ombreggiatura dal DEM LOLA (NASA CGI Moon Kit), più fitta sulla calotta sud, già ruotata come la mappa (trek.js).
// Marte: quota MOLA a colori (Mars Trek): Tharsis e gli altopiani pieni, Hellas e le pianure del nord quasi vuote.
// Terra: terre emerse Natural Earth (scripts/earth-dots.mjs).
export const loadDots = world => fetch(`/${world}-dots.json`).then(r => r.json())

// Export della pipeline (docs/backend_spec.md §2): un file per sito × test. Nel bundle entra solo `results`
// (gli esagoni `cells` della mappa di calore, 10.000 per file, restano fuori).
const EXPORT = import.meta.glob('../../../data/export/sites/*.json', { eager: true, import: 'results' })
const TOP = 5 // i posti mostrati per ogni sito × test (l'export ne ha 20: le riserve servono quando si escludono i siti noti)

// Siti di test già usati (data/config/excluded_known_analogues.json): si esclude l'esagono H3 del sito e i 6 adiacenti.
// Il raggio di esclusione del file non si usa (decisione del team, dom mattina).
const EXCLUDED = new Set(knownAnalogues.flatMap(k => gridDisk(latLngToCell(k.lat, k.lon, 5), 1)))
const nearKnown = r => r.h3_cells.some(h => EXCLUDED.has(h))

// null se la pipeline non ha ancora girato per questa coppia. Ordine: somiglianza col sito (quello della pipeline);
// la campagna (plan) si calcola per ogni posto e si mostra, ma non decide la classifica.
export function getResults(siteId, testId, hideKnown = false) {
  const all = EXPORT[`../../../data/export/sites/${siteId}__${testId}.json`]
  if (!all) return null
  const w = TESTS[testId].requisiti
  const kept = hideKnown ? all.filter(r => !nearKnown(r)) : all
  const results = kept.slice(0, TOP).map(r => ({ ...r, plan: plan(r, w), nearKnown: nearKnown(r) }))
  // la campagna più semplice tra i 5: meno ostacoli, poi più test coperto sul campo, poi meno strutture
  const easiest = results.reduce((b, r, i) => {
    const A = r.plan, B = results[b].plan
    return A.blockers < B.blockers || (A.blockers === B.blockers && (A.fieldShare > B.fieldShare + 0.005
      || (Math.abs(A.fieldShare - B.fieldShare) <= 0.005 && A.nFacilities < B.nFacilities))) ? i : b
  }, 0)
  const hidden = hideKnown ? all.slice(0, TOP + (all.length - kept.length)).filter(nearKnown).length : 0
  // zones: gli esagoni H3 di ogni posto (zona = esagoni che si toccano); rank = posto in classifica
  return { results, easiest, hidden, zones: results.flatMap((r, i) => r.h3_cells.map(h3 => ({ h3, rank: i + 1 }))) }
}

// Mappa di calore: i 10.000 esagoni H3 più simili sulla Terra per sito × test. Un chunk per file, scaricato solo alla scelta del test.
// ?raw: modulo distinto da quello eager di sopra, altrimenti Rolldown rimette tutto nel bundle principale
const CELLS = import.meta.glob('../../../data/export/sites/*.json', { query: '?raw', import: 'default' })
export const loadCells = (siteId, testId) => CELLS[`../../../data/export/sites/${siteId}__${testId}.json`]?.().then(t => JSON.parse(t).cells) ?? Promise.resolve([])

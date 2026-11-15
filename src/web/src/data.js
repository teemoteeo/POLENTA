import { load as loadYaml } from 'js-yaml'
// ponytail: copia fissa di tests.yaml v1 (commit 809a1b1): la v2 di Edo (3 test) rompe il pannello. Tornare a data/config quando il web la regge.
import testsRaw from './tests.yaml?raw'
import { toView } from './trek.js'

// landing_touchdown (aggiunto da Edo in tests.yaml) è nascosto dal pannello finché non ha dati e modello
const { landing_touchdown: _hidden, ...shown } = loadYaml(testsRaw).tests
export const TESTS = shown

// Siti scelti dal team (15/11): tre regioni Artemis III al Polo Sud della Luna e due siti di atterraggio su Marte.
// pos: dove sta il sito sulla mappa (la Luna è ruotata, vedi trek.js); tag: dove va l'etichetta in px (i siti lunari sono vicinissimi)
export const SITES = [
  { world: 'moon', name: 'Malapert Massif', lat: -85.98, lon: -1.67, tag: [0, -34] },
  { world: 'moon', name: 'Haworth', lat: -86.8, lon: -22, tag: [-34, 20] },
  { world: 'moon', name: 'Nobile Rim 1', lat: -85.4, lon: 37, tag: [34, 12] },
  { world: 'mars', name: 'Phoenix', lat: 68.2188, lon: 234.2508 - 360, tag: [16, 0] },
  { world: 'mars', name: 'Gale', lat: -4.5895, lon: 137.4417, tag: [16, 0] },
].map(s => ({ ...s, pos: s.world === 'moon' ? toView(s.lon, s.lat) : [s.lon, s.lat] }))

// Modelli NASA 3D Resources (github.com/nasa/NASA-3D-Resources) in public/models
export const MODELS = {
  rover_mobility: { src: '/models/rover.glb', name: 'Rover Perseverance' },
  flight_hda_lidar: { src: '/models/lander.glb', name: 'Lander lunare Apollo' },
  flight_trn_camera: { src: '/models/drone.glb', name: 'Drone Ingenuity' },
  eva_traverse: { src: '/models/suit.glb', name: 'Tuta EVA' },
}

// Pianeti a puntini [lon, lat, peso], precalcolati una volta su 50–59.000 punti di Fibonacci (il generatore è nella storia git, commit 67e90bc).
// Luna: albedo LRO + ombreggiatura dal DEM LOLA (NASA CGI Moon Kit), più fitta sulla calotta sud, già ruotata come la mappa (trek.js).
// Marte: quota MOLA a colori (Mars Trek): Tharsis e gli altopiani pieni, Hellas e le pianure del nord quasi vuote.
// Terra: terre emerse Natural Earth (scripts/earth-dots.mjs).
export const loadDots = world => fetch(`/${world}-dots.json`).then(r => r.json())

// Chi copre cosa la Terra non dà (ruolo "indoor" in params.csv). Da sostituire con facilities.csv.
export const FACILITIES = {
  gravity_1_6: ['LUNA, Colonia (offload)', 'ARGOS, NASA JSC'],
  vacuum: ['camere a vuoto ESTEC', 'Chamber B, NASA JSC'],
  electrostatic_dust: ['LUNA Dust Lab, Colonia', 'Swamp Works, NASA KSC'],
  plume_vacuum: ['sfera da 60 ft, NASA Langley'],
  cryo_psr: ['TVAC "sporca" ALTEC, Torino (in arrivo)'],
  agglutinates: ['vasche di simulante LHS-1 / LMS-1'],
  soil_density: ['vasche di simulante: LUNA, ALTEC, SLOPE NASA Glenn'],
}

// ponytail: dati finti finché non arriva data/export/sites/<site>__<test>.json di Edo.
// Stessa forma prevista: risultati con score per parametro.
const MOCK_PLACES = {
  rover_mobility: [['Etna, Piano delle Concazze', 37.77, 15.03], ['Etna, Cisternazza', 37.72, 14.99], ['Teide, Tenerife', 28.27, -16.64], ['Black Point Lava Flow, Arizona', 35.69, -111.45], ['Lanzarote', 29.0, -13.75]],
  flight_hda_lidar: [['Cinder Lake, Arizona', 35.3, -111.48], ['Meteor Crater, Arizona', 35.03, -111.02], ['Etna, Cisternazza', 37.72, 14.99], ['Kilbourne Hole, New Mexico', 31.98, -106.97]],
  flight_trn_camera: [['Death Valley, California', 36.5, -117.1], ['Mojave, California', 35.06, -118.15], ['Islanda, Holuhraun', 64.85, -16.83], ['Etna, Piano delle Concazze', 37.77, 15.03]],
  isru_anorthosite: [['Lofoten, Norvegia', 68.2, 13.9], ['Sithampoondi, India', 11.25, 78.0], ['Fiskenæsset, Groenlandia', 63.1, -50.7]],
  eva_traverse: [['San Francisco Volcanic Field, Arizona', 35.58, -111.63], ['Lanzarote', 29.0, -13.75]],
}

// Export della pipeline (docs/backend_spec.md §2): un file per sito × test, con i risultati (gli esagoni `cells` non si disegnano).
// ponytail: tutti i file nel bundle (1,4 MB col mock). L'export vero arriva a 20.000 celle per file: allora import pigro (togliere eager).
const EXPORT = import.meta.glob('../../../data/export/sites/*.json', { eager: true, import: 'default' })
const slug = s => s.toLowerCase().replace(/\s+/g, '_')

function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }

export function getResults(site, testId) {
  const file = EXPORT[`../../../data/export/sites/${slug(site)}__${testId}.json`]
  // TEST (solo per noi): le zone trovate dal modello. Ogni risultato è una zona (esagoni che si toccano, la migliore per prima); rank = posto in classifica
  if (file) return { results: file.results, zones: file.results.flatMap((r, i) => r.h3_cells.map(h3 => ({ h3, rank: i + 1 }))) }
  // nessun file per questa coppia (Marte): dati finti
  const test = TESTS[testId]
  const r = rnd([...site + testId].reduce((a, c) => a + c.charCodeAt(0), 1))
  const results = (MOCK_PLACES[testId] || []).map(([name, lat, lon], i) => {
    const params = Object.fromEntries(Object.keys(test.requisiti).map(p => [p, Math.max(0.05, Math.min(1, 0.95 - i * 0.08 - r() * 0.5))]))
    return { name, lat, lon, score: 0.92 - i * 0.07 - r() * 0.04, params }
  })
  return { results }
}

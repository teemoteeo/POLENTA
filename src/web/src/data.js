import { load as loadYaml } from 'js-yaml'
// catalogo dei test: quello della pipeline (Edo e Rocco), stessi id dei file di export
import testsRaw from '../../../data/config/tests.yaml?raw'
import manifest from '../../../data/export/manifest.json'
import validation from '../../../data/export/validation.json'
import knownAnalogues from '../../../data/config/excluded_known_analogues.json'
import knownRegions from '../../../data/config/known_analogue_regions.json'
import sensors from '../../../data/config/sensors.json'
import knownSites from '../../../data/export/known_sites.json'
import targets from '../../../data/export/targets.json'
import { toView } from './trek.js'
import { plan, haversineKm } from './campaign.js'
import paramsCsv from '../../../data/config/params.csv?raw'
import soilCsv from '../../../data/config/soil_mechanics.csv?raw'
import { parseUnits, parseSoil } from './simulink.js'
import { rock } from './i18n.js'

export const TESTS = loadYaml(testsRaw).tests
export const EXPORTED_AT = manifest.generated_at
export const MANIFEST = manifest
// sensors: sensore di ogni parametro: Terra (pipeline), Luna e Marte (Rocco, sensori_per_parametro_e_pianeta.csv)
// nome breve del sensore (senza le parentesi) e nome completo per il tooltip; world: 'earth' | 'moon' | 'mars'
export const sensor = (p, world) => {
  const full = sensors[p]?.[world]
  return full ? { short: full.replace(/\s*\([^)]*\)/g, '').replace(/ above 60°N/, '').replace(/, mean annual.*$/, '').trim(), full } : null
}
// valori dei 6 siti target (Luna e Marte): schedina al passaggio del mouse
export const TARGETS = Object.fromEntries(targets.map(t => [t.id, t]))
// export MATLAB / Simulink (simulink.js): unità dei parametri e Bekker-Wong per Luna e Marte
export const SIMULINK_CTX = { units: parseUnits(paramsCsv), soil: parseSoil(soilCsv), exportedAt: manifest.generated_at, dataVersion: `manifest ${manifest.version}`, rockName: rock, targets: TARGETS }
export const VALIDATION = validation // percentile dei siti di test noti per sito × test (pipeline)

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

// Siti famosi senza dati della pipeline: solo overview (niente ricerca di analoghi). Coordinate da NASA NSSDCA / missioni,
// longitudine est positiva in -180/+180, arrotondate al centesimo [da ricontrollare prima di usarle per calcoli].
export const FAMOUS = [
  ['apollo11', 'moon', 'Apollo 11 · Tranquility Base', 0.67, 23.47, 'First crewed landing, July 1969. Mare basalt plain in Mare Tranquillitatis.'],
  ['apollo12', 'moon', 'Apollo 12', -3.01, -23.42, 'Oceanus Procellarum, 180 m from the Surveyor 3 probe (1969).'],
  ['apollo14', 'moon', 'Apollo 14 · Fra Mauro', -3.65, -17.47, 'Hilly ejecta of the Imbrium basin (1971).'],
  ['apollo15', 'moon', 'Apollo 15 · Hadley-Apennine', 26.13, 3.63, 'First lunar rover. Edge of Mare Imbrium, Hadley Rille and the Apennine mountains (1971).'],
  ['apollo16', 'moon', 'Apollo 16 · Descartes', -8.97, 15.5, 'Only Apollo landing in the highlands: anorthosite, like the South Pole (1972).'],
  ['apollo17', 'moon', 'Apollo 17 · Taurus-Littrow', 20.19, 30.77, 'Last crewed landing (1972). Valley with orange volcanic glass.'],
  ['luna9', 'moon', 'Luna 9', 7.08, -64.37, 'First soft landing on the Moon (USSR, 1966). Oceanus Procellarum.'],
  ['change3', 'moon', "Chang'e 3", 44.12, -19.51, 'Chinese lander and Yutu rover in Mare Imbrium (2013).'],
  ['change4', 'moon', "Chang'e 4 · Von Kármán", -45.44, 177.6, 'First landing on the far side (2019), inside the South Pole–Aitken basin.'],
  ['change5', 'moon', "Chang'e 5", 43.06, -51.92, 'Sample return from young mare basalts, Mons Rümker (2020).'],
  ['change6', 'moon', "Chang'e 6", -41.64, -153.99, 'First samples from the far side, Apollo basin (2024).'],
  ['chandrayaan3', 'moon', 'Chandrayaan-3', -69.37, 32.32, 'Indian lander and Pragyan rover, the southernmost landing before 2024 (2023).'],
  ['slim', 'moon', 'SLIM', -13.32, 25.25, 'Japanese pinpoint landing near Shioli crater (2024).'],
  ['im1', 'moon', 'IM-1 Odysseus', -80.13, 1.44, 'First commercial landing (Intuitive Machines, 2024), Malapert A crater near the South Pole.'],
  ['shackleton', 'moon', 'Shackleton crater', -89.9, 0, 'Crater on the South Pole with a permanently shadowed floor and possible ice.'],
  ['tycho', 'moon', 'Tycho', -43.31, -11.36, 'Young crater with bright rays, 85 km across.'],
  ['copernicus', 'moon', 'Copernicus', 9.62, -20.08, 'Classic complex crater with terraced walls and central peaks, 93 km.'],
  ['viking1', 'mars', 'Viking 1 · Chryse Planitia', 22.27, -47.95, 'First successful landing on Mars (1976).'],
  ['viking2', 'mars', 'Viking 2 · Utopia Planitia', 47.67, 134.28, 'Northern plains, frost seen in winter (1976).'],
  ['pathfinder', 'mars', 'Pathfinder · Ares Vallis', 19.13, -33.22, 'First Mars rover, Sojourner, on an outflow channel full of rocks (1997).'],
  ['spirit', 'mars', 'Spirit · Gusev crater', -14.57, 175.47, 'Rover stuck in soft soil in 2009 after 7 km: the classic case of unexpected terrain.'],
  ['opportunity', 'mars', 'Opportunity · Meridiani Planum', -1.95, -5.53, 'Rover that drove 45 km in 14 years on hematite plains (2004–2018).'],
  ['insight', 'mars', 'InSight · Elysium Planitia', 4.5, 135.62, 'Seismometer and heat probe; the probe stopped at ~40 cm in unexpected soil (2018).'],
  ['jezero', 'mars', 'Jezero · Perseverance', 18.44, 77.45, 'Ancient lake delta, samples for Mars Sample Return (2021).'],
  ['zhurong', 'mars', 'Zhurong · Utopia Planitia', 25.07, 109.93, 'Chinese rover in the southern Utopia plains (2021).'],
  ['oxia', 'mars', 'Oxia Planum', 18.27, -24.63, 'Clay-rich plain chosen for ESA\'s Rosalind Franklin rover (ExoMars).'],
  ['olympus', 'mars', 'Olympus Mons', 18.65, -133.8, 'The largest volcano in the Solar System, ~22 km high.'],
  ['valles', 'mars', 'Valles Marineris', -13.9, -59.2, 'Canyon system 4,000 km long and up to 7 km deep.'],
  ['hellas', 'mars', 'Hellas Planitia', -42.4, 70.5, 'Deepest impact basin on Mars, 2,300 km across.'],
].map(([id, world, name, lat, lon, what]) => ({ id, world, name, lat, lon, what, famous: true, pos: world === 'moon' ? toView(lon, lat) : [lon, lat] }))

// Modelli NASA 3D Resources (github.com/nasa/NASA-3D-Resources) in public/models
export const MODELS = {
  rover_mobility: { src: '/models/rover.glb', name: 'Rover Perseverance' },
  flight_hda_lidar: { src: '/models/lander.glb', name: 'Lander lunare Apollo' },
  // trivella a coclea su treppiede, con gli strati del sottosuolo: modello nostro, generato a mano (non NASA)
  isru_subsurface: { src: '/models/drill.glb', name: 'Subsurface drill rig', own: true },
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

// Zone già studiate (decisione del team, dom 10:40): un posto NON è nuovo se
//  - cade in una regione di analoghi famosi (data/config/known_analogue_regions.json: US Southwest, Islanda, Atacama,
//    Hawaii, Canarie, Svalbard, Artico canadese, Antartide; le prime quattro le cita la challenge), oppure
//  - sta entro KNOWN_KM da un sito di test noto (lista di Rocco + data/export/known_sites.json, tutti i test).
// La stessa regola decide il toggle "Hide known test sites" e l'etichetta "new site".
const KNOWN_KM = 150
const KNOWN_POINTS = [...knownAnalogues, ...knownSites].map(k => ({ name: k.name, lat: k.lat, lon: k.lon }))
export function knownReason(r) {
  const reg = knownRegions.find(g => r.lat >= g.lat_min && r.lat <= g.lat_max && r.lon >= g.lon_min && r.lon <= g.lon_max)
  if (reg) return { kind: 'region', name: reg.name.split(' (')[0], text: `in a well-studied analogue region: ${reg.name.split(' (')[0]}` }
  const near = KNOWN_POINTS.map(k => ({ ...k, km: haversineKm(r, k) })).sort((a, b) => a.km - b.km)[0]
  return near && near.km <= KNOWN_KM ? { kind: 'near', name: near.name, km: near.km, text: `${near.km} km from ${near.name.split(' (')[0]}` } : null
}

// null se la pipeline non ha ancora girato per questa coppia. Ordine: somiglianza col sito (quello della pipeline);
// la campagna (plan) si calcola per ogni posto e si mostra, ma non decide la classifica.
export function getResults(siteId, testId, hideKnown = false, home) {
  const all = EXPORT[`../../../data/export/sites/${siteId}__${testId}.json`]
  if (!all) return null
  const w = TESTS[testId].requisiti
  const kept = hideKnown ? all.filter(r => !knownReason(r)) : all
  const results = kept.slice(0, TOP).map(r => ({ ...r, plan: plan(r, w, home), known: knownReason(r) }))
  // la campagna più semplice tra i 5: meno ostacoli, poi più test coperto sul campo, poi meno strutture
  const easiest = results.reduce((b, r, i) => {
    const A = r.plan, B = results[b].plan
    return A.blockers < B.blockers || (A.blockers === B.blockers && (A.fieldShare > B.fieldShare + 0.005
      || (Math.abs(A.fieldShare - B.fieldShare) <= 0.005 && A.nFacilities < B.nFacilities))) ? i : b
  }, 0)
  // zones: gli esagoni H3 di ogni posto (zona = esagoni che si toccano); rank = posto in classifica
  return { results, easiest, zones: results.flatMap((r, i) => r.h3_cells.map(h3 => ({ h3, rank: i + 1 }))) }
}

// Mappa di calore: i 10.000 esagoni H3 più simili sulla Terra per sito × test. Un chunk per file, scaricato solo alla scelta del test.
// ?raw: modulo distinto da quello eager di sopra, altrimenti Rolldown rimette tutto nel bundle principale
const CELLS = import.meta.glob('../../../data/export/sites/*.json', { query: '?raw', import: 'default' })
export const loadCells = (siteId, testId) => CELLS[`../../../data/export/sites/${siteId}__${testId}.json`]?.().then(t => JSON.parse(t).cells) ?? Promise.resolve([])

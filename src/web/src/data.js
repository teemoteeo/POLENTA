import { load as loadYaml } from 'js-yaml'
import testsRaw from '../../../data/config/tests.yaml?raw'
import { gridDisk, latLngToCell } from 'h3-js'
import { toView, sampler, LAYERS } from './trek.js'

export const TESTS = loadYaml(testsRaw).tests

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

// Luna a puntini: punti di Fibonacci uniformi sulla sfera
// Fibonacci: [lon, lat, peso]; il peso fa sfumare la calotta densa verso nord (niente bordo netto)
const fib = (n, yMin = -1) => Array.from({ length: n }, (_, i) => {
  const y = yMin + ((1 - yMin) * (i + 0.5)) / n // y = sin(-lat), area uniforme
  const lat = -(Math.asin(y) * 180) / Math.PI
  return [((((i * Math.PI * (3 - Math.sqrt(5)) * 180) / Math.PI) % 360) + 540) % 360 - 180, lat, yMin === -1 ? 1 : Math.min(1, (-lat - 62) / 18)]
})

async function pixels(src) {
  const img = new Image(); img.src = src; await img.decode()
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
  const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const { data } = g.getImageData(0, 0, img.width, img.height)
  return (lon, lat) => {
    const x = Math.min(img.width - 1, Math.floor((((lon + 540) % 360) / 360) * img.width))
    const y = Math.min(img.height - 1, Math.floor(((90 - lat) / 180) * img.height))
    return data[(y * img.width + x) * 4] / 255
  }
}

// Luna a puntini dalla vera albedo (LRO, NASA CGI Moon Kit) + ombreggiatura dal DEM LOLA:
// gli altopiani chiari sono pieni, i mari scuri quasi vuoti, i crateri grandi si vedono dal bordo.
export async function buildMoonDots() {
  const [albedo, dem] = await Promise.all([pixels('/moon/albedo.jpg'), pixels('/moon/ldem.jpg')])
  const pts = [...fib(45000), ...fib(14000, Math.sin((62 * Math.PI) / 180))]
  // contrasto adattivo: tra il 35° e il 70° percentile dell'albedo (mari → 0, altopiani → 1)
  const al = pts.map(([lon, lat]) => albedo(lon, lat)), sorted = [...al].sort((x, y) => x - y)
  const lo = sorted[Math.floor(sorted.length * 0.35)], hi = sorted[Math.floor(sorted.length * 0.7)]
  return pts.map(([lon, lat, cap], i) => {
    const shade = (dem(lon + 0.6, lat) - dem(lon - 0.6, lat)) * 5
    const w = Math.max(0.04, Math.min(1, (al[i] - lo) / (hi - lo + 1e-6) + shade))
    return [...toView(lon, lat), w * cap]
  })
}

// Marte a puntini dalla quota MOLA a colori: Tharsis e gli altopiani pieni, Hellas e le pianure del nord quasi vuote
export async function buildMarsDots() {
  const topo = await sampler(LAYERS.marsTopo, 2)
  const pts = fib(50000), v = pts.map(([lon, lat]) => topo(lon, lat)), sorted = [...v].sort((x, y) => x - y)
  const lo = sorted[Math.floor(sorted.length * 0.2)], hi = sorted[Math.floor(sorted.length * 0.85)]
  return pts.map(([lon, lat], i) => [lon, lat, Math.max(0.06, Math.min(1, (v[i] - lo) / (hi - lo + 1e-6)))])
}

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
// Stessa forma prevista: risultati con score per parametro + celle H3 per la heat map.
const MOCK_PLACES = {
  rover_mobility: [['Etna, Piano delle Concazze', 37.77, 15.03], ['Etna, Cisternazza', 37.72, 14.99], ['Teide, Tenerife', 28.27, -16.64], ['Black Point Lava Flow, Arizona', 35.69, -111.45], ['Lanzarote', 29.0, -13.75]],
  flight_hda_lidar: [['Cinder Lake, Arizona', 35.3, -111.48], ['Meteor Crater, Arizona', 35.03, -111.02], ['Etna, Cisternazza', 37.72, 14.99], ['Kilbourne Hole, New Mexico', 31.98, -106.97]],
  flight_trn_camera: [['Death Valley, California', 36.5, -117.1], ['Mojave, California', 35.06, -118.15], ['Islanda, Holuhraun', 64.85, -16.83], ['Etna, Piano delle Concazze', 37.77, 15.03]],
  isru_anorthosite: [['Lofoten, Norvegia', 68.2, 13.9], ['Sithampoondi, India', 11.25, 78.0], ['Fiskenæsset, Groenlandia', 63.1, -50.7]],
  eva_traverse: [['San Francisco Volcanic Field, Arizona', 35.58, -111.63], ['Lanzarote', 29.0, -13.75]],
}

function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }

export function getResults(site, testId) {
  const test = TESTS[testId]
  const r = rnd([...site + testId].reduce((a, c) => a + c.charCodeAt(0), 1))
  const results = (MOCK_PLACES[testId] || []).map(([name, lat, lon], i) => {
    const params = Object.fromEntries(Object.keys(test.requisiti).map(p => [p, Math.max(0.05, Math.min(1, 0.95 - i * 0.08 - r() * 0.5))]))
    return { name, lat, lon, score: 0.92 - i * 0.07 - r() * 0.04, params }
  })
  const cells = results.flatMap(({ lat, lon, score }) =>
    gridDisk(latLngToCell(lat, lon, 5), 3).map(h3 => ({ h3, score: score * (0.35 + r() * 0.65) })))
  return { results, cells }
}

import { load as loadYaml } from 'js-yaml'
import testsRaw from '../../../data/config/tests.yaml?raw'
import { gridDisk, latLngToCell } from 'h3-js'

export const TESTS = loadYaml(testsRaw).tests

// Lista NASA ott 2024 (docs/decisioni.md).
// ponytail: coordinate approssimate dai crateri e rilievi vicini, sostituire con artemis.csv quando c'è.
export const ARTEMIS_SITES = [
  { name: 'Peak near Cabeus B', lat: -82.3, lon: -53 },
  { name: 'Haworth', lat: -87.4, lon: -5 },
  { name: 'Malapert Massif', lat: -86, lon: 3 },
  { name: 'Mons Mouton Plateau', lat: -85, lon: 34 },
  { name: 'Mons Mouton', lat: -84, lon: 31 },
  { name: 'Nobile Rim 1', lat: -84.6, lon: 60 },
  { name: 'Nobile Rim 2', lat: -85.9, lon: 45 },
  { name: 'de Gerlache Rim 2', lat: -88, lon: -70 },
  { name: 'Slater Plain', lat: -88.3, lon: 110 },
]

// Modelli NASA 3D Resources (github.com/nasa/NASA-3D-Resources) in public/models
export const MODELS = {
  rover_mobility: { src: '/models/rover.glb', name: 'Rover Perseverance' },
  flight_hda_lidar: { src: '/models/lander.glb', name: 'Lander lunare Apollo' },
  flight_trn_camera: { src: '/models/drone.glb', name: 'Drone Ingenuity' },
  eva_traverse: { src: '/models/suit.glb', name: 'Tuta EVA' },
}

// Luna a puntini: punti di Fibonacci uniformi sulla sfera
// più fitti nella calotta sotto -70° perché lì si zooma sui siti
const fib = (n, yMin = -1) => Array.from({ length: n }, (_, i) => {
  const y = yMin + ((1 - yMin) * (i + 0.5)) / n // y = sin(lat) da yMin a 1, area uniforme
  const lat = -(Math.asin(y) * 180) / Math.PI
  return [((((i * Math.PI * (3 - Math.sqrt(5)) * 180) / Math.PI) % 360) + 540) % 360 - 180, lat, Math.min(1, (-lat - 62) / 18)]
})
// terzo valore = intensità: la calotta densa sfuma verso nord, niente bordo netto
export const MOON_DOTS = [...fib(14000).map(([x, y]) => [x, y, 1]), ...fib(11000, Math.sin((62 * Math.PI) / 180))]

// Chi copre cosa la Terra non dà (ruolo "indoor" in params.csv). Da sostituire con facilities.csv.
export const FACILITIES = {
  gravity_1_6: ['LUNA, Colonia (offload)', 'ARGOS, NASA JSC'],
  vacuum: ['camere a vuoto ESTEC', 'Chamber B, NASA JSC'],
  electrostatic_dust: ['LUNA Dust Lab, Colonia', 'Swamp Works, NASA KSC'],
  plume_vacuum: ['sfera da 60 ft, NASA Langley'],
  cryo_psr: ['TVAC "sporca" ALTEC, Torino (in arrivo)'],
  agglutinates: ['vasche di simulante LHS-1 / LMS-1'],
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

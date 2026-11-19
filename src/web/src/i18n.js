// L'export della pipeline è in italiano: l'app traduce per id.
import labels from '../../../data/export/labels.json'
import { PARAM_EN, ROCK } from './names.js'
export { PARAM_EN }
export const label = p => PARAM_EN[p] || p

export const DIMENSION_EN = {
  'Topografia': 'Topography',
  'Geologia e materiali di superficie': 'Geology and surface materials',
  'Temperatura e illuminazione': 'Temperature and illumination',
  'Acqua, ghiaccio e permafrost': 'Water, ice and permafrost',
  'Atmosfera, polvere e vento': 'Atmosphere, dust and wind',
  'Limiti della Terra (struttura indoor)': 'Limits of Earth (indoor only)',
}
export const dimension = p => { const d = labels?.[p]?.dimension; return DIMENSION_EN[d] || d || '' }

export const TEST_EN = {
  rover_mobility: { name: 'Rover mobility', what: 'slopes up to 20°, rocks and steps, sinkage in regolith, navigation under low-angle sunlight' },
  flight_hda_lidar: { name: 'Landing hazard detection (lidar)', what: 'the lander lidar (or that of a drone/helicopter carrying it) sees 30 cm rocks and 5° slopes and picks a safe spot' },
  isru_subsurface: { name: 'In-situ resources (ISRU)', what: 'extract water from ground ice and work the regolith (digging, sintering, oxygen); where to try plants, drills and simulants' },
}

const WORDS = [
  ['Terra di Francesco Giuseppe', 'Franz Josef Land'], ['Arcipelago artico canadese', 'Canadian Arctic Archipelago'],
  ['Groenlandia', 'Greenland'], ['Severnaja Zemlja', 'Severnaya Zemlya'], ['Area remota', 'Remote area'],
  ['Colonia', 'Cologne'], ['Torino', 'Turin'], ['in arrivo', 'coming soon'], ['sporca', 'dirty'],
]
export function placeName(name = '') {
  let s = name.replace(/(\d+) km da /, '$1 km from ')
  for (const [it, en] of WORDS) s = s.replaceAll(it, en)
  return s
}

const FACILITY = [
  ['Sfera a vuoto da 60 ft', '60 ft vacuum sphere'], ['Campo ALHAT', 'ALHAT hazard field'], ['Campo di prova di Huailai', 'Huailai proving ground'],
  ['Crateri di Challakere', 'Challakere craters'], ['TVAC "sporca" ALTEC (in arrivo)', 'ALTEC dusty thermal-vacuum chamber (coming soon)'], ['Voli parabolici Novespace', 'Novespace parabolic flights'],
  ["Basalti dell'Eifel", 'Eifel basalts'], ['Provincia anortositica del Rogaland', 'Rogaland anorthosite province'],
  ['Mars Terrain Simulator e centro lunare ALTEC', 'Mars Terrain Simulator and lunar centre, ALTEC'],
  ['nessuna struttura nota', 'no known facility'], ['nessuna struttura in elenco', 'no facility listed'],
]
export function facilityName(name = '') {
  let s = name
  for (const [it, en] of FACILITY) s = s.replaceAll(it, en)
  return placeName(s)
}

export const rock = c => ROCK[c] || c

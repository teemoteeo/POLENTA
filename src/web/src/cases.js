import './cases.css'

// presets that drive the normal navigation (see openCase in App.jsx)
export const CASES = [
  { id: 'rover', line: 'No single place on Earth is enough alone. The tool confirms Etna, proposes new places and says which facilities to combine.', site: 'malapert_massif', test: 'rover_mobility', title: 'Rover on a polar massif', sub: 'Malapert Massif · rover mobility' },
  { id: 'lidar', line: 'Instead of building a one-hectare crater field, it finds natural fields of tens of km2 with the same crater density.', site: 'haworth', test: 'flight_hda_lidar', title: 'Lander hazard detection', sub: 'Haworth · lidar landing' },
  { id: 'isru-moon', line: 'Finds terrain with the same dry, loose regolith conditions to test excavation and extraction.', site: 'aristarchus_plateau', test: 'isru_subsurface', title: 'In-situ resources, dry regolith', sub: 'Aristarchus Plateau · ISRU' },
  { id: 'isru-mars', line: 'For Martian ground ice the best analog is not Antarctica: it is the Tibetan Plateau.', site: 'phoenix', test: 'isru_subsurface', title: 'In-situ resources, ground ice', sub: 'Phoenix (Mars) · ISRU' },
]

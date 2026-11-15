import './cases.css'

// presets that drive the normal navigation (see openCase in App.jsx)
export const CASES = [
  { id: 'rover', site: 'malapert_massif', test: 'rover_mobility', title: 'Rover on a polar massif', sub: 'Malapert Massif · rover mobility' },
  { id: 'lidar', site: 'haworth', test: 'flight_hda_lidar', title: 'Lander hazard detection', sub: 'Haworth · lidar landing' },
  { id: 'isru-moon', site: 'aristarchus_plateau', test: 'isru_subsurface', title: 'In-situ resources, dry regolith', sub: 'Aristarchus Plateau · ISRU' },
  { id: 'isru-mars', site: 'phoenix', test: 'isru_subsurface', title: 'In-situ resources, ground ice', sub: 'Phoenix (Mars) · ISRU' },
]

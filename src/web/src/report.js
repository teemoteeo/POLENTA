// Report di trade-off (TODO [11]): la lista di posti che l'app sta mostrando (Best on Earth, Unexplored o Near you),
// in un CSV per le revisioni di progetto. Formato lungo: una riga per posto × parametro del test, così si filtra o si fa la
// tabella pivot in Excel, pandas (read_csv) o MATLAB (readtable) senza toccare il file.
// Gli stessi numeri del pacchetto Simulink: valori in SI (angoli in gradi) e fonti da buildTarget / buildAnalogue.
// Le colonne del posto (score, campagna, ...) si ripetono su ogni riga: ogni riga si legge da sola.
import { buildTarget, buildAnalogue, sourceFor, UNITS_CONVENTION, slug } from './simulink.js'

export const COLUMNS = [
  'data_version', 'data_export', 'units_convention',
  'site_id', 'site_name', 'site_world', 'test_id', 'test_name', 'list',
  'rank', 'place', 'country', 'lat_deg', 'lon_deg', 'h3_cells', 'score', 'kappa',
  'field_share', 'partner_facilities', 'base', 'km_from_base', 'already_used_for_tests', 'terrain_30m',
  'param', 'param_name', 'weight', 'unit', 'place_value', 'target_min', 'target_max', 'similarity', 'state',
  'target_range_type', 'target_source', 'earth_source', 'note',
]

// grandezze del terreno calcolate a 30 m (fine.py): esatte sui candidati, altrimenti stimate dal 500 m (calibrate.py)
const TERRAIN = new Set(['slope_p90', 'slope_trav_p90', 'trav_share', 'roughness', 'crater_density'])
const TERRAIN_SRC = { '30m': 'exact (30 m)', est: 'estimated from 500 m (calibrated)' }
export const STATE = { holds: 'holds in the field', partial: 'partial', breaks: 'breaks (indoor)', nodata: 'no data' }

// RFC 4180: virgolette se servono; numeri non finiti → cella vuota
const cell = x => {
  if (x == null || (typeof x === 'number' && !Number.isFinite(x))) return ''
  const s = String(x)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// list: { mode: 'earth' | 'new' | 'near', base: { name, ... }, radius }; ctx: SIMULINK_CTX più label, placeName, earthSource
export function reportRows(site, testId, testName, data, list, ctx) {
  const listName = list.mode === 'near' ? `Near ${list.base.name} within ${list.radius} km` : list.mode === 'new' ? 'Unexplored' : 'Best on Earth'
  const out = []
  data.results.forEach((r, i) => {
    const name = ctx.placeName(r.name)
    const t = buildTarget(site, testId, r, ctx)
    const a = buildAnalogue(site, testId, r, name, ctx)
    const terrain = TERRAIN_SRC[r.dossier?.terrain_src] || r.dossier?.terrain_src || ''
    const place = {
      data_version: a.data_version, data_export: a.data_export, units_convention: UNITS_CONVENTION,
      site_id: site.id, site_name: site.name, site_world: site.world, test_id: testId, test_name: testName, list: listName,
      rank: i + 1, place: name, country: r.country || '', lat_deg: a.lat_deg, lon_deg: a.lon_deg, h3_cells: (r.h3_cells || []).length,
      score: r.score, kappa: r.kappa, field_share: Number(r.plan.fieldShare.toFixed(3)), partner_facilities: r.plan.nFacilities,
      base: r.plan.home.name, km_from_base: r.plan.kmSite, already_used_for_tests: r.known ? `yes: ${r.known.text}` : 'no',
      terrain_30m: terrain,
    }
    for (const row of r.plan.rows) {
      const p = row.p, f = p.replace(/[^A-Za-z0-9_]/g, '_')
      const cat = p === 'rock_class'
      const [lo, hi] = cat ? [t.rock_class_name, t.rock_class_name] : t.range[f] || []
      const src = ctx.earthSource(p)
      out.push({
        ...place,
        param: p, param_name: ctx.label(p), weight: row.w, unit: cat ? 'class' : a.units[f] || '',
        place_value: row.state === 'nodata' ? '' : cat ? a.rock_class_name : a.values[f],
        target_min: lo, target_max: hi, similarity: row.s, state: STATE[row.state] || row.state,
        target_range_type: cat ? 'rock class of the target; similarity from the GLiM class table (data/config/rock_similarity.csv)' : t.range_type[f] || '',
        target_source: cat ? sourceFor(ctx.targets?.[site.id]?.sources?.rock_class, site.id, site.world) : t.source[f] || '',
        // crateri: nessuna stima dal 500 m (features.py), esistono solo dove c'è il 30 m
        earth_source: src ? (TERRAIN.has(p) && terrain ? `${src}; ${p === 'crater_density' && r.dossier?.terrain_src !== '30m' ? 'computed at 30 m only' : terrain}` : src) : '',
        note: (t.notes[f] || '').replace('use physical.thermal_inertia', 'physical thermal inertia in the Simulink package'),
      })
    }
  })
  return out
}

// BOM: Excel apre l'UTF-8 (nomi con accenti) solo se c'è. Fine riga CRLF come da RFC 4180.
export function reportCsv(rows) {
  return '﻿' + [COLUMNS.join(','), ...rows.map(r => COLUMNS.map(c => cell(r[c])).join(','))].join('\r\n') + '\r\n'
}

export const reportName = (site, testId, list) =>
  `polenta_tradeoff_${site.id}__${testId}__${list.mode === 'near' ? `near_${slug(list.base.name)}_${list.radius}km` : list.mode === 'new' ? 'unexplored' : 'best'}.csv`

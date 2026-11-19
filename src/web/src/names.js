// Nomi inglesi dei parametri e delle classi di roccia, senza dipendenze (li usa anche l'export Simulink nei test con node).
export const PARAM_EN = {
  slope_p90: 'Slopes', roughness: 'Roughness', crater_density: 'Craters', rock_cover: 'Boulders', grain_proxy: 'Regolith grain size',
  albedo: 'Albedo', low_sun_frac: 'Low-angle sunlight', bulk_density_0_5: 'Surface density', rock_class: 'Rock type',
  permafrost_share: 'Ground ice', temperature: 'Temperature', density_profile_0_2m: 'Density profile (0–2 m)', elevation: 'Elevation',
  atmosphere_wind: 'Atmosphere and wind', gravity_1_6: '1/6 gravity', vacuum: 'Vacuum', electrostatic_dust: 'Electrostatic dust',
  plume_vacuum: 'Engine plume on regolith in vacuum', cryo_psr: 'Cold of shadowed regions (40–110 K)',
  agglutinates: 'Agglutinates and nanophase iron', soil_density: 'Regolith density and compaction',
}

export const ROCK = {
  su: 'unconsolidated sediments', ss: 'siliciclastic sedimentary', sm: 'mixed sedimentary', sc: 'carbonate sedimentary', py: 'pyroclastics',
  ev: 'evaporites', mt: 'metamorphics', pa: 'acid plutonic', pi: 'intermediate plutonic', pb: 'basic plutonic', va: 'acid volcanic',
  vi: 'intermediate volcanic', vb: 'basic volcanic', ig: 'ice and glaciers', wb: 'water bodies', nd: 'no data',
  basalt_sedimentary: 'basalt (sedimentary)', basalt_volcanic: 'basalt (volcanic)',
}

# POLENTA

**P**lanetary **O**utcrop & **L**anding **E**nvironment **N**earby **T**estbed **A**ssistant

Where on Earth to test hardware for the Moon and Mars.

- **Live app:** https://polenta-fvg.vercel.app
- **Demo video (30 s):** https://drive.google.com/file/d/1Jdk8B1YpiaRJO4S7QKGdFbj_kGHfTl1g/view
- **Pitch deck (7 slides):** https://polenta-fvg.vercel.app/pitch/ (click or → to advance)
- **Team:** FVG Station (Timoteo, Edoardo, Rocco)
- **Event:** NASA Space Apps Challenge 2026, Turin
- **Challenge:** [Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/)

## What it does

You pick a landing site and a hardware test. POLENTA tells you where on Earth to run that test, how faithful the place is, where the analogy breaks, and which indoor facility closes each gap.

1. **Site.** Six targets: Malapert Massif, Haworth and Nobile Rim 1 (Artemis III candidate regions at the lunar South Pole), Aristarchus Plateau (Moon), Phoenix and Gale (Mars).
2. **Test.** Rover mobility, landing hazard detection with lidar, in-situ resources (ISRU). Each test weighs the parameters differently.
3. **Where.** A ranked list of places on Earth, in three views:
   - *Best on Earth*: the most similar places anywhere.
   - *Unexplored*: the same ranking without the places already used for tests. A place counts as known if it lies in a well-studied analogue region (US Southwest, Iceland, Atacama, Hawaii, Canary Islands, Svalbard, Canadian High Arctic, Antarctica) or within 150 km of a known test site.
   - *Near you*: the best places within 1,500, 3,000 or 5,000 km of the customer base (Turin or ISRO Bengaluru), with the similarity given up against the best place on Earth.
4. **Place card.** For each place: the score per parameter with its sensor on Earth and on the target body, what holds in the field, what is partial, what breaks, and the campaign: field site plus the indoor facilities that cover the rest. The campaign can be copied as a plain-text brief, and the place can be exported to MATLAB / Simulink (see below).

The **Benchmark** sheet shows the whole matrix, 6 sites × 3 tests, with the top unexplored place and its campaign in every cell.

## Method

- **Unit:** one hexagon of bare ground on Earth (H3 resolution 5, about 253 km²). Oceans, vegetation (median NDVI of the snow-free months ≥ 0.2), farmland and cities are masked out.
- **Same definitions on both bodies.** Slope, roughness and crater density on the Moon are computed by us on the LOLA 20 m DEM with the same code path and 30 m baseline used on Earth. Mars and Aristarchus values come from the literature (`data/config/siti_e_pesi.csv`, with references).
- **Score per parameter:** `s = exp(-(D/τ)²)`, with `D` the distance from the target value in Earth percentiles and `τ = 0.1`.
- **Total score:** weighted geometric mean with the weights of the chosen test (`data/config/tests.yaml`). A place enters the ranking only if at least 80% of the weight has data.
- **Where it breaks:** a parameter with `s < 0.3` breaks, between 0.3 and 0.5 is partial, from 0.5 holds. Broken parameters and the things Earth never reproduces (1/6 gravity, vacuum, electrostatic dust, engine plume in vacuum, cold of shadowed regions) are assigned to indoor facilities: the smallest set that covers every gap, most gaps covered first, then nearest to the customer.
- **Terrain resolution:** global screening at 500 m, exact 30 m values on known sites, a random sample and the candidates; a gradient-boosting model calibrates 500 m to 30 m on the rest, with the error declared.
- **Validation:** known test sites (Etna, Black Point, Cinder Lake, Death Valley and others in `data/config/known_sites.csv`) must come out near the top. Their percentiles are exported in `data/export/validation.json`.

Parameters in the score: 90th percentile slope, roughness, crater density, boulder cover, regolith grain size (thermal inertia proxy), albedo, low-angle sunlight, surface density, rock type, ground ice.

## MATLAB / Simulink export

Every place card has two buttons, built in the browser from the same data the card shows, so they always match the place on screen (Best on Earth, Unexplored or Near you):
- **Data report (.html):** the chosen site and the place on Earth in one short document, with tables and numbered references. It prints to PDF.
- **Simulink package (.zip):** the same values for MATLAB and Simulink, in the folder described below.

| File | Content |
|---|---|
| `polenta_<site>__<test>__<place>.mat` | All the data, in five variables (below) |
| `init_polenta.m` | Loads the file, turns `info` into a table, prints the comparison with units |
| `README.txt` | Variables, every field with its unit, how to use them in Simulink |
| `SOURCES.txt` | The source of every field, for the site and for the place on Earth |

The `.mat` uses flat structs, one level deep (schema `polenta-simulink-3`):
- **`target` and `analogue`:** the site and the place on Earth.
  - Each has one field per quantity, with the same names in both.
  - They hold numbers only, so they work directly as a Simulink Constant block value (`target.soil_kc`) or as a bus (`Simulink.Bus.createObject(target)`).
- **`target_range`:** `[min max]` for each target field.
- **`info`:** one row per field. In MATLAB it becomes a table. Its columns:
  - `group`: location, matched, physical or soil;
  - `quantity` and `unit`;
  - target and analogue values with their ranges;
  - `weight` and `similarity`;
  - `state`: holds, partial or breaks;
  - status, range type, sources and notes.
- **`meta`:** site, test, place, similarity and κ, elevation datums, rock classes, H3 cells, and field logistics (snow-free months, low-angle Sun, bare ground, night lights, protected area).

Fields:
- **Location:** `lat_deg`, `lon_deg` (planetocentric, east-positive), `gravity_m_s2`, `radius_m`, `solar_day_s` (NASA NSSDCA fact sheets; Earth: standard gravity 9.80665; Moon: synodic period 29.53 days).
- **Matched:** the parameters of the chosen test.
- **Physical:** `thermal_inertia_tiu`, `boulder_cover`, `subsurface_ice`, `t_mean_K`, `t_half_range_K`, `bulk_density_0_2m_kg_m3`, `feo`, `elevation_m`, `air_density_kg_m3`, `wind_m_s`, and `porosity_0_2m` (derived: 1 - bulk density / grain density).
- **Soil:** `soil_cohesion_Pa`, `soil_friction_angle_deg`, `soil_kc`, `soil_kphi`, `soil_n` (Bekker), `soil_K_m` (shear deformation modulus, Janosi-Hanamoto: with cohesion and friction angle it gives thrust and slip), `soil_grain_density_kg_m3`, `soil_d50_m` (median grain size).

**Units:** SI throughout, angles in degrees, and the unit is in the field name:

| Suffix | Unit |
|---|---|
| `_deg` | degrees |
| `_m` | metres |
| `_s` | seconds |
| `_per_m2` | per square metre |
| `_K` | kelvin |
| `_kg_m3` | kg m^-3 |
| `_Pa` | pascal |
| `_m_s` | m s^-1 |
| `_m_s2` | m s^-2 |
| `_per_K` | K^-1 |
| `_tiu` | thermal inertia units, J m^-2 K^-1 s^-0.5 |

No suffix means dimensionless (fractions 0-1). The exceptions are `soil_kc` and `soil_kphi`, in N m^-(n+1) and N m^-(n+2): their units depend on `soil_n`.

**Reading the values:**
- `rock_cover` and `grain_proxy` are matching indices. For physics, use `boulder_cover` and `thermal_inertia_tiu`.
- `NaN` means no data, never zero.
- Elevations of different bodies use different datums (`meta`) and are not comparable.
- Text in the `.mat` is ASCII only, so MATLAB, Octave and Python read it the same way.
- For Phoenix and Gale, `info.note` flags slope, roughness and craters as literature values with a definition different from the Earth one.

Bekker-Wong values come from `data/config/soil_mechanics.csv`, one row per site and parameter (`site` = `*` applies to the whole world), with `[lo, hi]` and a status: `measured` (in situ at that site), `inferred` (model fit to rover data at that site), `literature` (checked against the source, not specific to the site), `literature [NV]` (not yet checked), `assumed` (a declared hypothesis from a cited source, not a measurement) or `not measured` (`NaN`). Central value: the authors' value if given, else the median of the measured values. Mars: Phoenix cohesion and friction angle measured by the lander arm (Shaw et al. 2009), Gale inferred from Curiosity drives (Arvidson et al. 2014). Mars `kc`, `kphi`, `n` (and `K`) come from other Martian soils: Zhou et al. (2014) Table III, Reece parameters tuned on Opportunity drives at Meridiani, converted to the Bekker form with kc = c k'c b^(1-n), kphi = rho g k'phi b^(1-n) (b = 0.16 m wheel width, g = 3.71 m/s2); the conversion reproduces the measured Bekker values of the Mojave Mars Simulant (846 and 6708). Not measured at Phoenix or Gale. Moon: the Apollo rover (LRV) trafficability set, Lunar Sourcebook Table 9.14 (Carrier et al. 1991, after Costes et al. 1972), with the Apollo range for cohesion and friction angle (Table 9.11, confirmed by NASA SP-330); Aristarchus uses the friction angle of pyroclastic deposits (31 deg, Bickel et al. 2019). Earth places have no measured soil mechanics: their `soil` is estimated from the soil texture class (`status` = `estimated (texture class)`). Sand and clay of the top 5 cm (SoilGrids) give the USDA texture class (Soil Survey Manual 2017 triangle); `data/config/soil_by_texture.csv` gives, per class, the bevameter and shear tests of Wong (2010), *Terramechanics and Off-Road Vehicle Engineering*, 2nd ed., Tables 4.1, 5.1 and 5.2 (sand, sandy loam, loam, clay loam of Eastern Ontario): `n`, `kc`, `kphi` from the single test with the best fit (so the three belong together), cohesion and friction angle as the median of the tests, ranges as min-max. Clays have no reference soil and stay `NaN`. Moon: shear deformation modulus K = 1.8 cm (Table 9.14 p.529, same set as kc, kphi, n), grain density 3.1 g/cm3 (range 2.3 to >3.2, sec. 9.1.3 p.481) and median grain size 70 um (40-130 um, sec. 9.1.1 p.478), Lunar Sourcebook ch. 9. Earth grain density 2.7 g/cm3, typical of terrestrial soils (same section); Earth K only for sand (1.14 cm, Wong 2010 Table 5.1 p.124, Janosi-Hanamoto). Mars grain density 2.8 g/cm3 (2.6-3.0) is a declared assumption (`assumed`): basaltic grains, Moore (1991) USGS Open-File Report 91-568 Table 6, consistent with the Mojave Mars Simulant (2.875 g/cm3). Mars K = 1.5 cm (1.2-2.5), the same Janosi-Hanamoto model as the Moon, inferred from Opportunity drives at Meridiani Planum (Zhou et al. 2014, Journal of Field Robotics 31:141-160, Table III): other Martian soils, not measured at Phoenix or Gale. Earth D50 and Mars D50 are not sourced yet (`NaN`). The reference soils were moist and the analogues are dry: for more precision measure on site and replace the values with your own dataset. The code is in `src/web/src/simulink.js` (schema, units, package), `src/web/src/report.js` (data report), `src/web/src/matfile.js` (MAT Level 5 writer, with struct arrays) and `src/web/src/zip.js` (zip writer). `node src/simulink.test.mjs` checks every site × test pair (schema, SI units, conversions, ranges, sources, zip), and with `OUT=<dir>` it also writes the packages.

## Data

Earth data are processed in Google Earth Engine. The app reads only the pipeline export.

| Source | Used for |
|---|---|
| NASA NASADEM | Terrain up to 60°N: slope, roughness, craters (30 m) |
| NASA MODIS MOD44W, MOD13A3, MOD11A2, MCD43A3, MOD10A2 | Land mask, NDVI (bare ground), land temperature (thermal inertia), albedo, snow-free months |
| NASA VIIRS DNB | Night lights: excludes cities |
| NASA MERRA-2 | Wind at 10 m |
| NASA LRO LOLA (LDEM 80S 20 m, PDS) | Lunar terrain at the South Pole sites |
| NASA GIBS Blue Marble, NASA Moon Trek (LRO WAC), NASA/USGS Viking MDIM 2.1 | Map imagery of Earth, Moon and Mars |
| NASA 3D Resources | Rover and lander models |
| JAXA AW3D30 | Terrain above 60°N |
| JRC Global Surface Water | Excludes lakes from crater counts |
| SoilGrids (ISRIC) | Rock fraction, soil density, texture |
| WDPA | Protected areas (permit warning) |
| GLiM (Hartmann & Moosdorf 2012) | Rock type |
| Esri World Imagery | Close-up imagery of Earth |

## Known limits

- Model output, not a site survey: 30 m terrain and ~1 km satellite data averaged over ~250 km² hexagons. Check the place before planning a campaign.
- Earth never reproduces 1/6 gravity, vacuum, electrostatic dust, the engine plume in vacuum, or lunar agglutinates. These always go indoors.
- Mars and Aristarchus terrain values come from the literature, not from our own DEM processing.
- Ground ice is one quantity on every world: the share of area with thermally stable ice within 1 m of the surface. On the polar Moon it is the share within 10 km of the landing point (the Artemis unpressurized rover range, NASA EVA-EXP-0075), from the LRO Diviner ice-stability map, given as the median over every landing point in the USGS Artemis III region (the 10th-90th percentile spread is in the reference). Aristarchus and Gale are 0 and Phoenix is 1, from the literature. On Earth it is a MODIS proxy (mean annual temperature below −1 °C), which is only an approximation of ice within 1 m. In the ISRU test, when the site has ice, Earth places without permafrost are excluded; places with more ice than the site are penalised too, because the tool looks for analogues, not for the most ice (team decision, 19/11/2026). Subsurface ice in wt% stays in the card for information only.
- Rock type is coarse (GLiM, ~55 km cells): small volcanic fields such as Etna or the Eifel do not show.
- No Antarctica: MODIS NDVI does not cover it.
- Crater density exists only where 30 m terrain was computed exactly, so the lidar heat map is sparse.
- Some facility entries are marked `[NV]` (not verified) in `data/config/`.
- No cost figures: only measurable quantities.

## Repository

```
src/web/        frontend: React + Vite, MapLibre GL globe, deck.gl layers, three.js
src/pipeline/   data pipeline: Python, Google Earth Engine, H3
data/config/    hand-written inputs: tests and weights, target values, facilities, known sites, simulants
data/export/    pipeline output read by the app (the contract between pipeline and app)
docs/pitch/     pitch deck (HTML, 7 slides) and the script that records the video
```

`data/export/` contains:

| File | Content |
|---|---|
| `sites/<site>__<test>.json` | Top 20 places for the pair, plus the 10,000 most similar hexagons (heat map) |
| `near/<base>__<site>__<test>.json` | Best places within each radius of a customer base |
| `manifest.json` | Export time, sites, tests, datasets |
| `targets.json`, `labels.json`, `validation.json`, `benchmark.json` | Target values, parameter labels, known-site percentiles, matrix |
| `facilities.json`, `simulants.json`, `rock_sources.json`, `known_sites.json` | Campaign tables |

## Run the app

Needs Node.js 22 or later. No API keys.

```sh
cd src/web
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
node src/campaign.test.mjs   # self-check of the campaign logic, prints "ok"
node src/simulink.test.mjs   # self-check of the MATLAB / Simulink export, prints "ok"
```

The app imports `data/export/` and `data/config/` at build time, so it must be built from inside the repository. Map tiles come from NASA GIBS, NASA Moon Trek, OpenPlanetaryMap and Esri at runtime. Mars tiles go through the `/mars-tiles` proxy (`vite.config.js` in development, `vercel.json` in production) because the source sends no CORS headers.

Deploy: Vercel project with root `src/web`.

## Run the pipeline

Needs Python 3.11, a Google Cloud project registered for Earth Engine, and `earthengine authenticate`. The committed `data/export/` already holds the results: the pipeline is needed only to regenerate them.

```sh
python3.11 -m venv src/pipeline/.venv
source src/pipeline/.venv/bin/activate
pip install -r src/pipeline/requirements.txt
echo "GEE_PROJECT=your-google-cloud-project" > .env

python -m src.pipeline.run --step check    # libraries, config files, Earth Engine access
python -m src.pipeline.run --step grid     # H3 land hexagons with the bare-ground share
python -m src.pipeline.run --step sun      # low-angle sunlight by latitude and month
python -m src.pipeline.run --step regions  # USGS Artemis III region outlines (needs the LGRS 1 km grids, doi:10.5066/P1MEQ6UK, in data/raw/lola/usgs_lgrs/)
python -m src.pipeline.run --step lola     # LOLA 20 m DEM windows from the PDS
python -m src.pipeline.run --step lunar    # lunar slope, roughness, craters at 30 m
python -m src.pipeline.run --step ice      # ISRU ice: Diviner PRP ice depth within 10 km of each landing point (needs data/raw/diviner/dlre_prp_south.tab)
python -m src.pipeline.run --step earth    # terrain 500 m, surface, 30 m sample, calibration, features
python -m src.pipeline.run --step export   # preview in data/raw/export_preview/
python -m src.pipeline.run --step export --publish   # writes data/export/
```

Run all commands from the repository root. Downloads and intermediate files go to `data/raw/` (not in git); finished steps are cached. The rock-type step expects the GLiM 0.5° grid (doi:10.1594/PANGAEA.788537) unpacked in `data/raw/glim/extracted/`. `--sample` runs any step on a few test regions only.

After a new export, refresh the numbers of the pitch deck: `python3 docs/pitch/snapshot.py`.

## Pitch

`docs/pitch/index.html` is the 7-slide deck, online at https://polenta-fvg.vercel.app/pitch/. Open it locally with `cd docs/pitch && python3 -m http.server 5192`.

The 30-second demo video ([Google Drive](https://drive.google.com/file/d/1Jdk8B1YpiaRJO4S7QKGdFbj_kGHfTl1g/view)) is a screen recording of the live app between the first and last slide of the deck, with English captions. `docs/pitch/video/` records it: `npm install && npm run submission` (see `docs/pitch/README.md`).

## Use of AI

Code and data pipeline were written with AI assistance (Claude Code), including the pitch deck and the scripts that record the demo video. The video itself is a screen recording of the app, not generated imagery. All numbers shown in the app and in the pitch come from the pipeline export; none are generated by a language model.

## Team

FVG Station

- **Timoteo**: web app, map UI, deploy
- **Edoardo**: mathematics, data pipeline, scoring
- **Rocco**: physics of the analogy, test requirements, facilities research

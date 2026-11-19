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

Every place card has one button, **Simulink package (.zip)**. The package is built in the browser from the same data the card shows, so it always matches the place on screen (Best on Earth, Unexplored or Near you). It unzips to one folder:

| File | MATLAB variables | Content |
|---|---|---|
| `polenta_<site>__<test>__target.mat` | `polenta_target`, `polenta_target_num` | The Moon or Mars site |
| `polenta_<site>__<test>__<place>.mat` | `polenta_analogue`, `polenta_analogue_num` | The place on Earth |
| `init_polenta.m` | | Loads both files, checks they belong together, prints the comparison with units |
| `README.txt` | | Every field, its unit and meaning, what NaN and the ranges mean, how to use it in Simulink |
| `SOURCES.txt` | | The source of every number, only the part that applies to the site |

**Units** (schema `polenta-simulink-2`): SI throughout, angles in degrees, dimensionless fractions 0-1 with unit `1`. Temperatures in K, densities in kg m^-3, cohesion in Pa, crater density in m^-2, Bekker-Wong `kc` and `kphi` in N m^-(n+1) and N m^-(n+2). Every group of numbers has its units next to it (`units`, `soil.units`, `physical_units`, `site_units`), and the conversions from the source units are in `src/web/src/simulink.js` (`SI`, `PHYSICAL`, `SOIL`). `polenta_*_num` is the same struct with numbers only, ready for a Simulink Constant block or `Simulink.Bus.createObject`.

Both structs share one schema: `name`, `world`, `lat_deg`, `lon_deg` (planetocentric, east-positive), `gravity_m_s2` and `body_radius_m` (NASA NSSDCA fact sheets; Earth: standard gravity 9.80665), `values.<param>`, `range.<param>` (`[min max]`), `units.<param>`, `range_type.<param>` (literature value +/- uncertainty, computed from LOLA +/- tolerance, or median over the landing region), `source.<param>`, `rock_class` with `rock_class_name`, `soil` (Bekker-Wong `cohesion`, `friction_angle`, `kc`, `kphi`, `n`, with `range`, `units`, `source`, `status`), `physical` (thermal inertia, rock cover, subsurface ice, mean temperature and half range, density 0-2 m, FeO, elevation, air density, wind) with `physical_units`, `physical_source`, `physical_notes`, and `elevation_datum` (LOLA sphere, MOLA areoid or EGM96 geoid: heights of different bodies are not comparable). On Earth the physical quantities come from the place dossier: elevation (NASADEM / AW3D30), surface temperature (MODIS MOD11A2), soil density 0-2 m (SoilGrids, 6 layers), air density and wind (MERRA-2); thermal inertia, rock cover, ice and FeO have no measured Earth equivalent and stay `NaN`. `notes` flags parameters that are matching indices, not physical quantities (`grain_proxy`, `rock_cover`). `polenta_analogue` adds `match` (score, kappa, per-parameter similarity, state and weight) and `site` (country, H3 cells, field dossier, with `site_units`). `NaN` means no data, never zero.

Bekker-Wong values come from `data/config/soil_mechanics.csv`, one row per site and parameter (`site` = `*` applies to the whole world), with `[lo, hi]` and a status: `measured` (in situ at that site), `inferred` (model fit to rover data at that site), `literature` (checked against the source, not specific to the site), `literature [NV]` (not yet checked) or `not measured` (`NaN`). Central value: the authors' value if given, else the median of the measured values. Mars: Phoenix cohesion and friction angle measured by the lander arm (Shaw et al. 2009), Gale inferred from Curiosity drives (Arvidson et al. 2014); `kc`, `kphi` and `n` are not constrained by measurements and stay `NaN`. Moon: the Apollo rover (LRV) trafficability set, Lunar Sourcebook Table 9.14 (Carrier et al. 1991, after Costes et al. 1972), with the Apollo range for cohesion and friction angle (Table 9.11, confirmed by NASA SP-330); Aristarchus uses the friction angle of pyroclastic deposits (31 deg, Bickel et al. 2019). Earth places have no measured soil mechanics: their `soil` is estimated from the soil texture class (`status` = `estimated (texture class)`). Sand and clay of the top 5 cm (SoilGrids) give the USDA texture class (Soil Survey Manual 2017 triangle); `data/config/soil_by_texture.csv` gives, per class, the bevameter and shear tests of Wong (2010), *Terramechanics and Off-Road Vehicle Engineering*, 2nd ed., Tables 4.1, 5.1 and 5.2 (sand, sandy loam, loam, clay loam of Eastern Ontario): `n`, `kc`, `kphi` from the single test with the best fit (so the three belong together), cohesion and friction angle as the median of the tests, ranges as min-max. Clays have no reference soil and stay `NaN`. The reference soils were moist and the analogues are dry: for more precision measure on site and replace the values with your own dataset. The code is in `src/web/src/simulink.js` (schema, units, package), `src/web/src/matfile.js` (MAT Level 5 writer) and `src/web/src/zip.js` (zip writer). `node src/simulink.test.mjs` checks every site × test pair (schema, SI units, conversions, ranges, sources, zip), and with `OUT=<dir>` it also writes the packages.

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

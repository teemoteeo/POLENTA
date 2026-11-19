# Extending POLENTA with your own data

This guide is for an engineer who wants to plug their own data or requirements into POLENTA. That can mean:
- soil measured on site;
- different weights for a test;
- a new test;
- a new parameter;
- their own test facility.

Most changes touch configuration files only, in `data/config/`. Code changes are needed only for a new Earth parameter. Every number you add must carry its source: author, year, DOI or URL, and page or table.

| You want to | Edit | Then run |
|---|---|---|
| Use soil you measured on site, for one study | Nothing in the repo: overwrite the soil fields in MATLAB (section 1) | |
| Change the soil of a Moon or Mars site | `data/config/soil_mechanics.csv` | `node src/simulink.test.mjs` |
| Change the weights of a test | `data/config/tests.yaml` and `data/config/siti_e_pesi.csv` | export (section 6) |
| Add a test | the same two files, plus the English name in `src/web/src/i18n.js` | export |
| Change a target value of a site | `data/config/siti_e_pesi.csv` | export |
| Add a parameter measured on Earth | pipeline code plus config (section 4) | the Earth steps, then export |
| Add an indoor facility | `data/config/facilities.csv` | export |

## 1. Your own soil measurements

Earth places have no measured soil mechanics. Their Bekker-Wong values in the Simulink package are **estimates from the soil texture class**:
- **Field `status`:** `estimated (texture class)`.
- **How the class is found:** the SoilGrids sand and clay of the top 5 cm give the USDA texture class.
- **Where the values come from:** for each class, `data/config/soil_by_texture.csv` holds the bevameter and shear tests of Wong (2010), Tables 4.1, 5.1 and 5.2.

The reference soils were moist, while the analogue places are dry. If you measure the soil on site (bevameter, shear vane), replace the estimate with your values after loading the package. Keep the units in the field names (the same as `info.unit`):

| Field | Unit |
|---|---|
| `soil_cohesion_Pa` | Pa |
| `soil_friction_angle_deg` | deg |
| `soil_kc` | N m^-(n+1) |
| `soil_kphi` | N m^-(n+2) |
| `soil_n` | 1 |

```matlab
init_polenta                                     % loads target, analogue, target_range, info, meta
analogue.soil_cohesion_Pa        = 1200;         % Pa
analogue.soil_friction_angle_deg = 33;           % deg
analogue.soil_kc = 2.1e4; analogue.soil_kphi = 1.1e6; analogue.soil_n = 0.9;   % from your bevameter fit (same test)
src = 'Our bevameter campaign, 2027-05-12, plate 0.1 m, report XYZ-123 p.4';
for k = {'soil_cohesion_Pa','soil_friction_angle_deg','soil_kc','soil_kphi','soil_n'}
    i = strcmp(info.field, k{1});
    info.analogue(i) = analogue.(k{1});
    info.analogue_status{i} = 'measured';
    info.analogue_source{i} = src;
end
```

Take `kc`, `kphi` and `n` from the same pressure-sinkage fit, because the three only make sense together.

There is no table yet for measured soil at a given Earth place inside the repo, so these values live only in your MATLAB workspace. If you need them in every package, open an issue: the place to add them is `soilFor` in `src/web/src/simulink.js`.

## 2. Soil of a Moon or Mars site

`data/config/soil_mechanics.csv` has one row per site and parameter:
- **Key:** `world`, `site`. A site of `*` applies to the whole world.
- **Value columns:** `param`, `value`, `lo`, `hi`.
- **Description columns:** `unit`, `source`, `status`.

The CSV units are fixed: `kPa`, `deg`, `kN/m^(n+1)`, `kN/m^(n+2)` and `-`. The package converts them to SI.

`status` is one of:
- `measured`: in situ at that site;
- `inferred`: model fit to rover data at that site;
- `literature`: checked against the source;
- `literature [NV]`: not checked yet;
- `not measured`: leave `value` empty, and it becomes `NaN`.

Central value: the authors' value if they give one, otherwise the median of the measured values.

`node src/simulink.test.mjs` (from `src/web`) fails if a unit or a range is wrong.

## 3. Tests and weights

A test is an entry under `tests:` in `data/config/tests.yaml`. Its fields:
- **`requisiti`:** `param: weight`.
  - The weights sum to 1, and each nonzero weight is at least 0.05.
  - A weight of 0 means the parameter does not count.
  - The parameter names are the ones in `data/config/params.csv`.
- **`filtri`:** hard filters, such as `ndvi: "< 0.2"`.
- **`indoor`:** what Earth never reproduces.
  - Example: `gravity_1_6`, `vacuum`.
  - Each item is matched with the `covers` column of `facilities.csv`.
- **`validazione`:** known test sites that should rank high.

The score reads the weights from `tests.yaml` only. The matrix `data/config/siti_e_pesi.csv` repeats them in its weight columns, named `Peso <Name> (<test_id>)`, as the team's reference next to the target values and sources. Keep the two in sync by hand.

`python -m src.pipeline.run --step check` prints the weight sum of every test.

A new test also needs:
- an English name and a one-line description in `TEST_EN` in `src/web/src/i18n.js`;
- optionally a 3D model in `MODELS` in `src/web/src/data.js`.

The app shows a test only when the export has a file for it (`data/export/sites/<site>__<test>.json`).

## 4. A new parameter

Two kinds of files are involved.

**Target side, the matrix `data/config/siti_e_pesi.csv`.** Add one row per parameter:
- **Value cells:** one per site, in one of two forms:
  - `13.5 ± 1.5 °`: value ± uncertainty, which becomes the range [v - σ, v + σ];
  - `0.2 – 0.9`: a range, written with an en dash.
- **Weights:** one per test.
- **`Reference` column:** labelled parts, such as `Moon: ...; Mars: ...` or `Polar Moon: ...; Aristarchus: ...; Phoenix: ...`. Each package keeps only the part that applies to its site (`sourceFor` in `simulink.js`), so use these labels.

**Earth side**, in this order:
1. **The raster.** An Earth Engine function in `src/pipeline/surface.py` that returns `{name: image}` on the 0.05° grid. Register it in `GROUPS`.
2. **The mapping.** `SOURCES` in `src/pipeline/features.py`, from parameter to raster names in order of preference. The hexagon value is the mean of its pixels, weighted by bare-ground area.
3. **`data/config/params.csv`.** One row: name, dimension, unit, and the Earth, Moon and Mars source.
   - The unit must be one that `SI` in `src/web/src/simulink.js` can convert.
   - If it is not, add the conversion there; the test fails until you do.
4. **`data/config/sensors.json`.** The instrument on each world (`earth`, `moon`, `mars`), shown in the card and in the trade-off CSV.
5. **App labels.** `PARAM_EN` in `src/web/src/names.js` (display name), and `src/web/src/format.js` (display unit and decimals).
6. **Export labels.** `EARTH_UNITS` and `GAP_LABELS` in `src/pipeline/export.py`.
7. **Percentile scoring.** The score uses the distance in Earth percentiles. A parameter scored on physical distance instead goes in `PHYSICAL` in `src/pipeline/score.py`; today only `permafrost_share`.

Terrain parameters computed at 30 m involve more steps:
- `fine.py`: exact values on candidates and on the fixed sample;
- `calibrate.py`: estimate from 500 m on the rest;
- `lunar.py`: the same definition on LOLA for the Moon;
- `features.py` and `score.py`: the fixed reference sample.

Commit `915a2d1` (drivable slope and drivable area, TODO [17]) is a complete worked example.

## 5. Indoor facilities

`data/config/facilities.csv` has one row per facility:
- **Location:** `id`, `name`, `place`, `country`, `lat`, `lon`.
- **Description:** `type` and `capacity`, with the source.
- **`covers`:** the gaps it closes, separated by `;`. Use parameter names or indoor items, such as `vacuum` or `soil_density`.

For each place, the export picks the smallest set of facilities that covers every broken parameter and every indoor item. Ties go to the facility nearest to the customer.

## 6. Regenerate and check

```sh
source src/pipeline/.venv/bin/activate
python -m src.pipeline.run --step check
python -m src.pipeline.run --step export --no-refine     # preview in data/raw/export_preview/
# compare the preview with data/export, then:
python -m src.pipeline.run --step export --publish --no-refine
cd src/web && node src/simulink.test.mjs && node src/campaign.test.mjs && npx vite build
```

`--no-refine` reuses the 30 m values already computed. Without it, the export also computes new candidates at 30 m on Earth Engine.

`node src/simulink.test.mjs` checks every site × test pair:
- the Simulink package: schema, SI units, conversions, ranges, sources, zip;
- the trade-off CSV.

The README describes the full pipeline (section *Run the pipeline*).

## What you get out

Each place card has two download buttons. Both cover the chosen site (Moon or Mars) and the chosen place on Earth.
- **Data report (.html).** A short document that opens in any browser and prints to PDF. It holds:
  - the key figures: similarity, weight with data, and the share that holds, is partial or breaks;
  - five tables: locations; matched parameters (weight, target range, place value, similarity, state); physical properties; Bekker-Wong soil mechanics with status; field conditions;
  - notes and numbered references, with DOIs as links.
- **Simulink package (.zip).** One `.mat` with flat structs: `target` and `analogue` (same fields, numbers only, unit in the field name), `target_range`, `info` (one row per field with unit, similarity, weight, state and sources) and `meta`; plus `init_polenta.m`, `README.txt` and `SOURCES.txt`.

The two downloads are built by the same code (`buildTarget` / `buildAnalogue` in `simulink.js`), so the report and the `.mat` files always show the same numbers.

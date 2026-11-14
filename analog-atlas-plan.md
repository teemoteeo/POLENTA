# Analog Atlas — NASA Space Apps 2026 Project Plan

> **Purpose of this file.** Single source of truth for humans and coding agents working in this repo.
> Read it before implementing anything. When code and this file disagree, ask the team before changing either.
>
> - **Challenge:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars* (NASA Space Apps 2026)
> - **Team:** Edo (ML, backend and scoring), Timoteo (software, data infra and app), Rocco (nanotech engineering, physics and content)
> - **Event window:** Sat 2026-11-14 15:30 → Sun 2026-11-15 17:00 (submission planned by 16:30)
> - **Last updated:** 2026-11-14

---

## 1. Concept

We build **Analog Atlas**: a global map that scores every land area on Earth against a chosen Moon or Mars base site, one dimension at a time, and explains what matches and where the analogy breaks.

- **Pitch:** No place on Earth is the Moon. But many places are *partly* the Moon. We show which part, how much, and what you could test there.
- **Differentiator:** most teams will output one blended score. We keep a per-dimension fingerprint, so a site can read "strong terrain and mineral analog, weak thermal analog". That is exactly what the challenge asks for.
- **Known analogs are our test set, not our answer.** Atacama, Haughton, the Dry Valleys and others check that the method works. The headline result is high-scoring places that are *not* already known analogs.
- **Scope:** Mars (Jezero) is the MVP; Moon targets are a stretch goal. Explainable scoring plus ML-fitted weights. Deliverables: a web app and a short written report.

## 2. Targets

Each target is a profile config file with one target range per sub-feature and a citation for each value. Jezero is built first.

| Target | Body | Why it matters | Traits to match |
| --- | --- | --- | --- |
| Jezero crater (**MVP**) | Mars | Perseverance site, ancient lake delta | Delta sediments, carbonates, clays, olivine; cold, dry, dusty |
| Gale crater | Mars | Curiosity site | Layered sediments, clays, sulfates, hematite; dunes |
| Arcadia Planitia | Mars | Candidate human landing region with shallow ground ice | Flat plains, ice-rich ground, periglacial landforms |
| Artemis III south-pole regions (e.g. Malapert Massif, Haworth, Nobile Rim) | Moon | Candidate sites for landing and a permanent base | Rugged highland terrain, anorthosite rock, extreme cold, low sun angle, ice in shadowed craters |

The traits come from memory and must be checked against PDS and mission pages when building the profiles.

## 3. Analog dimensions and datasets

Six dimensions, plus a seventh as a stretch goal. Product names are from memory: confirm exact names and resolutions before relying on them.

| Dimension | Earth data | Moon / Mars data | Notes |
| --- | --- | --- | --- |
| Terrain: slope, roughness, relief, crater-likeness | Copernicus DEM GLO-30 ([Copernicus Data Space](https://dataspace.copernicus.eu/)); NASADEM / SRTM ([Earthdata Search](https://search.earthdata.nasa.gov/)) | LOLA DEMs ([LRO](https://pds-geosciences.wustl.edu/missions/lro/)); MOLA and HiRISE DTMs ([PDS](https://pds.nasa.gov/)) | Easiest to compare across planets; compute at matched resolution |
| Temperature: mean, daily range, minimum | MODIS land surface temperature (Earthdata) | [Diviner](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm) (Moon); THEMIS and rover weather records (Mars, PDS) | Earth never reaches Moon/Mars values: score against Earth's own extremes |
| Aridity and vegetation | GPM IMERG rainfall, MODIS NDVI (Earthdata); GSMaP ([JAXA G-Portal](https://gportal.jaxa.jp/gpr/index/index)) | None: zero on both bodies | Acts as a "lifeless surface" filter |
| Composition and minerals | EMIT mineral maps (Earthdata, dry regions only); ASTER emissivity; a global lithology map | CRISM mineral maps (Mars, PDS); highland and mare rock maps (Moon) | Rocco maps both sides to shared mineral classes |
| Dust and wind | MERRA-2 aerosols and winds, MODIS aerosol depth (Earthdata) | Mars Climate Sounder dust records (PDS) | Mars only: the Moon has no wind |
| Ice and permafrost | ESA CCI Permafrost ([ESA Open Science Catalog](https://opensciencedata.esa.int/)); MODIS snow | Mars ground-ice maps; Moon: Diviner ice stability, LEND, Mini-RF | Key for resource (ISRU) use cases |
| Radar roughness (stretch) | Sentinel-1; [RADARSAT-1](https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1) and [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm) (CSA) | Mini-RF (LRO) | Cross-planet link; start from CSA's [SAR Python tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial) |

Earth cannot reproduce gravity, the lunar vacuum, the thin Martian air or the radiation environment. Every site card shows these as "breaks down". [NASA Worldview](https://worldview.earthdata.nasa.gov/) is for quick visual checks of candidate sites.

## 4. Method overview

1. **Global grid.** Earth's land surface as equal-area H3 hexagons (resolution 5, about 250 km² each, roughly 600k cells). Coarse global products only at this stage.
2. **Features.** One value per cell per sub-feature (e.g. median slope, summer daily temperature range). Target ranges come from the profile files.
3. **Score each dimension.** 0–1, based on how many Earth percentile points the cell is from the target. When Earth can't reach the target value, the target is effectively clipped to Earth's extreme and the leftover gap is reported as "breaks down".
4. **Fingerprint and total.** The six scores form the fingerprint. The total is a weighted geometric mean, so a near-zero score on any dimension drags the total down. Weights come from use-case presets: rover mobility, mineral resources (ISRU), astrobiology, construction.
5. **ML: fit the weights.** The 20–30 known analog sites are the answer key: fit the geometric-mean weights so that they rank as high as possible. Stretch goal: a positive-unlabeled classifier as a second opinion.
6. **New candidates.** Cells with a high score that stays high across weight samples, and no known analog within about 200 km.
7. **Validation.** Leave one site out; negative controls (wet, forested areas) must score low.
8. **Zoom in.** For the top ~10 candidates: 30 m elevation, Sentinel-2 imagery and EMIT minerals, side by side with a HiRISE or LROC image of the target.

Known analogs skew toward places that are easy to reach, so the weights stay close to Rocco's expert values and we never rank on ML alone.

## 5. Scoring algorithm

### 5.1 Plain explanation

For every piece of Earth, the algorithm answers: how similar is it to the target (e.g. Jezero crater), and in which ways? All numbers below are made up to illustrate.

1. **Cut Earth into tiles.** ~600,000 equal-area tiles of ~250 km². Each tile gets its own score.
2. **Describe every tile with the same measurements** (average slope in degrees, coldest night in °C, yearly rain in mm, surface minerals). The target is described with the same measurements from Moon/Mars data.
3. **Compare one measurement at a time, using percentiles.** Each value becomes a percentile on Earth ("colder than X% of Earth's land").

   | Place | Coldest night | Percentile on Earth |
   | --- | --- | --- |
   | Jezero (target) | −80 °C | 100 (colder than anywhere on Earth) |
   | Tile A, polar desert | −45 °C | 97 |
   | Tile B, rainforest | +18 °C | 40 |

   Tile A is 3 points from the target; Tile B is 60 points away. Percentiles put every measurement on the same 0–100 scale, and a target more extreme than Earth simply sits at 100.
4. **Turn distance into a score from 0 to 1.**

   | Distance (percentile points) | 0 | 3 | 10 | 20 | 60 |
   | --- | --- | --- | --- | --- | --- |
   | Score | 1.00 | 0.91 | 0.37 | 0.02 | ≈ 0 |
5. **Combine dimensions by multiplying, not averaging** (geometric mean).

   | Tile | Terrain | Cold | Dry | Minerals | Average | Geometric mean |
   | --- | --- | --- | --- | --- | --- | --- |
   | A, polar desert | 0.90 | 0.80 | 0.90 | 0.70 | 0.83 | **0.82** |
   | B, rainforest | 0.95 | 0.30 | 0.02 | 0.60 | 0.47 | **0.24** |

   One terrible dimension pulls the whole score down.
6. **The explanation comes for free.** The Analog Card shows each dimension's score: strong, partial, and what always breaks down (gravity, atmosphere, radiation).
7. **Weights say what matters for the goal.** They are the exponents of the geometric mean.
8. **ML fits the weights** using known analogs as an answer key; high-scoring tiles far from any known analog are new discoveries.
9. **Check it works.** Hide a known site: does it still rank near the top? Rainforests must score low.

### 5.2 Formal model

**Notation**

- Cells *i* = 1…N: Earth land H3 cells at resolution 5 (N ≈ 600k).
- Dimensions *d* = 1…D (D = 6): terrain, thermal, aridity, composition, dust, ice. Each has sub-features *k* ∈ K_d with raw value x_ik.
- Target T: interval [ℓ_k, u_k] per sub-feature = 10th–90th percentile over the target region (or value ± uncertainty for literature values).
- F_k: empirical CDF of sub-feature *k* over Earth land cells (mid-ranks for ties).
- Terrain features are computed at the **same DEM resolution on both bodies** (≈ 460 m, matching MOLA).

**Sub-feature distance** (Earth percentile units; out-of-range targets map to 0 or 1, so clipping is automatic):

```math
\Delta_{ik} = \max\bigl(0,\; F_k(\ell_k) - F_k(x_{ik}),\; F_k(x_{ik}) - F_k(u_k)\bigr)
```

**Dimension score** (sub-feature weights a_k fixed by Rocco; bandwidth τ; floor ε):

```math
D_{id} = \sqrt{\frac{\sum_{k \in K_d} a_k \, \Delta_{ik}^2}{\sum_{k \in K_d} a_k}}, \qquad s_{id} = \max\left(\varepsilon,\; e^{-(D_{id}/\tau)^2}\right)
```

**Composition** uses a rarity-weighted Ruzicka similarity between mineral-class vectors m_i and m_T (p_c = share of Earth cells containing class c):

```math
s_{i,\text{comp}} = \frac{\sum_c \rho_c \min(m_{ic}, m_{Tc})}{\sum_c \rho_c \max(m_{ic}, m_{Tc})}, \qquad \rho_c = -\log p_c
```

**Gap ("breaks down").** g_k = physical distance between the target interval and Earth's range [min_i x_ik, max_i x_ik]; 0 when Earth can reach the target. Same for every cell; shown on the Analog Card.

**Aggregation** (weighted geometric mean, log form):

```math
\log S_i = \sum_{d=1}^{D} w_d \log s_{id}, \qquad w_d \ge 0.05, \quad \sum_d w_d = 1
```

Each term w_d · log s_id is the exact contribution of dimension *d*, so explanations need no SHAP. Ranking by log S equals ranking by S.

**Missing data.** A_i = dimensions with data in cell *i*. Renormalise weights over A_i and report confidence κ_i = Σ_{d∈A_i} w_d. Cells with κ_i < 0.7 are not ranked.

```math
\log S_i = \frac{\sum_{d \in A_i} w_d \log s_{id}}{\sum_{d \in A_i} w_d}
```

**Cells to sites.** Top 1% of cells by S → merge neighbours (connected components on H3 adjacency) → site score = median S of its cells → keep at most one site per 100 km. Sites > 200 km from any known analog are flagged **new**.

| Parameter | Starting value |
| --- | --- |
| τ (bandwidth) | 0.1 |
| ε (score floor) | 0.01 |
| Weight floor | 0.05 |
| Minimum confidence κ | 0.7 |
| Candidate cut | top 1% of cells |
| Site spacing | 100 km |
| "New" distance | 200 km |

All values are starting guesses, to be tuned against the validation checks.

### 5.3 Fitting the weights

The fitted parameters are the 6 exponents w of the geometric mean. Pick the w that ranks known analogs highest while staying close to Rocco's prior weights. **Build random search first; add pairwise logistic if time allows.**

**Setup.** z_i = (log s_i1, …, log s_iD), so log S_i = w · z_i. Each known analog site p ∈ P gets **one row** (median z over its cells). B = background sample of 20,000 random land cells.

**Objective** (mean percentile of known analogs among the background; 1 = all at the top):

```math
J(w) = \frac{1}{|P|} \sum_{p \in P} \frac{1}{|B|} \sum_{b \in B} \mathbf{1}\left[\, w \cdot z_b < w \cdot z_p \,\right]
```

**Option 1: random search (start here).**

```math
w^{(j)} \sim \mathrm{Dirichlet}(50 \cdot w_{\text{prior}}), \qquad \hat{w} = \arg\max_j J\!\left(w^{(j)}\right)
```

```python
import numpy as np
rng = np.random.default_rng(0)

# logS_bg:  (20000, 6) log-scores of random background cells
# logS_pos: (25, 6)    log-scores of known analogs, one row per site
def objective(w):
    bg, pos = logS_bg @ w, logS_pos @ w
    return np.mean([(bg < p).mean() for p in pos])

prior = np.array([0.25, 0.20, 0.20, 0.15, 0.10, 0.10])
cands = rng.dirichlet(prior * 50, size=10_000)   # 50 = how tightly to stay near the prior
cands = cands[(cands >= 0.05).all(axis=1)]       # weight floor
best_w = max(cands, key=objective)
```

**Option 2: pairwise logistic (learning to rank).** log S is linear in w, so this is a linear ranking model. B′ = background plus negative-control cells. Minimise with L-BFGS (`scipy.optimize.minimize`):

```math
w = 0.05 + 0.7\,\mathrm{softmax}(\theta), \qquad \mathcal{L}(\theta, c) = \frac{1}{|P||B'|} \sum_{p \in P} \sum_{n \in B'} \log\!\left(1 + e^{-c\, w \cdot (z_p - z_n)}\right) + \lambda \lVert w - w_{\text{prior}} \rVert^2
```

**Option 3: Optuna.** Black-box Bayesian search. Overkill for 6 weights; only if τ and other parameters are tuned together.

**Guardrails**

1. One row per site, so large sites don't dominate.
2. Leave one site out: the held-out percentile is the real result.
3. Weight floor plus prior: prevents putting everything on dryness because most known analogs are deserts.
4. True negatives: rainforest controls must rank low.
5. Fit Mars and Moon separately.
6. Sub-feature weights a_k stay fixed (set by Rocco); only 6 numbers are fitted from ~25 sites.

### 5.4 Validation

| Check | How | What we report | Pass if |
| --- | --- | --- | --- |
| Leave one site out | Fit weights without site *p*, then rank *p* | Median held-out percentile; share in top 5% | Median ≥ 0.95 |
| Negative controls | Score Amazon, Congo and Borneo cells | Their median percentile | ≤ 0.5 |
| Robustness | Score with 1,000 weight vectors from Dirichlet(50 · ŵ) | Per site: share of draws where it stays in the top 100 | Pitch only sites ≥ 0.8 |
| Ablation | Drop one dimension at a time and re-rank | Change in held-out percentile per dimension | Every dimension should help, or we cut it |

Leave-one-site-out must use **spatial blocks** (~500 km) so tiles next to a known site don't leak into training.

## 6. Product

The demo is a web map: pick a target and a use case, then click any place to get its Analog Card. Results are precomputed; the app needs no backend for scoring.

**Flow:** choose target → choose use-case preset → global heat map → click a cell → Analog Card.

**Analog Card**

- Radar chart of the six dimension scores, with the target profile on top
- **Strong analogy:** top dimensions, with plain-language reasons
- **Breaks down:** weak dimensions, plus gravity, atmosphere and radiation
- Side-by-side images: Earth (Sentinel-2) vs target (HiRISE or LROC)
- **What you could test here:** e.g. rover mobility on similar slopes, dust-resistant coatings, drilling and resource extraction, instrument calibration on similar minerals
- Data sources, with links

**Written report (2–3 pages):** method, validation numbers, top 3 new candidates described in depth.

**Stack:** Python pipeline (xarray, rasterio, h3, scikit-learn or LightGBM) → map tiles / GeoJSON → React with MapLibre or deck.gl → static hosting. Per-dimension scores can ship to the browser as uint8 so weight sliders recompute client-side.

## 7. Repo contracts (config and data files)

Proposed file formats. Keep the pipeline **target-agnostic**: a new target must only require a new profile file.

**`weights.yaml`** — preset (dimension) weights and fixed sub-feature weights (owner: Rocco)

```yaml
presets:
  rover_mobility: {terrain: 0.40, thermal: 0.15, aridity: 0.15, composition: 0.10, dust: 0.15, ice: 0.05}
subfeatures:
  terrain: {slope_median: 0.4, slope_p90: 0.2, roughness: 0.2, relief: 0.2}
```

Rules: each preset sums to 1; every weight ≥ 0.05.

Placeholder presets (Rocco to replace):

| Preset | Terrain | Thermal | Aridity | Composition | Dust | Ice |
| --- | --- | --- | --- | --- | --- | --- |
| Rover mobility | 0.40 | 0.15 | 0.15 | 0.10 | 0.15 | 0.05 |
| Mineral resources (ISRU) | 0.10 | 0.10 | 0.15 | 0.40 | 0.05 | 0.20 |
| Astrobiology | 0.05 | 0.20 | 0.30 | 0.25 | 0.05 | 0.15 |

**`analogs.csv`** — known-analog catalog, the answer key (owner: Rocco). Include 3–5 true negatives (rainforests).

```csv
name,lat,lon,radius_km,body,target,analog_for,source_url
```

**Target profiles** (owner: Rocco) — per target, the [p10, p90] range of every sub-feature, with a source each.

**Mineral classes** (owner: Rocco) — ~8 shared classes (e.g. basalt/olivine, clays, carbonates, sulfates, iron oxides, anorthosite) and how EMIT, the lithology map and CRISM map into them.

**Pipeline outputs** (owner: Edo) — `features.parquet` (cell × ~20 sub-features), per-target per-dimension scores per cell, fitted weights, site list with novelty flag.

## 8. Roles

| Who | Owns | Delivers |
| --- | --- | --- |
| Rocco (nanotech engineering) | Physics of the analogy | Target profiles with citations; mineral-class mapping; known-analog catalog; "breaks down" text; "what you could test here" ideas (materials, dust, ISRU); science part of the pitch |
| Edo (ML) | Backend, features, scoring, weight fitting | Feature pipeline for Earth and targets; per-dimension scoring; weight fitting; validation numbers; candidate site list |
| Timoteo (software) | Data infrastructure and app | Data downloads and storage; tile generation; map app and Analog Card UI; deployment; demo video |
| Possible 4th member | Depends on skills | GIS / remote sensing: help Edo with the pipeline. Design: help Timoteo with UI and pitch visuals |

**Rocco's deadlines**

- [ ] Sat 18:30 — Known-analog catalog (`analogs.csv`), with negatives
- [ ] Sat 22:00 — Jezero target profile
- [ ] Sat 22:00 — Preset weights
- [ ] Sat 22:00 — Sub-feature weights
- [ ] Sat 23:30 — Mineral classes
- [ ] Sun 10:00 — Sanity check of fitted weights and top sites

## 9. Timeline (Sat 15:30 – Sun 17:00)

~25 hours, ~19 working after dinner and 6 h sleep. MVP = **Jezero only**. Rule: a ranked map before anyone sleeps. If a gate slips by more than 2 hours, cut scope in the order listed in Risks.

**Gates**

| Gate | When |
| --- | --- |
| Vertical slice (2 dimensions end-to-end on the map) | Sat 20:00 |
| First ranked map (all available dimensions, Jezero) | Sun 01:00 |
| Feature freeze | Sun 12:00 |
| Submit (deadline assumed 17:00) | Sun 16:30 |

| When | Edo: backend and scoring | Timoteo: data infra and app | Rocco: physics and content |
| --- | --- | --- | --- |
| **Sat 15:30–16:30** Kickoff | Agree on scope; set up Python env and H3 grid | Create repo; Earthdata and Copernicus logins working | Start known-analog catalog |
| **Sat 16:30–20:00** Data + vertical slice | Terrain and aridity features; percentile scoring vs rough Jezero target | Download scripts for coarse global products; map app drawing H3 cells from a test file | Finish catalog by 18:30 (with negatives); then Jezero profile |
| **Sat 20:00–20:45** | Dinner | Dinner | Dinner |
| **Sat 20:45–01:00** Full scoring | Add thermal and composition, then dust and ice if data ready; geometric mean with preset weights | Heat-map layer; target and preset selector; weight sliders recomputing in browser | Preset and sub-feature weights by 22:00; mineral classes by 23:30; text templates for "breaks down" and "what to test" |
| **Before sleep** | Start leave-one-site-out and robustness runs overnight | Push a working build | Hand over all config files |
| **Sun 01:00–07:00** | Sleep | Sleep | Sleep |
| **Sun 07:00–12:00** ML + app | Fit weights (random search); read overnight validation; negative controls; extract top sites, flag new ones | Analog Card UI (radar chart, strong / breaks-down lists, images); first deploy by 12:00 | Sanity-check weights and top sites by 10:00; pick 3 best new candidates; gather Earth vs Mars images. Stretch: Artemis profile |
| **Sun 12:00–15:30** Polish + pitch | Final numbers and one validation figure; method section of report; bug fixes | Final deploy; record demo video | Write report (2–3 pages) and pitch slides |
| **Sun 15:30–17:00** Submit | Rehearse together | Submit by 16:30 | Keep 30 min buffer |

## 10. Risks and cuts

The biggest risk is data wrangling eating the whole weekend: coarse global data first, detailed data only for the top 10 candidates.

| Risk | Fallback |
| --- | --- |
| Downloads and regridding take too long | Monthly or climatology products at 0.05–0.1°; skip any dimension not ready by Sat 22:00 |
| Moon/Mars values not comparable to Earth's | Clip targets to Earth's range; state the gap as "breaks down" |
| ML only rediscovers known sites | Rank on the physics score too; filter cells near known analogs; report honestly |
| Mineral mapping too hard in time | Fall back to coarse rock classes from the lithology map |
| Too much scope | Cut in this order: radar dimension → extra Moon targets → image embeddings → weight fitting (the score with preset weights alone is still a full entry) |

**Open questions**

- Moon stretch goal: try the Artemis profile on Sunday morning, or skip it?
- Is a 4th member joining, and with what skills?
- Were new datasets added to the challenge Resources tab?

## 11. Sources

Official challenge Resources tab: [Earthdata Search](https://search.earthdata.nasa.gov/), [Worldview](https://worldview.earthdata.nasa.gov/), [PDS](https://pds.nasa.gov/), [LRO](https://pds-geosciences.wustl.edu/missions/lro/), [Diviner](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm), [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm), [RADARSAT-1](https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1), [SAR tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial), [Copernicus Data Space](https://dataspace.copernicus.eu/), [ESA Open Science Catalog](https://opensciencedata.esa.int/), [JAXA G-Portal](https://gportal.jaxa.jp/gpr/index/index).

Other dataset names (MODIS, EMIT, MERRA-2, CRISM, etc.) are from memory and not yet verified.

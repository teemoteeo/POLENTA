# Analog Atlas — NASA Space Apps 2026 Project Plan

> **Purpose of this file.** Single source of truth for humans and coding agents working in this repo.
> Read it before implementing anything. When code and this file disagree, ask the team before changing either.
>
> - **Challenge:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars* (NASA Space Apps 2026)
> - **Team:** Edo (ML, data pipeline and scoring), Timoteo (frontend, app and deploy), Rocco (nanotech engineering, physics and content)
> - **Event window (official Turin schedule):** hacking Sat 2026-11-14 16:00 → submission deadline Sun 2026-11-15 16:00; pitch 16:15. We submit by 15:30 (§9)
> - **Other docs:** `AGENTS.md` (agent rules and scopes), `clipboard/findings.md` (live log), `clipboard/fonti/BRIEFING-DIVISIONE.md` (skills per member). They point here for plan, roles and timeline
> - **Last updated:** 2026-11-14

---

## 1. Concept

We build **Analog Atlas**: a global map that scores every land area on Earth against a chosen Moon or Mars base site, one dimension at a time, and explains what matches and where the analogy breaks.

- **Pitch:** No place on Earth is the Moon. But many places are *partly* the Moon. We show which part, how much, and what you could test there.
- **Differentiator:** most teams will output one blended score. We keep a per-dimension fingerprint, so a site can read "strong terrain and mineral analog, weak thermal analog". That is exactly what the challenge asks for.
- **Known analogs are our test set, not our answer.** Atacama, Haughton, the Dry Valleys and others check that the method works. The headline result is high-scoring places that are *not* already known analogs.
- **Scope:** Mars (Jezero) is the MVP; Moon targets are a stretch goal. Explainable scoring plus ML-fitted weights. Deliverables: a web app and a short written report.
- **Twist:** not decided yet. Candidates in §1b; we pick one or a combination by Sat 17:00.

## 1b. Twist candidates (decide by Sat 17:00)

The core (per-dimension scores, Analog Card, validation) is the same for every twist, so nothing before Sat 17:00 depends on this choice. We decide on site, after the in-person briefing, and can combine several. The Space Apps rules ask that the idea is the team's own and that any AI use is declared in the submission form: this list is a menu, not a decision.

Judges score each project 1–5 on **Impact, Creativity, Validity, Relevance, Presentation** (Judging & Awards Guide).

| # | Twist | Pitch line | What it adds | Who and cost | Helps most on | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | **Analog Kit** | "No place on Earth is Mars. But three places, together, are." | Smallest set of 2–4 sites that together cover every dimension, optionally within R km of a chosen base (Turin, FVG, a research station). The spaceship flies the itinerary and lands at each stop | Edo ~2 h (greedy); Timoteo itinerary; Rocco a story per stop | Creativity, Presentation | Low |
| T2 | Reachable analogs | "The best analog you can actually get to." | Second axis: access cost (distance to roads and airports, NASA SEDAC population, VIIRS Black Marble night lights; access to verify). Show the Pareto front of analog score vs access cost | Edo ~2 h, 1–2 extra global rasters | Impact, Validity | Low–medium |
| T3 | Mars through time | "Jezero was a lake. Where on Earth is Jezero-then, and Jezero-now?" | 2–3 target profiles per epoch (wet Noachian → cold, dry Amazonian); a slider morphs the map. Matches the challenge's "processes as well as places" | Rocco 2–3 profiles; Timoteo slider; no pipeline change | Creativity, Relevance | Medium (old-epoch profiles are uncertain) |
| T4 | Changing Earth | "Climate change is creating new analogs, and erasing the ones we use." | Same scoring on two periods (e.g. 2001–05 vs 2020–24, MODIS): which places are becoming more or less Mars-like (drying, glacier and permafrost loss) | Edo: features on two periods; Rocco: interpretation | Impact | Medium (data volume) |
| T5 | Train from Turin | "The ExoMars rover will be driven from Turin. Where should its team train?" | Target Oxia Planum, landing site of ESA's Rosalind Franklin rover, whose operations centre is at ALTEC in Turin (verify current mission status). Same method, new profile | Rocco: profile and checks | Relevance (local jury), Impact | Low |
| T6 | Underground Moon base | "The safest Moon base may be underground." | Lunar pits and lava tubes as base sites (Diviner shows stable temperatures in some pit shadows; verify, Horvath et al. 2022); Earth lava tubes and caves as analogs. Site-level story, Moon target | Rocco story; Edo light | Creativity, Relevance | Medium (no global cave data) |
| T7 | Twin of any point | "Pick any spot on Mars. We find its twin on Earth." | Global Mars feature grids (MOLA, TES, THEMIS) instead of one profile, then nearest-neighbour search. Light version: 5–10 preset Mars and Moon sites | Edo heavy (full); light version cheap | Presentation | High (full), low (light) |
| T8 | How Martian is your home? | "Drop a pin: how Martian is your town?" | Click or geolocate any place → its Analog Card, as a shareable image. Uses the precomputed scores | Timoteo only | Impact (outreach), Presentation | Low |
| T9 | Lunar Lander mode | "Land on the best analog." | Arcade mode in the retro style: pilot the spaceship and land; the landing score is the analog score | Timoteo heavy | Presentation | Medium |
| T10 | Mission planner | "Tell us what you want to test; we tell you where." | Start from the technology (drill, wheels, dust coatings, ice extraction, habitat construction) → preset weights → ranked sites with "what to test here" | Rocco presets and texts; Timoteo UI | Impact, Validity | Low (presets exist) |

Combinations that fit together: T1 + T5 (a kit for Oxia Planum, reachable from Turin); T1 + T8 + T9 (the spaceship flies the kit, or lands anywhere you pick); T2 + T10 (practical test planning). Rule of thumb: at most one item marked heavy, and the twist must give the pitch one line and one number.

T1 math: log C(K) = Σ_d w_d · max_{i∈K} log s_id is a facility-location objective (monotone submodular after shifting by −log ε), so greedy selection reaches at least (1 − 1/e) of the optimum. Pitch number: coverage of the best single site vs the kit.

## 2. Targets

Each target is a profile config file with one target range per sub-feature and a citation for each value. Jezero is built first.

| Target | Body | Why it matters | Traits to match |
| --- | --- | --- | --- |
| Jezero crater (**MVP**) | Mars | Perseverance site, ancient lake delta | Delta sediments, carbonates, clays, olivine; cold, dry, dusty |
| Gale crater | Mars | Curiosity site | Layered sediments, clays, sulfates, hematite; dunes |
| Arcadia Planitia | Mars | Candidate human landing region with shallow ground ice | Flat plains, ice-rich ground, periglacial landforms |
| Artemis III south-pole regions (e.g. Malapert Massif, Haworth, Nobile Rim) | Moon | Candidate sites for landing and a permanent base | Rugged highland terrain, anorthosite rock, extreme cold, low sun angle, ice in shadowed craters |
| Oxia Planum (only with twist T5) | Mars | ExoMars Rosalind Franklin landing site, operated from ALTEC, Turin | Ancient flat plains, Fe/Mg clays, remnant fan deposits; cold, dry, dusty |

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

**Flow:** spaceship intro (retro style, `clipboard/references.md`) → choose target → choose use-case preset → global heat map → click a cell → descent onto the site → Analog Card.

Each dimension can be switched off (dropped from the mean) or given a minimum score in the UI, so every active parameter still narrows the results as in the original idea.

**Analog Card**

- Radar chart of the six dimension scores, with the target profile on top
- **Strong analogy:** top dimensions, with plain-language reasons
- **Breaks down:** weak dimensions, plus gravity, atmosphere and radiation
- Side-by-side images: Earth (Sentinel-2) vs target (HiRISE or LROC)
- **What you could test here:** e.g. rover mobility on similar slopes, dust-resistant coatings, drilling and resource extraction, instrument calibration on similar minerals
- Data sources, with links

**Written report (2–3 pages):** method, validation numbers, top 3 new candidates described in depth.

**Stack:** Python pipeline (xarray, rasterio, h3, scikit-learn or LightGBM) → export files in `data/export/` (§7) → React with deck.gl `H3HexagonLayer` on MapLibre (default) → static hosting. Per-dimension scores ship to the browser as uint8 so weight sliders recompute client-side. Timoteo may switch to CesiumJS (notes in `clipboard/findings.md`) if his Sat 16:00–17:00 prototype runs ~600k H3 cells, the flyTo landing and the retro post-process smoothly; decision by Sat 17:00.

## 7. Repo contracts (config and data files)

Proposed file formats. Keep the pipeline **target-agnostic**: a new target must only require a new profile file.

Paths: config files in `data/config/` (owner Rocco: `weights.yaml`, `analogs.csv`, `targets/<target>.yaml`, `minerals.yaml`, `texts.yaml`); app exports in `data/export/<target>/` (owner Edo, read by the app). Changes to the export format go in `clipboard/findings.md` (AGENTS.md rule).

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
| Construction | 0.35 | 0.20 | 0.10 | 0.15 | 0.10 | 0.10 |

**`analogs.csv`** — known-analog catalog, the answer key (owner: Rocco). Start from the USGS Known Terrestrial Analog Sites layer (link in `clipboard/findings.md`). Include 3–5 true negatives (rainforests).

```csv
name,lat,lon,radius_km,body,target,analog_for,source_url
```

**Target profiles** (owner: Rocco) — per target, the [p10, p90] range of every sub-feature, with a source each.

**Mineral classes** (owner: Rocco) — ~8 shared classes (e.g. basalt/olivine, clays, carbonates, sulfates, iron oxides, anorthosite) and how EMIT, the lithology map and CRISM map into them.

**Pipeline outputs** (owner: Edo) — internal: `features.parquet` (cell × ~20 sub-features). For the app, in `data/export/<target>/`:

- `scores.csv`: one row per H3 cell, `h3,terrain,thermal,aridity,composition,dust,ice`, each 0–255, empty = no data
- `sites.json`: candidate sites (id, lat, lon, H3 cells, dimension scores, total, `new` flag)
- `target.json`: target profile and the "breaks down" gaps
- `weights.json`: presets and fitted weights
- twist outputs, added here once the twist is chosen

A small test export is due Sat 18:00 so the app can start on real files.

## 8. Roles

| Who | Owns | Delivers |
| --- | --- | --- |
| Rocco (nanotech engineering) | Physics of the analogy | Target profiles with citations; mineral-class mapping; known-analog catalog; "breaks down" text; "what you could test here" ideas (materials, dust, ISRU); twist content; report, the 7 demo slides and the science part of the pitch |
| Edo (ML) | Data pipeline, features, scoring, weight fitting | Data downloads; feature pipeline for Earth and targets; per-dimension scoring; weight fitting; validation numbers; candidate site list; export files for the app (§7); twist computation |
| Timoteo (software) | App, demo and deploy | Map app and Analog Card UI; spaceship intro and twist UI; deployment; ≤30 s demo video; project page and submission |

The whole team picks the twist by Sat 17:00 (§1b).

**Rocco's deadlines**

- [ ] Sat 18:30 — Known-analog catalog (`analogs.csv`, starting from the USGS layer), with negatives
- [ ] Sat 22:00 — Jezero target profile
- [ ] Sat 22:00 — Preset weights
- [ ] Sat 22:00 — Sub-feature weights
- [ ] Sat 23:30 — Mineral classes
- [ ] Sun 10:00 — Sanity check of fitted weights and top sites
- [ ] Sun 14:30 — Report and the 7 slides

## 9. Timeline (official Turin schedule)

Turin event page: reception Sat 13:00, team composition 14:30, intro 15:00, **hacking starts Sat 16:00**, dinner 20:00–21:00, breakfast Sun 09:00, lunch 13:00, finalization phase 15:00, **submission deadline Sun 16:00**, **pitch session 16:15**, awards 17:30. The page lists its timezone as "Greenwich": confirm at the 15:00 intro that these are Rome times. The global deadline in the Submission Guide (Sun 23:59 local time) is later, but the local one binds us.

24 hours of hacking, ~16 working after meals and 6 h sleep. MVP = **Jezero only**. Rule: a ranked map before anyone sleeps. If a gate slips by more than 2 hours, cut scope in the order listed in Risks.

**Submission requirements** (Project Submission Guide): project page (name, summary, details, NASA data used, partner data and references, AI use); a demo that is **either 7 slides (title included) or a video of 30 seconds or less** (over the limit = out of global judging); a public link to the final project, no login; at least one NASA dataset.

**Gates**

| Gate | When |
| --- | --- |
| Twist chosen (§1b) and map engine chosen (§6) | Sat 17:00 |
| Test export in `data/export/` (§7) | Sat 18:00 |
| Vertical slice (2 dimensions end-to-end on the map) | Sat 20:00 |
| First ranked map (all available dimensions, Jezero) | Sun 01:00 |
| Feature freeze | Sun 11:00 |
| Submitted ("Submit for Judging") | Sun 15:30 |
| Deadline / pitch | Sun 16:00 / 16:15 |

| When | Edo: data, scoring, ML | Timoteo: app, demo, deploy | Rocco: physics and content |
| --- | --- | --- | --- |
| **Sat 13:00–16:00** On site: reception, team confirmation, intro (prep only) | Python env; Earthdata and Copernicus logins working; list of download links | Map keys (Cesium ion, Maps) in `.env`; Space Apps project page created | Note on-site info (challenge updates, pitch format, timezone); get the USGS known-analog layer |
| **Sat 16:00–17:00** Kickoff | H3 grid; start coarse downloads (DEM, NDVI, rainfall) | Map engine prototype, decision by 17:00 | Start `analogs.csv`. **All: pick the twist by 17:00** |
| **Sat 17:00–20:00** Data + vertical slice | Terrain and aridity features; percentile scoring vs rough Jezero target; test export by 18:00 | Map drawing H3 cells from the test export; target selector | Finish catalog by 18:30 (with negatives); then Jezero profile |
| **Sat 20:00–21:00** | Dinner | Dinner | Dinner |
| **Sat 21:00–01:00** Full scoring + twist | Add thermal and composition, then dust and ice if data ready; geometric mean with preset weights; twist computation | Heat-map layer; preset selector; weight sliders and thresholds in browser; twist UI skeleton | Preset and sub-feature weights by 22:00; mineral classes by 23:30; text templates for "breaks down" and "what to test"; twist content |
| **Before sleep** | Start weight fitting (random search) and leave-one-site-out overnight | Push a working build | Hand over all config files |
| **Sun 01:00–07:00** | Sleep | Sleep | Sleep |
| **Sun 07:00–11:00** ML + app (breakfast 09:00) | Read overnight fit and validation; robustness with the fitted weights; negative controls; top sites, flag new ones; twist outputs | Analog Card UI (radar chart, strong / breaks-down lists, images); twist UI; first deploy by 11:00 | Sanity-check weights and top sites by 10:00; pick 3 best new candidates; gather Earth vs target images. Stretch: Artemis profile |
| **Sun 11:00–14:30** Polish + materials (lunch 13:00) | Final numbers and one validation figure; method text for report and project page; bug fixes | Final deploy; record the ≤30 s demo video | Report (2–3 pages); the 7 slides, also used for the pitch; project page texts |
| **Sun 14:30–15:30** Submission | Check numbers and the NASA data list | Fill the project page; test every link in a private window; **submit by 15:30** | Proofread texts and slides |
| **Sun 15:30–16:15** Pitch | Rehearse together | Rehearse together | Rehearse together |

## 10. Risks and cuts

The biggest risk is data wrangling eating the whole weekend: coarse global data first, detailed data only for the top 10 candidates.

| Risk | Fallback |
| --- | --- |
| Downloads and regridding take too long | Monthly or climatology products at 0.05–0.1°; skip any dimension not ready by Sat 22:00 |
| Moon/Mars values not comparable to Earth's | Clip targets to Earth's range; state the gap as "breaks down" |
| ML only rediscovers known sites | Rank on the physics score too; filter cells near known analogs; report honestly |
| Mineral mapping too hard in time | Fall back to coarse rock classes from the lithology map |
| Too much scope | Cut in this order: radar dimension → extra Moon targets → image embeddings → weight fitting (the score with preset weights alone is still a full entry). The chosen twist is never cut whole: simplify its UI instead |

**Open questions**

- Which twist, or which combination (§1b)? Decide by Sat 17:00.
- Moon stretch goal: try the Artemis profile on Sunday morning, or skip it?
- A 4th member at team composition (Sat 14:30)? If so: GIS help for Edo, or design help for Timoteo.
- Ask at the 15:00 intro: are the schedule times Rome time, what are the pitch format and length, and who is the Team Owner who submits?
- Were new datasets added to the challenge Resources tab?

## 11. Sources

Official challenge Resources tab: [Earthdata Search](https://search.earthdata.nasa.gov/), [Worldview](https://worldview.earthdata.nasa.gov/), [PDS](https://pds.nasa.gov/), [LRO](https://pds-geosciences.wustl.edu/missions/lro/), [Diviner](https://pds-geosciences.wustl.edu/missions/lro/diviner.htm), [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm), [RADARSAT-1](https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1), [SAR tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial), [Copernicus Data Space](https://dataspace.copernicus.eu/), [ESA Open Science Catalog](https://opensciencedata.esa.int/), [JAXA G-Portal](https://gportal.jaxa.jp/gpr/index/index).

Other dataset names (MODIS, EMIT, MERRA-2, CRISM, etc.) are from memory and not yet verified.

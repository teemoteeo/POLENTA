# Backend spec — la pipeline, passo per passo (per Edo)

Autore: Edo · 2026-11-14 20:30.

Basata su:
- `docs/proposta-finale.md` (commit `812f5ba`);
- `data/config/tests.yaml` e `data/config/params.csv` (con le modifiche delle 20:05);
- `docs/reference-codice.md`, per le tecniche da riprendere;
- il formato dati già usato dall'app di Timo (`src/web/src/data.js`, commit `d21001f`).

**Scope (AGENTS.md):** scrivo in `src/pipeline/` e `data/`; `data/config/` lo leggo (ne è responsabile Rocco); `src/web/` è di Timo. Chi cambia il formato degli export lo scrive in `docs/` e lo dice a Rocco: questo documento fa da contratto.

Legenda: ⚠ = ID o comportamento da verificare alla prima esecuzione.

**Decisioni confermate (20:40):**
1. DEM sopra i 60°N: **AW3D30 di JAXA** (§4.3).
2. File intermedi in `data/raw/interim/`.
3. **Risoluzione massima:** Luna alla risoluzione nativa di LOLA (5-20 m), Terra a **30 m** su tutto il globo. Confronto alla stessa distanza di misura (30 m) + analisi su più scale con l'esponente di Hurst (§5.1).
4. Formato JSON del §3 approvato.

---

## 0. In breve

| # | Passo | Output | Entro |
|---|---|---|---|
| 0 | Ambiente, account GEE, struttura delle cartelle | `src/pipeline/` pronto, `ee.Initialize()` funziona | **21:00** |
| 1 | **Export di prova** (valori finti, formato definitivo) | `data/export/` con `sites/*.json`, `targets.json`, `benchmark.json`, `manifest.json` | **21:00**: sblocca Timo |
| 2 | Griglia H3 e maschera dei pixel validi | `cells.parquet` | 21:45 (poi si esce dal Politecnico) |
| 3 | Raster del terreno a **30 m** (pendenze su più scale, rugosità, Hurst) + `ndvi` + tabella della luce | raster a 0,05° | 22:15 (rischio: calcolo pesante, vedi §14) |
| 4 | Feature per cella (solo terreno e luce) + punteggio del rover su 1 sito | **primo end-to-end** | **22:30** |
| 5 | Gli altri raster (albedo, inerzia termica, SoilGrids, neve, crateri) | raster | 23:30 |
| 6 | Lato Luna: `artemis.csv` + LOLA per i siti della demo | `targets.json` vero | 00:15 |
| 7 | 9 siti × 3 test MVP: punteggio, siti, `new`, copertura | `sites/*.json` veri, `benchmark.json` | **01:00** |
| 8 | Dossier (luci, WDPA, vento, paese), zoom, immagini | campi del dossier, PNG | dom 10:00 |
| 9 | Validazione + EVA in anteprima | `validation.json` + figura | **dom 11:00 (freeze)** |
| 10 | Testi per la submission (metodo, lista dei dati NASA) | testo per Rocco e Timo | dom 14:30 |

Gate di `decisioni.md`: si esce alle 21:45 e si continua da remoto; rientro dom 09:00; freeze 11:00; submit interno 15:30.

## 1. Architettura

```
data/config/ (Rocco)            GEE (calcolo in remoto)            locale (src/pipeline)
 tests.yaml  params.csv  ─┐      maschera + terreno a 30 m, resto ~1 km ─►  raster globali a 0,05°
 artemis.csv  known_sites ├──►   → reduceResolution a 0,05°            (data/raw/gee/*.tif)
 facilities  materials  ──┘      → computePixels a tile                      │
                                                                             ▼
LOLA / Diviner / letteratura ──► lunar.py ──► targets.json        features.py → celle H3 res 5
                                                   │                          │
                                                   └────────► score.py ◄──────┘
                                                                 │
                                                       sites.py (siti, new, copertura, dossier)
                                                                 │
                                                       export.py → data/export/ ──► app di Timo
                                                       validate.py → numeri per la slide
```

Due principi (`proposta-finale.md` §9):
1. **I filtri si applicano ai pixel, non alle celle.** La maschera (terra e `ndvi < 0,1`) si applica prima di aggregare. Ogni cella tiene `valid_share`, cioè la quota di area utile.
2. **Massima risoluzione, stessa distanza di misura.** La Luna si usa alla risoluzione nativa di LOLA (5-20 m), la Terra a 30 m (la più fine disponibile ovunque). Il punteggio confronta le grandezze **misurate su entrambi** alla stessa distanza (30 m), con lo **stesso algoritmo** per pendenze, rugosità e crateri. Le scale più fini della Luna entrano con l'esponente di Hurst (§5.1), dichiarato come estrapolazione.

## 2. Passo 0 — ambiente e account (20:30-21:00)

### 2.1 Cartelle

```
src/pipeline/
  __init__.py
  config.py        # percorsi, costanti (risoluzione 0,05°, tau, eps, soglie), lettura di tests.yaml e params.csv
  gee_common.py    # init GEE, maschera, DEM, to_grid(), fetch() a tile
  gee_export.py    # un'immagine per parametro → data/raw/gee/<param>.tif
  grid.py          # celle H3 di terra
  sun.py           # tabella latitudine × mese di low_sun_frac
  features.py      # raster → celle H3 (features.parquet)
  lunar.py         # artemis.csv + LOLA → targets.json
  score.py         # percentili, s, media geometrica, κ, filtri
  sites.py         # celle → siti, new, nome, copertura, dossier
  export.py        # data/export/*
  validate.py      # siti noti, controlli negativi, sensibilità
  mock_export.py   # passo 1: export di prova
  run.py           # esegue i passi in ordine (python -m src.pipeline.run --step ...)
data/raw/          # già in .gitignore
  gee/  lola/  interim/   # interim qui dentro, così non serve toccare .gitignore (è di Timo)
data/export/       # versionato: è il contratto con l'app
```

### 2.2 Ambiente Python (≥ 3.11)

```bash
cd src/pipeline && python -m venv .venv && source .venv/bin/activate
pip install earthengine-api numpy pandas pyarrow rasterio h3 pvlib pyyaml scipy shapely geopandas matplotlib
```

- `h3` versione 4: si usano `latlng_to_cell`, `grid_disk`, `cell_to_latlng`.
- `geopandas` serve solo per la mappa geologica USGS.

### 2.3 Google Earth Engine

1. Account GEE + progetto Google Cloud registrato per uso **non commerciale** (decisione aperta 7: lo apro io).
2. `earthengine authenticate` (si apre il browser; dal terminale di Claude Code si lancia con `! earthengine authenticate`).
3. Il progetto va in `.env`: `GEE_PROJECT=...` (`.env` è già ignorato da git).
4. Prova:

```python
import ee, os
ee.Initialize(project=os.environ["GEE_PROJECT"])
print(ee.Image("NASA/NASADEM_HGT/001").bandNames().getInfo())   # ['elevation', 'num', 'swb']
```

**Fatto quando:** la prova stampa le bande.

**Piano B:** se GEE non si attiva entro le 21:30, download diretto da Earthdata delle versioni mensili a 0,05° (`MOD13C2`, `MOD11C3`) e del DEM a 90 m (`SRTMGL3`).

## 3. Passo 1 — export di prova (subito, entro le 21:00)

Serve a Timo per agganciare l'app ai file veri. **Il formato è quello definitivo, i valori sono finti.**

### 3.1 Identificativi

- **Sito Artemis**, slug dal nome di `ARTEMIS_SITES` dell'app (minuscolo, spazi → `_`): `peak_near_cabeus_b`, `haworth`, `malapert_massif`, `mons_mouton_plateau`, `mons_mouton`, `nobile_rim_1`, `nobile_rim_2`, `de_gerlache_rim_2`, `slater_plain`.
- **Test**: le chiavi di `tests.yaml`: `rover_mobility`, `flight_hda_lidar`, `flight_trn_camera` (MVP), `eva_traverse` (anteprima).

### 3.2 `data/export/sites/<site>__<test>.json`

Stessa forma di `getResults()` nell'app (`results` + `cells`), con campi in più:

```json
{
  "site": "malapert_massif",
  "test": "rover_mobility",
  "status": "mvp",
  "generated_at": "2026-11-14T21:00:00+01:00",
  "mock": true,
  "results": [
    {
      "id": "r01",
      "name": "Etna, Piano delle Concazze",
      "lat": 37.77, "lon": 15.03, "country": "Italy",
      "score": 0.87, "kappa": 0.95, "new": false,
      "known_site": "etna_piano_concazze",
      "h3_cells": ["851e8053fffffff"],
      "params": {"slope_p90": 0.91, "roughness": 0.74, "grain_proxy": 0.62, "rock_cover": 0.55,
                 "low_sun_frac": 0.12, "crater_density": 0.70, "rock_class": 0.40},
      "values": {"slope_p90": 21.4, "roughness": 6.2, "grain_proxy": 0.031, "rock_cover": 0.18,
                 "low_sun_frac": 0.05, "crater_density": 0.8, "rock_class": "basalt_volcanic"},
      "target": {"slope_p90": 24.0, "roughness": 7.0, "low_sun_frac": 1.0, "rock_class": "anorthosite"},
      "breaks": [
        {"param": "low_sun_frac", "why": "Sole radente: la Terra non arriva al valore lunare",
         "covered_by": ["Ames Lunar Lab", "ALTEC (luci a ~8°)"]},
        {"param": "gravity_1_6", "why": "indoor", "covered_by": ["LUNA (offload)", "ARGOS, NASA JSC"]}
      ],
      "dossier": {"snow_free_months": 7, "night_lights": 3.1, "protected_area": true,
                  "protected_area_name": "Parco dell'Etna", "wind_10m": null}
    }
  ],
  "cells": [{"h3": "851e8053fffffff", "score": 0.87}]
}
```

**Regole:**
- `score` e `params` sono tra 0 e 1 (`s` per parametro); `values` sono i valori fisici, per le barre Terra contro Luna.
- `params` contiene solo i parametri con peso nel test.
- `breaks` = parametri con `s < break_below` (0,3) + gli `indoor` del test, ciascuno con le strutture di `facilities.csv` che lo coprono.
- `wind_10m` vale `null` per i test non di volo.
- `cells`: al massimo le **20.000 celle migliori** per sito × test, score arrotondato a 3 decimali (~0,5 MB per file).

### 3.3 Gli altri file

| File | Contenuto |
|---|---|
| `targets.json` | per ognuno dei 9 siti: `id`, `name`, `lat`, `lon`, `values` (parametri di `artemis.csv`), `card` (`t_min_c`, `t_max_c`, `bulk_density_profile`, `h_wt_pct`, `grail_density`, `geo_unit`), `sources` |
| `benchmark.json` | `{site: {test: {"best": result_id, "best_new": result_id, "facility": [...]}}}` |
| `facilities.json` | copia di `facilities.csv` in JSON (quando Rocco lo scrive; finché manca, la mappa `FACILITIES` di `data.js`) |
| `known_sites.json` | copia di `known_sites.csv`, per i pin |
| `manifest.json` | versione, `generated_at`, `mock`, elenco dei file, dataset usati con ID e licenza |

`mock_export.py` genera tutto questo per 9 siti × 4 test, partendo dai luoghi finti di `data.js` e usando `grid_disk` per le celle.

**Fatto quando:** i 36 JSON esistono, sono validi e Timo conferma che l'app li legge. Si committa `data/export/` e si avvisa Rocco del contratto.

## 4. Passo 2 — griglia H3 e maschera (21:00-21:45)

### 4.1 Funzioni comuni su GEE (`gee_common.py`)

```python
import ee
RES = 0.05                                      # griglia di esportazione (~5,5 km all'equatore)
GRID = [RES, 0, -180, 0, -RES, 90]              # affine EPSG:4326
YEARS = ("2021-01-01", "2024-01-01")

def valid_mask():
    """Pixel di terra senza vegetazione: il filtro ndvi < 0,1 di tutti i test, applicato al pixel."""
    water = ee.ImageCollection("MODIS/061/MOD44W").sort("system:time_start", False).first().select("water_mask")  # ⚠ ID e versione
    ndvi_max = (ee.ImageCollection("MODIS/061/MOD13A3").filterDate(*YEARS)
                .select("NDVI").max().multiply(1e-4))
    return water.eq(0).And(ndvi_max.lt(0.1))

def dem():
    """NASADEM fino a 60°N (NASA); sopra, AW3D30 (JAXA, agenzia partner della challenge). Vedi §4.3."""
    nasadem = ee.Image("NASA/NASADEM_HGT/001").select("elevation")
    aw3d = ee.ImageCollection("JAXA/ALOS/AW3D30/V3_2").select("DSM")
    aw3d = aw3d.mosaic().setDefaultProjection(aw3d.first().projection())
    return nasadem.unmask(aw3d).rename("elev")

def to_grid(img, reducer, native_m):
    """Aggrega dal pixel nativo (solo i pixel non mascherati) alla griglia a 0,05°."""
    return (img.setDefaultProjection(crs="EPSG:4326", scale=native_m)
               .reduceResolution(reducer=reducer, maxPixels=65535)
               .reproject(crs="EPSG:4326", crsTransform=GRID))
```

### 4.2 Scaricare i raster a tile (niente Google Drive)

```python
import numpy as np, rasterio
from rasterio.transform import from_origin

def fetch(img, band, path, tile_deg=30):
    n = int(tile_deg / RES)                     # 600×600 px per tile, molto sotto i limiti di richiesta
    out = np.full((int(180 / RES), int(360 / RES)), np.nan, dtype="float32")
    for r, lat0 in enumerate(range(90, -90, -tile_deg)):
        for c, lon0 in enumerate(range(-180, 180, tile_deg)):
            arr = ee.data.computePixels({
                "expression": img.select(band), "fileFormat": "NUMPY_NDARRAY",
                "grid": {"dimensions": {"width": n, "height": n},
                         "affineTransform": {"scaleX": RES, "shearX": 0, "translateX": lon0,
                                             "shearY": 0, "scaleY": -RES, "translateY": lat0},
                         "crsCode": "EPSG:4326"}})
            out[r*n:(r+1)*n, c*n:(c+1)*n] = arr[band]
    with rasterio.open(path, "w", driver="GTiff", height=out.shape[0], width=out.shape[1], count=1,
                       dtype="float32", crs="EPSG:4326", transform=from_origin(-180, 90, RES, RES),
                       nodata=np.nan, compress="deflate") as dst:
        dst.write(out, 1)
```

**Se `computePixels` va in timeout** (calcoli pesanti): tile più piccole (15°), oppure `Export.image.toCloudStorage` + download.

### 4.3 DEM: NASADEM fino a 60°N, AW3D30 sopra (confermato alle 20:40)

ASTER GDEM non è nel catalogo ufficiale di GEE ⚠. Sopra i 60°N si usa **AW3D30 di JAXA**: è su GEE, arriva a ±82° ed è di un'agenzia partner della challenge, quindi conta come dato partner. Da dichiarare nella submission e da dire a Rocco per `decisioni.md`.

### 4.4 Griglia (`grid.py`)

1. Esporto `valid_share = to_grid(valid_mask().unmask(0), mean, 1000)` e un raster di terra (`water.eq(0)`, media).
2. Per ogni pixel a 0,05° con terra > 0, `h3.latlng_to_cell(lat, lon, 5)`, poi `groupby` → insieme delle celle di terra (~600k).
3. Per cella: `lat`, `lon` del centro, `land_share`, `valid_share`.

**Output:** `data/raw/interim/cells.parquet`.

**Fatto quando:** ~600k celle; la cella dell'Etna (37,75; 15,0) ha `valid_share > 0`.

## 5. Passo 3 — raster del terreno e della luce (21:45-22:15, da remoto)

Il terreno si calcola a **30 m su tutto il globo**: ~34 mila pixel per pixel di griglia, sotto il limite di 65.536 di `reduceResolution`. È più pesante del 90 m (vedi §14), ma è la risoluzione massima disponibile ovunque. **Sulla Luna si usa lo stesso codice di pendenza** (§8).

### 5.1 Strategia di risoluzione: più scale ed esponente di Hurst

La pendenza dipende dalla distanza su cui la si misura (*baseline*): più è corta, più la pendenza è alta. Confrontare LOLA a 5 m con un DEM terrestre a 30 m sbaglierebbe sistematicamente. Quindi:

1. **Pendenza alla baseline L:** DEM portato alla risoluzione L (media), poi la pendenza con lo **stesso operatore** su Terra e Luna. `ee.Terrain.slope` usa i vicini a 4 connessioni (differenze centrali su 2L) ⚠: sulla Luna si replica identico in numpy.
2. **Baseline:** Terra 30, 60, 120 e 240 m; Luna 5 (o 10, o 20, secondo il prodotto LOLA del sito), 10, 20, 30, 60, 120 e 240 m.
3. **Esponente di Hurst H** (rugosità auto-affine; Shepard 2001; Rosenburg et al. 2011 per LOLA): `tan s(L) = tan s(L₀) · (L/L₀)^(H−1)`. H si stima su ogni corpo con la retta di log(tan s_mediana) contro log(L), sulle baseline disponibili.
4. **Punteggio:** `slope_p90` e `roughness` alla **baseline comune di 30 m**, misurata su entrambi i corpi. Nessuna estrapolazione nel punteggio.
5. **Card:** il valore lunare alla risoluzione nativa (5-20 m) accanto a quello terrestre **estrapolato** alla stessa baseline con il suo H, segnato "estrapolato". H stesso diventa un parametro della card (`hurst`, da aggiungere a `params.csv`): dice se la tessitura alle piccole scale somiglia, ed è utile per il volo con lidar (pericoli da 30 cm).

```python
m = valid_mask()
d30 = dem().reproject(crs="EPSG:4326", scale=30)

def at_baseline(d, L):
    if L == 30:
        return d
    return (d.reduceResolution(ee.Reducer.mean(), maxPixels=1024)
             .reproject(crs="EPSG:4326", scale=L))

slopes = {L: ee.Terrain.slope(at_baseline(d30, L)).updateMask(m) for L in (30, 60, 120, 240)}

# slope_p90 alla baseline comune di 30 m (punteggio)
slope_p90 = to_grid(slopes[30], ee.Reducer.percentile([90]), 30)
# mediana per baseline (serve a Hurst)
slope_med = {L: to_grid(s, ee.Reducer.median(), L) for L, s in slopes.items()}
# hurst per pixel di griglia: retta di log(tan s_med) su log(L), calcolata in locale da slope_med

# roughness: deviazione standard del rilievo locale a 30 m (quota − media su 150 m)
relief = d30.subtract(d30.focalMean(150, "circle", "meters")).updateMask(m)
roughness = to_grid(relief, ee.Reducer.stdDev(), 30)

# elevation_m (card)
elev = to_grid(d30.updateMask(m), ee.Reducer.mean(), 30)
```

**`low_sun_frac` (`sun.py`, in locale, senza GEE).** La frazione di ore di luce con il Sole sotto 7° dipende solo da latitudine e mese, se si trascura l'orizzonte. Quindi basta una tabella 1800 latitudini × 12 mesi:

```python
import numpy as np, pandas as pd, pvlib
times = pd.date_range("2025-01-01", "2026-01-01", freq="1h", tz="UTC", inclusive="left")
lats = np.round(np.arange(-89.95, 90, 0.1), 2)
table = np.zeros((len(lats), 12))
for i, lat in enumerate(lats):
    el = pvlib.solarposition.get_solarposition(times, lat, 0.0)["apparent_elevation"].to_numpy()
    for mo in range(12):
        e = el[times.month == mo + 1]
        day = e > 0
        table[i, mo] = ((e > 0) & (e < 7)).sum() / max(day.sum(), 1)
np.save("data/raw/interim/low_sun_table.npy", table)
```

Per cella: `low_sun_frac` = massimo di `table[lat, mese]` sui **mesi senza neve** (passo 5). Fino ad allora, il massimo su tutti i mesi.

**Fatto quando:** `slope_p90.tif`, `slope_med_{30,60,120,240}.tif`, `roughness.tif`, `elevation_m.tif`, `valid_share.tif`, `low_sun_table.npy` esistono. Controlli a occhio: l'Etna ha `slope_p90` alto, il Sahara piatto basso; H sta tra 0,5 e 1 quasi ovunque.

## 6. Passo 4 — feature, punteggio, primo end-to-end (22:15-22:30)

### 6.1 Da raster a celle (`features.py`)

1. Si legge ogni raster a 0,05° e si calcola la cella H3 del centro di ogni pixel.
2. **Media pesata con `valid_share`** dei pixel della cella. Per `slope_p90` è la media dei p90 dei pixel: un'approssimazione, da dichiarare.
3. Una colonna per ogni parametro di `params.csv` con ruolo `score`, `filtro`, `card` o `dossier`.

**Output:** `data/raw/interim/features.parquet` (`h3, lat, lon, valid_share, <param>...`).

### 6.2 Punteggio (`score.py`)

Regole di `tests.yaml`: `tau 0.1`, `eps 0.01`, `break_below 0.3`; κ ≥ 0,7.

```python
import numpy as np

def s_param(x, lo, hi, earth, tau=0.1, eps=0.01):
    """Distanza in percentili terrestri dal range del target [lo, hi]; one-sided se il target sta fuori dalla Terra."""
    q = np.sort(earth[~np.isnan(earth)])
    F = lambda v: np.searchsorted(q, v, side="right") / len(q)
    p1, p99 = np.quantile(q, [0.01, 0.99])
    if lo > p99:   D = np.maximum(0, F(p99) - F(x))        # es. low_sun_frac lunare ≈ 1
    elif hi < p1:  D = np.maximum(0, F(x) - F(p1))
    else:          D = np.maximum.reduce([np.zeros_like(x), F(lo) - F(x), F(x) - F(hi)])
    s = np.maximum(eps, np.exp(-(D / tau) ** 2))
    return np.where(np.isnan(x), np.nan, s)

def total(S, w, kappa_min=0.7):
    """S: celle × parametri (NaN = nessun dato); w: pesi del test. Media geometrica pesata sui parametri disponibili."""
    avail = ~np.isnan(S)
    kappa = (w * avail).sum(1)
    logS = np.where(avail, np.log(np.where(avail, S, 1)) * w, 0).sum(1) / np.maximum(kappa, 1e-9)
    return np.where(kappa >= kappa_min, np.exp(logS), np.nan), kappa
```

- **Gap fisico** per la card: se il target è fuori dal range terrestre, `gap = target − max_Terra` (o il minimo), salvato in `breaks[].why`.
- **Filtri di `tests.yaml` a livello di cella:** `slope_p90 ≥ 15` per il rover, `≤ 25` per le EVA. `ndvi` è già nella maschera dei pixel; in più si richiede `valid_share ≥ 0,05`.
- **`rock_class`, categorico:** `s = 1` se la classe è uguale; matrice di somiglianza scritta da Rocco (proposta: anortosite ~ breccia d'impatto 0,6; basalto ~ anortosite 0,4; sedimentario 0,1). Se la classe è sconosciuta → NaN, cioè κ più basso.

### 6.3 Primo end-to-end

- Un sito (Malapert) e il test rover, con i soli `slope_p90`, `roughness`, `low_sun_frac`.
- I valori lunari: provvisori da `artemis.csv` di Rocco, oppure segnaposto dichiarati (`slope_p90` 24°, `roughness` dalla letteratura, `low_sun_frac` 1).
- Si scrive il JSON vero di `malapert_massif__rover_mobility` al posto del mock.

**Fatto quando:** l'app di Timo mostra la heat map vera di Malapert × rover, e guardo dove cade l'Etna.

## 7. Passo 5 — gli altri raster (22:30-23:30)

```python
lst = ee.ImageCollection("MODIS/061/MOD11A2").filterDate(*YEARS)
td = lst.select("LST_Day_1km").median().multiply(0.02)
tn = lst.select("LST_Night_1km").median().multiply(0.02)
alb = (ee.ImageCollection("MODIS/061/MCD43A3").filterDate(*YEARS)
       .select("Albedo_WSA_shortwave").median().multiply(1e-3))
dT = td.subtract(tn)

albedo      = to_grid(alb.updateMask(m), ee.Reducer.mean(), 500)
grain_proxy = to_grid(ee.Image(1).subtract(alb).divide(dT).updateMask(dT.gt(1)).updateMask(m),
                      ee.Reducer.mean(), 1000)                          # ATI, NaN se ΔT ≤ 1 K
t_min_c = to_grid(lst.select("LST_Night_1km").min().multiply(0.02).subtract(273.15).updateMask(m), ee.Reducer.mean(), 1000)
t_max_c = to_grid(lst.select("LST_Day_1km").max().multiply(0.02).subtract(273.15).updateMask(m), ee.Reducer.mean(), 1000)

sg = lambda p: ee.Image(f"projects/soilgrids-isric/{p}_mean")           # ⚠ ID
rock_cover = to_grid(sg("cfvo").select("cfvo_0-5cm_mean").divide(1000).updateMask(m), ee.Reducer.mean(), 250)  # cm³/dm³ → frazione
bdod = sg("bdod")                                                       # card: 3 profondità, cg/cm³ → g/cm³
bulk_0_5, bulk_30_60, bulk_100_200 = [to_grid(bdod.select(f"bdod_{z}_mean").divide(100).updateMask(m), ee.Reducer.mean(), 250)
                                      for z in ("0-5cm", "30-60cm", "100-200cm")]

# neve: 12 bande, quota media di neve per mese (per snow_free_months e per low_sun_frac)
snow = ee.ImageCollection("MODIS/061/MOD10A1").filterDate(*YEARS).select("NDSI_Snow_Cover")
snow_m = ee.Image.cat([snow.filter(ee.Filter.calendarRange(i, i, "month")).mean().rename(f"m{i:02d}")
                       for i in range(1, 13)])
snow_monthly = to_grid(snow_m.updateMask(m), ee.Reducer.mean(), 500)    # mese senza neve = media < 10
```

**`crater_density`: lo stesso algoritmo su Terra e Luna, nello stesso intervallo di diametri.** Minimi locali nel DEM a 30 m, profondi più di 3 m rispetto alla media su 150 m, contati per km² di area valida. A 30 m si vedono crateri da ~100-150 m di diametro in su: sulla Luna si contano **solo quelli dello stesso intervallo** (stesso codice sul DEM LOLA portato a 30 m). Quelli più piccoli, che LOLA a 5 m vede e la Terra no, vanno nella card come "si rompe" (`crater_density_small`, solo Luna).

```python
k = ee.Kernel.circle(150, "meters")
is_min = d30.eq(d30.focalMin(kernel=k))
crater = is_min.And(d30.focalMean(kernel=k).subtract(d30).gt(3)).updateMask(m)
area_km2 = ee.Image.pixelArea().divide(1e6).updateMask(m)
n = to_grid(crater.unmask(0).updateMask(m), ee.Reducer.sum(), 30)
a = to_grid(area_km2, ee.Reducer.sum(), 30)
crater_density = n.divide(a)
```

Più due layer di punti da CSV (GVP, Earth Impact Database), usati per il nome dei siti e per `rock_class` (vulcanico, impatto). Le soglie (3 m, 150 m) vanno tarate su Cinder Lake e Meteor Crater.

**`rock_class` per cella:**
- `basalt_volcanic` se c'è un vulcano GVP olocenico entro 25 km;
- `impact_breccia` se si è dentro il raggio di una struttura d'impatto;
- la classe di `materials.csv` se c'è una sorgente entro 25 km;
- altrimenti NaN.

**Fatto quando:** tutti i raster dei parametri `score` e `card` esistono e `features.parquet` è completo.

## 8. Passo 6 — lato Luna (`lunar.py`, 23:30-00:15)

1. **Si legge `data/config/targets/artemis.csv`** (Rocco), uno per sito: `site,lat,lon,slope_p90,roughness,crater_density,rock_cover,low_sun_frac,albedo,grain_proxy,bulk_density,rock_class,t_min_c,t_max_c,geo_unit,source` (+ `h_wt_pct`, `grail_density` per la card).
2. **Per ogni sito** (almeno Malapert per le 22:30, poi tutti e 9) si calcolano da LOLA alla **risoluzione massima**, con lo stesso algoritmo della Terra:
   - **prodotto LOLA più fine che copre il sito** ⚠: 5 m/px vicino al polo (LDEM a 5 m sotto 87,5°S), altrimenti 10 o 20 m/px (LDEM a 80°S, 20 m). Fonti: COG di `astrogeo-ard` (`barker_south_pole_dems`, come shishir) oppure i file di PGDA via `/vsicurl` (come tauseef). Si legge **solo la finestra** attorno al sito, non il file intero;
   - finestra di raggio ~5 km in stereografica polare, alla risoluzione nativa;
   - **pendenze su più scale:** nativa (5, 10 o 20 m), poi 30, 60, 120 e 240 m (media a blocchi), con lo stesso operatore di `ee.Terrain.slope`. Da qui la retta di Hurst (§5.1);
   - **punteggio:** `slope_p90` e `roughness` (std della quota meno la media su 150 m) **a 30 m**, `crater_density` con il detector del §7 sul DEM a 30 m;
   - **card:** pendenza alla risoluzione nativa, `hurst`, `crater_density_small` (crateri più piccoli di ~100 m, che solo LOLA vede).
3. **Valori fissi o dalla letteratura** (Rocco):
   - `low_sun_frac` = 1 (Sole sempre sotto ~7,5° a 84-90°S);
   - `bulk_density` = profilo Hayne/Apollo, solo card;
   - `rock_class` dalla mappa geologica USGS (`data/raw/lunar_geology/`, con geopandas, punto nel poligono `GeoUnits`);
   - `t_min_c`/`t_max_c` da Diviner;
   - `h_wt_pct` da LEND;
   - `grail_density` da GRAIL.
4. **Output:** `data/export/targets.json`, con la fonte per ogni valore.

**Piano B:** se LOLA non si legge in tempo, valori dalla letteratura per tutti e 9 i siti, dichiarati come tali.

## 9. Passo 7 — 9 siti × 3 test (`sites.py`, 00:15-01:00)

Per ogni sito × test MVP:
1. `S` per cella con `score.py`, usando i pesi e i filtri di `tests.yaml` e il target di `targets.json`.
2. **Top 1%** delle celle → componenti connesse sulla griglia H3 (`grid_disk(c, 1)`) → un sito per componente. Punteggio del sito = mediana di `S`; posizione = centro della cella migliore.
3. **Al massimo un sito ogni 100 km** (greedy per punteggio), top 10.
4. **`new`:** distanza > 200 km da tutti i `known_sites` dello stesso test (haversine).
5. **Nome**, in ordine:
   - sito noto entro 30 km;
   - vulcano GVP o struttura d'impatto entro 50 km;
   - paese + coordinate.
6. **`breaks`** = parametri con `s < 0,3` + `indoor` del test → `covered_by` da `facilities.csv`, cercando la chiave in `covers`.
7. **`dossier`:** i campi del §10 (se non sono ancora pronti, `null`).
8. **`cells`:** le 20.000 celle migliori.

Poi `benchmark.json`: miglior sito e miglior sito `new` per ogni casella, più le strutture indoor.

**Fatto quando:** 27 file veri (9 × 3); EVA ancora mock; `benchmark.json` pieno; Timo lo vede nell'app. **Commit e push.**

## 10. Passo 8 — dossier, zoom, immagini (dom 09:00-10:00)

| Campo | Fonte su GEE ⚠ | Come |
|---|---|---|
| `snow_free_months` | `MOD10A1` (già scaricato al passo 5) | numero di mesi con neve media < 10% |
| `night_lights` | `NOAA/VIIRS/DNB/ANNUAL_V21` (oppure Black Marble NASA, se c'è) | media annua |
| `protected_area` | `WCMC/WDPA/current/polygons` | quota della cella in area protetta; nome e tipo dell'area per i top siti (`reduceRegion` sul punto) |
| `wind_10m` | `NASA/GSFC/MERRA/slv/2`, `U10M`/`V10M` | media di √(u² + v²) su un anno; solo per i test di volo |
| `country` (filtro Italia/Europa) | `USDOS/LSIB_SIMPLE/2017` | paese del centro della cella |

- **Zoom sui top siti:** nella finestra di 10 km (`reduceRegion`) si prende l'**istogramma completo** delle pendenze a 30 m e lo si confronta con quello di LOLA a 30 m (distanza di Wasserstein, come shishir). Si aggiunge la pendenza terrestre estrapolata con Hurst alla baseline nativa di LOLA, segnata "estrapolato". Va nella card come "dettaglio".
- **Immagini:** composito Sentinel-2 (`COPERNICUS/S2_SR_HARMONIZED`, mediana senza nuvole) → `getThumbURL` → `data/export/img/<site>__<test>__<id>.png`.

## 11. Passo 9 — validazione ed EVA (dom 10:00-11:00)

`validate.py` produce `data/export/validation.json` e una figura (`validation.png`) per la slide.

| Controllo | Come | Soglia |
|---|---|---|
| Siti noti in alto | percentile di `S` della cella di ogni sito di `validazione` (`tests.yaml`) tra le celle valide, per ogni sito Artemis | ≥ 95° percentile |
| Controlli negativi | i deserti piatti (Rub' al Khali, Salar de Uyuni) devono uscire bassi per rover e lidar; le foreste sono già escluse dal filtro | sotto il 50° percentile |
| Permutation test (da yos-ww) | siti noti contro celle casuali senza vegetazione | p < 0,05 |
| Sensibilità | pesi perturbati del ±20% (100 estrazioni) → quota di volte in cui un top sito resta nella top 10 | va nella card |

**EVA in anteprima:** stessi passi del §9 con i pesi di `eva_traverse`, senza dossier e senza validazione → `status: "preview"`.

**Se l'Etna non esce in alto:** si controllano scala, soglie e pesi; se resta basso lo si dice e si spiega (per esempio con il materiale, basalto contro anortosite). Anche questo è un risultato.

## 12. Passo 10 — testi (dom 11:00-14:30)

- **Metodo** (½ pagina per il report e la pagina del progetto): griglia, filtri sui pixel, percentili, media geometrica, copertura, validazione con i numeri.
- **Lista dei dati NASA** con ID: NASADEM, MODIS (`MOD44W`, `MOD13A3`, `MOD11A2`, `MCD43A3`, `MOD10A1`), MERRA-2, VIIRS, LRO (LOLA, Diviner, LEND, LROC), GRAIL.
- **Fonti partner ed esterne:** AW3D30 (JAXA, agenzia partner), SoilGrids, GVP, Earth Impact Database, WDPA, mappa geologica USGS, Google Earth Engine.
- **Codice ispirato** da yos-ww, shishir-kuet, tauseefkhan007, azrialahmad (`reference-codice.md`): citati, e licenza controllata prima di copiare qualunque riga.

## 13. Cosa mi serve dagli altri

| Da chi | Cosa | Entro |
|---|---|---|
| Rocco | `artemis.csv`: almeno Malapert per le 22:30, tutti e 9 per le 00:15 | 22:30 / 00:15 |
| Rocco | `known_sites.csv` con lat/lon (inclusi Piano delle Concazze e Cisternazza) | 00:15 |
| Rocco | `facilities.csv` con `covers` (chiavi = nomi dei parametri e degli `indoor` di `params.csv`) | 00:15 |
| Rocco | matrice di somiglianza di `rock_class`; `materials.csv` | 00:15 |
| Rocco o Timo | `ksc_alhat_field` → `death_valley` in `tests.yaml`; aggiungere a `params.csv` le voci di card `hurst` e `crater_density_small`; AW3D30 in `decisioni.md` | 22:30 |
| Timo | conferma che l'app legge il formato del §3 | 21:15 |

## 14. Rischi e piani B

| Rischio | Piano B |
|---|---|
| GEE non si attiva | Earthdata: `MOD13C2`, `MOD11C3`, `SRTMGL3`, letti in locale |
| `computePixels` in timeout (il terreno a 30 m globale è pesante) | tile da 10°; oppure `Export.image.toCloudStorage` lanciati in parallelo; in ultima istanza 90 m per lo screening globale e 30 m solo sulle celle candidate (il punteggio resta a baseline comune) |
| LOLA a 5 m troppo grande | finestra di 5 km letta via `/vsicurl`; se lenta, il prodotto a 20 m |
| ID del catalogo sbagliati (⚠) | si verificano con `ee.data.getInfo(id)` prima di lanciare tutto |
| LOLA lento | letteratura per tutti i siti; LOLA solo per Malapert |
| SoilGrids pieno di NaN sulla roccia nuda | κ gestisce i dati mancanti; `rock_cover` si appoggia alla rugosità |
| L'Etna non esce in alto | rivedere soglie, scala e pesi; altrimenti dirlo |
| Tempo | ordine dei tagli: zoom → immagini → vento → EVA → volo con camera |

## 15. Ordine dei comandi

```bash
python -m src.pipeline.run --step mock        # passo 1
python -m src.pipeline.run --step grid        # passo 2
python -m src.pipeline.run --step gee --params slope_p90 slope_med roughness elevation_m valid_share   # passo 3 (30 m)
python -m src.pipeline.run --step sun
python -m src.pipeline.run --step features
python -m src.pipeline.run --step score --site malapert_massif --test rover_mobility        # passo 4
python -m src.pipeline.run --step gee --params albedo grain_proxy t_min_c t_max_c rock_cover bulk_density snow_monthly crater_density   # passo 5
python -m src.pipeline.run --step lunar       # passo 6
python -m src.pipeline.run --step sites       # passo 7: 9 × 3 + benchmark
python -m src.pipeline.run --step dossier     # passo 8
python -m src.pipeline.run --step validate    # passo 9
```

Dopo ogni passo che cambia `data/export/`: `git pull`, commit solo di `src/pipeline/` e `data/export/`, push.

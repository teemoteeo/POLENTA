"""Fase fine (30 m): valori esatti di terreno sugli esagoni che contano (docs/backend_spec.md §4.1, §6.2).

Perché una fase a parte: a 30 m su tutto il mondo Earth Engine non regge (memoria e tempo, misurati
il 14/11). Lo screening a 500 m sceglie i candidati; qui si calcolano i valori a 30 m, la stessa
baseline di LOLA, per:
- i candidati (i migliori dello screening per ogni sito × test);
- i siti noti (validazione);
- un CAMPIONE CASUALE di esagoni validi: è la distribuzione terrestre di riferimento per i percentili.
  Senza, i percentili verrebbero calcolati solo sui candidati, che sono già i più simili: voto distorto.

Per ogni esagono, con reduceRegions sul suo poligono a 30 m:
- slope_p90_30, slope_med_30/60/120/240 → retta di Hurst (pendenza contro scala)
- roughness_30: scarto quadratico medio della quota attorno alla media su 150 m
- crater_density: minimi locali entro 300 m, almeno 20 m sotto il bordo, per km² di area valida
Output: data/raw/interim/fine.parquet (si aggiunge a ogni esecuzione: si può interrompere e riprendere).
"""
import time

import ee
import h3
import numpy as np
import pandas as pd

from . import config, gee_common as g

BASELINES = config.SLOPE_BASELINES_M          # 30, 60, 120, 240 m
CRATER_RADIUS_M, CRATER_RIM_DEPTH_M = 300, 20  # stesso detector da usare su LOLA a 30 m
OUT = config.INTERIM / "fine.parquet"


def image(full: bool = True) -> ee.Image:
    """Le bande a 30 m. full=False (esagoni "normali"): senza le pendenze a 60/120/240 m, che servono solo
    all'esponente di Hurst nelle card dei siti mostrati: ~1,5 volte più veloce. Le grandezze del voto
    (slope_p90_30, roughness_30, crater_density) sono identiche nelle due versioni."""
    # maschera calcolata a 1 km (la sua risoluzione) e poi ingrandita: lasciata a 30 m, Earth Engine rifaceva la
    # mediana di 36 immagini MODIS per ogni pixel da 30 m (15/11, 00:10: gruppi da 20 esagoni in ~100 s)
    m = g.valid_mask().reproject(crs="EPSG:4326", scale=config.MASK_NATIVE_M)
    d30 = g.dem().reproject(crs="EPSG:4326", scale=30)
    bands = []
    for L in (BASELINES if full else BASELINES[:1]):
        dL = d30 if L == 30 else d30.reduceResolution(ee.Reducer.mean(), maxPixels=1024).reproject(crs="EPSG:4326", scale=L)
        bands.append(ee.Terrain.slope(dL).rename(f"slope_{L}"))
    relief = d30.subtract(d30.focalMean(150, "circle", "meters"))
    # Cratere = minimo locale entro 300 m, almeno 20 m sotto il bordo più alto, fuori dai laghi (JRC).
    # Con soglie più basse (150 m, 3-10 m) si contava il rumore del DEM sulle piane. Un fondo piatto (lago, conca,
    # fondo del Meteor Crater) ha molti pixel minimi alla pari e ognuno contava come un cratere (100-400/km² nello
    # scudo canadese): 1 cm di rumore casuale lascia un solo minimo per fondo. Contare i gruppi connessi
    # (connectedPixelCount) dava lo stesso effetto ma era molto più lento (15/11, 00:10).
    k = ee.Kernel.circle(CRATER_RADIUS_M, "meters")
    water = ee.Image("JRC/GSW1_4/GlobalSurfaceWater").select("occurrence").unmask(0).gt(50)
    dn = d30.add(ee.Image.random(0).multiply(0.01))
    crater = (dn.eq(dn.focalMin(kernel=k)).And(d30.focalMax(kernel=k).subtract(d30).gt(CRATER_RIM_DEPTH_M))
              .And(water.Not()))
    bands += [relief.pow(2).rename("relief_sq"), crater.rename("crater"),
              ee.Image.pixelArea().divide(1e6).rename("px_km2")]
    return ee.Image.cat(bands).updateMask(m).toFloat()


def polygon(cell: str) -> ee.Geometry:
    ring = [[lon, lat] for lat, lon in h3.cell_to_boundary(cell)]
    return ee.Geometry.Polygon([ring + [ring[0]]], None, False)


def reduce_batch(img: ee.Image, cells: list[str], retries: int = 6) -> list[dict]:
    fc = ee.FeatureCollection([ee.Feature(polygon(c), {"h3": c}) for c in cells])
    red = ee.Reducer.percentile([50, 90]).combine(ee.Reducer.mean(), "", True).combine(ee.Reducer.count(), "", True)
    for attempt in range(retries):
        try:
            out = img.reduceRegions(collection=fc, reducer=red, scale=30, tileScale=8).getInfo()["features"]
            break
        except Exception as e:                      # 429 o errore transitorio: si riprova con attese crescenti
            if attempt == retries - 1:
                raise
            time.sleep(g.backoff(str(e), attempt))
    rows = []
    for f in out:
        p = f["properties"]
        row = {"h3": p["h3"], "n_px": p.get("slope_30_count")}
        row["slope_p90_30"] = p.get("slope_30_p90")
        for L in BASELINES:
            row[f"slope_med_{L}"] = p.get(f"slope_{L}_p50")   # None per le bande non calcolate (full=False)
        rs = p.get("relief_sq_mean")
        row["roughness_30"] = float(np.sqrt(rs)) if rs is not None else None
        cm, pa = p.get("crater_mean"), p.get("px_km2_mean")
        row["crater_density"] = cm / pa if cm is not None and pa else None
        rows.append(row)
    return rows


def hurst(df: pd.DataFrame) -> np.ndarray:
    """H = 1 + pendenza della retta log(tan s_mediana) contro log(L)."""
    L = np.log(np.array(BASELINES, dtype=float))
    T = np.log(np.tan(np.radians(df[[f"slope_med_{b}" for b in BASELINES]].to_numpy(dtype=float))))
    ok = np.isfinite(T).all(1)
    H = np.full(len(df), np.nan)
    if ok.any():
        Lc = L - L.mean()
        H[ok] = 1 + ((T[ok] - T[ok].mean(1, keepdims=True)) @ Lc) / (Lc @ Lc)
    return H


def select_cells(n_sample: int = 3000, seed: int = 0, scope: str = "sample") -> pd.DataFrame:
    """Quali esagoni calcolare, in ordine di priorità: siti noti, campione casuale, candidati, (tutto il resto).
    scope='candidates': solo siti noti e candidati (quello che serve all'export, pochi minuti)."""
    from .mock_export import KNOWN_SITES
    cells = pd.read_parquet(config.INTERIM / "cells.parquet")
    valid = cells[cells["valid_share"] >= 0.05]
    rng = np.random.default_rng(seed)
    chosen = {h3.latlng_to_cell(k["lat"], k["lon"], config.H3_RES): "known" for k in KNOWN_SITES}
    if scope != "candidates":
        for c in rng.choice(valid["h3"].to_numpy(), size=min(n_sample, len(valid)), replace=False):
            chosen.setdefault(c, "sample")
    cand = config.INTERIM / "candidates.parquet"
    if cand.exists():
        for c in pd.read_parquet(cand)["h3"]:
            chosen.setdefault(c, "candidate")
    if scope == "all":                     # tutto il resto, dopo le priorità: 30 m ovunque ci sia area valida
        rest = valid
        if config.FEATURES.exists():
            f = pd.read_parquet(config.FEATURES)
            rest = rest.merge(f[[c for c in ("h3", "roughness", "snow_free_months") if c in f]], on="h3", how="left")
            if "snow_free_months" in rest:     # ghiacci permanenti fuori: niente vegetazione, ma non sono suolo
                rest = rest[~(rest["snow_free_months"] == 0)]
            if "roughness" in rest:            # prima i terreni accidentati: per le piane il 500 m basta quasi
                rest = rest.sort_values("roughness", ascending=False, na_position="last")
        for c in rest["h3"]:
            chosen.setdefault(c, "rest")
    return pd.DataFrame({"h3": list(chosen), "role": list(chosen.values())})


def main(batch: int = 20, workers: int | None = None, limit: int | None = None, scope: str = "sample",
         n_sample: int = 3000) -> int:
    """scope='sample': siti noti + campione di riferimento + candidati; scope='all': tutti gli esagoni validi
    (in ordine di priorità, i "normali" in versione leggera, 16 richieste in parallelo)."""
    # 12 con la quota del piano Contributor; in restricted mode (quota mensile finita) Earth Engine regge
    # poche richieste insieme: lì serve --workers 4 (con 8 i gruppi saltavano per il 429, 14/11 23:30)
    workers = workers or 12
    from concurrent.futures import ThreadPoolExecutor, as_completed
    g.init()
    todo = select_cells(n_sample=n_sample, scope=scope)
    done = pd.read_parquet(OUT) if OUT.exists() else pd.DataFrame(columns=["h3"])
    todo = todo[~todo["h3"].isin(done["h3"])]
    if limit:
        todo = todo.head(limit)
    print(f"esagoni da calcolare a 30 m: {len(todo)} (già fatti: {len(done)}); ruoli: {todo['role'].value_counts().to_dict()}")
    imgs = {True: image(full=True), False: image(full=False)}
    batches = []
    for full, part in ((True, todo[todo["role"].isin(["known", "candidate"])]),
                       (False, todo[~todo["role"].isin(["known", "candidate"])])):
        batches += [(full, part["h3"].iloc[i:i + batch].tolist()) for i in range(0, len(part), batch)]
    rows, t0 = [], time.time()

    def save():
        if rows:
            new = pd.DataFrame(rows).merge(todo, on="h3", how="left")
            pd.concat([done, new], ignore_index=True).drop_duplicates("h3", keep="last").to_parquet(OUT, index=False)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(reduce_batch, imgs[full], b): b for full, b in batches}
        for k, fut in enumerate(as_completed(futures), 1):
            try:
                rows.extend(fut.result())
            except Exception as e:
                print(f"\n   gruppo saltato ({len(futures[fut])} esagoni): {str(e)[:100]}")
            if k % 10 == 0:
                save()                                    # salvataggio periodico: si può riprendere
            print(f"   {k}/{len(batches)} gruppi ({time.time() - t0:.0f} s)", end="\r", flush=True)
    save()
    df = pd.read_parquet(OUT)
    df["hurst"] = hurst(df)
    df.to_parquet(OUT, index=False)
    print(f"\nfatto: {len(df)} esagoni a 30 m in {OUT.relative_to(config.ROOT)}")
    return 0

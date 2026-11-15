"""Passo 4 (parte 1): la carta d'identità di ogni esagono (docs/backend_spec.md §5).

Per ogni raster a 0,05° in data/raw/gee/, il valore dell'esagono è la media dei suoi pixel
pesata per area valida (valid_share × coseno della latitudine): i pixel senza area valida
non contano, ed è così che i filtri restano sul pixel e non sulla cella intera.

Usa i parametri che ci sono: si rilancia ogni volta che arriva un raster nuovo.
Output: data/raw/interim/features.parquet (una riga per esagono, una colonna per parametro).
"""
import warnings

import numpy as np
import pandas as pd

from . import calibrate, config, gee_common as g, geology, sun

# parametro di params.csv → raster da usare, in ordine di preferenza (il 30 m batte il 90 m)
SOURCES = {
    "slope_p90": ["slope_p90_30", "slope_p90_90", "slope_p90_500"],
    "roughness": ["roughness_30", "roughness_90", "roughness_500"],
    "elevation_m": ["elevation_m_30", "elevation_m_90", "elevation_m_500"],
    # lo screening a 500 m tenuto a parte: è l'ingresso della calibrazione verso il 30 m (calibrate.py)
    "slope_p90_500": ["slope_p90_500"], "slope_med_500": ["slope_med_500"], "roughness_500": ["roughness_500"],
    "slope_med_30": ["slope_med_30"], "slope_med_60": ["slope_med_60"],
    "slope_med_120": ["slope_med_120"], "slope_med_240": ["slope_med_240"],
    "albedo": ["albedo"], "grain_proxy": ["grain_proxy"], "rock_cover": ["rock_cover"],
    "crater_density": ["crater_density"], "t_min_c": ["t_min_c"], "t_max_c": ["t_max_c"],
    "bulk_density_0_5": ["bulk_0_5"], "bulk_density_30_60": ["bulk_30_60"],
    "bulk_density_100_200": ["bulk_100_200"], "night_lights": ["night_lights"],
    "protected_area": ["protected_area"], "wind_10m": ["wind_10m"],
    "sand_pct": ["sand_pct"], "clay_pct": ["clay_pct"], "soc_gkg": ["soc_gkg"],
    "lst_mean_c": ["lst_mean_c"], "permafrost_share": ["permafrost_share"],
}
SNOW_FREE = 10   # mese senza neve: copertura media < 10%


def main() -> int:
    cells = pd.read_parquet(config.INTERIM / "cells.parquet")
    pc = np.load(config.INTERIM / "pixel_cells.npz")
    rows, cols, cell = pc["rows"], pc["cols"], pc["cell"]
    lat_px = 90 - config.GRID_RES_DEG * (rows + 0.5)
    valid = np.nan_to_num(g.read(config.RAW / "gee" / "valid_share.tif")[rows, cols])   # sempre quello globale
    w = valid * np.cos(np.radians(lat_px))
    ncell = len(cells)

    def per_cell(values: np.ndarray) -> np.ndarray:
        ok = np.isfinite(values) & (w > 0)
        num = np.bincount(cell[ok], weights=(w * values)[ok], minlength=ncell)
        den = np.bincount(cell[ok], weights=w[ok], minlength=ncell)
        with np.errstate(invalid="ignore", divide="ignore"):
            return np.where(den > 0, num / den, np.nan)

    def find(name: str):
        """Il raster nella cartella corrente (in modalità test: gee_test) o, se manca, in quella globale."""
        for d in (config.GEE_DIR, config.RAW / "gee"):
            if (d / f"{name}.tif").exists():
                return d / f"{name}.tif"
        return None

    used = {}
    for param, candidates in SOURCES.items():
        for name in candidates:
            path = find(name)
            if path:
                cells[param] = per_cell(g.read(path)[rows, cols])
                used[param] = name
                break

    # fase a 30 m (fine.py): per gli esagoni calcolati, i valori esatti alla baseline comune con LOLA
    fine_path = config.INTERIM / "fine.parquet"
    if fine_path.exists():
        fine = pd.read_parquet(fine_path).drop(columns=["role", "n_px"], errors="ignore")
        cells = cells.merge(fine.add_suffix("_fine").rename(columns={"h3_fine": "h3"}), on="h3", how="left")
        used["fine_30m"] = f"{fine['h3'].nunique():,} esagoni"

    # tipo di roccia dominante (GLiM, griglia da 0,5°): geology.py
    if geology.GLIM.exists():
        cells["rock_class"] = geology.rock_class(cells["lat"].to_numpy(), cells["lon"].to_numpy())
        used["rock_class"] = "GLiM 0,5°"

    # neve per mese (12 bande, se scaricata) → mesi senza neve
    snow_paths = [find(f"snow_m{i:02d}") for i in range(1, 13)]
    has_snow = all(snow_paths)
    if has_snow:
        snow = np.stack([per_cell(g.read(p)[rows, cols]) for p in snow_paths], axis=1)
        snow_free = snow < SNOW_FREE
        cells["snow_free_months"] = np.where(np.isnan(snow).all(1), np.nan, snow_free.sum(1))
        used["snow_free_months"] = "snow_m01..12"
    else:
        snow_free = np.ones((ncell, 12), dtype=bool)   # finché manca la neve, tutti i mesi valgono

    # luce radente: il mese migliore tra quelli senza neve (tabella di sun.py)
    tab = np.load(config.INTERIM / "low_sun_table.npz")
    frac = sun.lookup(cells["lat"].to_numpy(), tab["lats"], tab["table"])
    hrs = sun.lookup(cells["lat"].to_numpy(), tab["lats"], tab["hours"])
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)   # esagoni senza mesi liberi: NaN
        cells["low_sun_frac"] = np.nanmax(np.where(snow_free, frac, np.nan), axis=1)
        cells["low_sun_hours"] = np.nanmax(np.where(snow_free, hrs, np.nan), axis=1)
    cells["low_sun_best_month"] = np.nanargmax(np.where(snow_free, hrs, -1), axis=1) + 1
    used["low_sun_frac"] = "sun.py" + (" + neve" if has_snow else " (senza neve)")

    # terreno alla baseline di 30 m per tutti: valore esatto dove c'è (fine.py), altrimenti la stima
    # calibrata dal 500 m (calibrate.py), che usa anche neve e superficie. terrain_src dice quale dei due: le card mostrano solo esatti.
    if calibrate.MODELS.exists() and fine_path.exists():
        cells = calibrate.apply(cells)
        exact = cells["slope_p90_30_fine"].notna()
        cells["slope_p90"] = cells["slope_p90_30_fine"].fillna(cells["slope_p90_est"])
        cells["roughness"] = cells["roughness_30_fine"].fillna(cells["roughness_est"])
        cells["crater_density"] = cells["crater_density_fine"]       # nessuna stima: solo dove c'è il 30 m
        cells["terrain_src"] = np.where(exact, "30m", np.where(cells["slope_p90"].notna(), "est", None))
        used["slope_p90"] = used["roughness"] = f"30 m esatto su {exact.sum():,}, stima dal 500 m sul resto"

    cells.to_parquet(config.FEATURES, index=False)
    print(f"esagoni: {ncell:,}; parametri: " + ", ".join(f"{p}←{s}" for p, s in used.items()))
    return 0

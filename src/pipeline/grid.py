"""Passo 2: la griglia di esagoni H3 sulle terre emerse (docs/backend_spec.md §3).

1. Da Earth Engine scarica due raster a 0,05°: quota di terra emersa e quota di area valida
   (terra senza vegetazione) per ogni pixel.
2. Per ogni pixel con terra calcola in quale esagono H3 (risoluzione 5) cade.
3. Raggruppa per esagono: coordinate del centro, land_share e valid_share pesati per area.

Output (data/raw/interim/):
- cells.parquet:     una riga per esagono di terra (h3, lat, lon, land_share, valid_share, n_pixels)
- pixel_cells.npz:   per ogni pixel di terra, l'indice dell'esagono: serve a features.py per
                     aggregare tutti gli altri raster senza ricalcolare H3 ogni volta
"""
import h3
import numpy as np
import pandas as pd

from . import config, gee_common as g


def download() -> None:
    g.init()
    m = g.valid_mask()
    res = config.MASK_NATIVE_M
    print(f"1-2) quota di terra emersa (MOD44W) e di area valida (NDVI mediano < {config.NDVI_THRESHOLD}) "
          f"per pixel, a {res} m")
    g.fetch_many({"land_share": g.to_grid(g.land().unmask(0), ee_mean(), res),
                  "valid_share": g.to_grid(m.unmask(0), ee_mean(), res)}, native_m=res)


def ee_mean():
    import ee
    return ee.Reducer.mean()


def build() -> pd.DataFrame:
    land = g.read(config.GEE_DIR / "land_share.tif")
    valid = g.read(config.GEE_DIR / "valid_share.tif")
    lat, lon = g.pixel_centers()
    sel = np.nan_to_num(land) > 0
    print(f"3) pixel con terra: {sel.sum():,}; calcolo dell'esagono di ciascuno…")
    cells = np.array([h3.latlng_to_cell(a, b, config.H3_RES) for a, b in zip(lat[sel], lon[sel])])
    area = np.cos(np.radians(lat[sel]))  # i pixel a 0,05° si restringono verso i poli
    df = pd.DataFrame({"h3": cells, "w": area, "land": land[sel] * area,
                       "valid": np.nan_to_num(valid[sel]) * area})
    grp = df.groupby("h3", sort=True)
    out = pd.DataFrame({"n_pixels": grp.size(),
                        "land_share": grp["land"].sum() / grp["w"].sum(),
                        "valid_share": grp["valid"].sum() / grp["w"].sum()}).reset_index()
    centers = np.array([h3.cell_to_latlng(c) for c in out["h3"]])
    out["lat"], out["lon"] = centers[:, 0], centers[:, 1]
    out.to_parquet(config.INTERIM / "cells.parquet", index=False)
    index_of = pd.Series(np.arange(len(out)), index=out["h3"])
    np.savez_compressed(config.INTERIM / "pixel_cells.npz",
                        rows=np.nonzero(sel)[0].astype("int32"), cols=np.nonzero(sel)[1].astype("int32"),
                        cell=index_of.loc[cells].to_numpy().astype("int32"))
    return out


def main(skip_download: bool = False) -> int:
    config.ensure_dirs()
    if not skip_download:
        download()
    out = build()
    etna = out.loc[out["h3"] == h3.latlng_to_cell(37.75, 15.0, config.H3_RES)]
    print(f"esagoni di terra: {len(out):,}; con area valida: {(out['valid_share'] > 0).sum():,}")
    print(f"controllo Etna: valid_share = {etna['valid_share'].round(3).tolist()}")
    return 0

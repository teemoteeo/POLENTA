"""Passo 3 (terreno): pendenze, rugosità e quota dal DEM, riassunte su griglia a 0,05°.

Due fasi (docs/backend_spec.md §4):
- screening (500 m): tutto il mondo, veloce. Earth Engine tiene già pronte le versioni a bassa
  risoluzione del DEM ("piramidi"), quindi non deve ricalcolare dai 30 m. Serve a scegliere i candidati.
  (A 90 m un solo quadrato da 3° richiedeva 4 minuti, e a 6° superava la memoria: verificato il 14/11.)
- fine (30 m): la baseline comune con LOLA, calcolata esatta solo sugli esagoni candidati
  (fine.py, con le pendenze a 30-240 m per l'esponente di Hurst e i crateri).

Ogni parametro di screening diventa un GeoTIFF in data/raw/gee/<nome>_<scala>.tif.
"""
import ee

from . import config, gee_common as g


TILE_DEG = {500: 15, 90: 3}   # lati dei quadrati che stanno nei limiti di memoria di Earth Engine (misurati)


def dem_at(scale_m: int) -> ee.Image:
    """DEM alla risoluzione scale_m, preso dalle piramidi di Earth Engine (media dei 30 m)."""
    return g.dem().reproject(crs="EPSG:4326", scale=scale_m)


def layers(scale_m: int) -> dict:
    """Le immagini da scaricare a una certa scala (solo pixel validi)."""
    m = g.valid_mask()
    d = dem_at(scale_m)
    slope = ee.Terrain.slope(d).updateMask(m)                 # gradi, operatore a 4 vicini
    radius = 5 * scale_m                                      # 150 m a 30 m, 450 m a 90 m
    relief = d.subtract(d.focalMean(radius, "circle", "meters")).updateMask(m)
    return {
        f"slope_p90_{scale_m}": g.to_grid(slope, ee.Reducer.percentile([90]), scale_m),
        f"slope_med_{scale_m}": g.to_grid(slope, ee.Reducer.median(), scale_m),
        f"roughness_{scale_m}": g.to_grid(relief, ee.Reducer.stdDev(), scale_m),
        f"elevation_m_{scale_m}": g.to_grid(d.updateMask(m), ee.Reducer.mean(), scale_m),
    }


def run(scale_m: int) -> None:
    g.init()
    need = g.read(config.RAW / "gee" / "valid_share.tif")   # salta i quadrati senza area valida
    todo = {k: v for k, v in layers(scale_m).items() if not (config.GEE_DIR / f"{k}.tif").exists()}
    if not todo:
        print("   terreno già scaricato")
        return
    boxes = g.TEST_BOXES if config.TEST_MODE else None
    g.fetch_many(todo, native_m=scale_m, need=need, boxes=boxes,   # tutte le bande in un'unica serie di richieste
                 tile_deg=TILE_DEG.get(scale_m), out_dir=config.GEE_DIR)


def main(scale_m: int = 500) -> int:
    config.ensure_dirs()
    run(scale_m)
    return 0

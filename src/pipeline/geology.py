"""Tipo di roccia per esagono e fonti di materiale (docs/backend_spec.md sez. E).

- rock_class: classe litologica dominante dalla carta GLiM (Hartmann & Moosdorf 2012, griglia da 0,5°,
  doi:10.1594/PANGAEA.788537, CC-BY 3.0). È grossolana (celle da ~55 km: i campi vulcanici piccoli come l'Etna o
  l'Eifel non si vedono): nel voto pesa poco, e per dire dove trovare la roccia si usa rock_sources.csv.
- le celle costiere senza dato prendono la classe della cella valida più vicina.
- somiglianza tra la classe GLiM e la roccia del sito: data/config/rock_similarity.csv (bozza di Edo, da confermare
  con Rocco).
"""
import numpy as np
import pandas as pd
from scipy import ndimage

from . import config

GLIM = config.RAW / "glim" / "extracted" / "glim_wgs84_0point5deg.txt.asc"
CODES = {1: "su", 2: "vb", 3: "ss", 4: "pb", 5: "sm", 6: "sc", 7: "va", 8: "mt", 9: "pa", 10: "vi",
         11: "wb", 12: "py", 13: "pi", 14: "ev", 15: "nd", 16: "ig"}
SKIP = {11, 15, 16}            # acqua, nessun dato, ghiaccio: non sono classi di roccia


def grid() -> np.ndarray:
    """Griglia GLiM 360 × 720 con le celle senza roccia riempite dalla cella valida più vicina."""
    a = np.loadtxt(GLIM, skiprows=6)
    bad = (a < 0) | np.isin(a, list(SKIP))
    idx = ndimage.distance_transform_edt(bad, return_distances=False, return_indices=True)
    return a[tuple(idx)].astype(int)


def rock_class(lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    a = grid()
    r = np.clip(((90 - np.asarray(lat)) / 0.5).astype(int), 0, 359)
    c = np.clip(((np.asarray(lon) + 180) / 0.5).astype(int), 0, 719)
    return np.array([CODES[v] for v in a[r, c]])


def similarity() -> dict:
    """{(roccia del sito, classe GLiM): somiglianza 0-1}."""
    df = pd.read_csv(config.CONFIG / "rock_similarity.csv").set_index("glim")
    return {(t, g): float(df.at[g, t]) for g in df.index for t in df.columns if t != "nome"}

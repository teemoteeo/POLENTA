"""Calibrazione 500 m → 30 m del terreno (docs/backend_spec.md, sezione E).

Perché: calcolare il terreno a 30 m su tutti i ~253 mila esagoni richiede ore su Earth Engine,
e ogni prova andrebbe rifatta. Ma per ~3.000 esagoni casuali abbiamo entrambe le misure
(500 m dallo screening, 30 m da fine.py): da lì si impara la relazione tra le due scale e la si
applica a tutti in pochi secondi.

Modello: gradient boosting (alberi di decisione in sequenza, scikit-learn) che stima il valore a 30 m
dallo screening a 500 m più quota, latitudine, albedo, temperature, neve e grana. Le grandezze sono in
scala logaritmica, perché tra due scale la pendenza cambia come una legge di potenza (la stessa fisica
dell'esponente di Hurst). Una retta tra i logaritmi dava R² 0,73 e sottostimava di ~6° i pendii sopra
30°; il gradient boosting dà R² 0,90 e ~0,6° (14/11, 22:55).
L'errore si misura con una validazione incrociata a 5 parti (esagoni che il modello non ha visto) e si dichiara.

Le classifiche finali NON usano le stime: per i candidati si calcolano i 30 m esatti (fine.py).
Output: data/raw/interim/calibration.json (errori) e calibration.joblib (modelli).
"""
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import KFold, cross_val_predict

from . import config

OUT = config.INTERIM / "calibration.json"
MODELS = config.INTERIM / "calibration.joblib"
EPS = 0.1
INPUTS = ["slope_p90_500", "slope_med_500", "roughness_500", "elevation_m", "lat", "valid_share",
          "albedo", "t_max_c", "t_min_c", "snow_free_months", "grain_proxy"]
REQUIRED = ["slope_p90_500", "slope_med_500", "roughness_500"]   # senza screening a 500 m niente stima


def _logtan(deg):
    return np.log(np.tan(np.radians(np.clip(deg, 0.05, 89))))


def design(df: pd.DataFrame) -> np.ndarray:
    """Le grandezze da cui si stima il 30 m (i valori mancanti vanno bene: il modello li gestisce)."""
    X = df[INPUTS].to_numpy(float)
    return np.column_stack([X, _logtan(df["slope_p90_500"]), np.log(df["roughness_500"] + EPS), np.abs(df["lat"])])


TARGETS = {   # grandezza a 30 m → (trasformazione, inversa)
    "slope_p90_30": (_logtan, lambda v: np.degrees(np.arctan(np.exp(v)))),
    "roughness_30": (lambda v: np.log(v + EPS), lambda v: np.exp(v) - EPS),
}


def model() -> HistGradientBoostingRegressor:
    return HistGradientBoostingRegressor(max_iter=400, learning_rate=0.05, max_leaf_nodes=15,
                                         min_samples_leaf=20, l2_regularization=1.0, random_state=0)


def main() -> int:
    feats = pd.read_parquet(config.FEATURES)
    fine = pd.read_parquet(config.INTERIM / "fine.parquet")
    df = feats.merge(fine, on="h3", how="inner", suffixes=("", "_f"))
    report, models = {"inputs": INPUTS, "targets": {}}, {}
    for target, (fwd, inv) in TARGETS.items():
        d = df.dropna(subset=REQUIRED + [target])
        d = d[(d["roughness_500"] >= 0) & (d[target] >= 0)]
        X, y = design(d), fwd(d[target].to_numpy(float))
        pred = cross_val_predict(model(), X, y, cv=KFold(5, shuffle=True, random_state=0))
        err = np.abs(inv(pred) - inv(y))
        models[target] = model().fit(X, y)
        r = report["targets"][target] = {
            "r2_cv": float(1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()),
            "median_abs_err": float(np.median(err)), "p90_abs_err": float(np.quantile(err, 0.9)), "n": int(len(d)),
        }
        unit = "°" if "slope" in target else " m"
        print(f"{target:<14} R² (validazione incrociata) = {r['r2_cv']:.3f} | errore mediano {r['median_abs_err']:.2f}{unit} "
              f"| 90% degli errori sotto {r['p90_abs_err']:.2f}{unit} | su {r['n']} esagoni")
    joblib.dump(models, MODELS)
    OUT.write_text(json.dumps(report, indent=1))
    return 0


def apply(feats: pd.DataFrame) -> pd.DataFrame:
    """Aggiunge le stime a 30 m (colonne *_est) a tutti gli esagoni con lo screening a 500 m."""
    if not MODELS.exists():
        return feats
    models = joblib.load(MODELS)
    ok = feats[REQUIRED].notna().all(1).to_numpy()
    X = design(feats.loc[ok])
    for target, (_, inv) in TARGETS.items():
        col = target.replace("_30", "_est")
        feats[col] = np.nan
        feats.loc[ok, col] = np.maximum(0, inv(models[target].predict(X)))
    return feats

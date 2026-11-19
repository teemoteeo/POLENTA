"""Passo 4 (parte 2): il voto di ogni esagono per un sito Artemis e un test (docs/backend_spec.md §5).

1. Ogni parametro diventa un percentile terrestre (dove sta rispetto a tutta la Terra).
2. Distanza in punti percentuali dal valore del sito Artemis; voto s = exp(−(distanza/τ)²).
   Se la Luna è fuori da quello che la Terra raggiunge, la distanza si misura dal valore
   terrestre più estremo (one-sided) e la differenza fisica finisce in "si rompe".
3. Totale: media geometrica pesata con i pesi del test, sui parametri disponibili.
4. κ = quota di peso con dati nell'esagono (tra i parametri che la pipeline ha già prodotto):
   sotto 0,7 l'esagono non entra in classifica. Poi i filtri rigidi del test.
"""
import re

import numpy as np
import pandas as pd

from . import config



# Frazioni 0-1 con un grosso blocco di valori uguali: si confrontano in distanza fisica, non in percentile.
# permafrost_share è 0 per l'85% degli esagoni: in percentile tutti quelli con un po' di permafrost finivano
# schiacciati nel 10% più alto (7,5% di permafrost prendeva 0,98 contro un target 42-100%, 15/11 01:55).
PHYSICAL = {"permafrost_share"}
# Terreno: percentili solo sul campione casuale fisso a 30 m esatto (features.ref_sample), come promette fine.py.
# Su tutti gli esagoni la base mescolava esatti e stime e cambiava a ogni export, perché ogni export aggiunge
# candidati al 30 m; i crateri, che esistono solo al 30 m, avevano per base campione + candidati (19/11).
REF_SAMPLE = {"slope_p90", "roughness", "crater_density"}


def s_param(x: np.ndarray, lo: float, hi: float, tau: float, eps: float, physical: bool = False,
            ref: np.ndarray | None = None) -> tuple[np.ndarray, float]:
    """Voto 0-1 per un parametro numerico; restituisce anche il gap fisico se la Luna è fuori dalla Terra.
    ref: maschera degli esagoni su cui calcolare i percentili (default: tutti)."""
    if physical:
        D = np.maximum(0, np.maximum(lo - x, x - hi))
        return np.where(np.isfinite(x), np.maximum(eps, np.exp(-(D / (2 * tau)) ** 2)), np.nan), 0.0
    earth = x[np.isfinite(x) & (True if ref is None else ref)]
    q = np.sort(earth)
    # percentile medio sulle parità (mid-rank): con "≤ v" un parametro con molti valori uguali (permafrost_share
    # è 0 per l'85% degli esagoni) metteva tutti quegli esagoni vicino al target (voto 0,94 senza permafrost, 15/11)
    F = lambda v: (np.searchsorted(q, v, side="left") + np.searchsorted(q, v, side="right")) / (2 * len(q))
    p1, p99 = np.quantile(q, [0.01, 0.99])
    gap = 0.0
    if lo > p99:                                   # Luna oltre il massimo terrestre (es. luce radente)
        D = np.maximum(0, F(p99) - F(x)); gap = lo - q[-1]
    elif hi < p1:                                  # Luna sotto il minimo terrestre
        D = np.maximum(0, F(x) - F(p1)); gap = hi - q[0]
    else:
        D = np.maximum(0, np.maximum(F(lo) - F(x), F(x) - F(hi)))
    s = np.maximum(eps, np.exp(-(D / tau) ** 2))
    return np.where(np.isfinite(x), s, np.nan), gap


def s_rock(x: pd.Series, target: str) -> np.ndarray:
    """Somiglianza tra la classe GLiM dell'esagono e la roccia del sito (data/config/rock_similarity.csv)."""
    from .geology import similarity
    sim = similarity()
    return np.array([sim.get((target, v), 0.1) if isinstance(v, str) else np.nan for v in x])


def passes(series: pd.Series, rule: str) -> np.ndarray:
    """Filtro di tests.yaml, es. '< 0.1' o '>= 15'. Dato mancante = non passa."""
    op, val = re.match(r"\s*(<=|>=|<|>)\s*([-\d.]+)", rule).groups()
    v, x = float(val), series.to_numpy(dtype=float)
    out = {"<": x < v, "<=": x <= v, ">": x > v, ">=": x >= v}[op]
    return np.where(np.isfinite(x), out, False)


def score(feats: pd.DataFrame, test: dict, target: dict, rules: dict) -> dict:
    """Voti di tutti gli esagoni per un test e un sito. Restituisce totale, κ, voti e gap per parametro."""
    tau, eps = rules.get("tau", 0.1), rules.get("eps", 0.01)
    w_all = config.weights(test)
    # parametri usabili: prodotti dalla pipeline (colonna presente) e con un valore lunare
    usable = [p for p in w_all if p in feats.columns and target.get(p) is not None]
    S, gaps = {}, {}
    for p in usable:
        t = target[p]
        if p == "rock_class":
            S[p] = s_rock(feats[p], t)
        else:
            lo, hi = (t, t) if not isinstance(t, (list, tuple)) else t
            # senza fine.parquet non c'è il campione: percentili su tutti gli esagoni, come prima
            ref = feats["ref_sample"].to_numpy() if p in REF_SAMPLE and "ref_sample" in feats else None
            S[p], gaps[p] = s_param(feats[p].to_numpy(dtype=float), lo, hi, tau, eps, physical=p in PHYSICAL, ref=ref)
    w = np.array([w_all[p] for p in usable])
    M = np.column_stack([S[p] for p in usable]) if usable else np.empty((len(feats), 0))
    avail = np.isfinite(M)
    kappa = (avail * w).sum(1) / max(w.sum(), 1e-9)
    logS = np.where(avail, np.log(np.where(avail, M, 1.0)) * w, 0).sum(1) / np.maximum((avail * w).sum(1), 1e-9)
    # κ minimo 0,8 (tests.yaml: kappa_min): con 0,7 gli esagoni con meno dati (alto Artico senza SoilGrids)
    # salivano in testa, perché il voto si calcola sui soli parametri presenti (15/11, 01:20)
    total = np.where(kappa >= rules.get("kappa_min", 0.8), np.exp(logS), np.nan)
    ok = feats["valid_share"].to_numpy() >= 0.05
    if "snow_free_months" in feats.columns:           # ghiacci permanenti: niente vegetazione, ma non sono suolo
        ok &= feats["snow_free_months"].fillna(0).to_numpy() >= 1
    if "crop_urban_share" in feats.columns:            # campi coltivati e città (MODIS MCD12Q1) sull'area valida
        ok &= feats["crop_urban_share"].fillna(0).to_numpy() <= rules.get("crop_urban_max", 0.5)
    if "night_lights" in feats.columns:               # città: il cemento ha NDVI basso come il suolo nudo e passava
        ok &= feats["night_lights"].fillna(0).to_numpy() <= rules.get("night_lights_max", 5)   # (Tokyo, 15/11)
    for p, rule in (test.get("filtri") or {}).items():
        if p == "ndvi":
            continue                                # già applicato ai pixel (maschera)
        if p in feats.columns:
            ok &= passes(feats[p], rule)
    # filtri che valgono solo quando il sito ha quel parametro > 0 (tests.yaml: filtri_se_sito_positivo).
    # ISRU: se il sito ha ghiaccio, un posto terrestre senza ghiaccio non è un analogo per estrarlo; con la sola
    # distanza un deserto caldo prendeva 0,999 sul ghiaccio per Malapert (target p10-p90 [0,007, 0,666], 19/11).
    # Per Gale e Aristarchus (ghiaccio 0) il filtro non si applica.
    for p, rule in (test.get("filtri_se_sito_positivo") or {}).items():
        t = target.get(p)
        lo = min(t) if isinstance(t, (list, tuple)) else t
        if p in feats.columns and lo is not None and lo > 0:
            ok &= passes(feats[p], rule)
    total = np.where(ok, total, np.nan)
    return {"total": total, "kappa": kappa, "s": S, "gaps": gaps, "used": usable,
            "missing": [p for p in w_all if p not in usable]}

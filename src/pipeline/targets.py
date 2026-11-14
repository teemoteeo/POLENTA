"""Valori dei 5 siti e pesi dei test dalla matrice di Rocco (data/config/siti_e_pesi.csv).

La matrice ha una riga per parametro e, per colonne, il valore di ogni sito ("13.5 ± 1.5 °") e il peso di
ogni test (0 = il parametro non conta per quel test). Un test nuovo è una colonna, un parametro nuovo una riga.

Ogni valore diventa un intervallo [v − σ, v + σ] nelle unità della carta d'identità terrestre. Dove le unità
di Rocco sono diverse dalle nostre si converte, e la conversione va dichiarata:
- rock_cover: % di area coperta da massi (Diviner) → frazione 0-1 (SoilGrids misura i sassi nel suolo:
  la Luna cade sotto il minimo terrestre e il confronto diventa a una via);
- grain_proxy: inerzia termica SI del pianeta → stessa "finezza" sulla Terra. Finezza = posizione tra regolite
  fine e roccia sul suo pianeta (scala logaritmica); il valore terrestre è il percentile corrispondente
  dell'inerzia termica apparente;
- subsurface_ice (acqua in peso, %) → permafrost_share: sotto 1% secco (0), sopra 10% suolo ghiacciato (1),
  in mezzo lineare.
"""
import re

import numpy as np
import pandas as pd

from . import config

MATRIX = config.CONFIG / "siti_e_pesi.csv"
ALIAS = {"subsurface_ice": "permafrost_share"}      # nome nella matrice → nome nella carta d'identità
ROCK = {"anortosite": "anorthosite", "basalto": "basalt_volcanic", "sedimentario": "sedimentary"}
COORDS = {   # come nell'app di Timo (src/web/src/data.js)
    "malapert_massif": (-85.98, -1.67, "moon"), "haworth": (-86.8, -22.0, "moon"),
    "nobile_rim_1": (-85.4, 37.0, "moon"), "phoenix": (68.2188, -125.7492, "mars"), "gale": (-4.5895, 137.4417, "mars"),
}
TI_RANGE = {"moon": (40, 2000), "mars": (50, 1500)}   # inerzia termica: regolite fine → roccia (J m⁻² K⁻¹ s⁻½) [NV]
NUM = re.compile(r"(-?\d+(?:\.\d+)?)(?:\s*±\s*(\d+(?:\.\d+)?))?")


def parse(cell: str) -> tuple[float, float]:
    """'13.5 ± 1.5 °' → (13.5, 1.5); senza ± l'incertezza è 0."""
    m = NUM.search(str(cell))
    return (float(m.group(1)), float(m.group(2) or 0)) if m else (np.nan, np.nan)


def load() -> pd.DataFrame:
    df = pd.read_csv(MATRIX)
    df["param"] = df["Parametro (ID)"].str.strip()
    return df.set_index("param")


def site_columns(df: pd.DataFrame) -> dict:
    """slug del sito → colonna della matrice ('Malapert Massif (Luna)' → malapert_massif)."""
    return {config.slug(c.split(" (")[0]): c for c in df.columns if c.split(" (")[0] in config.SITES}


def weights() -> dict:
    """{test: {parametro: peso}} con i nomi della carta d'identità; gli zeri restano (completezza)."""
    df = load()
    out = {}
    for c in df.columns:
        m = re.search(r"Peso .*\((\w+)\)", c)
        if m:
            out[m.group(1)] = {ALIAS.get(p, p): float(w) for p, w in df[c].items()}
    return out


def ti_to_earth(ti: float, world: str, earth_ati: np.ndarray) -> float:
    lo, hi = TI_RANGE[world]
    f = float(np.clip(np.log(ti / lo) / np.log(hi / lo), 0, 1))
    return float(np.quantile(earth_ati[np.isfinite(earth_ati)], f))


def ice_to_share(wt: float) -> float:
    return float(np.clip((wt - 1) / 9, 0, 1))


def site_targets(feats: pd.DataFrame) -> list[dict]:
    """I 5 siti nel formato di targets.json: values (intervalli per il voto), card (il resto), fonte."""
    df = load()
    ati = feats["grain_proxy"].to_numpy(float) if "grain_proxy" in feats else np.array([np.nan])
    out = []
    for sid, col in site_columns(df).items():
        lat, lon, world = COORDS[sid]
        values, card = {}, {}
        for p, row in df.iterrows():
            raw = str(row[col])
            v, s = parse(raw)
            lo, hi = v - s, v + s
            if p == "rock_class":
                name = raw.split(" (")[0].split("/")[0].strip()
                values["rock_class"] = ROCK.get(name, name)
                card["feo_wt_pct"] = parse(raw.split("(")[1])[0] if "(" in raw else None
            elif p == "rock_cover":
                values[p] = [lo / 100, hi / 100]
                card["rock_cover_pct"] = v
            elif p == "grain_proxy":
                values[p] = sorted([ti_to_earth(max(lo, 1), world, ati), ti_to_earth(hi, world, ati)])
                card["thermal_inertia_si"] = v
            elif p == "subsurface_ice":
                values["permafrost_share"] = [ice_to_share(lo), ice_to_share(hi)]
                card["subsurface_ice_wt_pct"] = v
            elif p == "temperature":
                card["t_mean_c"], card["t_range_c"] = round(v - 273.15, 1), s
            elif p == "atmosphere_wind":
                rho, wind = raw.split("|")
                card["air_density_kgm3"], card["wind_ms"] = parse(rho)[0], parse(wind)[0]
            elif p in ("density_profile_0_2m", "elevation"):
                card[p] = v
            else:
                values[p] = [lo, hi]
        out.append({"id": sid, "name": col.split(" (")[0], "lat": lat, "lon": lon, "world": world, "mock": False,
                    "values": values, "card": card,
                    "sources": {"all": "Rocco, data/config/siti_e_pesi.csv (fonti per valore: da aggiungere)"}})
    return out

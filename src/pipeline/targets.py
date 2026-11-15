"""Valori dei 5 siti e pesi dei test dalla matrice di Rocco (data/config/siti_e_pesi.csv).

La matrice ha una riga per parametro e, per colonne: la dimensione (le categorie del testo della challenge),
il valore di ogni sito ("13.5 ± 1.5 °"), il peso di ogni test (0 = il parametro non conta per quel test) e la
reference. Un test nuovo è una colonna, un parametro nuovo una riga.

Ogni valore diventa un intervallo [v − σ, v + σ] nelle unità della carta d'identità terrestre. Dove le unità
di Rocco sono diverse dalle nostre si converte, e la conversione va dichiarata:
- rock_cover: % di area coperta da massi (Diviner) → frazione 0-1 (SoilGrids misura i sassi nel suolo:
  la Luna cade sotto il minimo terrestre e il confronto diventa a una via);
- grain_proxy: inerzia termica SI del pianeta → stessa "finezza" sulla Terra. Finezza = posizione tra regolite
  fine e roccia sul suo pianeta (scala logaritmica); il valore terrestre è il percentile corrispondente
  dell'inerzia termica apparente;
- subsurface_ice (acqua in peso, %) → permafrost_share: sotto 1% secco (0), da 5% in su suolo cementato dal
  ghiaccio (1), in mezzo lineare. Con la soglia a 10% il ghiaccio lunare delle zone in ombra (5,6%, scenario B)
  diventava "permafrost a metà" e il permafrost continuo dell'Artico veniva penalizzato.
"""
import json
import re

import numpy as np
import pandas as pd

from . import config

MATRIX = config.CONFIG / "siti_e_pesi.csv"
ALIAS = {"subsurface_ice": "permafrost_share"}      # nome nella matrice → nome nella carta d'identità
ROCK = {"anortosite": "anorthosite", "basalto": "basalt_volcanic", "sedimentario": "sedimentary"}
def _coords() -> dict:
    """slug → (lat, lon, pianeta) da data/config/siti_coordinate.csv (Rocco); longitudini in -180/+180."""
    df = pd.read_csv(config.CONFIG / "siti_coordinate.csv")
    return {r.id: (float(r.lat), float(r.lon), r.body.lower()) for r in df.itertuples()}


COORDS = _coords()
TI_RANGE = {"moon": (40, 2000), "mars": (50, 1500)}   # inerzia termica: regolite fine → roccia (J m⁻² K⁻¹ s⁻½) [NV]
LUNAR = (json.loads((config.INTERIM / "lunar_terrain.json").read_text())["regions"]
         if (config.INTERIM / "lunar_terrain.json").exists() else {})
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
    return float(np.clip((wt - 1) / 4, 0, 1))


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
                name = raw.split(" (")[0].strip().lower()
                values["rock_class"] = ("basalt_sedimentary" if "sediment" in name else "anorthosite" if "anort" in name
                                        else "basalt_volcanic" if ("basalt" in name or "piroclast" in name) else name)
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
        sources = {ALIAS.get(p, p): r for p, r in (df["Reference"] if "Reference" in df else pd.Series(dtype=str)).items()
                   if isinstance(r, str)}
        # Luna: pendenza, rugosità e crateri calcolati da noi su LOLA con le definizioni della Terra (lunar.py).
        # I valori della matrice (Wueller 2025: solo aree percorribili < 15°, rugosità di Smith 2017; crateri da
        # catalogo) restano nella card come letteratura: non sono confrontabili con quelli terrestri.
        mine = LUNAR.get(sid) if world == "moon" else None
        if mine and mine.get("area_km2"):
            for p, half in (("slope_p90", 1.0), ("roughness", 0.2), ("crater_density", mine["crater_density_sigma"])):
                card[f"{p}_literature"] = round(float(np.mean(values[p])), 3)
                values[p] = [max(0.0, mine[p] - half), mine[p] + half]
                sources[p] = (f"calcolato da noi: LOLA LDEM_80S_20M (PDS) → 30 m, stessa definizione della Terra "
                              f"(lunar.py), regione USGS {mine['area_km2']:.0f} km². Letteratura: {sources.get(p, '')}")
        dims = df["Dimensione (challenge)"] if "Dimensione (challenge)" in df else pd.Series(dtype=str)
        values = {k: ([round(x, 4) for x in v] if isinstance(v, list) else v) for k, v in values.items()}
        out.append({"id": sid, "name": col.split(" (")[0], "lat": lat, "lon": lon, "world": world, "mock": False,
                    "values": values, "card": card,
                    "sources": sources,
                    "dimensions": {ALIAS.get(p, p): d for p, d in dims.items() if isinstance(d, str)}})
    return out

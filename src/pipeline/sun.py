"""Passo 3 (luce): tabella "quanta luce radente c'è a ogni latitudine in ogni mese".

low_sun_frac = ore di luce con il Sole tra 0° e 7° / ore di luce totali.
Sulla Terra dipende quasi solo da latitudine e mese (la longitudine sposta solo l'orario),
quindi basta calcolarla una volta per 1800 latitudini × 12 mesi invece che per ogni esagono.
Ogni esagono poi sceglie il mese migliore senza neve (features.py).

Output: data/raw/interim/low_sun_table.npz (lats, table[lat, mese]).
"""
import numpy as np
import pandas as pd
import pvlib

from . import config

LOW_SUN_DEG = 7.0   # soglia di params.csv: al Polo Sud lunare il Sole resta sotto ~7°


def build(step_deg: float = 0.1) -> tuple[np.ndarray, np.ndarray]:
    times = pd.date_range("2025-01-01", "2026-01-01", freq="10min", tz="UTC", inclusive="left")
    month = times.month.to_numpy()
    lats = np.round(np.arange(-90 + step_deg / 2, 90, step_deg), 3)
    table = np.zeros((len(lats), 12), dtype="float32")   # frazione delle ore di luce con Sole < 7°
    hours = np.zeros((len(lats), 12), dtype="float32")   # ore al giorno con Sole tra 0° e 7°
    ndays = pd.Series(times.normalize()).groupby(month).nunique().to_numpy()
    for i, lat in enumerate(lats):
        el = pvlib.solarposition.get_solarposition(times, lat, 0.0)["apparent_elevation"].to_numpy()
        day = el > 0
        low = day & (el < LOW_SUN_DEG)
        for mo in range(12):
            sel = month == mo + 1
            table[i, mo] = low[sel].sum() / max(day[sel].sum(), 1)
            hours[i, mo] = low[sel].sum() / ndays[mo] / 6   # campioni da 10 minuti → ore
    return lats, table, hours


def lookup(lats_cells: np.ndarray, lats: np.ndarray, table: np.ndarray) -> np.ndarray:
    """Riga della tabella per ogni esagono (latitudine più vicina): array esagoni × 12 mesi."""
    idx = np.clip(np.searchsorted(lats, lats_cells), 0, len(lats) - 1)
    return table[idx]


def main() -> int:
    config.ensure_dirs()
    lats, table, hours = build()
    np.savez_compressed(config.INTERIM / "low_sun_table.npz", lats=lats, table=table, hours=hours)
    for lat in (37.75, 64.0, 78.0, 80.0):  # Etna, Islanda, Svalbard, alto Artico
        frac = lookup(np.array([lat]), lats, table)[0]
        hrs = lookup(np.array([lat]), lats, hours)[0]
        print(f"lat {lat:>5}°: frazione max {frac.max():.2f} (mese {frac.argmax() + 1:>2}) | "
              f"ore radenti/giorno max {hrs.max():.1f} (mese {hrs.argmax() + 1:>2}) | agosto {hrs[7]:.1f} h")
    return 0

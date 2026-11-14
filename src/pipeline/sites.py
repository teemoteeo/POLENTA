"""Passo 7 (e primo end-to-end): dagli esagoni migliori ai siti, e il file per l'app (docs/backend_spec.md §8).

Per un sito Artemis × test:
1. voto di tutti gli esagoni (score.py);
2. l'1% migliore, unendo gli esagoni che si toccano: ogni gruppo è un sito (voto = mediana);
3. al massimo un sito ogni 100 km, i primi 10;
4. nuovo o noto (siti di test già usati entro 200 km), nome, cosa non torna e chi lo copre;
5. scrive data/export/sites/<sito>__<test>.json nel formato del contratto.
"""
import json
import math
from datetime import datetime, timezone

import h3
import numpy as np
import pandas as pd

from . import config, score as sc
from .mock_export import FACILITIES, KNOWN_SITES   # finché Rocco non scrive facilities.csv e known_sites.csv


def km(a_lat, a_lon, b_lat, b_lon) -> float:
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp, dl = p2 - p1, math.radians(b_lon - a_lon)
    return 2 * 6371 * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2))


def components(cells: list[str]) -> list[list[str]]:
    """Gruppi di esagoni che si toccano (vicini diretti sulla griglia H3)."""
    left, groups = set(cells), []
    while left:
        stack, comp = [left.pop()], []
        while stack:
            c = stack.pop()
            comp.append(c)
            for nb in h3.grid_disk(c, 1):
                if nb in left:
                    left.remove(nb)
                    stack.append(nb)
        groups.append(comp)
    return groups


def build(feats: pd.DataFrame, site_id: str, test_id: str, test: dict, target: dict, rules: dict,
          top_frac: float = 0.01, n_sites: int = 10) -> dict:
    res = sc.score(feats, test, target, rules)
    total = res["total"]
    df = feats[["h3", "lat", "lon"]].assign(score=total, kappa=res["kappa"])
    df = df[np.isfinite(df["score"])]
    if df.empty:
        raise RuntimeError(f"{site_id} × {test_id}: nessun esagono valido (filtri o κ troppo severi)")
    best = df[df["score"] >= df["score"].quantile(1 - top_frac)]
    idx = feats.reset_index().set_index("h3")["index"]
    sites = []
    for comp in components(best["h3"].tolist()):
        sub = best.set_index("h3").loc[comp].sort_values("score", ascending=False)
        top = sub.index[0]                           # la cella migliore va per prima in h3_cells
        sites.append({"cells": sub.index.tolist(), "score": float(sub["score"].median()), "h3": top,
                      "lat": float(sub.loc[top, "lat"]), "lon": float(sub.loc[top, "lon"]),
                      "kappa": float(sub.loc[top, "kappa"])})
    sites.sort(key=lambda s: -s["score"])
    chosen = []
    for s in sites:                                  # al massimo un sito ogni 100 km
        if all(km(s["lat"], s["lon"], c["lat"], c["lon"]) > 100 for c in chosen):
            chosen.append(s)
        if len(chosen) == n_sites:
            break
    known = [k for k in KNOWN_SITES if test_id in k["tests"]]
    results = []
    for i, s in enumerate(chosen, 1):
        near = min(known, key=lambda k: km(s["lat"], s["lon"], k["lat"], k["lon"]), default=None)
        d_near = km(s["lat"], s["lon"], near["lat"], near["lon"]) if near else 1e9
        name = near["name"] if near and d_near <= 30 else f"{s['lat']:.2f}°, {s['lon']:.2f}°"
        row = idx[s["h3"]]
        params = {p: round(float(v[row]), 3) for p, v in res["s"].items() if np.isfinite(v[row])}
        values = {p: (round(float(feats.at[row, p]), 3) if p != "rock_class" else feats.at[row, p])
                  for p in res["used"] if pd.notna(feats.at[row, p])}
        breaks = [{"param": p, "why": (f"la Terra non arriva al valore lunare (differenza {res['gaps'][p]:.2f})"
                                       if res["gaps"].get(p) else "voto sotto 0,3"),
                   "covered_by": FACILITIES.get(p, ["da cercare in facilities.csv"])}
                  for p, v in params.items() if v < rules.get("break_below", 0.3)]
        breaks += [{"param": p, "why": "la Terra non lo riproduce (indoor)",
                    "covered_by": FACILITIES.get(p, ["da cercare in facilities.csv"])} for p in test.get("indoor", [])]
        results.append({
            "id": f"r{i:02d}", "name": name, "lat": round(s["lat"], 4), "lon": round(s["lon"], 4), "country": None,
            "score": round(s["score"], 3), "kappa": round(s["kappa"], 3),
            "new": d_near > 200, "known_site": near["id"] if near and d_near <= 200 else None,
            "h3_cells": s["cells"][:50], "params": params, "values": values,
            "target": {p: target[p] for p in res["used"]}, "breaks": breaks,
            "dossier": {"snow_free_months": None, "night_lights": None, "protected_area": None,
                        "protected_area_name": None, "wind_10m": None,
                        "low_sun_hours": round(float(feats.at[row, "low_sun_hours"]), 1)
                        if "low_sun_hours" in feats else None},
        })
    top_cells = df.nlargest(config.MAX_CELLS_EXPORT, "score")
    return {"site": site_id, "test": test_id, "status": test.get("stato"),
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "mock": False,
            "params_used": res["used"], "params_missing": res["missing"],
            "results": results,
            "cells": [{"h3": h, "score": round(float(v), 3)} for h, v in zip(top_cells["h3"], top_cells["score"])]}


def write(data: dict) -> None:
    path = config.EXPORT / "sites" / f"{data['site']}__{data['test']}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

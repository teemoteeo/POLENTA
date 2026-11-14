"""Passo 1: export di prova.

Scrive in data/export/ tutti i file che l'app leggerà, con il formato definitivo
(docs/backend_spec.md §2) e numeri finti. Serve a Timo per collegare l'app ai file
prima che arrivino i dati veri: poi cambiano solo i numeri, non il formato.
"""
import json
import random
from datetime import datetime, timezone

import h3

from . import config

# Luoghi finti per test (gli stessi dei dati finti dell'app, src/web/src/data.js).
# known = id del sito di test già usato, se il luogo lo è.
MOCK_PLACES = {
    "rover_mobility": [
        ("Etna, Piano delle Concazze", 37.77, 15.03, "Italy", "etna_piano_concazze"),
        ("Etna, Cisternazza", 37.72, 14.99, "Italy", "etna_cisternazza"),
        ("Teide, Tenerife", 28.27, -16.64, "Spain", "teide"),
        ("Black Point Lava Flow, Arizona", 35.69, -111.45, "United States", "black_point_lava_flow"),
        ("Lanzarote", 29.00, -13.75, "Spain", None),
        ("Harrat Khaybar, Arabia Saudita", 25.70, 39.90, "Saudi Arabia", None),
    ],
    "flight_hda_lidar": [
        ("Cinder Lake, Arizona", 35.30, -111.48, "United States", "cinder_lake"),
        ("Meteor Crater, Arizona", 35.03, -111.02, "United States", "meteor_crater"),
        ("Etna, Cisternazza", 37.72, 14.99, "Italy", "etna_cisternazza"),
        ("Kilbourne Hole, New Mexico", 31.98, -106.97, "United States", None),
        ("Pinacate, Messico", 31.77, -113.50, "Mexico", None),
    ],
    "flight_trn_camera": [
        ("Death Valley, California", 36.50, -117.10, "United States", "death_valley"),
        ("Mojave, California", 35.06, -118.15, "United States", "mojave"),
        ("Holuhraun, Islanda", 64.85, -16.83, "Iceland", None),
        ("Etna, Piano delle Concazze", 37.77, 15.03, "Italy", "etna_piano_concazze"),
        ("Tibesti, Ciad", 20.80, 18.10, "Chad", None),
    ],
    "eva_traverse": [
        ("San Francisco Volcanic Field, Arizona", 35.58, -111.63, "United States", "sf_volcanic_field"),
        ("Lanzarote", 29.00, -13.75, "Spain", None),
        ("Bletterbach, Alto Adige", 46.36, 11.43, "Italy", None),
    ],
}

# Siti di test già usati (bozza: le coordinate vere le mette Rocco in known_sites.csv)
KNOWN_SITES = [
    {"id": "etna_piano_concazze", "name": "Etna, Piano delle Concazze", "lat": 37.77, "lon": 15.03, "tests": ["rover_mobility"]},
    {"id": "etna_cisternazza", "name": "Etna, Cisternazza", "lat": 37.72, "lon": 14.99, "tests": ["rover_mobility"]},
    {"id": "teide", "name": "Teide, Tenerife", "lat": 28.27, "lon": -16.64, "tests": ["rover_mobility"]},
    {"id": "black_point_lava_flow", "name": "Black Point Lava Flow", "lat": 35.69, "lon": -111.45, "tests": ["rover_mobility", "eva_traverse"]},
    {"id": "sf_volcanic_field", "name": "San Francisco Volcanic Field", "lat": 35.58, "lon": -111.63, "tests": ["eva_traverse"]},
    {"id": "meteor_crater", "name": "Meteor Crater", "lat": 35.03, "lon": -111.02, "tests": ["rover_mobility", "flight_hda_lidar"]},
    {"id": "cinder_lake", "name": "Cinder Lake", "lat": 35.30, "lon": -111.48, "tests": ["flight_hda_lidar"]},
    {"id": "death_valley", "name": "Death Valley", "lat": 36.50, "lon": -117.10, "tests": ["flight_hda_lidar", "flight_trn_camera"]},
    {"id": "mojave", "name": "Mojave", "lat": 35.06, "lon": -118.15, "tests": ["flight_trn_camera"]},
]

# Chi copre cosa la Terra non dà (bozza, da sostituire con facilities.csv di Rocco)
FACILITIES = {
    "gravity_1_6": ["LUNA, Colonia (offload)", "ARGOS, NASA JSC"],
    "vacuum": ["camere a vuoto ESTEC", "Chamber B, NASA JSC"],
    "electrostatic_dust": ["LUNA Dust Lab, Colonia", "Swamp Works, NASA KSC"],
    "plume_vacuum": ["sfera da 60 ft, NASA Langley"],
    "cryo_psr": ['TVAC "sporca" ALTEC, Torino (in arrivo)'],
    "agglutinates": ["vasche di simulante LHS-1 / LMS-1"],
    "soil_density": ["vasche di simulante: LUNA, ALTEC, NASA Glenn SLOPE"],
    "low_sun_frac": ["Ames Lunar Lab", "ALTEC (luci a ~8°)"],
    "slope_p90": ["ALTEC (rampa a 25°)"],
}

# Intervalli plausibili dei valori fisici, solo per i numeri finti
EARTH_RANGE = {"slope_p90": (5, 35), "roughness": (1, 15), "crater_density": (0, 3), "rock_cover": (0, 0.5),
               "low_sun_frac": (0, 0.6), "albedo": (0.1, 0.4), "grain_proxy": (0.01, 0.06)}
ROCK_CLASSES = ["basalt_volcanic", "impact_breccia", "sedimentary", "anorthosite"]

# Posizioni approssimative dei 9 siti Artemis: SEGNAPOSTO, le vere le mette Rocco in artemis.csv
MOCK_TARGET_POS = [(-84.9, 1.0), (-87.4, -5.0), (-86.0, -2.9), (-85.0, 31.0), (-84.6, 21.0),
                   (-85.5, 37.0), (-85.4, 54.0), (-88.7, -69.0), (-89.4, -58.0)]


def _round(x, n=3):
    return round(float(x), n)


def mock_target(rng):
    """Carta d'identità finta di un sito Artemis (stessi parametri dei test)."""
    return {"slope_p90": _round(rng.uniform(15, 30), 1), "roughness": _round(rng.uniform(4, 12), 1),
            "crater_density": _round(rng.uniform(1, 5), 2), "rock_cover": _round(rng.uniform(0.05, 0.2), 2),
            "low_sun_frac": 1.0, "albedo": _round(rng.uniform(0.15, 0.25), 2), "grain_proxy": 0.02,
            "rock_class": "anorthosite"}


def mock_site_file(site, test_id, test, target, rng):
    """Un file sito × test: i migliori luoghi finti, con voti, valori, cosa non torna, dossier."""
    weights = config.weights(test)
    flight = test_id.startswith("flight")
    results, cells = [], {}
    for i, (name, lat, lon, country, known) in enumerate(MOCK_PLACES.get(test_id, [])):
        score = max(0.05, 0.92 - i * 0.08 - rng.random() * 0.05)
        params = {p: _round(max(0.01, min(1, score + rng.uniform(-0.45, 0.15)))) for p in weights}
        values = {}
        for p in weights:
            if p == "rock_class":
                values[p] = rng.choice(ROCK_CLASSES)
            else:
                lo, hi = EARTH_RANGE.get(p, (0, 1))
                values[p] = _round(rng.uniform(lo, hi), 2)
        breaks = [{"param": p, "why": "voto sotto la soglia di 0,3 (mock)",
                   "covered_by": FACILITIES.get(p, ["da cercare in facilities.csv"])}
                  for p, s in params.items() if s < 0.3]
        breaks += [{"param": p, "why": "la Terra non lo riproduce (indoor)",
                    "covered_by": FACILITIES.get(p, ["da cercare in facilities.csv"])}
                   for p in test.get("indoor", [])]
        cell = h3.latlng_to_cell(lat, lon, config.H3_RES)
        results.append({
            "id": f"r{i + 1:02d}", "name": name, "lat": lat, "lon": lon, "country": country,
            "score": _round(score), "kappa": _round(rng.uniform(0.75, 1.0)),
            "new": known is None, "known_site": known, "h3_cells": [cell],
            "params": params, "values": values, "target": {p: target[p] for p in weights if p in target},
            "breaks": breaks,
            "dossier": {"snow_free_months": rng.randint(4, 12), "night_lights": _round(rng.uniform(0, 20), 1),
                        "protected_area": rng.random() < 0.5, "protected_area_name": None,
                        "wind_10m": _round(rng.uniform(2, 9), 1) if flight else None},
        })
        for c in h3.grid_disk(cell, 6):  # macchia di calore attorno al luogo, come i mock dell'app
            cells[c] = max(cells.get(c, 0), _round(score * (0.35 + rng.random() * 0.65)))
    cells_list = sorted(({"h3": c, "score": s} for c, s in cells.items()), key=lambda d: -d["score"])
    return {"site": site, "test": test_id, "status": test.get("stato"),
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "mock": True,
            "results": results, "cells": cells_list[:config.MAX_CELLS_EXPORT]}


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")


def main() -> int:
    config.ensure_dirs()
    rng = random.Random(42)  # numeri finti ma ripetibili
    tests = {tid: t for tid, t in config.load_tests().items() if tid in MOCK_PLACES}
    written = []

    targets = []
    for name, (lat, lon) in zip(config.ARTEMIS_SITES, MOCK_TARGET_POS):
        targets.append({"id": config.slug(name), "name": name, "lat": lat, "lon": lon, "mock": True,
                        "values": mock_target(rng),
                        "card": {"t_min_c": -230, "t_max_c": -50, "h_wt_pct": None, "grail_density": 2550,
                                 "geo_unit": None,
                                 "bulk_density_profile": [[0, 1.1], [0.1, 1.5], [1.0, 1.8]]},
                        "sources": {"all": "MOCK: valori finti, in attesa di artemis.csv (Rocco)"}})
    write_json(config.EXPORT / "targets.json", targets)
    written.append("targets.json")

    benchmark = {}
    for t in targets:
        benchmark[t["id"]] = {}
        for tid, test in tests.items():
            data = mock_site_file(t["id"], tid, test, t["values"], rng)
            fname = f"sites/{t['id']}__{tid}.json"
            write_json(config.EXPORT / fname, data)
            written.append(fname)
            best_new = next((r["id"] for r in data["results"] if r["new"]), None)
            benchmark[t["id"]][tid] = {"best": data["results"][0]["id"] if data["results"] else None,
                                       "best_new": best_new,
                                       "facility": sorted({f for p in test.get("indoor", []) for f in FACILITIES.get(p, [])})}
    write_json(config.EXPORT / "benchmark.json", benchmark)
    write_json(config.EXPORT / "facilities.json",
               [{"name": n, "covers": [k for k, v in FACILITIES.items() if n in v]}
                for n in sorted({n for v in FACILITIES.values() for n in v})])
    write_json(config.EXPORT / "known_sites.json", KNOWN_SITES)
    written += ["benchmark.json", "facilities.json", "known_sites.json"]

    write_json(config.EXPORT / "manifest.json", {
        "version": "0.1-mock", "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "mock": True, "contract": "docs/backend_spec.md §2", "files": written,
        "sites": [t["id"] for t in targets], "tests": list(tests),
        "datasets": "MOCK: nessun dato reale. I dataset veri sono in docs/proposta-finale.md §7-8"})
    print(f"scritti {len(written) + 1} file in {config.EXPORT.relative_to(config.ROOT)}/ "
          f"({len(targets)} siti × {len(tests)} test)")
    return 0

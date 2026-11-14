"""Passi 7-8: tutti i siti Artemis × test, dal voto al file per l'app (docs/backend_spec.md §8).

1. voto di tutti gli esagoni con le stime a 30 m (veloce, locale);
2. raffinamento: per i primi 25 siti di ogni combinazione si calcola il 30 m ESATTO della cella migliore
   (fine.py, solo le celle nuove: i risultati restano in cache), poi si rifà la carta d'identità;
3. nuovo voto e primi 10 siti: valori e voti nelle card vengono dal 30 m esatto (terrain_src);
4. dossier dei siti finali (aree protette, vento) in un'unica richiesta a Earth Engine, con cache;
5. scrive i file nel formato del contratto (lo stesso del mock) e il manifest.

Siti della demo: 3 lunari e 2 marziani (SITES). Finché Rocco non manda i valori veri, i target sono segnaposto dichiarati.
Di default scrive in data/raw/export_preview/; con publish=True in data/export/ (quello che legge l'app).
"""
import json
import shutil
from datetime import datetime, timezone

import pandas as pd

from . import config, features, fine, sites
from .mock_export import KNOWN_SITES

TESTS = ("flight_hda_lidar", "rover_mobility", "isru_resources")
N_CANDIDATES = 25
DOSSIER_CACHE = config.INTERIM / "site_dossier.json"


# I siti della demo (gli stessi dell'app di Timo, src/web/src/data.js): 3 sulla Luna, 2 su Marte.
SITES = tuple(config.slug(n) for n in config.SITES)
MARS_PLACEHOLDER = {   # SEGNAPOSTO finché Rocco non manda i valori veri (DTM CTX/HiRISE, THEMIS, TES)
    "phoenix": {"name": "Phoenix", "lat": 68.2188, "lon": -125.7492, "world": "mars",
                "values": {"slope_p90": 3.0, "roughness": 0.8, "crater_density": 0.05, "rock_cover": 0.08,
                           "low_sun_frac": 0.3, "albedo": 0.2, "grain_proxy": 0.03, "rock_class": "basalt_volcanic",
                           "bulk_density_0_5": 1.2, "permafrost_share": 1.0, "sand_pct": 45.0, "clay_pct": 8.0}},
    "gale": {"name": "Gale", "lat": -4.5895, "lon": 137.4417, "world": "mars",
             "values": {"slope_p90": 6.0, "roughness": 1.5, "crater_density": 0.1, "rock_cover": 0.1,
                        "low_sun_frac": 0.12, "albedo": 0.22, "grain_proxy": 0.04, "rock_class": "sedimentary",
                        "bulk_density_0_5": 1.3, "sand_pct": 70.0, "clay_pct": 8.0}},   # niente ghiaccio a Gale
}


def load_targets() -> list[dict]:
    """Valori lunari e marziani per sito. Ora: segnaposto (mock per la Luna, MARS_PLACEHOLDER per Marte);
    poi: i valori di Rocco."""
    moon = {t["id"]: {**t, "world": "moon"} for t in json.loads((config.EXPORT / "targets.json").read_text())}
    for t in moon.values():                  # SEGNAPOSTO: densità Apollo ~1,5 g/cm³ nei primi 15 cm; ghiaccio nelle
        t["values"].setdefault("bulk_density_0_5", 1.5)        # zone in ombra vicine (LEND, Diviner); regolite
        t["values"].update({"permafrost_share": 1.0, "sand_pct": 50.0, "clay_pct": 3.0})   # ~metà sabbia fine
    mars = {k: {"id": k, "mock": True, **v} for k, v in MARS_PLACEHOLDER.items()}
    every = {**moon, **mars}
    return [every[s] for s in SITES]


def run_all(feats, targets, rules, n_sites) -> dict:
    out = {}
    for t in targets:
        for test_id in TESTS:
            try:
                out[(t["id"], test_id)] = sites.build(feats, t["id"], test_id, rules["tests"][test_id], t["values"],
                                                      rules, n_sites=n_sites)
            except RuntimeError as e:
                print(f"   {e}")
    return out


def refine(first: dict) -> int:
    """30 m esatto sulla cella migliore di ogni sito candidato (le celle già calcolate si saltano)."""
    cells = {r["h3_cells"][0] if r["h3_cells"] else None for d in first.values() for r in d["results"]}
    cand = pd.DataFrame({"h3": sorted(c for c in cells if c)})
    cand.to_parquet(config.INTERIM / "candidates.parquet", index=False)
    print(f"   candidati: {len(cand)} esagoni")
    fine.main(scope="candidates")
    features.main()
    return len(cand)


def dossier(data: dict, feats: pd.DataFrame) -> None:
    """Compila il dossier di ogni sito: dalla carta d'identità + aree protette e vento (Earth Engine, con cache)."""
    from . import gee_common as g, surface
    cache = json.loads(DOSSIER_CACHE.read_text()) if DOSSIER_CACHE.exists() else {}
    key = lambda r: f"{r['lat']:.3f},{r['lon']:.3f}"
    todo = {key(r): (key(r), r["lat"], r["lon"]) for d in data.values() for r in d["results"] if key(r) not in cache}
    if todo:
        g.init()
        pts = list(todo.values())
        for i in range(0, len(pts), 100):
            cache.update(surface.site_dossier(pts[i:i + 100]))
        DOSSIER_CACHE.write_text(json.dumps(cache))
    f = feats.set_index("h3")
    for d in data.values():
        for r in d["results"]:
            row = f.loc[r["h3_cells"][0]] if r["h3_cells"] else None
            r["dossier"].update(cache.get(key(r), {}))
            if row is not None:
                r["dossier"]["snow_free_months"] = int(row["snow_free_months"]) if pd.notna(row["snow_free_months"]) else None
                r["dossier"]["night_lights"] = round(float(row["night_lights"]), 2) if pd.notna(row["night_lights"]) else None
                r["dossier"]["terrain_src"] = row.get("terrain_src")


def main(publish: bool = False, do_refine: bool = True, do_dossier: bool = True) -> int:
    rules = config.load_tests_file()
    targets = load_targets()
    feats = pd.read_parquet(config.FEATURES)
    print(f"1) voto con le stime: {len(targets)} siti × {len(TESTS)} test")
    first = run_all(feats, targets, rules, N_CANDIDATES)
    if do_refine:
        print("2) 30 m esatti sui candidati")
        refine(first)
        feats = pd.read_parquet(config.FEATURES)
    print("3) voto finale")
    data = run_all(feats, targets, rules, 10)
    if do_dossier:
        print("4) dossier")
        dossier(data, feats)
    out = config.EXPORT if publish else config.RAW / "export_preview"
    (out / "sites").mkdir(parents=True, exist_ok=True)
    if not publish:                                   # gli altri file del contratto, uguali al mock per ora
        for name in ("benchmark.json", "facilities.json", "known_sites.json"):
            shutil.copy(config.EXPORT / name, out / name)
    files = ["targets.json"]
    for stale in (out / "sites").glob("*.json"):     # il manifest è la verità: via i file di siti o test tolti
        stale.unlink()
    (out / "targets.json").write_text(json.dumps(targets, ensure_ascii=False, indent=1), encoding="utf-8")
    for (site, test), d in data.items():
        d["target_source"] = "SEGNAPOSTO: valori provvisori, in attesa dei valori di Rocco"
        path = out / "sites" / f"{site}__{test}.json"
        path.write_text(json.dumps(d, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
        files.append(f"sites/{site}__{test}.json")
    manifest = json.loads((config.EXPORT / "manifest.json").read_text())
    manifest.update({"version": "0.2-earth", "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                     "mock": False, "targets_mock": True, "files": files + ["benchmark.json", "facilities.json", "known_sites.json"]})
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"5) {len(data)} file in {out.relative_to(config.ROOT)}")
    for (site, test), d in list(data.items())[:3]:
        r = d["results"][0] if d["results"] else {}
        print(f"   {site} × {test}: primo {r.get('name')} voto {r.get('score')} ({r.get('dossier', {}).get('terrain_src')})")
    return 0

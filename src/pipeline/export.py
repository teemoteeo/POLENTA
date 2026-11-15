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

TESTS = ("flight_hda_lidar", "rover_mobility", "isru_subsurface")
N_CANDIDATES = 25
SCREEN_KAPPA = 0.6
N_RESULTS = 20   # l'app ne mostra 5; le riserve servono quando si escludono i siti di test noti
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


def load_targets(feats: pd.DataFrame | None = None) -> list[dict]:
    """I valori dei 5 siti: dalla matrice di Rocco (targets.py) se c'è, altrimenti i segnaposto."""
    from . import targets
    if targets.MATRIX.exists() and feats is not None:
        return targets.site_targets(feats)
    return placeholder_targets()


def placeholder_targets() -> list[dict]:
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
                r["dossier"]["valid_share"] = round(float(row["valid_share"]), 3)   # quota di suolo nudo dell'esagono
                # finestra di test: mesi senza neve (gen → dic) e il mese migliore (senza neve, Sole più radente)
                r["dossier"]["snow_free_mask"] = row.get("snow_free_mask")
                r["dossier"]["best_month"] = int(row["low_sun_best_month"]) if pd.notna(row.get("low_sun_best_month")) else None
                if "crop_urban_share" in row and pd.notna(row["crop_urban_share"]):
                    r["dossier"]["crop_urban_share"] = round(float(row["crop_urban_share"]), 3)


# Isole artiche dove GeoNames (città con più di 1.000 abitanti) non ha centri: lì la "città più vicina" è a
# centinaia di km, meglio il nome dell'area. (lat_min, lat_max, lon_min, lon_max, nome, paese)
REMOTE = [
    (76, 82, 40, 66, "Terra di Francesco Giuseppe", "Russia"), (74, 81, 10, 35, "Svalbard", "Norway"),
    (70, 77, 51, 69, "Novaja Zemlja", "Russia"), (78, 82, 89, 108, "Severnaja Zemlja", "Russia"),
    (73, 77.5, 135, 160, "Isole della Nuova Siberia", "Russia"), (59, 84, -65, -11, "Groenlandia", "Denmark"),
    (70, 84, -125, -65, "Arcipelago artico canadese", "Canada"),
]
def name_places(data: dict) -> None:
    """Nome leggibile al posto delle coordinate (GeoNames offline, reverse_geocoder) e paese."""
    import math
    import pycountry
    import reverse_geocoder as rg
    todo = [r for d in data.values() for r in d["results"]]
    found = rg.search([(r["lat"], r["lon"]) for r in todo], mode=1, verbose=False)
    for r, g in zip(todo, found):
        d_km = sites.km(r["lat"], r["lon"], float(g["lat"]), float(g["lon"]))
        country = getattr(pycountry.countries.get(alpha_2=g["cc"]), "name", g["cc"])
        box = next((b for b in REMOTE if b[0] <= r["lat"] <= b[1] and b[2] <= r["lon"] <= b[3]), None)
        region = "" if g["cc"] == "CN" else f", {g['admin1']}"   # GeoNames sbaglia spesso le province cinesi
        if r.get("known_site") and not r["name"][0].isdigit() and r["name"][0] != "-":
            pass
        elif d_km <= 25:
            r["name"] = f"{g['name']}{region}"
        elif d_km <= 250:
            r["name"] = f"{d_km:.0f} km da {g['name']}{region}"
        elif box:                                      # con le coordinate: le isole sono grandi e i siti tanti
            r["name"] = f"{box[4]}, {abs(r['lat']):.1f}°{'N' if r['lat'] >= 0 else 'S'} {abs(r['lon']):.1f}°{'E' if r['lon'] >= 0 else 'W'}"
            country = box[5]
        else:
            r["name"] = f"Area remota, {d_km:.0f} km da {g['name']}"
        r["country"] = country


# --- Campagna consigliata: sito all'aperto + strutture indoor + simulanti + roccia naturale ------------------
CLIENT = ("Torino", 45.07, 7.69)          # i clienti della demo (TAS-I, ALTEC)
GAP_LABELS = {
    "gravity_1_6": "gravità a 1/6", "vacuum": "vuoto", "electrostatic_dust": "polvere elettrostatica",
    "plume_vacuum": "getto del motore sulla regolite nel vuoto", "cryo_psr": "freddo delle zone in ombra (40-110 K)",
    "agglutinates": "agglutinati e ferro nanofase della regolite", "soil_density": "densità e compattazione della regolite",
    "rock_cover": "massi", "roughness": "rugosità", "crater_density": "crateri", "slope_p90": "pendenze",
    "grain_proxy": "grana della regolite", "bulk_density_0_5": "densità superficiale", "albedo": "albedo",
    "low_sun_frac": "luce radente", "permafrost_share": "ghiaccio nel suolo", "rock_class": "tipo di roccia",
}
# unità dei valori nelle card (values e target sono nelle unità terrestri: targets.py converte quelle lunari)
EARTH_UNITS = {"slope_p90": "°", "roughness": "m", "crater_density": "crateri/km²", "rock_cover": "frazione 0-1",
               "grain_proxy": "inerzia termica apparente (1/K)", "albedo": "frazione 0-1", "low_sun_frac": "frazione 0-1",
               "bulk_density_0_5": "g/cm³", "permafrost_share": "quota di area con permafrost (0-1)", "rock_class": "classe GLiM"}
REGOLITH = {"soil_density", "grain_proxy", "bulk_density_0_5", "agglutinates", "rock_class", "permafrost_share"}
SIMULANTS_FOR = {"moon_highland": ["lsp2", "lhs1"], "moon_mare": ["lms1", "eac1a"], "phoenix": ["mgs1"], "gale": ["mgs1", "jez1"]}


def labels() -> dict:
    """Per l'app: nome in italiano, dimensione della challenge e unità di ogni parametro e di ogni gap."""
    from . import targets
    m = targets.load()
    out = {}
    for p, row in m.iterrows():
        key = targets.ALIAS.get(p, p)
        out[key] = {"label": GAP_LABELS.get(key, key), "definition": row["Definizione e Unità"],
                    "dimension": row.get("Dimensione (challenge)"), "unit": EARTH_UNITS.get(key, "")}
    for key, lab in GAP_LABELS.items():
        out.setdefault(key, {"label": lab, "definition": None, "dimension": "Limiti della Terra (struttura indoor)", "unit": ""})
    return out


def validation(feats: pd.DataFrame, targets: list, rules: dict) -> dict:
    """Dove si piazzano i siti di test già usati (known_sites.csv) tra tutti gli esagoni con un voto, per ogni
    sito × test: percentile 0-100 (100 = il migliore). È la prova che il metodo ritrova i posti che usano le aziende."""
    import h3
    import numpy as np
    from . import score as sc
    idx = pd.Series(range(len(feats)), index=feats["h3"])
    known = config.known_sites()
    out = {}
    for t in targets:
        for test in TESTS:
            tot = sc.score(feats, rules["tests"][test], t["values"], rules)["total"]
            ok = tot[np.isfinite(tot)]
            rows = []
            for k in known:
                if test not in k["tests"]:
                    continue
                c = h3.latlng_to_cell(k["lat"], k["lon"], config.H3_RES)
                v = tot[idx[c]] if c in idx.index else np.nan
                rows.append({"id": k["id"], "name": k["name"], "score": None if not np.isfinite(v) else round(float(v), 3),
                             "percentile": None if not np.isfinite(v) else round(float(100 * (ok < v).mean()))})
            out.setdefault(t["id"], {})[test] = rows
    return out


def tables() -> tuple[list, list, list]:
    """Strutture, simulanti e fonti di roccia da data/config (con la distanza dal cliente)."""
    fac = pd.read_csv(config.CONFIG / "facilities.csv").to_dict("records")
    for f in fac:
        f["covers"] = f["covers"].split(";")
        f["km_client"] = round(sites.km(CLIENT[1], CLIENT[2], f["lat"], f["lon"]))
    sim = pd.read_csv(config.CONFIG / "simulants.csv").fillna("").to_dict("records")
    rocks = pd.read_csv(config.CONFIG / "rock_sources.csv").to_dict("records")
    return fac, sim, rocks


def campaign(r: dict, target: dict, test: str, fac: list, sim: list, rocks: list) -> dict:
    gaps = list(dict.fromkeys(b["param"] for b in r["breaks"]))
    by_gap = {g: sorted((f for f in fac if g in f["covers"]), key=lambda f: f["km_client"]) for g in gaps}
    for b in r["breaks"]:                              # chi copre ogni "si rompe", la più vicina al cliente per prima
        b["label"] = GAP_LABELS.get(b["param"], b["param"])
        b["covered_by"] = [f["name"] for f in by_gap[b["param"]][:3]] or ["nessuna struttura nota"]
    left, chosen = {g for g in gaps if by_gap[g]}, []
    while left:                                        # insieme minimo: chi copre più gap, a parità il più vicino
        best = max(fac, key=lambda f: (len(left & set(f["covers"])), -f["km_client"]))
        got = sorted(left & set(best["covers"]))
        chosen.append({"id": best["id"], "name": best["name"], "place": f"{best['place']}, {best['country']}",
                       "lat": best["lat"], "lon": best["lon"], "km_client": best["km_client"],
                       "covers": got, "covers_labels": [GAP_LABELS.get(g, g) for g in got], "source": best["source"]})
        left -= set(got)
    by_material = {"rock_class"}                      # il tipo di roccia lo chiudono simulante o roccia naturale
    out = {"outdoor": {"name": r["name"], "lat": r["lat"], "lon": r["lon"]}, "facilities": chosen,
           "uncovered": [{"param": g, "label": GAP_LABELS.get(g, g)} for g in gaps if not by_gap[g] and g not in by_material]}
    if test != "flight_hda_lidar" or REGOLITH & set(gaps):   # simulanti: quando conta il suolo
        key = (target["id"] if target["world"] == "mars"
               else "moon_highland" if target["values"].get("rock_class") == "anorthosite" else "moon_mare")
        out["simulants"] = [{k: s[k] for k in ("id", "name", "producer", "terrain", "price", "source")}
                            for s in sim if s["id"] in SIMULANTS_FOR.get(key, [])]
        rock = "anorthosite" if target["values"].get("rock_class") == "anorthosite" else "basalt"
        cand = [x for x in rocks if x["rock"] == rock]
        near = lambda la, lo: min(cand, key=lambda x: sites.km(la, lo, x["lat"], x["lon"]))
        for label, (la, lo) in (("near_client", CLIENT[1:]), ("near_site", (r["lat"], r["lon"]))):
            x = near(la, lo)
            out[f"rock_source_{label}"] = {"id": x["id"], "name": x["name"], "rock": rock, "lat": x["lat"], "lon": x["lon"],
                                           "km": round(sites.km(la, lo, x["lat"], x["lon"])), "use": x["use"], "source": x["source"]}
        for b in r["breaks"]:
            if b["param"] in by_material:
                b["covered_by"] = [x["name"] for x in out["simulants"]] + [out["rock_source_near_client"]["name"]]
        out["rock_note"] = ("Roccia naturale da cava: 8-20 volte più economica del simulante commerciale (precedente: "
                            "LUNA a Colonia), ma i grani terrestri sono arrotondati, quelli lunari taglienti: combacia "
                            "in chimica, non in geotecnica.")
    out["client"] = CLIENT[0]
    return out


def main(publish: bool = False, do_refine: bool = True, do_dossier: bool = True) -> int:
    rules = config.load_tests_file()
    feats = pd.read_parquet(config.FEATURES)
    targets = load_targets(feats)
    print(f"1) voto con le stime: {len(targets)} siti × {len(TESTS)} test")
    # screening con κ ≥ 0,6: i crateri ci sono solo dove c'è il 30 m esatto, e con κ 0,8 il lidar (crateri 0,30)
    # cercava solo nel campione casuale (3.227 esagoni in gara invece di ~200 mila, 15/11 01:45). I candidati poi
    # ricevono il 30 m esatto, crateri compresi, e il voto finale torna a κ ≥ 0,8.
    first = run_all(feats, targets, {**rules, "kappa_min": SCREEN_KAPPA}, N_CANDIDATES)
    if do_refine:
        print("2) 30 m esatti sui candidati")
        refine(first)
        feats = pd.read_parquet(config.FEATURES)
    print("3) voto finale")
    data = run_all(feats, targets, rules, N_RESULTS)
    est = {r["h3_cells"][0] for d in data.values() for r in d["results"]}
    est = [c for c in est if feats.set_index("h3").at[c, "terrain_src"] != "30m"] if do_refine else []
    if est:                                   # secondo giro: i risultati finali rimasti con la stima
        print(f"   secondo giro di 30 m esatti: {len(est)} esagoni")
        refine({("_", "_"): {"results": [{"h3_cells": [c]} for c in est]}})
        feats = pd.read_parquet(config.FEATURES)
        data = run_all(feats, targets, rules, N_RESULTS)
    if do_dossier:
        print("4) dossier")
        dossier(data, feats)
    name_places(data)
    fac, sim, rocks = tables()
    tmap = {t["id"]: t for t in targets}
    for (site, test), d in data.items():
        for r in d["results"]:
            r["campaign"] = campaign(r, tmap[site], test, fac, sim, rocks)
    out = config.EXPORT if publish else config.RAW / "export_preview"
    (out / "sites").mkdir(parents=True, exist_ok=True)
    for name, rows in (("facilities.json", fac), ("simulants.json", sim), ("rock_sources.json", rocks), ("labels.json", labels()),
                       ("known_sites.json", config.known_sites()), ("validation.json", validation(feats, targets, rules))):
        (out / name).write_text(json.dumps(rows, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    # benchmark (la slide del pitch): per ogni sito × test il primo risultato, il primo nuovo e le strutture indoor
    bench = {}
    for (site, test), d in data.items():
        rs = d["results"]
        bench.setdefault(site, {})[test] = {
            "best": rs[0]["id"] if rs else None, "best_new": next((r["id"] for r in rs if r["new"]), None),
            "facility": [f["name"] for f in rs[0]["campaign"]["facilities"]] if rs else []}
    (out / "benchmark.json").write_text(json.dumps(bench, ensure_ascii=False, indent=1), encoding="utf-8")
    files = ["targets.json"]
    for stale in (out / "sites").glob("*.json"):     # il manifest è la verità: via i file di siti o test tolti
        stale.unlink()
    (out / "targets.json").write_text(json.dumps(targets, ensure_ascii=False, indent=1), encoding="utf-8")
    for (site, test), d in data.items():
        d["target_source"] = ("data/config/siti_e_pesi.csv (Rocco); unità convertite in targets.py"
                              if not targets[0].get("mock") else "SEGNAPOSTO: valori provvisori, in attesa dei valori di Rocco")
        path = out / "sites" / f"{site}__{test}.json"
        path.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":"), default=str), encoding="utf-8")
        files.append(f"sites/{site}__{test}.json")
    manifest = json.loads((config.EXPORT / "manifest.json").read_text())
    manifest.update({"version": "1.0", "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                     "mock": False, "targets_mock": bool(targets[0].get("mock")), "sites": list(SITES), "tests": list(TESTS),
                     "datasets": ("Terra (Google Earth Engine): NASADEM, MODIS MOD44W/MOD13A3/MOD11A2/MCD43A3/MOD10A2, VIIRS DNB, "
                                  "MERRA-2, JAXA AW3D30, JRC Global Surface Water, SoilGrids (ISRIC), WDPA, GLiM (Hartmann & "
                                  "Moosdorf 2012). Luna: LRO LOLA LDEM_80S_20M (PDS) + valori di letteratura (siti_e_pesi.csv). "
                                  "Marte: valori di letteratura (siti_e_pesi.csv). Dettagli: docs/backend_spec.md sez. E"),
                     "contract": "docs/3am_changes_spec.md", "files": files + ["benchmark.json", "facilities.json", "simulants.json", "rock_sources.json", "labels.json", "known_sites.json", "validation.json"]})
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"5) {len(data)} file in {out.relative_to(config.ROOT)}")
    for (site, test), d in list(data.items())[:3]:
        r = d["results"][0] if d["results"] else {}
        print(f"   {site} × {test}: primo {r.get('name')} voto {r.get('score')} ({r.get('dossier', {}).get('terrain_src')})")
    return 0

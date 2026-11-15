"""Snapshot dei numeri del pitch: legge data/export e src/web/public, scrive docs/pitch/data.js.

Autore: Edo. Si rilancia dopo ogni ripubblicazione dell'export:
    python3 docs/pitch/snapshot.py
Il deck legge solo data.js (funziona anche da file://, senza server).
"""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPORT = ROOT / "data" / "export"
DOTS = ROOT / "src" / "web" / "public"
OUT = Path(__file__).with_name("data.js")

TESTS = ["flight_hda_lidar", "rover_mobility", "isru_subsurface"]
TOP = 5  # posti per casella
DOT_BUDGET = {"moon": 12000, "mars": 10000, "earth": 9000}

# stesse traduzioni di src/web/src/i18n.js (l'export è in italiano)
WORDS = [
    ("Terra di Francesco Giuseppe", "Franz Josef Land"), ("Arcipelago artico canadese", "Canadian Arctic Archipelago"),
    ("Groenlandia", "Greenland"), ("Severnaja Zemlja", "Severnaya Zemlya"), ("Area remota", "Remote area"),
    ("Colonia", "Cologne"), ("Torino", "Turin"), ("in arrivo", "coming soon"), ("sporca", "dirty"),
    ("Sfera a vuoto da 60 ft", "60 ft vacuum sphere"), ("Campo ALHAT", "ALHAT hazard field"),
    ("Campo di prova di Huailai", "Huailai proving ground"), ("Crateri di Challakere", "Challakere craters"),
    ('TVAC "dirty" ALTEC (coming soon)', "ALTEC dusty thermal-vacuum chamber (coming soon)"),
    ("Voli parabolici Novespace", "Novespace parabolic flights"),
    ("Mars Terrain Simulator e centro lunare ALTEC", "ALTEC Mars Terrain Simulator and lunar centre"),
]
PARAM_EN = {
    "slope_p90": "Slopes", "roughness": "Roughness", "crater_density": "Craters", "rock_cover": "Boulders",
    "grain_proxy": "Regolith grain size", "albedo": "Albedo", "low_sun_frac": "Low-angle sunlight",
    "bulk_density_0_5": "Surface density", "rock_class": "Rock type", "permafrost_share": "Ground ice",
    "gravity_1_6": "1/6 gravity", "vacuum": "Vacuum", "electrostatic_dust": "Electrostatic dust",
    "plume_vacuum": "Engine plume in vacuum", "cryo_psr": "Cold of shadowed regions",
    "agglutinates": "Agglutinates", "soil_density": "Regolith density",
}


def en(name):
    s = name.replace(" km da ", " km from ")
    for it, eng in WORDS:
        s = s.replace(it, eng)
    return s


def load(name):
    return json.loads((EXPORT / name).read_text())


def place(r):
    camp = r.get("campaign") or {}
    dossier = r.get("dossier") or {}
    return {
        "name": en(r["name"]), "country": r.get("country"), "lat": r["lat"], "lon": r["lon"],
        "score": r["score"], "new": r.get("new"), "known": r.get("known_site"),
        "breaks": [PARAM_EN.get(b["param"], b["param"]) for b in r.get("breaks", [])],
        "facilities": [{"name": en(f["name"]), "lat": f["lat"], "lon": f["lon"], "km": f.get("km_client")}
                       for f in camp.get("facilities", [])],
        "snow_free_months": dossier.get("snow_free_months"), "valid_share": dossier.get("valid_share"),
    }


def dots(world):
    a = json.loads((DOTS / f"{world}-dots.json").read_text())
    # campione casuale (seme fisso): i file sono ordinati a spirale, un passo fisso disegna la spirale
    a = random.Random(7).sample(a, min(len(a), DOT_BUDGET[world]))
    flat = []
    for p in a:  # [lon, lat] o [lon, lat, peso]
        flat += [round(p[0], 1), round(p[1], 1), round(p[2] if len(p) > 2 else 1, 2)]
    return flat


def main():
    manifest = load("manifest.json")
    targets = load("targets.json")
    results, n_new, n_cells = {}, 0, 0
    for t in targets:
        for test in TESTS:
            f = EXPORT / "sites" / f"{t['id']}__{test}.json"
            if not f.exists():
                continue
            d = json.loads(f.read_text())
            top = [place(r) for r in d["results"][:TOP]]
            results[f"{t['id']}__{test}"] = top
            n_new += bool(top and top[0]["new"])
            n_cells = max(n_cells, len(d.get("cells") or []))
    data = {
        "generated_at": manifest.get("generated_at"),
        "targets": [{k: t[k] for k in ("id", "name", "world", "lat", "lon")} for t in targets],
        "tests": TESTS,
        "results": results,
        "first_is_new": [n_new, len(results)],
        "validation": load("validation.json"),
        "known_sites": [{k: s.get(k) for k in ("id", "name", "lat", "lon", "tests")} for s in load("known_sites.json")],
        "facilities": [{"id": f["id"], "name": en(f["name"]), "lat": f["lat"], "lon": f["lon"]} for f in load("facilities.json")],
        "dots": {w: dots(w) for w in DOT_BUDGET},
    }
    OUT.write_text("// generato da snapshot.py: non modificare a mano\nwindow.PITCH_DATA = "
                   + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"{OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB · export {data['generated_at']} · "
          f"{len(results)} caselle · primo posto nuovo {n_new}/{len(results)}")


if __name__ == "__main__":
    main()

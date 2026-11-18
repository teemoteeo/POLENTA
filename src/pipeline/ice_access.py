"""Passo 6b (ghiaccio): quota di area con ghiaccio d'acqua accessibile per ISRU attorno ai siti lunari polari.

Definizione (decisione del team, 18/11/2026: architettura Artemis):
  per un punto di atterraggio P, ice_share(P) = area con ghiaccio stabile entro D_MAX dalla superficie, dentro il cerchio
  di raggio R_KM attorno a P, divisa per l'area del cerchio. Il punto di atterraggio vero non è noto: è un punto
  qualunque dentro la regione candidata Artemis, quindi il valore del sito è l'intervallo [p10, p90] di ice_share(P)
  su tutti i P della regione (campionati sui centri dei triangoli Diviner, ~500 m).

  R_KM = 10   raggio d'azione dell'LTV con equipaggio, vincolato dal ritorno a piedi (~5 h):
              NASA EVA-EXP-0075 "Exploration EVA System Concept of Operations" (NTRS 20200001071), valore TBR.
  D_MAX = 1 m profondità di ghiaccio considerata accessibile [da confermare con fonte].

Ingressi:
  data/raw/diviner/dlre_prp_south.tab   LRO Diviner Polar Resource Product, LRO-L-DLRE-5-PRP-V2.0 (Paige, UCLA;
      PDS Geosciences Node, urn:nasa:pds:lro_diviner_derived1:data_derived_prp). Colonna ice_depth: profondità (m) a
      cui il ghiaccio sublima meno di 1 kg m⁻² per miliardo di anni; 0 = stabile in superficie; -999 = oltre 2,87 m.
  data/raw/lola/artemis_regions.json    contorni USGS delle regioni (McClernan 2024, doi:10.5066/P1MEQ6UK),
      stesso formato di lunar.py. Se manca, la regione è un quadrato di 15 × 15 km centrato sulle coordinate di
      siti_coordinate.csv (dimensione delle regioni candidate Artemis III, NASA 2022) e il risultato è PROVVISORIO.
Output: data/raw/interim/ice_access.json (valori del sito + sensibilità a R e D_MAX).
"""
import json

import numpy as np
import pandas as pd
from scipy.spatial import cKDTree
from shapely.geometry import MultiPoint, Point, box

from . import config

PRP = config.RAW / "diviner" / "dlre_prp_south.tab"
REGIONS = config.LOLA_DIR / "artemis_regions.json"
OUT = config.INTERIM / "ice_access.json"
R_KM, D_MAX = 10.0, 1.0
PCT = (10, 90)
SENS_R, SENS_D = (2.0, 10.0, 12.0), (0.5, 1.0, 2.0)  # a piedi (2 km), LTV (10 km), rover pressurizzato (12 km)
PROVISIONAL_SIDE_KM = 15.0
MOON_R = 1737.4
LAT_CUT = -82.0  # i siti polari della demo sono oltre 85°S: basta la calotta, con margine per il raggio


def load_prp() -> pd.DataFrame:
    """Triangoli della calotta sud: centro (xyz, km), area (km²), ice_depth (m)."""
    cols = ["tri1_x", "tri1_y", "tri1_z", "tri2_x", "tri2_y", "tri2_z", "tri3_x", "tri3_y", "tri3_z", "tri_clat", "ice_depth"]
    parts = []
    for c in pd.read_csv(PRP, skipinitialspace=True, usecols=cols, chunksize=500_000):
        parts.append(c[c.tri_clat <= LAT_CUT])
    d = pd.concat(parts, ignore_index=True)
    v = [d[[f"tri{i}_x", f"tri{i}_y", f"tri{i}_z"]].to_numpy() for i in (1, 2, 3)]
    d["area"] = 0.5 * np.linalg.norm(np.cross(v[1] - v[0], v[2] - v[0]), axis=1)
    c = (v[0] + v[1] + v[2]) / 3
    d["cx"], d["cy"], d["cz"] = c.T
    return d[["cx", "cy", "cz", "area", "ice_depth"]]


def to_xy(lat, lon):
    """Proiezione stereografica polare sud (km), per i contorni e il quadrato provvisorio."""
    lat, lon = np.radians(lat), np.radians(lon)
    k = 2 * MOON_R / (1 - np.sin(lat))
    return k * np.cos(lat) * np.sin(lon), k * np.cos(lat) * np.cos(lon)


def xyz_to_xy(x, y, z):
    r = np.sqrt(x * x + y * y + z * z)
    return to_xy(np.degrees(np.arcsin(z / r)), np.degrees(np.arctan2(y, x)))


def regions() -> tuple[dict, bool]:
    """slug → poligono (stereografica sud, km); il booleano dice se sono i contorni USGS veri."""
    if REGIONS.exists():
        out = {}
        for r in json.loads(REGIONS.read_text())["regions"].values():
            pts = [to_xy(lat, lon) for line in r["lines"] for lat, lon in line]
            out[config.slug(r["name"].replace("_", " "))] = MultiPoint(pts).convex_hull
        return out, True
    sites = pd.read_csv(config.CONFIG / "siti_coordinate.csv")
    h = PROVISIONAL_SIDE_KM / 2
    out = {}
    for s in sites[(sites.body == "Moon") & (sites.lat < -80)].itertuples():
        x, y = to_xy(s.lat, s.lon)
        out[s.id] = box(x - h, y - h, x + h, y + h)
    return out, False


def shares(d: pd.DataFrame, tree: cKDTree, landing: np.ndarray, r_km: float, d_max: float) -> np.ndarray:
    """ice_share per ogni punto di atterraggio (indici in d)."""
    ice = ((d.ice_depth >= 0) & (d.ice_depth <= d_max)).to_numpy()
    area = d.area.to_numpy()
    pts = d[["cx", "cy", "cz"]].to_numpy()
    chord = 2 * MOON_R * np.sin(r_km / (2 * MOON_R))  # distanza in linea retta equivalente all'arco r_km
    out = np.empty(len(landing))
    for i, j in enumerate(landing):
        nb = tree.query_ball_point(pts[j], chord)
        a = area[nb]
        out[i] = a[ice[nb]].sum() / a.sum()
    return out


def main() -> int:
    if not PRP.exists():
        print(f"   manca {PRP}: scaricarlo dal PDS (vedi docstring)")
        return 1
    d = load_prp()
    tree = cKDTree(d[["cx", "cy", "cz"]].to_numpy())
    px, py = xyz_to_xy(d.cx.to_numpy(), d.cy.to_numpy(), d.cz.to_numpy())
    regs, official = regions()
    res = {}
    for sid, poly in regs.items():
        minx, miny, maxx, maxy = poly.bounds
        cand = np.where((px >= minx) & (px <= maxx) & (py >= miny) & (py <= maxy))[0]
        landing = np.array([j for j in cand if poly.contains(Point(px[j], py[j]))])
        if not len(landing):
            res[sid] = {"n_landing_points": 0}
            continue
        main_s = shares(d, tree, landing, R_KM, D_MAX)
        sens = {f"R{r:g}km_d{dm:g}m": [round(float(np.percentile(s, p)), 4) for p in PCT]
                for r in SENS_R for dm in SENS_D
                for s in [main_s if (r, dm) == (R_KM, D_MAX) else shares(d, tree, landing, r, dm)]}
        res[sid] = {
            "ice_area_share": [round(float(np.percentile(main_s, p)), 4) for p in PCT],
            "min": round(float(main_s.min()), 4), "median": round(float(np.median(main_s)), 4), "max": round(float(main_s.max()), 4),
            "n_landing_points": int(len(landing)), "region_km2": round(float(poly.area), 1), "sensitivity_p10_p90": sens,
        }
    doc = {
        "definition": f"quota di area con ghiaccio d'acqua stabile entro {D_MAX:g} m di profondità, entro {R_KM:g} km dal punto "
                      f"di atterraggio; intervallo p{PCT[0]}-p{PCT[1]} sui punti di atterraggio possibili nella regione",
        "R_km": R_KM, "d_max_m": D_MAX, "percentiles": list(PCT),
        "regions": "USGS McClernan 2024 doi:10.5066/P1MEQ6UK" if official else
                   f"PROVVISORIO: quadrato {PROVISIONAL_SIDE_KM:g} km centrato su siti_coordinate.csv (contorni USGS mancanti)",
        "provisional": not official,
        "sources": {
            "ice": "LRO Diviner Polar Resource Product LRO-L-DLRE-5-PRP-V2.0 (Paige, UCLA), PDS Geosciences Node, "
                   "urn:nasa:pds:lro_diviner_derived1:data_derived_prp:dlre_prp_south, colonna ice_depth",
            "radius": "NASA EVA-EXP-0075 Exploration EVA System ConOps (NTRS 20200001071): LTV non pressurizzato 10 km, "
                      "ritorno a piedi ~5 h [TBR]",
        },
        "sites": res,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False))
    print(f"   regioni: {doc['regions']}")
    print(f"{'sito':<18}{'punti':>7}{'km²':>7}{'p10':>8}{'mediana':>9}{'p90':>8}{'max':>8}")
    for sid, r in res.items():
        if r.get("n_landing_points"):
            print(f"{sid:<18}{r['n_landing_points']:>7}{r['region_km2']:>7}{r['ice_area_share'][0]:>8.3f}"
                  f"{r['median']:>9.3f}{r['ice_area_share'][1]:>8.3f}{r['max']:>8.3f}")
    print(f"   → {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

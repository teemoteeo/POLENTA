"""Passo 6a (regioni): contorni delle regioni candidate Artemis III → data/raw/lola/artemis_regions.json.

Fonte: McClernan, M.T., 2024, Lunar Grid Reference System (LGRS) Down Selected Artemis III Candidate Landing Site
Navigational Grids in Artemis Condensed Coordinate (ACC) Format, U.S. Geological Survey data release,
doi:10.5066/P1MEQ6UK (pubblico dominio, Use Constraints: "None"). Da ScienceBase si scarica a mano uno zip per regione
e lo si scompatta in data/raw/lola/usgs_lgrs/<Regione>/ (es. usgs_lgrs/Malapert_Massif/).

La regione è l'unione delle celle della griglia LGRS da 1 km (<Regione>_PolarLGRS_ACC_1km_S_Grid.shp): la griglia copre
esattamente l'area candidata. Le celle sono in Lunar Polar Stereographic sud (sfera R = 1737,4 km, k0 = 0,994,
falso est/nord 500 km, vedi il .prj); il contorno viene riportato in (lat, lon) planetocentriche, il formato letto da
lola_fetch.py, lunar.py e ice_access.py.
Controllo: area della griglia / k0² = area vera (Malapert 468, Haworth 942, Nobile Rim 1 446 km²).
"""
import json

import numpy as np
import shapefile  # pyshp
from shapely.geometry import shape
from shapely.ops import unary_union

from . import config

SRC = config.LOLA_DIR / "usgs_lgrs"
OUT = config.LOLA_DIR / "artemis_regions.json"
R_M, K0, FE, FN = 1737400.0, 0.994, 500000.0, 500000.0
DOI = "doi:10.5066/P1MEQ6UK"


def to_latlon(x, y):
    """Inversa della stereografica polare sud (Snyder 1987, eq. 21-15, 20-14 e 21-19 con φ0 = -90°)."""
    dx, dy = np.asarray(x) - FE, np.asarray(y) - FN
    c = 2 * np.arctan(np.hypot(dx, dy) / (2 * R_M * K0))
    return np.degrees(c - np.pi / 2), np.degrees(np.arctan2(dx, dy))


def main() -> int:
    grids = sorted(SRC.glob("*/*_PolarLGRS_ACC_1km_S_Grid.shp"))
    if not grids:
        print(f"   nessuna griglia in {SRC}: scaricare le regioni da {DOI} (vedi docstring)")
        return 1
    regions = {}
    print(f"{'regione':<18}{'celle':>7}{'km² veri':>10}")
    for shp in grids:
        name = shp.parent.name
        cells = [shape(s.__geo_interface__) for s in shapefile.Reader(str(shp)).shapes()]
        poly = unary_union(cells)
        assert poly.geom_type == "Polygon", f"{name}: la griglia non è un'area unica"
        x, y = np.array(poly.exterior.coords).T
        lat, lon = to_latlon(x, y)
        km2 = poly.area / K0**2 / 1e6
        regions[config.slug(name)] = {"name": name, "cells_1km": len(cells), "area_km2": round(km2, 1),
                                      "lines": [[[round(float(a), 6), round(float(o), 6)] for a, o in zip(lat, lon)]]}
        print(f"{name:<18}{len(cells):>7}{km2:>10.1f}")
    doc = {"source": f"USGS, McClernan 2024, LGRS ACC 1 km grids, {DOI}", "format": "lines = contorno [[lat, lon], ...]",
           "regions": regions}
    OUT.write_text(json.dumps(doc, indent=1))
    print(f"   → {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

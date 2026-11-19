"""Passo 6 (terreno): pendenza, rugosità e crateri delle regioni Artemis dal DEM LOLA, con le STESSE definizioni
usate sulla Terra (fine.py), così Terra e Luna si confrontano alla pari (docs/backend_spec.md §7).

- DEM LOLA a 20 m delle zone dei siti (stereografica polare) → media su pixel da 30 m, la baseline della Terra;
- slope_p90: pendenza al 90° percentile;
- slope_trav_p90, trav_share: pendenza al 90° percentile dei soli pixel sotto config.TRAV_SLOPE_DEG (20°, requisito LTV)
  e quota di pixel sotto la soglia (test rover, TODO [17]); check_15deg: lo stesso a 15°, solo per il confronto con
  Wueller et al. 2025 (pendenza delle aree percorribili sotto 15°: Malapert 13,5°);
- roughness: scarto quadratico della quota dalla media su un cerchio di 150 m;
- crater_density: punti più bassi entro 300 m (con 1 cm di rumore: un solo minimo per fondo piatto), almeno 20 m
  sotto il bordo più alto dello stesso cerchio, per km². Solo dove il cerchio è tutto dentro il DEM.

Ingressi in data/raw/lola/: ldem_regions_20m.tif (lola_fetch.py) e artemis_regions.json (contorni USGS, McClernan 2024,
doi:10.5066/P1MEQ6UK). Calcolo locale (numpy/scipy), pochi secondi.
Output: data/raw/interim/lunar_terrain.json
"""
import json

import numpy as np
import rasterio
from pyproj import CRS, Transformer
from rasterio.features import rasterize
from rasterio.warp import Resampling, reproject
from scipy import ndimage
from shapely.geometry import MultiPoint

from . import config

DEM = config.LOLA_DIR / "ldem_regions_20m.tif"   # lola_fetch.py: le 3 regioni della demo, complete
REGIONS = config.LOLA_DIR / "artemis_regions.json"
OUT = config.INTERIM / "lunar_terrain.json"
RES = config.BASELINE_M                       # 30 m
CRATER_RADIUS_M, CRATER_RIM_DEPTH_M = 300, 20  # come fine.py
RELIEF_RADIUS_M = 150


def disk(radius_m: float) -> np.ndarray:
    r = int(round(radius_m / RES))
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def dem_30m():
    """Il DEM LOLA medio su pixel da 30 m, nella sua stereografica polare."""
    with rasterio.open(DEM) as src:
        w, h = int(src.width * src.res[0] / RES), int(src.height * src.res[1] / RES)
        transform = rasterio.Affine(RES, 0, src.bounds.left, 0, -RES, src.bounds.top)
        out = np.full((h, w), np.nan, dtype="float32")
        reproject(src.read(1), out, src_transform=src.transform, src_crs=src.crs, src_nodata=np.nan,
                  dst_transform=transform, dst_crs=src.crs, dst_nodata=np.nan, resampling=Resampling.average)
        return out, transform, src.crs


def terrain(d: np.ndarray) -> dict:
    """Le grandezze per pixel, con le definizioni di fine.py."""
    valid = np.isfinite(d)
    gy, gx = np.gradient(np.where(valid, d, np.nan), RES)
    slope = np.degrees(np.arctan(np.hypot(gx, gy)))
    k_rel = disk(RELIEF_RADIUS_M)
    filled = np.where(valid, d, 0.0)
    n = ndimage.convolve(valid.astype(float), k_rel.astype(float), mode="constant")
    mean = ndimage.convolve(filled, k_rel.astype(float), mode="constant") / np.maximum(n, 1)
    relief_sq = np.where(n == k_rel.sum(), (d - mean) ** 2, np.nan)        # cerchio tutto dentro il DEM
    k = disk(CRATER_RADIUS_M)
    full = ndimage.convolve(valid.astype(float), k.astype(float), mode="constant") == k.sum()
    dn = d + np.random.default_rng(0).random(d.shape) * 0.01
    lo = ndimage.minimum_filter(np.where(valid, dn, np.inf), footprint=k, mode="constant", cval=np.inf)
    hi = ndimage.maximum_filter(np.where(valid, d, -np.inf), footprint=k, mode="constant", cval=-np.inf)
    crater = full & (dn == lo) & (hi - d > CRATER_RIM_DEPTH_M)
    return {"slope": slope, "relief_sq": relief_sq, "crater": crater, "full": full}


def region_masks(transform, shape, crs) -> dict:
    """Contorni USGS (lat, lon) → maschere sulla griglia da 30 m."""
    geo = Transformer.from_crs(CRS.from_wkt(crs.to_wkt()).geodetic_crs, CRS.from_wkt(crs.to_wkt()), always_xy=True)
    out = {}
    for key, r in json.loads(REGIONS.read_text())["regions"].items():
        pts = [geo.transform(lon, lat) for line in r["lines"] for lat, lon in line]
        out[config.slug(r["name"].replace("_", " "))] = rasterize([MultiPoint(pts).convex_hull], out_shape=shape,
                                                                  transform=transform, fill=0, default_value=1).astype(bool)
    return out


def main() -> int:
    d, transform, crs = dem_30m()
    t = terrain(d)
    px_km2 = RES * RES / 1e6
    res = {}
    for sid, m in region_masks(transform, d.shape, crs).items():
        inside = m & np.isfinite(d)
        if inside.sum() == 0:
            res[sid] = {"covered": 0.0}
            continue
        area = (m & t["full"]).sum() * px_km2                                # area dove il detector vede tutto
        n = int((t["crater"] & m).sum())
        s = t["slope"][inside]
        s = s[np.isfinite(s)]
        trav = lambda deg: {"p90": round(float(np.percentile(s[s < deg], 90)), 2) if (s < deg).any() else None,
                            "share": round(float((s < deg).mean()), 3)}
        tr, t15 = trav(config.TRAV_SLOPE_DEG), trav(config.TRAV_CHECK_DEG)
        res[sid] = {
            "covered": round(float(inside.sum() / m.sum()), 3), "area_km2": round(float(area), 1),
            "slope_p90": round(float(np.nanpercentile(t["slope"][inside], 90)), 2),
            "roughness": round(float(np.sqrt(np.nanmean(t["relief_sq"][inside]))), 2),
            "crater_density": round(n / area, 3) if area else None,
            "crater_density_sigma": round(np.sqrt(max(n, 1)) / area, 3) if area else None, "n_craters": n,
            "slope_trav_p90": tr["p90"], "trav_share": tr["share"],
            "check_15deg": {"slope_p90": t15["p90"], "share": t15["share"]},
        }
    OUT.write_text(json.dumps({"source": "LOLA 20 m → 30 m, stesse definizioni della Terra (lunar.py)",
                               "regions": res}, indent=1))
    print(f"{'regione':<22}{'copertura':>10}{'area km²':>10}{'p90 °':>8}{'rug. m':>8}{'crateri/km²':>13}{'n':>5}"
          f"{'p90<20°':>9}{'quota<20°':>10}{'p90<15°':>9}{'quota<15°':>10}")
    for sid, r in res.items():
        if r.get("area_km2"):
            print(f"{sid:<22}{r['covered']:>10.2f}{r['area_km2']:>10.0f}{r['slope_p90']:>8.1f}{r['roughness']:>8.2f}"
                  f"{r['crater_density']:>9.3f} ± {r['crater_density_sigma']:.3f}{r['n_craters']:>5}"
                  f"{r['slope_trav_p90']:>9.1f}{r['trav_share']:>10.2f}{r['check_15deg']['slope_p90']:>9.1f}{r['check_15deg']['share']:>10.2f}")
        else:
            print(f"{sid:<22}{r['covered']:>10.2f}   (fuori dal DEM)")
    return 0


if __name__ == "__main__":
    main()

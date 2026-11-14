"""Scarica dal PDS il DEM LOLA a 20 m delle regioni Artemis della demo (docs/backend_spec.md §7).

LOLA LDEM_80S_20M (stereografica polare, int16, DN × 0,5 = quota in m) letto a finestre: per ogni riga della
regione si chiedono solo le colonne utili, con richieste HTTP multi-range (stesso metodo di fetch_data.py di Edo).
Regioni: contorni USGS (McClernan 2024) in data/raw/lola/artemis_regions.json, più 1 km di margine per il cerchio
da 300 m del detector dei crateri. Output: data/raw/lola/ldem_regions_20m.tif
"""
import json
import re
import ssl
import urllib.request

import numpy as np
import rasterio
from pyproj import CRS, Transformer
from rasterio.transform import from_origin
from rasterio.windows import from_bounds

from . import config

PDS = "https://pds-geosciences.wustl.edu"
LBL = f"/vsicurl/{PDS}/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_20m.lbl"
OUT = config.LOLA_DIR / "ldem_regions_20m.tif"
MARGIN, RES = 1000.0, 20.0
MOON_SITES = ("malapert_massif", "haworth", "nobile_rim_1")

try:
    import certifi
    urllib.request.install_opener(urllib.request.build_opener(
        urllib.request.HTTPSHandler(context=ssl.create_default_context(cafile=certifi.where()))))
except ImportError:
    pass


def get_ranges(url: str, ranges: list[tuple[int, int]]) -> dict:
    """(inizio, fine) inclusivi → {inizio: bytes}, a blocchi di 400 range per richiesta."""
    out = {}
    for i in range(0, len(ranges), 400):
        chunk = ranges[i:i + 400]
        hdr = "bytes=" + ",".join(f"{a}-{b}" for a, b in chunk)
        for attempt in range(4):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={"Range": hdr}), timeout=120) as r:
                    ctype, body = r.headers.get("Content-Type", ""), r.read()
                break
            except OSError:
                if attempt == 3:
                    raise
        if "multipart" not in ctype:
            out[chunk[0][0]] = body
            continue
        for m in re.finditer(rb"Content-Range: bytes (\d+)-(\d+)/\d+\r\n\r\n", body):
            a, b = int(m.group(1)), int(m.group(2))
            out[a] = body[m.end():m.end() + b - a + 1]
    return out


def main() -> int:
    with rasterio.open(LBL) as ds:                       # solo l'etichetta: CRS, griglia, scala
        assert ds.res == (RES, RES) and ds.scales[0] == 0.5 and ds.dtypes[0] == "int16"
        crs, tr, width = ds.crs, ds.transform, ds.width
    geo = Transformer.from_crs(CRS.from_wkt(crs.to_wkt()).geodetic_crs, CRS.from_wkt(crs.to_wkt()), always_xy=True)
    regions = json.loads((config.LOLA_DIR / "artemis_regions.json").read_text())["regions"]
    boxes = {}
    for r in regions.values():
        sid = config.slug(r["name"].replace("_", " "))
        if sid in MOON_SITES:
            xy = np.array([geo.transform(lon, lat) for line in r["lines"] for lat, lon in line])
            boxes[sid] = (xy[:, 0].min() - MARGIN, xy[:, 1].min() - MARGIN, xy[:, 0].max() + MARGIN, xy[:, 1].max() + MARGIN)
    ul, ub = np.floor(min(b[0] for b in boxes.values()) / RES) * RES, np.floor(min(b[1] for b in boxes.values()) / RES) * RES
    ur, ut = np.ceil(max(b[2] for b in boxes.values()) / RES) * RES, np.ceil(max(b[3] for b in boxes.values()) / RES) * RES
    out = np.full((int((ut - ub) / RES), int((ur - ul) / RES)), np.nan, dtype="float32")
    img = LBL.replace("/vsicurl/", "").replace(".lbl", ".img")
    for sid, b in boxes.items():
        win = from_bounds(*b, transform=tr).round_offsets().round_lengths()
        r0, c0, h, w = int(win.row_off), int(win.col_off), int(win.height), int(win.width)
        start = lambda r: (r * width + c0) * 2
        got = get_ranges(img, [(start(r), start(r) + 2 * w - 1) for r in range(r0, r0 + h)])
        arr = np.array([np.frombuffer(got[start(r)], "<i2") for r in range(r0, r0 + h)], "float32")
        arr = np.where(arr == -32768, np.nan, arr * 0.5)
        x0, y1 = tr * (c0, r0)
        R0, C0 = int(round((ut - y1) / RES)), int(round((x0 - ul) / RES))
        out[R0:R0 + h, C0:C0 + w] = arr
        print(f"   {sid}: {h} × {w} pixel ({h * w * 2 / 1e6:.1f} MB)")
    with rasterio.open(OUT, "w", driver="GTiff", width=out.shape[1], height=out.shape[0], count=1, dtype="float32",
                       crs=crs, nodata=np.nan, transform=from_origin(ul, ut, RES, RES), compress="deflate", tiled=True) as ds:
        ds.write(out, 1)
    print(f"scritto {OUT.relative_to(config.ROOT)} {out.shape}, pixel validi: {int(np.isfinite(out).sum()):,}")
    return 0


if __name__ == "__main__":
    main()

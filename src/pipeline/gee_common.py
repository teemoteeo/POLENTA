"""Ricette comuni per Google Earth Engine (docs/backend_spec.md §3).

- init():        collega Python a Earth Engine con il progetto del file .env
- valid_mask():  sì/no per pixel: terra emersa E senza vegetazione (NDVI massimo < 0,1)
- dem():         quota a 30 m: NASADEM fino a 60°N, AW3D30 (JAXA) sopra
- to_grid():     riassume i pixel nativi (solo quelli validi) in pixel da 0,05°
- fetch():       scarica un raster globale a quadrati e lo salva come GeoTIFF
"""
import time

import ee
import numpy as np
import rasterio
from rasterio.transform import from_origin

from . import config

RES = config.GRID_RES_DEG
GRID = [RES, 0, -180, 0, -RES, 90]          # griglia mondiale a 0,05° (lat/lon)
NROWS, NCOLS = int(180 / RES), int(360 / RES)


def init() -> None:
    ee.Initialize(project=config.env("GEE_PROJECT"))
    # tempo massimo per richiesta: se la rete cade, la richiesta fallisce e si riprova invece di restare appesa
    ee.data.setDeadline(300_000)


def land() -> ee.Image:
    """1 = terra emersa, 0 = acqua (MODIS MOD44W v006, immagine 2015).

    La collezione MODIS/061/MOD44W esiste ma è vuota (verificato il 14/11 alle 21:00).
    """
    water = (ee.ImageCollection("MODIS/006/MOD44W").sort("system:time_start", False)
             .first().select("water_mask"))
    return water.eq(0)


def ndvi_median() -> ee.Image:
    """NDVI mediano mensile del periodo (MODIS MOD13A3, 1 km): il valore tipico, non il picco.

    Solo i mesi senza neve e senza nuvole (SummaryQA 0-1). Con la mediana di tutto l'anno la neve
    invernale abbassava l'NDVI e la tundra verde passava come suolo nudo (Taymyr: −0,01 sull'anno,
    0,55 senza neve; verificato il 14/11 alle 23:10). Nei deserti non cambia nulla; i ghiacci
    permanenti, mai senza neve, restano senza valore e quindi escono dalla maschera."""
    col = ee.ImageCollection("MODIS/061/MOD13A3").filterDate(*config.YEARS)
    clear = col.map(lambda i: i.select("NDVI").updateMask(i.select("SummaryQA").lte(1)))
    return clear.median().multiply(1e-4)


def valid_mask() -> ee.Image:
    """Il filtro comune a tutti i test, applicato al singolo pixel: terra e NDVI mediano < soglia."""
    return land().And(ndvi_median().lt(config.NDVI_THRESHOLD))


def dem() -> ee.Image:
    """Quota a 30 m: NASADEM (NASA) dove c'è, cioè fino a 60°N; AW3D30 (JAXA) per il resto."""
    nasadem = ee.Image("NASA/NASADEM_HGT/001").select("elevation")
    # AW3D30 (V4_1; la V3_2 è deprecata) solo sopra i 59,5°N: comporre tutti i 24.000 tasselli
    # anche dove non servono (oceani compresi) rallentava ogni richiesta.
    north = ee.Geometry.Rectangle([-180, 59.5, 180, 84], "EPSG:4326", False)
    aw3d_all = ee.ImageCollection("JAXA/ALOS/AW3D30/V4_1")
    aw3d = aw3d_all.filterBounds(north).select("DSM").mosaic()
    # mosaic con NASADEM sopra: nasadem.unmask(aw3d) non riempie fuori dall'impronta di NASADEM
    # e sopra i 60°N dava zero pixel (verificato il 14/11 alle 22:30)
    return (ee.ImageCollection([aw3d.rename("elev").toFloat(), nasadem.rename("elev").toFloat()]).mosaic()
            .setDefaultProjection(nasadem.projection()))


def to_grid(img: ee.Image, reducer: ee.Reducer, native_m: float) -> ee.Image:
    """Riassume i pixel nativi in pixel da 0,05° con la regola `reducer` (media, percentile, somma…).

    I pixel mascherati non contano: è qui che i filtri si applicano ai pixel.
    """
    return (img.setDefaultProjection(crs="EPSG:4326", scale=native_m)
               .reduceResolution(reducer=reducer, maxPixels=65535)
               .reproject(crs="EPSG:4326", crsTransform=GRID))


TILE_OPTIONS = (30, 20, 15, 10, 6, 5, 4, 3, 2, 1)   # lati possibili, divisori di 180 e 360
MAX_INPUT_PX = 8000   # Earth Engine rifiuta oltre ~2^26 pixel di partenza (~8192 × 8192): verificato il 14/11


def tile_for(native_m: float) -> int:
    """Il quadrato più grande che, alla risoluzione nativa, resta sotto il limite di Earth Engine."""
    for t in TILE_OPTIONS:
        if t * 111_320 / native_m <= MAX_INPUT_PX:
            return t
    return TILE_OPTIONS[-1]


def fetch(img: ee.Image, path, native_m: float, need: np.ndarray | None = None, **kw) -> np.ndarray:
    """Una sola immagine → un GeoTIFF (scorciatoia di fetch_many)."""
    return fetch_many({path.stem: img}, native_m, need=need, out_dir=path.parent, **kw)[path.stem]


TEST_BOXES = [   # zone campione per il test rapido: dove stanno i siti noti (lon_min, lat_min, lon_max, lat_max)
    (12, 36, 16, 39),        # Sicilia ed Etna
    (-119, 34, -110, 37),    # Arizona, California: SFVF, Cinder Lake, Meteor Crater, Death Valley, Mojave
    (-18, 27, -13, 30),      # Canarie: Teide, Lanzarote
    (10, 20, 22, 26),        # Sahara centrale (controllo: deserto piatto e Tibesti)
]


def backoff(msg: str, attempt: int) -> float:
    """Secondi di attesa prima di riprovare. Il limite di richieste in parallelo (429, più stretto in
    "restricted mode", a quota mensile finita) chiede attese lunghe; gli altri errori transitori no."""
    if "Too Many Requests" in msg or "concurrency" in msg:
        return min(120, 15 * 2 ** attempt) * (0.5 + np.random.rand())
    return 3 * (attempt + 1)


def fetch_many(images: dict, native_m: float, need: np.ndarray | None = None, out_dir=None,
               workers: int = 10, retries: int = 6, tile_deg: int | None = None,
               boxes: list | None = None) -> dict:
    """Scarica più immagini (già su griglia a 0,05°) in un'unica serie di richieste e salva un GeoTIFF ciascuna.

    - Le immagini viaggiano come bande della stessa richiesta: meno chiamate a Earth Engine.
    - Il mondo si divide in quadrati: il lato dipende dalla risoluzione nativa (tile_for).
    - Ogni quadrato è una richiesta (computePixels), `workers` in parallelo; niente Google Drive.
    - `need`: raster a 0,05° (es. valid_share); i quadrati dove è tutto 0 o vuoto si saltano.
    - Un quadrato in errore si riprova con attese crescenti; se sfora la memoria si divide in 4 (fino a due
      volte); se non va neanche così resta vuoto (NaN) e finisce nell'elenco dei falliti, senza fermare il resto.
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    out_dir = out_dir or config.GEE_DIR
    names = list(images)
    img = ee.Image.cat([images[k].rename(k).toFloat() for k in names])
    tile_deg = tile_deg or tile_for(native_m)   # si può forzare più piccolo se l'oggetto è troppo grande
    n = int(round(tile_deg / RES))
    outs = {k: np.full((NROWS, NCOLS), np.nan, dtype="float32") for k in names}
    tiles = []
    for r, lat0 in enumerate(range(90, -90, -tile_deg)):
        for c, lon0 in enumerate(range(-180, 180, tile_deg)):
            if need is not None and not np.nan_to_num(need[r * n:(r + 1) * n, c * n:(c + 1) * n]).any():
                continue
            if boxes and not any(lon0 < x1 and lon0 + tile_deg > x0 and lat0 > y0 and lat0 - tile_deg < y1
                                 for x0, y0, x1, y1 in boxes):
                continue                              # modalità test: solo i quadrati delle zone campione
            tiles.append((r, lat0, c, lon0))

    failed = []

    def request(lat0: float, lon0: float, size: int) -> dict:
        """Un quadrato di size × size pixel con angolo in alto a sinistra (lat0, lon0)."""
        return ee.data.computePixels({
            "expression": img, "fileFormat": "NUMPY_NDARRAY",
            "grid": {"dimensions": {"width": size, "height": size},
                     "affineTransform": {"scaleX": RES, "shearX": 0, "translateX": lon0,
                                         "shearY": 0, "scaleY": -RES, "translateY": lat0},
                     "crsCode": "EPSG:4326"}})

    def block(lat0: float, lon0: float, size: int, depth: int = 0) -> dict:
        """Prova il quadrato; se sfora memoria o dimensione lo divide in 4 (fino a 2 volte); se no, resta vuoto."""
        for attempt in range(retries):
            try:
                arr = request(lat0, lon0, size)
                return {k: arr[k] for k in names}
            except Exception as e:
                msg = str(e)
                too_big = any(s in msg for s in ("memory limit", "too large", "Too many pixels"))
                if too_big and depth < 2 and size % 2 == 0:
                    h, d = size // 2, size // 2 * RES
                    parts = [[block(lat0, lon0, h, depth + 1), block(lat0, lon0 + d, h, depth + 1)],
                             [block(lat0 - d, lon0, h, depth + 1), block(lat0 - d, lon0 + d, h, depth + 1)]]
                    return {k: np.block([[parts[0][0][k], parts[0][1][k]], [parts[1][0][k], parts[1][1][k]]])
                            for k in names}
                if attempt == retries - 1 or too_big:
                    failed.append(f"lat {lat0:.2f} lon {lon0:.2f} ({size}px): {msg[:80]}")
                    return {k: np.full((size, size), np.nan, dtype="float32") for k in names}
                time.sleep(backoff(msg, attempt))   # troppe richieste o errore transitorio: si riprova

    # cache: ogni quadrato finito si salva subito, così un'interruzione (rete, processo) non fa perdere il lavoro
    cache = out_dir / "_tiles" / f"{'+'.join(names)}_{tile_deg}"
    cache.mkdir(parents=True, exist_ok=True)

    def one(r, lat0, c, lon0):
        f = cache / f"{r}_{c}.npz"
        if f.exists():
            with np.load(f) as z:
                return r, c, {k: z[k] for k in names}
        arr = block(lat0, lon0, n)
        if not any(s.startswith(f"lat {lat0:.2f} lon {lon0:.2f}") for s in failed):
            np.savez_compressed(f, **arr)
        return r, c, arr

    t0 = time.time()
    label = "+".join(names)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(one, *t) for t in tiles]
        for k, fut in enumerate(as_completed(futures), 1):
            r, c, arr = fut.result()
            for name in names:
                outs[name][r * n:(r + 1) * n, c * n:(c + 1) * n] = arr[name]
            print(f"   {label}: {k}/{len(tiles)} quadrati da {tile_deg}° ({time.time() - t0:.0f} s)",
                  end="\r", flush=True)
    print(f"   {label}: {len(tiles)} quadrati in {time.time() - t0:.0f} s; falliti: {len(failed)}")
    for f in failed:
        print(f"      vuoto: {f}")
    for name in names:
        with rasterio.open(out_dir / f"{name}.tif", "w", driver="GTiff", height=NROWS, width=NCOLS, count=1,
                           dtype="float32", crs="EPSG:4326", transform=from_origin(-180, 90, RES, RES),
                           nodata=np.nan, compress="deflate") as dst:
            dst.write(outs[name], 1)
    return outs


def read(path) -> np.ndarray:
    with rasterio.open(path) as src:
        return src.read(1)


def pixel_centers() -> tuple[np.ndarray, np.ndarray]:
    """Latitudine e longitudine del centro di ogni pixel della griglia a 0,05° (array 2D)."""
    lats = 90 - RES * (np.arange(NROWS) + 0.5)
    lons = -180 + RES * (np.arange(NCOLS) + 0.5)
    return np.meshgrid(lats, lons, indexing="ij")

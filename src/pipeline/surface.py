"""Passo 5: i parametri che non sono terreno, su griglia a 0,05° (docs/backend_spec.md §6).

Gruppi (ognuno è una serie di richieste a Earth Engine, tutte le bande insieme):
- termico:  albedo (MCD43A3), grana (inerzia termica apparente da MOD11A2 + albedo), temperature
- suolo:    sassi e densità a 3 profondità (SoilGrids, fonte esterna dichiarata)
- neve:     quota di neve per mese (MOD10A2, compositi di 8 giorni) → mesi senza neve, luce radente "vera"
- dossier:  luci notturne (VIIRS) sulla griglia; aree protette (WDPA) e vento (MERRA-2) solo per i siti finali

Tutti i valori sono calcolati solo sui pixel validi (maschera di gee_common).
"""
import ee

from . import config, gee_common as g

KELVIN = 273.15
TILE_DEG = {"thermal": 10, "soil": 15, "snow": 10, "dossier": 15}   # gruppi pesanti → quadrati più piccoli


def every_16_days() -> list[str]:
    """Indici 'YYYY_MM_DD' delle immagini MODIS giornaliere da usare, una ogni 16 giorni nel periodo."""
    import datetime as dt
    d, end, out = dt.date.fromisoformat(config.YEARS[0]), dt.date.fromisoformat(config.YEARS[1]), []
    while d < end:
        out.append(d.strftime("%Y_%m_%d"))
        d += dt.timedelta(days=16)
    return out


def thermal(m: ee.Image) -> dict:
    lst = ee.ImageCollection("MODIS/061/MOD11A2").filterDate(*config.YEARS)
    td = lst.select("LST_Day_1km").median().multiply(0.02)          # temperatura di giorno (K)
    tn = lst.select("LST_Night_1km").median().multiply(0.02)        # temperatura di notte (K)
    # albedo: un'immagine ogni 16 giorni (~70 in 3 anni) basta per la mediana; tutte e 1.100 sforavano la memoria
    alb = (ee.ImageCollection("MODIS/061/MCD43A3").filter(ee.Filter.inList("system:index", every_16_days()))
           .select("Albedo_WSA_shortwave").median().multiply(1e-3))
    dT = td.subtract(tn)
    ati = ee.Image(1).subtract(alb).divide(dT).updateMask(dT.gt(1))  # inerzia termica apparente
    mean = ee.Reducer.mean()
    return {
        "albedo": g.to_grid(alb.updateMask(m), mean, 1000),
        "grain_proxy": g.to_grid(ati.updateMask(m), mean, 1000),
        "t_min_c": g.to_grid(lst.select("LST_Night_1km").min().multiply(0.02).subtract(KELVIN).updateMask(m), mean, 1000),
        "t_max_c": g.to_grid(lst.select("LST_Day_1km").max().multiply(0.02).subtract(KELVIN).updateMask(m), mean, 1000),
    }


def soil(m: ee.Image) -> dict:
    sg = lambda p: ee.Image(f"projects/soilgrids-isric/{p}_mean")
    mean = ee.Reducer.mean()
    out = {"rock_cover": g.to_grid(sg("cfvo").select("cfvo_0-5cm_mean").divide(1000).updateMask(m), mean, 1000)}
    for z, name in (("0-5cm", "bulk_0_5"), ("30-60cm", "bulk_30_60"), ("100-200cm", "bulk_100_200")):
        out[name] = g.to_grid(sg("bdod").select(f"bdod_{z}_mean").divide(100).updateMask(m), mean, 1000)
    return out


def snow(m: ee.Image) -> dict:
    """Quota di neve per mese (0-100): frazione dei compositi di 8 giorni MOD10A2 con neve (valore 200)."""
    col = (ee.ImageCollection("MODIS/061/MOD10A2").filterDate(*config.YEARS).select("Maximum_Snow_Extent")
           .map(lambda i: i.eq(200).multiply(100).copyProperties(i, ["system:time_start"])))
    return {f"snow_m{i:02d}": g.to_grid(col.filter(ee.Filter.calendarRange(i, i, "month")).mean().updateMask(m),
                                        ee.Reducer.mean(), 1000) for i in range(1, 13)}


def dossier(m: ee.Image) -> dict:
    """Sulla griglia globale solo le luci notturne (leggere). Aree protette e vento servono solo nella card:
    si calcolano per i siti finali con site_dossier() (dipingere tutti i poligoni WDPA e mediare un anno di
    vento orario su tutto il mondo non finiva neanche un quadrato in 10 minuti: verificato il 14/11)."""
    lights = (ee.ImageCollection("NOAA/VIIRS/DNB/ANNUAL_V21").filterDate("2021-01-01", "2023-01-01")
              .select("average").median())
    return {"night_lights": g.to_grid(lights.updateMask(m), ee.Reducer.mean(), 1000)}


def site_dossier(points: list[tuple[str, float, float]]) -> dict:
    """Per pochi punti (id, lat, lon): area protetta WDPA (nome e tipo) e vento medio a 10 m (MERRA-2, 2023)."""
    wdpa = ee.FeatureCollection("WCMC/WDPA/current/polygons")
    merra = ee.ImageCollection("NASA/GSFC/MERRA/slv/2").filterDate("2023-01-01", "2024-01-01")
    hours = merra.filter(ee.Filter.calendarRange(0, 0, "hour"))       # un'ora al giorno basta per la media
    wind = hours.map(lambda i: i.select("U10M").hypot(i.select("V10M"))).mean().rename("wind_10m")
    fc = ee.FeatureCollection([ee.Feature(ee.Geometry.Point([lon, lat]), {"id": i}) for i, lat, lon in points])
    fc = wind.reduceRegions(fc, ee.Reducer.first().setOutputs(["wind_10m"]), scale=50_000)

    def add_wdpa(f):                       # tutto in un'unica richiesta: in restricted mode le chiamate costano
        hit = wdpa.filterBounds(f.geometry())
        first = ee.Feature(hit.first())
        has = hit.size().gt(0)
        return f.set({"pa": has, "pa_name": ee.Algorithms.If(has, first.get("NAME"), None),
                      "pa_desig": ee.Algorithms.If(has, first.get("DESIG_ENG"), None)})

    out = {}
    for f in fc.map(add_wdpa).getInfo()["features"]:
        p = f["properties"]
        out[p["id"]] = {"protected_area": bool(p.get("pa")),
                        "protected_area_name": f"{p['pa_name']} ({p.get('pa_desig')})" if p.get("pa_name") else None,
                        "wind_10m": round(p["wind_10m"], 1) if p.get("wind_10m") is not None else None}
    return out


GROUPS = {"thermal": thermal, "soil": soil, "snow": snow, "dossier": dossier}


def main(groups: list[str] | None = None, tile_deg: int | None = None) -> int:
    config.ensure_dirs()
    g.init()
    m = g.valid_mask()
    need = g.read(config.INTERIM.parent / "gee" / "valid_share.tif")
    boxes = g.TEST_BOXES if config.TEST_MODE else None
    for name in groups or list(GROUPS):
        todo = {k: v for k, v in GROUPS[name](m).items() if not (config.GEE_DIR / f"{k}.tif").exists()}
        if not todo:
            print(f"   {name}: già scaricato")
            continue
        print(f"   {name}: {', '.join(todo)}")
        g.fetch_many(todo, native_m=1000, need=need, tile_deg=tile_deg or TILE_DEG[name], boxes=boxes,
                     out_dir=config.GEE_DIR)
    return 0

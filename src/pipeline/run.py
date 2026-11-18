"""Punto di ingresso della pipeline.

Dalla radice della repo:
    source src/pipeline/.venv/bin/activate
    python -m src.pipeline.run --step check

Ogni passo diventa uno --step: `check` (passo 0), `grid` (passo 2), ... `export` (passi 7-8).
"""
import argparse
import importlib
import os
import sys

from . import config


def check() -> int:
    """Passo 0: librerie, file di config del team, accesso a Earth Engine."""
    ok = True

    print("1) Librerie")
    for mod in ("ee", "numpy", "pandas", "pyarrow", "rasterio", "h3", "pvlib", "yaml", "scipy",
                "shapely"):
        try:
            m = importlib.import_module(mod)
            print(f"   ok  {mod} {getattr(m, '__version__', '')}")
        except ImportError as e:
            ok = False
            print(f"   NO  {mod}: {e}")

    print("2) File di config del team")
    tests = config.load_tests()
    for tid, t in tests.items():
        w = config.weights(t)
        print(f"   ok  {tid:<18} stato={t.get('stato'):<12} pesi={sum(w.values()):.2f}")
    print(f"   ok  params.csv: {len(config.load_params())} parametri")
    print(f"   ok  siti della demo: {', '.join(config.slug(s) for s in config.SITES)}")

    print("3) Cartelle")
    config.ensure_dirs()
    print(f"   ok  {config.RAW.relative_to(config.ROOT)}/ (fuori da git), {config.EXPORT.relative_to(config.ROOT)}/")

    print("4) Google Earth Engine")
    project = config.env("GEE_PROJECT")
    if not project:
        print("   --  manca GEE_PROJECT nel file .env (vedi src/pipeline/.env.example)")
        return 1
    try:
        import ee
        ee.Initialize(project=project)
        bands = ee.Image("NASA/NASADEM_HGT/001").bandNames().getInfo()
        print(f"   ok  progetto {project}; NASADEM: {bands}")
    except Exception as e:  # autenticazione mancante, progetto non registrato, rete
        print(f"   NO  {type(e).__name__}: {e}")
        print("       → lancia `earthengine authenticate` e registra il progetto per uso non commerciale")
        return 1

    return 0 if ok else 1


def grid(args) -> int:
    """Passo 2: esagoni H3 di terra, con la quota di area valida."""
    from . import grid as grid_step
    return grid_step.main(skip_download=args.skip_download)


def sun(args) -> int:
    """Passo 3 (luce): tabella latitudine × mese della luce radente."""
    from . import sun as sun_step
    return sun_step.main()


def terrain(args) -> int:
    """Passo 3 (terreno): pendenze, rugosità, quota. --scale 500 (screening globale), 90 o 30."""
    from . import terrain as terrain_step
    return terrain_step.main(scale_m=args.scale)


def features(args) -> int:
    """Passo 4: dai raster alla carta d'identità di ogni esagono."""
    from . import features as features_step
    return features_step.main()


def surface(args) -> int:
    """Passo 5: albedo, grana, temperature, suolo, neve, dossier (gruppi: thermal soil snow dossier)."""
    from . import surface as surface_step
    return surface_step.main(groups=args.groups)


def fine(args) -> int:
    """Fase a 30 m sugli esagoni: --scope sample (noti + campione + candidati) o all (tutti i validi)."""
    from . import fine as fine_step
    return fine_step.main(scope=args.scope, limit=args.limit, n_sample=args.n_sample, workers=args.workers)


def calibrate(args) -> int:
    """Relazione 500 m → 30 m stimata sul campione, con l'errore dichiarato (calibrate.py)."""
    from . import calibrate as calibrate_step
    return calibrate_step.main()


def earth(args) -> int:
    """Tutta la mappatura della Terra in fila: terreno 500 m → superficie → campione a 30 m → calibrazione
    → carta d'identità. I passi già fatti si saltano (cache), quindi rilanciarlo costa poco."""
    from . import terrain as terrain_step, surface as surface_step, fine as fine_step
    from . import features as features_step, calibrate as calibrate_step
    for name, fn in (("terreno a 500 m", lambda: terrain_step.main(scale_m=500)),
                     ("superficie", lambda: surface_step.main()),
                     ("30 m su siti noti e campione", lambda: fine_step.main(scope="sample")),
                     ("carta d'identità", features_step.main),
                     ("calibrazione 500 m → 30 m", calibrate_step.main),
                     ("carta d'identità con le stime a 30 m", features_step.main)):
        print(f"=== {name}", flush=True)
        fn()
    return 0


def lola(args) -> int:
    """Passo 6: scarica dal PDS il DEM LOLA a 20 m delle 3 regioni lunari della demo."""
    from . import lola_fetch
    return lola_fetch.main()


def regions(args) -> int:
    """Passo 6a: contorni USGS delle regioni Artemis III (griglie LGRS 1 km) → artemis_regions.json."""
    from . import artemis_regions
    return artemis_regions.main()


def ice(args) -> int:
    """Passo 6b: quota di area con ghiaccio accessibile per ISRU (Diviner PRP, raggio LTV 10 km) nelle regioni polari."""
    from . import ice_access
    return ice_access.main()


def lunar(args) -> int:
    """Passo 6: pendenza, rugosità e crateri delle regioni lunari, con le definizioni della Terra."""
    from . import lunar as lunar_step
    return lunar_step.main()


def export(args) -> int:
    """Passi 7-8: tutti i siti × test → file per l'app (prova in data/raw/export_preview/, --publish in data/export/)."""
    from . import export as export_step
    return export_step.main(publish=args.publish, do_refine=not args.no_refine, do_dossier=not args.no_dossier)


STEPS = {"check": lambda a: check(), "grid": grid, "sun": sun,
         "terrain": terrain, "surface": surface, "fine": fine, "calibrate": calibrate, "earth": earth,
         "features": features, "regions": regions, "lola": lola, "lunar": lunar, "ice": ice, "export": export}


def main() -> int:
    parser = argparse.ArgumentParser(description="Pipeline FVG Station")
    parser.add_argument("--step", required=True, choices=sorted(STEPS))
    parser.add_argument("--sample", action="store_true",
                        help="modalità test: solo le zone campione, in cartelle separate (non tocca i dati globali)")
    parser.add_argument("--scale", type=int, default=500, choices=(30, 90, 500),
                        help="terrain: risoluzione del DEM (500 = screening globale, 30 = baseline comune con LOLA)")
    parser.add_argument("--groups", nargs="*", help="surface: quali gruppi (default: tutti)")
    parser.add_argument("--scope", default="sample", choices=("sample", "candidates", "all"), help="fine: quali esagoni a 30 m")
    parser.add_argument("--limit", type=int, help="fine: al massimo N esagoni (per provare)")
    parser.add_argument("--n-sample", type=int, default=3000, help="fine: esagoni del campione casuale")
    parser.add_argument("--workers", type=int, help="fine: richieste in parallelo (4 in restricted mode, 12 con la quota)")
    parser.add_argument("--publish", action="store_true", help="export: scrive in data/export/ (lo legge l'app)")
    parser.add_argument("--no-refine", action="store_true", help="export: niente 30 m esatti sui candidati (solo stime)")
    parser.add_argument("--no-dossier", action="store_true", help="export: niente aree protette e vento (Earth Engine)")
    parser.add_argument("--skip-download", action="store_true",
                        help="usa i raster già scaricati in data/raw/gee/ invece di richiederli a Earth Engine")
    args = parser.parse_args()
    if args.sample:
        config.set_test_mode()
    return STEPS[args.step](args)


if __name__ == "__main__":
    code = main()
    sys.stdout.flush()
    os._exit(code or 0)   # esce anche se una richiesta a Earth Engine è rimasta appesa in un thread

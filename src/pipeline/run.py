"""Punto di ingresso della pipeline.

Dalla radice della repo:
    source src/pipeline/.venv/bin/activate
    python -m src.pipeline.run --step check

Ogni passo di docs/backend_spec.md diventa uno --step: `check` (passo 0), `mock` (passo 1).
"""
import argparse
import importlib
import sys

from . import config


def check() -> int:
    """Passo 0: librerie, file di config del team, accesso a Earth Engine."""
    ok = True

    print("1) Librerie")
    for mod in ("ee", "numpy", "pandas", "pyarrow", "rasterio", "h3", "pvlib", "yaml", "scipy",
                "shapely", "geopandas", "matplotlib"):
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
    print(f"   ok  siti Artemis: {', '.join(config.slug(s) for s in config.ARTEMIS_SITES)}")

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


def mock() -> int:
    """Passo 1: export di prova con il formato definitivo e numeri finti."""
    from . import mock_export
    return mock_export.main()


STEPS = {"check": check, "mock": mock}


def main() -> int:
    parser = argparse.ArgumentParser(description="Pipeline FVG Station")
    parser.add_argument("--step", required=True, choices=sorted(STEPS))
    args = parser.parse_args()
    return STEPS[args.step]()


if __name__ == "__main__":
    sys.exit(main())

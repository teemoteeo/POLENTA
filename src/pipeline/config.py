"""Percorsi, costanti e lettura dei file di config del team.

Tutti gli altri moduli importano da qui: se cambia un percorso o una costante, si cambia solo qui.
"""
import csv
import os
import re
from pathlib import Path

import yaml

# --- Percorsi -------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[2]  # radice della repo
CONFIG = ROOT / "data" / "config"           # file scritti a mano dal team (Rocco)
RAW = ROOT / "data" / "raw"                 # dati scaricati: fuori da git
GEE_DIR = RAW / "gee"                       # raster globali scaricati da Earth Engine
LOLA_DIR = RAW / "lola"                     # finestre dei DEM lunari
INTERIM = RAW / "interim"                   # file intermedi (griglia, feature)
EXPORT = ROOT / "data" / "export"           # file per l'app: versionati, sono il contratto

# --- Costanti -------------------------------------------------------------
GRID_RES_DEG = 0.05   # passo dei raster scaricati da GEE (~5,5 km all'equatore)
H3_RES = 5            # risoluzione delle celle esagonali (~250 km² l'una)
BASELINE_M = 30       # distanza di misura comune Terra/Luna per pendenze, rugosità, crateri
SLOPE_BASELINES_M = (30, 60, 120, 240)    # scale per l'esponente di Hurst
YEARS = ("2021-01-01", "2024-01-01")      # periodo dei compositi MODIS
MAX_CELLS_EXPORT = 10_000   # esagoni nella heat map di ogni sito × test (~2,5 milioni di km²)
# Maschera "suolo nudo o vegetazione rada", applicata al pixel da 1 km.
# NDVI mediano (non il massimo) < 0,2: con "massimo < 0,1" si perdevano metà dei siti di validazione
# (Black Point, SFVF, Meteor Crater, Mojave: 0% di area sotto 0,1 entro 5 km; ~100% sotto 0,2). Verificato il 14/11.
NDVI_THRESHOLD = 0.2
MASK_NATIVE_M = 1000      # risoluzione dell'NDVI MODIS: la maschera si calcola qui

# I siti della demo (data/config/siti_coordinate.csv, Rocco): 4 sulla Luna, 2 su Marte
SITES = ["Malapert Massif", "Haworth", "Nobile Rim 1", "Aristarchus Plateau", "Phoenix", "Gale"]

# I 9 siti candidati di Artemis III: li usa solo l'export di prova (mock_export.py)
ARTEMIS_SITES = [
    "Peak near Cabeus B", "Haworth", "Malapert Massif", "Mons Mouton Plateau", "Mons Mouton",
    "Nobile Rim 1", "Nobile Rim 2", "de Gerlache Rim 2", "Slater Plain",
]


def slug(name: str) -> str:
    """'Malapert Massif' -> 'malapert_massif': l'identificativo usato nei nomi dei file."""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


# --- File di config del team ----------------------------------------------
def load_tests_file() -> dict:
    """tests.yaml completo: regole comuni (tau, eps, break_below) + catalogo dei test."""
    with open(CONFIG / "tests.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_tests() -> dict:
    """Solo il catalogo: {id_test: {requisiti, filtri, indoor, validazione, stato, ...}}."""
    return load_tests_file()["tests"]


def load_params() -> list[dict]:
    """params.csv come lista di righe: nome, dimensione, unità, ruolo, fonte Luna e Terra."""
    with open(CONFIG / "params.csv", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def weights(test: dict) -> dict:
    """Pesi del test (solo quelli > 0); nei requisiti un peso può essere un numero o {peso: ..., target: ...}.
    I pesi zero restano scritti in tests.yaml per completezza (matrice parametri × test) ma non contano."""
    w = {p: (v["peso"] if isinstance(v, dict) else v) for p, v in test["requisiti"].items()}
    return {p: v for p, v in w.items() if v > 0}


# --- Variabili d'ambiente -------------------------------------------------
def env(key: str) -> str | None:
    """Prima l'ambiente, poi il file .env nella radice della repo (ignorato da git)."""
    if os.environ.get(key):
        return os.environ[key]
    dotenv = ROOT / ".env"
    if dotenv.exists():
        for line in dotenv.read_text(encoding="utf-8").splitlines():
            k, sep, v = line.partition("=")
            if sep and k.strip() == key:
                return v.strip().strip('"').strip("'")
    return None


TEST_MODE = False
FEATURES = INTERIM / "features.parquet"


def set_test_mode() -> None:
    """Modalità test: solo le zone campione (gee_common.TEST_BOXES), in cartelle separate.

    Non tocca i raster globali né l'export che legge l'app. I percentili in test sono calcolati
    solo sulle zone campione: servono a verificare la catena, non a dare numeri veri.
    """
    global TEST_MODE, GEE_DIR, FEATURES, EXPORT
    TEST_MODE = True
    GEE_DIR = RAW / "gee_test"
    FEATURES = INTERIM / "features_test.parquet"
    EXPORT = RAW / "export_test"


def ensure_dirs() -> None:
    for d in (GEE_DIR, LOLA_DIR, INTERIM, EXPORT / "sites"):
        d.mkdir(parents=True, exist_ok=True)

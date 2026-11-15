# Allineamento dom 00:20: siti, test, parametri

Autore: Edo · 2026-11-15 00:20 (prima versione sab 23:30) · per Rocco e Timo. Le decisioni stanno in `decisioni.md`; i dettagli tecnici e i motivi in `backend_spec.md` sez. E.

## 1. Perimetro della demo

- **6 siti** (Aristarchus aggiunto da Rocco dom 02:10, coordinate in `data/config/siti_coordinate.csv`):
  - Luna: Malapert Massif, Haworth, Nobile Rim 1, Aristarchus Plateau (25°N, 51,5°W);
  - Marte: Phoenix (68,2°N), Gale (4,6°S).
  - Slug: `malapert_massif`, `haworth`, `nobile_rim_1`, `aristarchus_plateau`, `phoenix`, `gale`.
- **3 test**, scelti sul testo della challenge ("landing, mobility", "water, ice, permafrost and other potential resources", "geology… surface materials"):

| Test | Cosa simula | Aziende |
|---|---|---|
| `flight_hda_lidar` | atterraggio: il lidar del lander riconosce crateri, massi e pendenze in discesa | TAS-I (Argonaut), Evolunar, PoliTo PIC4SeR |
| `rover_mobility` | rover su pendii, rocce e regolite | TAS-I, ALTEC, AIKO, PoliTo |
| `isru_resources` | risorse in situ per una base permanente: ghiaccio nel suolo e regolite da lavorare (scavo, sinterizzazione, ossigeno) | ALTEC (centro lunare), TAS-I (habitat MPH) |

- **Fuori:** camera, EVA, contatto col suolo, trivella, Jezero, gli altri 6 siti Artemis.

## 2. Parametri nel voto (matrice di Rocco, dom 00:45)

| Parametro | Definizione | Luna | Marte | Pesi lidar / rover / ISRU |
|---|---|---|---|---|
| `slope_p90` | pendenza al 90° percentile, DEM a 30 m | **calcolata da noi su LOLA** (stessa definizione della Terra) | DTM CTX / HiRISE (letteratura) | 0,20 / 0,35 / 0,10 |
| `roughness` | scarto della quota dalla media su 150 m | **calcolata da noi su LOLA** | CTX / HiRISE | 0,15 / 0,15 / — |
| `crater_density` | conche entro 300 m, ≥ 20 m sotto il bordo, per km² | **calcolata da noi su LOLA** (0,07-0,14/km²) | CTX / HiRISE | 0,30 / 0,05 / — |
| `rock_cover` | quota di sassi e massi | Diviner | TES / HiRISE | 0,25 / 0,15 / 0,05 |
| `grain_proxy` | inerzia termica (confronto per finezza/percentile) | Diviner | THEMIS / TES | — / 0,15 / 0,15 |
| `albedo` | riflettanza a banda larga | LOLA / Diviner | TES | 0,05 / — / — |
| `low_sun_frac` | quota di luce con il Sole a 0-7° | 1,0 | da latitudine | — / 0,10 / — |
| `bulk_density_0_5` | densità dei primi 5 cm (g/cm³) | Apollo 1,5 | Phoenix, Curiosity | — / — / 0,20 |
| `rock_class` | tipo di roccia (fonte terrestre da decidere: fuori dal voto finché manca) | anortosite | basalto, sedimentario | 0,05 / 0,05 / 0,15 |
| `subsurface_ice` → `permafrost_share` | ghiaccio nel sottosuolo (% in peso) → sulla Terra permafrost probabile (MODIS) | **scenario B**: 5,6% nelle zone in ombra vicine (LCROSS) | Phoenix 55%, Gale 2,25% | — / — / 0,35 |

Valori, pesi e reference: `data/config/siti_e_pesi.csv` (Rocco). Un test nuovo è una colonna, un parametro nuovo una riga; peso 0 = non conta per quel test.

- **Luna, terreno:** pendenza, rugosità e crateri li calcoliamo noi su LOLA a 30 m con le definizioni della Terra (`lunar.py`). I valori di Wueller et al. 2025 (DOI 10.1029/2025JE009127) restano nella card come letteratura: sono medie sulle sole aree percorribili (< 15°), con la rugosità di Smith 2017.
- **Unità convertite** (`targets.py`): massi da % a frazione; inerzia termica SI → stessa "finezza" sulla Terra; ghiaccio % in peso → permafrost (sotto 1% secco, da 5% suolo cementato).

## 3. Fuori dal voto (card e "dove si rompe")

- Temperature: minima, massima e media annua.
- Carbonio organico (SoilGrids): sulla Luna e su Marte è zero, ma SoilGrids è inaffidabile nell'alto Artico (Devon Island 110 g/kg, che è un deserto polare).
- Profilo di densità 0-2 m, quota, vento per i siti finali.
- Luci notturne come proxy dell'isolamento; mesi senza neve; Hurst; aree protette.
- Gap indoor: gravità 1/6, vuoto, polvere elettrostatica, getto del motore nel vuoto, freddo delle zone in ombra (ISRU), agglutinati (ISRU).

## 4. File condivisi (`data/config/`)

- **`tests.yaml` v2:** i 3 test; filtro `ndvi < 0.2`; `death_valley` al posto di `ksc_alhat_field`.
- **`params.csv`:** nuovi parametri `permafrost_share`, `sand_pct`, `clay_pct`, `soc_gkg`, `lst_mean_c` (oltre a `bulk_density_0_5`, `hurst`, `low_sun_hours`, `valid_share`).

## 5. Da fare

- **Rocco:** confermare i pesi ISRU, scegliere la fonte di `rock_class`.
- **Edo + Rocco:** valori dei 5 siti per i parametri della §2.
- **Timo:**
  - l'export vero ha lo stesso formato del mock: `data/export/sites/<sito>__<test>.json`, 18 file;
  - nel `dossier` ci sono campi in più: `terrain_src` (`30m` esatto o `est`), `snow_free_months`, `night_lights`, `wind_10m`, `protected_area_name`;
  - nei tuoi documenti vanno aggiornati 9 siti → 5 e 3 test (`requirements-tecnici.md`, `mercato.md`).

## 6. Campagna consigliata (dom 02:20): campi nuovi nell'export, per Timo

In ogni risultato di `data/export/sites/<sito>__<test>.json` c'è `campaign`:
- `outdoor`: il sito all'aperto (nome, lat, lon);
- `facilities`: le poche strutture indoor che coprono i gap. Per ognuna: `name`, `place`, `lat`, `lon`, `km_client` (distanza da Torino), `covers` e `covers_labels` (cosa copre, in italiano), `source`;
- `uncovered`: i gap che nessuna struttura nota copre (es. agglutinati della regolite);
- `simulants`: i simulanti adatti (nome, produttore, terreno, prezzo se noto, link);
- `rock_source_near_client` e `rock_source_near_site`: la fonte di roccia naturale più vicina a Torino e al sito, con km, uso e fonte; `rock_note` spiega il limite (grani arrotondati contro grani taglienti).

Ogni voce di `breaks` ha anche `label`, in italiano.

File nuovi accanto ai siti: `facilities.json` (con coordinate, per i pin sulla mappa), `simulants.json`, `rock_sources.json`, `labels.json` (nome in italiano, dimensione della challenge e unità di ogni parametro e gap). Nel `dossier` c'è anche `valid_share`, la quota di suolo nudo dell'esagono.

**LLM explainer:** passargli il risultato con la sua `campaign` e chiedere di usare solo le strutture, i simulanti e le fonti lì presenti. Le spiegazioni conviene generarle in anticipo e salvarle nel JSON: l'app è statica e una chiave API nel browser sarebbe pubblica.

# Allineamento dom 00:20: siti, test, parametri

Autore: Edo · 2026-11-15 00:20 (prima versione sab 23:30) · per Rocco e Timo. Le decisioni stanno in `decisioni.md`; i dettagli tecnici e i motivi in `backend_spec.md` sez. E.

## 1. Perimetro della demo

- **5 siti:**
  - Luna: Malapert Massif, Haworth, Nobile Rim 1;
  - Marte: Phoenix (68,2°N), Gale (4,6°S).
  - Slug: `malapert_massif`, `haworth`, `nobile_rim_1`, `phoenix`, `gale`.
- **3 test**, scelti sul testo della challenge ("landing, mobility", "water, ice, permafrost and other potential resources", "geology… surface materials"):

| Test | Cosa simula | Aziende |
|---|---|---|
| `flight_hda_lidar` | atterraggio: il lidar del lander riconosce crateri, massi e pendenze in discesa | TAS-I (Argonaut), Evolunar, PoliTo PIC4SeR |
| `rover_mobility` | rover su pendii, rocce e regolite | TAS-I, ALTEC, AIKO, PoliTo |
| `isru_resources` | risorse in situ per una base permanente: ghiaccio nel suolo e regolite da lavorare (scavo, sinterizzazione, ossigeno) | ALTEC (centro lunare), TAS-I (habitat MPH) |

- **Fuori:** camera, EVA, contatto col suolo, trivella, Jezero, gli altri 6 siti Artemis.

## 2. Parametri nel voto

Per ogni sito servono il valore (o un intervallo min-max) e la fonte, **calcolati con la stessa definizione** usata sulla Terra. Il formato è quello di `targets.json`.

| Parametro | Definizione | Luna | Marte | Lidar / Rover / ISRU |
|---|---|---|---|---|
| `slope_p90` | pendenza al 90° percentile, DEM a 30 m | LOLA | DTM CTX o HiRISE (non MOLA) | 0,20 / 0,35 / 0,10 |
| `roughness` | scarto quadratico della quota dalla media su 150 m | LOLA | CTX / HiRISE | 0,15 / 0,15 / — |
| `crater_density` | conche entro 300 m, ≥ 20 m sotto il bordo, per km² | LOLA | CTX / HiRISE | 0,30 / 0,05 / — |
| `rock_cover` | quota di sassi e massi | Diviner | TES / THEMIS | 0,25 / 0,15 / — |
| `grain_proxy` | inerzia termica: suolo fine e sciolto contro compatto | Diviner | THEMIS | — / 0,15 / 0,15 |
| `albedo` | quanto riflette la superficie (segnale di ritorno del lidar) | LROC / LOLA | TES | 0,05 / — / — |
| `low_sun_frac` | quota di luce con il Sole a 0-7° | ~1,0 | da latitudine | — / 0,10 / — |
| `permafrost_share` | quota di area con temperatura media annua MODIS < −1 °C (proxy del ghiaccio nel suolo) | ghiaccio nelle zone in ombra vicine (LEND, Diviner) | Phoenix sì (~5 cm), Gale no | — / — / 0,30 |
| `sand_pct` | sabbia nei primi 5 cm (SoilGrids) | ~50% (regolite: sabbia fine e limo) | Phoenix, Curiosity | — / — / 0,20 |
| `clay_pct` | argilla nei primi 5 cm (SoilGrids) | pochi % | argille a Gale | — / — / 0,15 |
| `bulk_density_0_5` | densità dei primi cm (g/cm³) | Apollo ~1,5 | Phoenix, Curiosity | — / — / 0,10 |
| `rock_class` | tipo di roccia | anortosite | basalto, sedimentario | 0,05 / 0,05 / — |

- **Grana:** l'inerzia termica di Luna e Marte è in unità diverse dalla nostra terrestre. Si confronta per percentile, cioè dove sta il sito tra i valori del suo pianeta.
- **Ghiaccio a Gale:** non c'è, quindi il parametro non entra nel voto per Gale. κ lo dichiara.
- **`rock_class`:** la fonte terrestre non c'è ancora. SoilGrids dà le proprietà del suolo, non il tipo di roccia. Opzione: indice mafico ASTER GED (NASA, su Earth Engine).
- **Pesi di `isru_resources`:** proposti da Edo, **da confermare con Rocco**.

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
  - l'export vero ha lo stesso formato del mock: `data/export/sites/<sito>__<test>.json`, 15 file;
  - nel `dossier` ci sono campi in più: `terrain_src` (`30m` esatto o `est`), `snow_free_months`, `night_lights`, `wind_10m`, `protected_area_name`;
  - nei tuoi documenti vanno aggiornati 9 siti → 5 e 3 test (`requirements-tecnici.md`, `mercato.md`).

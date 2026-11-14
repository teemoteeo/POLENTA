# Allineamento sab 23:30: siti, test, parametri

Autore: Edo · 2026-11-14 23:30 · per Rocco (che lo riporta in `decisioni.md`) e Timo. I dettagli tecnici e i motivi sono in `backend_spec.md` sez. E.

## 1. Perimetro della demo

- **5 siti:**
  - Luna: Malapert Massif, Haworth, Nobile Rim 1;
  - Marte: Phoenix (68,2°N), Gale (4,6°S).
  - Gli stessi dell'app di Timo. Slug: `malapert_massif`, `haworth`, `nobile_rim_1`, `phoenix`, `gale`.
- **5 test, tutti nella demo** (in `tests.yaml` v1 sono tutti `stato: mvp`):

| Test | Cosa simula |
|---|---|
| `rover_mobility` | rover su pendii, rocce e regolite |
| `flight_hda_lidar` | il lidar del lander riconosce i pericoli in discesa (solo geometria e albedo: il sensore non vede la portanza) |
| `flight_trn_camera` | camera di navigazione sul terreno con Sole radente |
| `eva_traverse` | traversata a piedi degli astronauti |
| `landing_touchdown` | **nuovo:** gambe del lander, portanza del suolo, erosione del getto del motore sulla regolite |

- **Fuori:** ISRU, trivella, Jezero, gli altri 6 siti Artemis. Niente "coming soon".

## 2. Parametri nel voto

Per ogni sito servono il valore (o un intervallo min-max) e la fonte, **calcolati con la stessa definizione** usata sulla Terra. Il formato è quello di `targets.json`.

| Parametro | Definizione (uguale su Terra, Luna, Marte) | Luna | Marte | Pesi R / L / C / E / T |
|---|---|---|---|---|
| `slope_p90` | pendenza al 90° percentile, DEM a 30 m | LOLA | DTM CTX o HiRISE (non MOLA) | 0,35 / 0,20 / 0,10 / 0,30 / 0,30 |
| `roughness` | scarto quadratico della quota dalla media su 150 m | LOLA | CTX / HiRISE | 0,15 / 0,15 / 0,15 / 0,15 / 0,10 |
| `crater_density` | conche entro 300 m, ≥ 20 m sotto il bordo, per km² (un gruppo di pixel = 1) | LOLA | CTX / HiRISE | 0,05 / 0,30 / 0,20 / — / — |
| `rock_cover` | quota di sassi e massi | Diviner (abbondanza di rocce) | TES / THEMIS | 0,15 / 0,25 / — / 0,10 / 0,15 |
| `grain_proxy` | inerzia termica: suolo fine e sciolto contro compatto | Diviner | THEMIS | 0,15 / — / — / 0,10 / 0,20 |
| `albedo` | quanto riflette la superficie | LROC / LOLA | TES | — / 0,05 / 0,20 / — / — |
| `low_sun_frac` | quota di luce con il Sole a 0-7° | ~1,0 | da latitudine | 0,10 / — / 0,30 / 0,20 / — |
| `bulk_density_0_5` | densità dei primi cm (g/cm³) | Apollo ~1,5 | Phoenix, Curiosity | — / — / — / — / 0,25 |
| `rock_class` | tipo di roccia | anortosite | basalto, sedimentario | 0,05 / 0,05 / 0,05 / 0,15 / — |

R = rover, L = lidar, C = camera, E = EVA, T = touchdown.

- **Grana:** l'inerzia termica di Luna e Marte è in unità diverse dalla nostra terrestre. Si confronta per percentile, cioè dove sta il sito tra i valori del suo pianeta.
- **`rock_class`:** la fonte terrestre non c'è ancora. Proposta: classi a regole da vulcani (GVP) e crateri da impatto (Earth Impact Database). Finché manca, il voto usa gli altri parametri e κ lo dichiara.
- **Pesi di `landing_touchdown`:** proposti da Edo, **da confermare con Rocco**.

## 3. Fuori dal voto (card e "dove si rompe")

Questi valori, sulla Luna e su Marte, sono uguali per tutti i siti terrestri (vuoto, −230 °C) oppure non confrontabili (quota). Non cambiano la classifica.
- Temperature `t_min_c` e `t_max_c`.
- Profilo di densità 0-2 m, quota, atmosfera (densità dalla quota; vento MERRA-2 per i siti finali).
- Comunicazioni: `night_lights` come proxy dell'isolamento.
- `snow_free_months`, `hurst`, aree protette.
- Gap indoor: gravità 1/6, vuoto, polvere elettrostatica, getto del motore nel vuoto.

## 4. Cosa ho cambiato nei file condivisi (`data/config/`)

- **`tests.yaml` v1:**
  - 5 test tutti `mvp`; ISRU tolto;
  - filtro `ndvi < 0.2` ovunque (mediana dei mesi senza neve, sul pixel);
  - `ksc_alhat_field` → `death_valley`;
  - `landing_touchdown` nuovo.
- **`params.csv`:**
  - fonti aggiornate a quello che gira davvero;
  - nuovi parametri: `bulk_density_0_5`, `hurst`, `low_sun_hours`, `valid_share`.

## 5. Da fare

**Rocco:** ~~aggiornare `decisioni.md`~~ fatto da Edo con il suo OK (23:30). Restano: confermare i pesi del touchdown e scegliere la fonte di `rock_class`.

**Edo + Rocco:** valori dei 5 siti per i parametri della §2.

**Timo:**
- l'export vero ha **lo stesso formato del mock**: `data/export/sites/<sito>__<test>.json`, 25 file;
- nel `dossier` ci sono campi in più: `terrain_src` (`30m` esatto o `est`), `snow_free_months`, `night_lights`, `wind_10m`, `protected_area_name`;
- nei tuoi documenti vanno aggiornati 9 siti → 5, NDVI 0,1 → 0,2 e l'MVP. Righe: `requirements-tecnici.md` 11, 17, 38, 50 e §3; `mercato.md` 23, 31, 76.

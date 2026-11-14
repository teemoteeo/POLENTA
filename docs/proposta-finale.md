# Proposta finale — dove testare l'hardware lunare sulla Terra

Autore: Edo · 2026-11-14 19:45 · prende il posto di `proposta-rover-volo.md`. È il riferimento per sviluppare il prodotto. Rocco riporta le decisioni in `decisioni.md`, che resta la fonte unica.

Legenda: ✅ = fonte NASA o portale ufficiale della challenge · ➕ = fonte esterna, da dichiarare nella submission · ⚠ = nome, ID o disponibilità da verificare · [NV] = numero non verificato · [A] = stima.

---

## 0. Decisioni prese (sab 19:40)

| Tema | Decisione |
|---|---|
| Prodotto | tool B2B: dato un sito Artemis III e un test, dice dove farlo sulla Terra, quanto è fedele, dove l'analogia si rompe e quale struttura indoor chiude il buco |
| Target | i 9 siti candidati di Artemis III al Polo Sud |
| **Test MVP**, completi e validati entro dom 01:00 | `rover_mobility`, `flight_hda_lidar`, `flight_trn_camera` |
| **Anteprima**, pesi veri ma senza validazione né dossier | `eva_traverse` (tute ed EVA) |
| Coming soon | ISRU/anortosite, trivella |
| **Dati lunari** (set minimo di Rocco) | **LOLA, Diviner, LEND, LROC, GRAIL** incrociati |
| Dati della Terra | dati NASA come base (NASADEM, ASTER GDEM, MODIS, VIIRS, MERRA-2), elaborati su **Google Earth Engine** |
| Fonti esterne ammesse | **SoilGrids**, **GVP + Earth Impact Database**, **Google Earth Engine** (piattaforma) |
| Non ammesse, per ora | Natura 2000 / WDPA, ArcticDEM, Copernicus DEM per lo zoom (vedi §17: senza aree protette il pilastro "permessi" si indebolisce) |
| Parametri e pesi | `data/config/params.csv` e `data/config/tests.yaml` v0 (Timo); i pesi li corregge Rocco |

## 1. In una frase

**"Dacci il sito Artemis e il test che devi fare: ti diciamo dove farlo sulla Terra, quanto è fedele, cosa non torna e quale struttura indoor chiude il buco."**

Frase per il pitch: *"TAS-I ci ha messo 10 mesi a scegliere dove testare il rover ETNA. Noi rifacciamo quella scelta in un minuto, e per il volo troviamo il campo di crateri che oggi si costruisce a mano."*

## 2. Il problema

- **Rover.** La scelta del sito della campagna ULS (rover ETNA di TAS-I) ha richiesto ~10 mesi, di cui 4-5 di permessi, e ~57 giornate-persona [A]. I criteri sono scritti a mano. Quando il sito è più facile del target, la validazione è falsata: Yutu era stato provato su sabbia più liscia del sito vero.
- **Volo.** Per provare la navigazione di discesa (TRN) e il rilevamento dei pericoli (HDA) si **costruiscono campi di crateri**: Morpheus a KSC, Astrobotic LSPG a Mojave, Huailai, Challakere. Morpheus: ~14 M$ in 4 anni. I campi naturali esistono, ma nessuno li cerca rispetto al sito target.
- **EVA.** La luce del Polo Sud si simula di notte con lampade (JETT3 e JETT5 in Arizona).
- **Copertura.** Le strutture indoor (LUNA, ALTEC, Astrobotic) vendono fedeltà senza misurarla rispetto a un target, e nessuno dice cosa fa la natura e cosa serve fare al chiuso.

Fonti: `test-aziende.md`, `requisiti-test.md`, `mercato.md`.

## 3. La soluzione: flusso e schermate

1. **Mappa polare della Luna:** 9 siti Artemis, si sceglie un sito; la card del sito mostra il suo profilo dai 5 strumenti lunari.
2. **Selettore del test:** rover · volo con lidar · volo con camera; EVA (anteprima); ISRU e trivella (coming soon).
3. **Mappa della Terra** (deck.gl su MapLibre):
   - heat map H3 con il punteggio per sito × test;
   - top 10 siti naturali;
   - pin di strutture indoor e siti di test già usati;
   - filtro "Italia/Europa".
4. **Card del sito terrestre:**
   - barre per parametro, Terra contro Luna;
   - **combacia / si rompe** (`s < 0,3`, più i limiti `indoor` del test);
   - **struttura indoor** che chiude ciascun buco;
   - flag **nuovo**;
   - dossier: mesi senza neve, accesso (luci notturne), vento;
   - immagini Terra (Sentinel-2) e Luna (LROC) affiancate;
   - fonti dei dati.
5. **Vista benchmark** (anche slide del pitch): matrice 9 siti × 3 test, con miglior sito naturale e struttura indoor per ogni casella.

Statica, senza backend, link pubblico senza login (`requirements-tecnici.md` §7). Navicella e discesa 3D: solo se il resto è finito entro dom 11:00.

## 4. Perché vince: originalità

Nel campione dei repo di Space Apps 2026 (~47 sugli analoghi, ricerche delle 17:00 e delle 18:30) molti hanno già:
- piattaforme di similarità;
- profili di missione;
- inerzia termica + EMIT;
- "cosa testare qui";
- ore con Sole basso (`earth-analog-explorer`) e "settimane giuste" (`analog_windows`).

**Nessuno ha:**

1. **Copertura natura → strutture indoor.** Ogni buco dell'analogia richiama la struttura che lo chiude: "il terreno te lo dà questo sito; il vuoto e la luce a 1,5–7° no (il letto di ALTEC ha le luci a ~8°): per quelli vai lì".
2. **La scelta reale di TAS-I rifatta.** Validiamo su una decisione industriale vera: Piano delle Concazze e Cisternazza devono uscire in alto.
3. **Il campo di crateri naturale per i voli di test,** al posto di quelli costruiti.
4. **Il dossier di campagna:** stagione, accesso, vento. È più debole senza le aree protette (§17).

## 5. Clienti e giudici

| Chi | Test | Perché gli serve | In sala |
|---|---|---|---|
| TAS-I, rover ETNA (ULS) | rover | scelta del sito a mano in 10 mesi; altre campagne in arrivo | **giuria** |
| TAS-I, lander Argonaut | volo lidar, volo camera | test di discesa da pianificare | **giuria** |
| ALTEC | copertura | il centro lunare indoor è la struttura che chiude il buco; canale verso ispace-EUROPE | partner |
| Evolunar (I3P) | volo | hopper LuNaDrone, navigazione senza GPS | ecosistema I3P |
| PoliTo PIC4SeR, DIANA | volo, rover | drone e sensori del rover ETNA | — |
| AIKO | rover, volo camera | dati in luce radente per l'autonomia | — |
| Argotec | copertura | righe TVAC e vibrazioni in `facilities.csv` | **giuria** |
| ORiS | rover (luce e ombra) | energia ai rover in ombra, studio per TAS | sponsor del 1° premio |
| ESA BIC | tutto | numeri e modello di business | **giuria** |
| NASA JETT, ESA EAC, Axiom/Prada | EVA (anteprima) | siti per tute con luce radente | — |

## 6. Catalogo dei test (`tests.yaml` v0)

Regole comuni: `tau 0.1`, `eps 0.01`, `break_below 0.3`.

| Test | Stato | Pesi | Filtri | Indoor (copertura) | Validazione |
|---|---|---|---|---|---|
| `rover_mobility` | **MVP** | `slope_p90` 0,30 · `roughness` 0,15 · `grain_proxy` 0,15 · `rock_cover` 0,10 · `bulk_density` 0,10 · `low_sun_frac` 0,10 · `crater_density` 0,05 · `rock_class` 0,05 | `ndvi < 0,1`, `slope_p90 ≥ 15` | gravità 1/6, vuoto, polvere elettrostatica | `etna_piano_concazze`, `etna_cisternazza` (+ Teide, SFVF, Meteor Crater) |
| `flight_hda_lidar` | **MVP** | `crater_density` 0,30 · `rock_cover` 0,25 · `slope_p90` 0,20 · `roughness` 0,15 · `albedo` 0,05 · `rock_class` 0,05 | `ndvi < 0,1` | gravità 1/6, getto del motore nel vuoto, vuoto | `cinder_lake`, ~~`ksc_alhat_field`~~ → **proposta: `rogers_lakebed`** (il campo di KSC è costruito e i dati satellitari non lo vedono) |
| `flight_trn_camera` | **MVP** | `low_sun_frac` 0,30 · `albedo` 0,20 · `crater_density` 0,20 · `roughness` 0,15 · `slope_p90` 0,10 · `rock_class` 0,05 | `ndvi < 0,1` | gravità 1/6, vuoto | `death_valley`, `mojave` |
| `eva_traverse` | **anteprima** | `slope_p90` 0,30 · `low_sun_frac` 0,20 · `roughness` 0,15 · `rock_class` 0,15 · `grain_proxy` 0,10 · `rock_cover` 0,10 | `ndvi < 0,1`, `slope_p90 ≤ 25` | gravità 1/6, vuoto, polvere, PSR criogeniche | `sf_volcanic_field`, `black_point_lava_flow` |
| `isru_anorthosite` | coming soon | (in `tests.yaml`, non calcolato) | — | — | — |

**Perché questi pesi** (dettaglio in `requisiti-test.md` e `test-aziende.md`):
- **rover:** 20° è il requisito di TAS-I e NASA; rocce ≥ 0,2-0,3 m; regolite fine.
- **lidar:** rocce da 30 cm e pendenze da 5° (ALHAT); crateri con la distribuzione LRO.
- **camera:** dipende da luce radente e contrasto; le dune lisce rompono la visione.
- **EVA:** pendii fino a 20° entro 2 km, luce radente; oggi si lavora di notte con lampade.

**Dove si rompe, per tutti:** gravità 1/6, vuoto, polvere elettrostatica e tagliente, ombre ferme con cielo nero. Per il volo anche l'aria (aerodinamica, getto del motore e polvere sollevata). Facoltativo (Rocco): la terramecanica, cioè l'affondamento a 1 g contro 1/6 g.

## 7. Dati lunari: il set minimo LOLA + Diviner + LEND + LROC + GRAIL

Servono a riempire `data/config/targets/artemis.csv`, uno per sito, e la card lunare. Colonne di `requirements-tecnici.md` §6: `site,lat,lon,slope_p90,roughness,crater_density,rock_cover,low_sun_frac,albedo,grain_proxy,bulk_density,rock_class,t_min_c,t_max_c,geo_unit,source`. Aggiunte proposte per la card: `h_wt_pct`, `grail_density`.

| Strumento | Prodotto (PDS) | Cosa ricaviamo | Parametro | Note |
|---|---|---|---|---|
| **LOLA** (altimetro laser) | DEM polari ad alta risoluzione ⚠ (5-20 m/px a sud di 80°S); riflettanza a 1064 nm; mappe di illuminazione polare ⚠ | pendenze e rugosità **ricampionate alla baseline della Terra**; albedo; quota; frazione di luce | `slope_p90`, `roughness`, `albedo`, `low_sun_frac`, `elevation_m` | la base del terreno; `low_sun_frac` ≈ 1 al Polo Sud |
| **Diviner** (radiometro) | prodotti polari (temperature massime e medie); abbondanza di rocce ⚠; parametro H della regolite ⚠ | temperature; rocce in superficie; densità e inerzia termica della regolite | `t_min_c`, `t_max_c`, `rock_cover`, `grain_proxy`, `bulk_density` | un altro team non ha trovato l'abbondanza di rocce scaricabile: piano B = rugosità LOLA + conteggi LROC |
| **LROC** (camere NAC e WAC) | immagini NAC (~0,5 m); mosaici WAC; DTM NAC dove esistono ⚠ | conteggi di crateri e massi sui siti demo (o dalla letteratura); immagini della card | `crater_density`, `rock_cover` | i crateri 10-100 m si vedono solo qui |
| **LEND** (neutroni) | mappe dell'idrogeno polare ⚠ | idrogeno, cioè possibile ghiaccio vicino | `h_wt_pct` (card) | serve alla trivella (coming soon) e alla card |
| **GRAIL** (gravità) | modelli di gravità e densità della crosta | densità e porosità della crosta sotto il sito (scala chilometrica) | `grail_density` (card) | **non ha un parametro terrestre corrispondente**: va solo nella card come caratterizzazione del sito (§17) |
| Mappa geologica USGS (➕, già in `data/raw/lunar_geology/`) | `GeoUnits.shp` | unità geologica → classe terrestre (anortosite, breccia da impatto) | `geo_unit`, `rock_class` | |

**Chi e come:**
- **Rocco:** compila `artemis.csv` dalla letteratura e dai prodotti pronti (valori, fonte per ogni cella).
- **Edo:** calcola da LOLA `slope_p90` e `roughness` alla stessa baseline della Terra, almeno per i siti della demo (es. Malapert).
- Obiettivo: 1 sito per le 22:30, tutti e 9 per le 01:00.

## 8. Dati della Terra: Google Earth Engine come motore

**Perché GEE:** i dataset NASA (MODIS, NASADEM, SRTM, MERRA-2, VIIRS) sono già nel catalogo, con SoilGrids e Sentinel. Si calcola in remoto: niente download di terabyte, e niente problema HDF4 per `MCD43A3`.

**Strategia:** su GEE si producono raster globali aggregati a ~1 km, uno per parametro (es. `slope_p90` = percentile 90 delle pendenze a 30 m dentro ogni pixel da 1 km). Si esportano in GeoTIFF in `data/raw/gee/`, fuori da git. In locale si aggregano sulle celle H3 a risoluzione 5. Per lo zoom sui candidati: riduzione a 30 m solo sulle loro aree.

**Requisiti:** account GEE con un progetto Cloud non commerciale; autenticazione con l'API Python (`earthengine-api`).

Gli ID del catalogo sono scritti a memoria: **verificarli tutti prima dell'uso** (⚠).

| Parametro (`params.csv`) | Ruolo | Dataset NASA / fonte | ID su GEE ⚠ | Come si calcola | Test |
|---|---|---|---|---|---|
| maschera delle terre | griglia | MODIS `MOD44W` ✅ | `MODIS/061/MOD44W` | pixel di terra | tutti |
| `slope_p90` | score | `NASADEM_HGT` ✅ (fino a 60°N); ASTER GDEM ✅ (fino a 83°) | `NASA/NASADEM_HGT/001`; ASTER GDEM: catalogo della community ⚠ oppure download da Earthdata | `ee.Terrain.slope`, percentile 90 a 1 km | R H T E |
| `roughness` | score | come sopra | come sopra | deviazione standard della quota dopo detrend a 1 km | R H T E |
| `elevation_m` | card | come sopra | come sopra | media | tutti |
| `crater_density` | score | DEM ✅ + GVP ➕ + Earth Impact Database ➕ | DEM su GEE; GVP e Impact DB come CSV caricati | depressioni chiuse nel DEM (n/km²) + distanza da campi vulcanici e strutture d'impatto | R H T |
| `rock_cover` | score | SoilGrids `cfvo` ➕ + rugosità; Sentinel-1 ✅ sui candidati | `projects/soilgrids-isric/cfvo_mean` ⚠; `COPERNICUS/S1_GRD` | media 0-5 cm; backscatter solo per lo zoom | R H E |
| `low_sun_frac` | score | calcolo + neve MODIS ✅ | `MODIS/061/MOD10A1` (neve giornaliera) | frazione delle ore di luce con Sole < 7° nel mese migliore senza neve (pvlib o astropy, in locale per cella) | R T E |
| `albedo` | score | MODIS `MCD43A3` ✅ | `MODIS/061/MCD43A3` | albedo white-sky a banda larga, mediana annua | H T |
| `grain_proxy` | score | MODIS `MOD11A2` + `MCD43A3` ✅ | `MODIS/061/MOD11A2` | inerzia termica apparente = (1 − albedo)/(T_giorno − T_notte), mediana dei mesi senza neve | R E |
| `bulk_density` | score | SoilGrids `bdod` ➕ | `projects/soilgrids-isric/bdod_mean` ⚠ | media 0-5 cm | R |
| `rock_class` | score | `materials.csv` a mano; ASTER emissività ✅ facoltativa | — | classe da litologia nota; vuoto dove non c'è | R H T E |
| `ndvi` | filtro | MODIS `MOD13A3` ✅ | `MODIS/061/MOD13A3` | massimo annuo (filtro < 0,1) | tutti |
| `t_min_c`, `t_max_c` | card | MODIS `MOD11A2` ✅ | `MODIS/061/MOD11A2` | minimo notturno e massimo diurno annui | tutti |
| `snow_free_months` | dossier | MODIS neve ✅ | `MODIS/061/MOD10A1` | mesi con copertura < 10% | tutti |
| `night_lights` | dossier | VIIRS Black Marble ✅ | `NASA/VIIRS/002/VNP46A2` ⚠ (in alternativa `NOAA/VIIRS/DNB/ANNUAL_V21`) | media annua | tutti |
| `wind_10m` (proposta) | dossier | MERRA-2 ✅ | `NASA/GSFC/MERRA/slv/2` | velocità media a 10 m | H T |
| filtro Italia/Europa | UI | confini nazionali | `USDOS/LSIB_SIMPLE/2017` | paese per cella | tutti |
| immagini della card | card | Sentinel-2 ✅ | `COPERNICUS/S2_SR_HARMONIZED` | composito senza nuvole sui top siti | tutti |

**Il nucleo NASA è indispensabile:** NASADEM, ASTER, MODIS, VIIRS, MERRA-2 lato Terra; LOLA, Diviner, LEND, LROC, GRAIL lato Luna. GEE è solo la piattaforma di calcolo, da dichiarare.

## 9. Il motore di punteggio

1. **Griglia:** H3 a risoluzione 5 (~250 km²) sulle terre emerse, filtrata dalla maschera `MOD44W`.
2. **Parametri per cella:** i raster GEE a 1 km aggregati su H3 (mediana; per `slope_p90` il percentile 90).
3. **Distanza:** `D` = distanza in percentili terrestri dal valore del sito Artemis (o dal range, se `artemis.csv` ne dà uno); out-of-range della Terra → `D` massima e "si rompe".
4. **Punteggio per parametro:** `s = max(eps, exp(−(D/τ)²))`.
5. **Totale:** media geometrica pesata con i pesi del test, dopo i filtri rigidi. Confidenza κ = somma dei pesi dei parametri con dato; se κ < 0,7 la cella non entra in classifica.
6. **Da celle a siti:** top 1% delle celle → unione delle celle vicine sulla griglia H3 → punteggio del sito = mediana → al massimo un sito ogni 100 km.
7. **Flag `new`:** sito a più di 200 km da tutti i `known_sites.csv` dello stesso test.
8. **Copertura:** per ogni parametro con `s < 0,3` e per ogni voce `indoor` del test, si cercano in `facilities.csv` le strutture con quel `covers`.
9. **Zoom sui candidati (dom mattina):** si ricalcolano pendenze e rugosità a 30 m sulle aree dei top siti, e si aggiungono le immagini Sentinel-2.

**Scala:** le pendenze dipendono dalla risoluzione, quindi Terra e Luna vanno confrontate alla stessa baseline. Rocce da 0,3 m e crateri da 10 m non si vedono a 30-90 m: si usano proxy, dichiarati.

## 10. File e contratti

**Config (`data/config/`, scritti a mano):**

| File | Stato | Contenuto | Chi | Entro |
|---|---|---|---|---|
| `params.csv` | v0 | aggiungere `wind_10m` (dossier), `h_wt_pct` e `grail_density` (card) | Timo, Rocco | sab 22:30 |
| `tests.yaml` | v0 | rivedere i pesi; `ksc_alhat_field` → `rogers_lakebed` | Rocco | sab 22:30 |
| `targets/artemis.csv` | da fare | 9 siti (§7) | Rocco + Edo (LOLA) | 1 sito per le 22:30, 9 per le 01:00 |
| `facilities.csv` | da fare | `name,lat,lon,type,simulant,covers,url`: LUNA, ALTEC (MTS e centro lunare), SLOPE, KSC Swamp Works, Ames Lunar Lab, Langley (sfera a vuoto), Marshall (Flat Floor e camera), DLR LAMA, Huailai, Astrobotic LSPG, ESTEC (TVAC e vibrazioni), Argotec (TVAC), NBL, ARGOS, Chamber B, Novespace | Rocco, aiuta Timo | dom 01:00 |
| `known_sites.csv` | da fare | `name,lat,lon,test,campaign,source`: gli id di `tests.yaml` + Teide, Meteor Crater, Rogers Lakebed | Rocco | dom 01:00 |
| `materials.csv` | da fare | `name,lat,lon,rock_class,evidence_url` (per `rock_class`) | Rocco | dom mattina |

**Export (`data/export/`, pipeline):**
- `scores.csv`: `h3` + una colonna per ogni parametro con ruolo `score`, `filtro`, `card` o `dossier`, ognuno 0–255, vuoto = nessun dato.
- `sites/<site>__<test>.json`: top 10 siti naturali con `lat`, `lon`, celle H3, `s` per parametro, totale, κ, `new`, "si rompe" (parametro → struttura), dossier.
- `benchmark.json`: per ogni sito × test MVP, miglior sito naturale, migliore sito nuovo e struttura indoor.
- `targets.json`: i 9 siti Artemis con i valori lunari, per la card della Luna.

Chi cambia un contratto lo scrive in un suo file in `docs/` e lo dice a Rocco (regola di AGENTS).

## 11. Pipeline (Edo, `src/pipeline/`)

| Modulo | Cosa fa | Output |
|---|---|---|
| `gee_export.py` | per ogni parametro, script GEE che produce il raster globale a 1 km e lo esporta | `data/raw/gee/<param>.tif` |
| `grid.py` | celle H3 di terra (risoluzione 5) dalla maschera | `data/interim/cells.parquet` |
| `features.py` | aggrega i raster sulle celle; calcola `low_sun_frac` (pvlib/astropy) e `crater_density` (depressioni + GVP / Impact DB) | `data/interim/features.parquet` |
| `lunar.py` | da LOLA: pendenze e rugosità alla stessa baseline; unisce `artemis.csv` | `data/export/targets.json` |
| `score.py` | percentili, `s`, media geometrica, filtri, κ (legge `tests.yaml`) | punteggi per cella × sito × test |
| `sites.py` | celle → siti, flag `new`, copertura (`facilities.csv`), dossier | `data/export/sites/*.json`, `benchmark.json` |
| `export.py` | `scores.csv` a 0–255 per l'app | `data/export/scores.csv` |
| `validate.py` | ranking dei siti noti per test; controllo negativo (foreste pluviali) | numeri per la slide |

`data/interim/` va aggiunto a `.gitignore`, come `data/raw/`.

## 12. App (Timo, `src/web/`)

Schermate del §3. Stack di `requirements-tecnici.md` §7: React, deck.gl `H3HexagonLayer` su MapLibre, statica, senza backend.

Componenti:
- mappa polare con i 9 siti;
- selettore dei test (3 MVP, EVA "anteprima", ISRU e trivella "coming soon");
- heat map H3;
- pin delle strutture e dei siti noti;
- card;
- vista benchmark;
- filtro Italia/Europa.

**Il ricalcolo nel browser** è facoltativo: con `scores.csv` a 0–255 si possono rifare i pesi lato client.

## 13. Validazione

| Test | Prova | Soglia proposta |
|---|---|---|
| rover | Piano delle Concazze e Cisternazza nel 5% migliore delle celle, per il sito Artemis più simile | se fallisce: controllare scala e pesi, e dirlo comunque |
| volo lidar | Cinder Lake e Rogers Lakebed in alto | idem |
| volo camera | Death Valley e Mojave in alto | idem |
| EVA (anteprima) | SFVF e Black Point | solo indicativo |
| tutti | foreste pluviali (Amazzonia, Congo, Borneo) in basso | mediana sotto il 50° percentile |
| tutti | sensibilità: pesi perturbati del ±20%, i top siti restano nel top 10? | quota di stabilità sulla card |

## 14. Piano sui gate (da adesso)

| Quando | Edo | Rocco | Timo |
|---|---|---|---|
| **sab 20:00** | export di prova con valori finti e colonne di `params.csv` | revisione dei pesi di `tests.yaml` | mappa che legge l'export |
| sab 20:00-22:30 | accesso a GEE; raster di `slope_p90`, `roughness`, `ndvi`, maschera; `grid.py` | `artemis.csv` per 1 sito (Malapert?); coordinate dei siti TAS-I | selettore dei test, heat map |
| **sab 22:30** | primo punteggio del rover su 1 sito, end-to-end | `known_sites.csv` (bozza) | card base |
| sab 22:30-01:00 | albedo, LST, neve, SoilGrids, `low_sun_frac`, `crater_density`; 3 test × 9 siti; `new`; copertura | `artemis.csv` completo, `facilities.csv` | card con "si rompe" e strutture |
| **dom 01:00** | ranking 9 × 3 | — | build funzionante |
| dom 09:00-11:00 | zoom a 30 m sui candidati, dossier, `validate.py`; EVA in anteprima | testi di "si rompe" e "cosa testare"; terramecanica (facoltativa) | vista benchmark, immagini, deploy |
| **dom 11:00** | freeze | freeze | freeze, app online |
| dom 11:00-15:30 | figura di validazione, testo del metodo, lista dei dati NASA | 7 slide, pitch di 4 min | video da 30 s, pagina del progetto, **submit alle 15:30** |

## 15. Rischi e piani B

| Rischio | Piano B |
|---|---|
| Accesso a GEE lento da attivare | download diretto da Earthdata delle versioni mensili a 0,05° (`MOD13C2`, `MOD11C3`) e del DEM a 90 m (`SRTMGL3`) |
| DEM polare LOLA pesante | letteratura per tutti i siti; LOLA solo per i siti della demo |
| Abbondanza di rocce Diviner non scaricabile | rugosità LOLA + conteggi LROC sui siti demo |
| Crateri da 1-50 m invisibili | GVP + Impact Database come layer; dichiararlo |
| SoilGrids debole su roccia nuda | più peso a `grain_proxy`; controllare sui siti noti |
| Piano delle Concazze non esce in alto | rivedere scala e pesi; altrimenti dirlo e spiegarlo |
| Tre test MVP troppi | si tiene rover + volo lidar; la camera passa in anteprima |
| Ritardo generale | il freeze delle 11:00 non si sposta: si tagliano zoom ed EVA |

## 16. Pitch, demo e submission

**Video da 30 s:**
1. Malapert → rover → Etna in cima (la scelta di TAS-I rifatta) → un sito nuovo vicino;
2. card con "si rompe" → ALTEC;
3. cambio su volo con lidar → campo di crateri naturale contro Morpheus.

**Pitch di 4 minuti (7 slide):**
1. **Problema:** 10 mesi; campi di crateri costruiti a mano; EVA di notte con lampade.
2. **Soluzione**, con la frase della challenge: "identifichiamo e caratterizziamo i luoghi della Terra analoghi ai siti Artemis".
3. **Demo.**
4. **Scienza e dati:** 5 strumenti lunari, dati NASA della Terra, validazione su TAS-I e sui siti di volo, limiti dichiarati.
5. **Mercato e business:** da 57 a 20 giornate-persona [A]; 127 miliardi $ al 2050 (PwC); report o abbonamento; ALTEC come canale.
6. **Concorrenza:** le strutture vendono fedeltà senza misurarla; gli altri team rispondono solo al *dove*.
7. **Team e invito all'azione:** "un pilota con il team ETNA e con Argonaut".

**Checklist della submission (Submission Guide):**
- [ ] demo: 7 slide **oppure** video ≤ 30 s;
- [ ] link pubblici senza login (app e repo);
- [ ] dati NASA elencati: NASADEM, ASTER GDEM, MODIS (`MOD44W`, `MOD13A3`, `MOD11A2`, `MCD43A3`, `MOD10A1`), VIIRS, MERRA-2, LRO (LOLA, Diviner, LEND, LROC), GRAIL;
- [ ] fonti esterne dichiarate: SoilGrids, GVP, Earth Impact Database, mappa geologica USGS, Google Earth Engine (piattaforma);
- [ ] uso dell'AI dichiarato nel form.

## 17. Decisioni ancora aperte (da chiudere presto)

1. **Aree protette.** Senza Natura 2000 / WDPA il pilastro "permessi" (4-5 mesi di TAS-I) si riduce a stagione, accesso e vento. WDPA è già nel catalogo di GEE (`WCMC/WDPA/current/polygons` ⚠): basterebbe ammetterlo e dichiararlo.
2. **`ksc_alhat_field` → `rogers_lakebed`** in `tests.yaml`.
3. **`wind_10m`** come dossier per il volo.
4. **GRAIL:** solo card (densità della crosta), oppure Rocco vede un uso nel punteggio?
5. **Nome del prodotto:** "Analog Atlas" è già preso da un altro team.
6. **Account GEE:** chi lo apre e con quale progetto Cloud.

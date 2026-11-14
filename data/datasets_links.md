# Dataset — spec (target: 3 siti Artemis III + 2 siti su Marte)

Autore: Edo · aggiornato 2026-11-14 17:45. Prodotto, target e tipi di test sono in `docs/decisioni.md`. Le fonti sono i portali delle risorse ufficiali della challenge (`docs/fonti/resources.txt`).

- **Nomi e risoluzioni delle collection sono scritti a memoria:** confermarli sul portale prima di scaricare. ⚠ = nome o presenza più incerti.
- **Stato:** solo spec. Il download si decide dopo; i dati grezzi andranno in `data/raw/`, che è fuori da git.
- **Dati della Terra:** la challenge chiede "open NASA Earth data", quindi le collection NASA (Earthdata) sono la base e Copernicus fa da controllo incrociato.
- **Ancora aperto:** quali tipi di test entrano nell'MVP e come si costruisce il layer materiali dipende dai requisiti dei test delle aziende di Torino (`docs/test-aziende.md`, Rocco).

**Priorità** (gate in `decisioni.md`): `Base` = serve per qualunque tipo di test · `Mobilità` · `Trivella` · `ISRU` = solo se quel test entra nell'MVP · `Card` = solo immagini per la card.

## Aggiornamento sab 23:30: cosa usa davvero la pipeline

Il resto del file è la spec delle 17:45 (scritta a memoria). Questa tabella è quello che gira in `src/pipeline/`, tutto su **Google Earth Engine**, con gli ID verificati. Motivi delle scelte: `docs/backend_spec.md` sez. E.

| Parametro | ID su Earth Engine | Note |
|---|---|---|
| terra / acqua | `MODIS/006/MOD44W` | la v061 è vuota |
| maschera NDVI | `MODIS/061/MOD13A3` | mediana dei mesi senza neve né nuvole (`SummaryQA` ≤ 1) < 0,2 |
| quota, pendenza, rugosità, crateri | `NASA/NASADEM_HGT/001` + `JAXA/ALOS/AW3D30/V4_1` (sopra 59,5°N) | 500 m su tutto il mondo; 30 m esatti su campione, siti noti e candidati |
| laghi (fuori dal detector dei crateri) | `JRC/GSW1_4/GlobalSurfaceWater` | presenza d'acqua > 50% |
| temperature, grana | `MODIS/061/MOD11A2` | min notturno, max diurno; inerzia termica apparente con l'albedo |
| albedo | `MODIS/061/MCD43A3` | un'immagine ogni 16 giorni |
| neve per mese | `MODIS/061/MOD10A2` | al posto di `MOD10CM`, che non c'è |
| sassi, densità del suolo | `projects/soilgrids-isric/cfvo_mean`, `bdod_mean` | fonte esterna (ISRIC), da dichiarare |
| luci notturne | `NOAA/VIIRS/DNB/ANNUAL_V21` | |
| aree protette, vento (solo siti finali) | `WCMC/WDPA/current/polygons`, `NASA/GSFC/MERRA/slv/2` | |
| luce radente | — | calcolata con pvlib |

**Marte (rientrato con 2 siti: Phoenix e Gale).** Valori da trovare (Edo + Rocco), ⚠ da verificare:
- pendenza, rugosità e crateri a 30 m dai DTM **CTX** (~20 m) o **HiRISE** (~1 m) delle due zone (PDS, USGS Astrogeology). MOLA (~460 m) non basta per la baseline di 30 m;
- grana: inerzia termica **THEMIS**, confrontata per percentile perché le unità sono diverse dalla nostra;
- albedo e abbondanza di rocce: **TES**;
- temperature: Mars Climate Database o REMS (Curiosity) e Phoenix MET.

## Riepilogo per tipo di test

| Tipo di test | Dimensioni (`decisioni.md`) | Terra | Luna |
|---|---|---|---|
| Tutti | superficie senza vegetazione né neve | `MOD13A3` / `MOD13C2`, `MOD10CM` | — |
| Mobilità | pendenza, rugosità, granulometria (+ luce radente, facoltativa) | `NASADEM_HGT` + `ASTGTM`; temperatura e albedo MODIS per la granulometria | DEM polari LOLA; Diviner |
| Trivella | ghiaccio, durezza | ESA CCI Permafrost, `MOD10CM`, `MOD11C3` | Diviner (stabilità del ghiaccio), LEND, Mini-RF |
| ISRU / materiale | mineralogia | layer a mano dalla letteratura; facoltativi ASTER ed EMIT | composizione lunare (PDS), Christiansen Feature di Diviner |

---

## LUNA — il target

### LRO, nodo Geosciences del PDS
- **Link:** https://pds-geosciences.wustl.edu/missions/lro/ · **Accesso:** libero.

| Collection | Cosa contiene | A cosa serve | Priorità |
|---|---|---|---|
| DEM polari LOLA ⚠ (prodotti ad alta risoluzione a sud di 80°S, 5–20 m) | quote dei siti Artemis | pendenza e rugosità del target | **Base** |
| Pendenze e illuminazione polare LOLA ⚠ | pendenze già calcolate; illuminazione media | controllo delle pendenze; luce radente | Mobilità |
| Mini-RF ⚠ | radar: rugosità e indizi di ghiaccio | trivella | Trivella |
| LEND ⚠ | neutroni, cioè idrogeno: possibile ghiaccio | trivella | Trivella |

### LRO Diviner
- **Link:** https://pds-geosciences.wustl.edu/missions/lro/diviner.htm · **Accesso:** libero.

| Collection | Cosa contiene | A cosa serve | Priorità |
|---|---|---|---|
| Prodotti polari di Diviner | temperature massime e medie, profondità di stabilità del ghiaccio | temperatura del target; ghiaccio | Base / Trivella |
| Abbondanza di rocce, inerzia termica della regolite ⚠ | rocce in superficie, densità della regolite | indicatore di granulometria e rocce. Un altro team non li ha trovati scaricabili: piano B, rugosità LOLA su distanze brevi | Mobilità |
| Christiansen Feature ⚠ | composizione dei silicati dall'infrarosso termico (altopiani ricchi di plagioclasio) | mineralogia del target, con la stessa fisica dell'emissività ASTER sulla Terra | ISRU |

### NASA PDS (archivio generale)
- **Link:** https://pds.nasa.gov/ · **Accesso:** libero.

| Collection | Cosa contiene | A cosa serve | Priorità |
|---|---|---|---|
| Mappe di composizione (FeO, TiO₂ da Lunar Prospector e Clementine) ⚠ | chimica della superficie | mineralogia del target | ISRU |
| LROC NAC / WAC | immagini (fino a ~0,5 m) | lato Luna della card | Card |

---

## TERRA — NASA

### NASA Earthdata Search
- **Link:** https://search.earthdata.nasa.gov/ · **Accesso:** account Earthdata Login gratuito.

| Collection | Cosa contiene | Risoluzione | A cosa serve | Priorità |
|---|---|---|---|---|
| `NASADEM_HGT` | quote (SRTM rielaborato) | 30 m, solo 60°N–56°S | pendenza e rugosità | **Base** |
| `ASTGTM` (ASTER GDEM) | quote | 30 m, fino a 83°N/S | pendenza e rugosità alle alte latitudini (Islanda, Svalbard, Artico canadese) | **Base** |
| `MOD13A3` / `MOD13C2` | NDVI (vegetazione) | 1 km / 0,05°, mensile | filtro: superficie senza vegetazione | **Base** |
| `MOD10CM` | copertura nevosa | 0,05°, mensile | filtro neve; ghiaccio | **Base** |
| `MOD11A2` / `MOD11C3` | temperatura della superficie, giorno e notte | 1 km / 0,05° | temperatura; con l'albedo dà l'inerzia termica apparente, indicatore della granulometria | Mobilità / Trivella |
| `MCD43A3` | albedo | 500 m | inerzia termica apparente. È in HDF4: alternativa con albedo VIIRS + temperatura ECOSTRESS | Mobilità |
| `AG100` / `AG1km` (ASTER GED) | emissività nell'infrarosso termico (rocce chiare/feldspatiche contro rocce basiche) | 100 m / 1 km | mappa indicativa dei materiali | ISRU (facoltativo) |
| `EMITL2BMIN` | ~10 minerali delle polveri (argille, carbonati, gesso, ossidi di ferro), solo zone aride | 60 m | **non vede il plagioclasio dell'anortosite**: utile solo per escludere o caratterizzare | ISRU (facoltativo) |

### NASA Worldview
- **Link:** https://worldview.earthdata.nasa.gov/ · **Accesso:** libero.
- Tile GIBS (`https://gibs.earthdata.nasa.gov/wmts/`) per il lato Terra della card. Priorità: Card.

---

## TERRA — agenzie partner

| Portale | Link | Collection | A cosa serve | Priorità |
|---|---|---|---|---|
| ESA Copernicus Data Space | https://dataspace.copernicus.eu/ | Copernicus DEM GLO-30; Sentinel-2 L2A | controllo incrociato del DEM; immagini della card | Base (controllo) / Card |
| ESA Open Science Catalog | https://opensciencedata.esa.int/ | ESA CCI Permafrost ⚠ | ghiaccio nel suolo | Trivella |
| JAXA G-Portal | https://gportal.jaxa.jp/ | neve e umidità del suolo (GCOM) ⚠ | alternativa per i filtri | facoltativo |
| CSA RADARSAT-1 / RCM | https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1 · https://donnees-data.asc-csa.gc.ca/en/dataset/rcm | SAR in banda C (tutorial: https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial) | rugosità radar, da confrontare con Mini-RF | facoltativo |

---

## Layer a mano (non sono dataset satellitari)

| Layer | Contenuto | Fonte | Chi |
|---|---|---|---|
| Strutture indoor | ~10 punti: LUNA, ALTEC, Moonyard, Astrobotic, PISCES, JSC Rock Yard, KSC Swamp Works, DLR… | `docs/mercato.md` | Timo / Rocco |
| Sorgenti di materiale | 5–10 affioramenti e cave note: anortosite della Groenlandia (LUNA), Stillwater, Etna, Lanzarote… | letteratura (`docs/mercato.md`) | Rocco |
| Siti di test già usati (validazione) | Etna, Lanzarote, Teide, Ries, Islanda | `docs/mercato.md`; layer USGS (fuori dalla lista ufficiale) | Rocco |
| Luce radente | altezza e azimut del Sole per luogo e giorno | calcolata con una libreria (pvlib o astropy), nessun download | Edo |

## Fuori scope

- **Marte, Jezero e il resto del pianeta:** fuori. Restano solo Phoenix e Gale (sopra). Spec vecchia di Jezero nella storia di git (commit `01ce8c5`).
- **Fonti fuori dalla lista ufficiale** (Planetary Computer, Meteomatics, OpenStreetMap, GLiM): solo se servono e dichiarate come tali.

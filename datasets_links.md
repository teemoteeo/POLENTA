# Dataset — spec

Fonti dati del progetto: sono i portali delle risorse ufficiali della challenge (`clipboard/fonti/resources.txt`). Per ogni portale: link, accesso, collection che prendiamo e a cosa servono. Le dimensioni sono quelle di `analog-atlas-plan.md` §3.

**Nomi e risoluzioni delle collection sono scritti a memoria:** prima di scaricare, confermarli cercando il nome sul portale. ⚠ = nome o presenza sul portale più incerti.

**Priorità:** `MVP` = vertical slice (sab 20:00) · `Full` = prima mappa completa (dom 01:00) · `Zoom` = solo sui ~10 candidati migliori · `Stretch` = se avanza tempo · `Twist` = solo se scegliamo quel twist.

## Riepilogo per dimensione

| Dimensione | Terra | Luna | Marte |
|---|---|---|---|
| Terreno (quota, pendenza, rugosità) | Copernicus DEM (`MVP`) | LOLA | MOLA (`MVP`) |
| Temperatura della superficie | `MOD11C3` | Diviner | THEMIS, TES, MEDA |
| Aridità e vegetazione | `MOD13C2`, `GPM_3IMERGM` (`MVP`) | zero | zero |
| Composizione e minerali | EMIT, ASTER | mappe geologiche | CRISM, TES |
| Polvere e vento | MERRA-2, `MOD08_M3` | n/a | Mars Climate Sounder |
| Ghiaccio e permafrost | `MOD10CM`, ESA CCI Permafrost | Diviner, LEND, Mini-RF | SHARAD, neutroni di Odyssey |
| Rugosità radar (`Stretch`) | Sentinel-1, RADARSAT | Mini-RF | — |
| Immagini (solo Analog Card) | Worldview, Sentinel-2 | LROC | HiRISE, CTX |

---

## TERRA — NASA

### NASA Earthdata Search
- **Link:** https://search.earthdata.nasa.gov/
- **Accesso:** account Earthdata Login gratuito (serve anche per scaricare via script).
- **Cos'è:** il portale principale dei dati NASA sulla Terra. Per l'MVP usiamo le versioni **mensili a 0,05°** (~5 km): pochi file globali invece di migliaia di riquadri.

| Collection | Cosa contiene | Risoluzione | A cosa serve | Priorità |
|---|---|---|---|---|
| `MOD11C3` | MODIS (satellite Terra): temperatura della superficie del suolo (LST), media mensile di giorno e di notte | 0,05°, mensile, dal 2000 | **Temperatura:** media, escursione giorno-notte, minima (notte del mese più freddo). Stesso tipo di misura di Diviner e THEMIS | Full |
| `MOD13C2` | MODIS: indice di vegetazione NDVI. Roccia e sabbia ~0–0,1, foresta ~0,8 | 0,05°, mensile | **Aridità:** filtro "superficie senza vita" (su Luna e Marte vale 0) | MVP |
| `GPM_3IMERGM` | GPM IMERG (NASA + JAXA): pioggia, fusione di più satelliti | 0,1°, mensile, dal 2000 | **Aridità:** pioggia annua. Copre bene solo tra 60°N e 60°S: ai poli si integra con MERRA-2 | MVP |
| `NASADEM_HGT` | NASADEM: quote dalla missione radar SRTM (2000), rielaborate nel 2020 | 30 m | **Terreno**, di riserva: copre solo 60°N–56°S e perde analoghi polari come Haughton e le Dry Valleys. Il principale è Copernicus DEM | riserva |
| `MOD10CM` | MODIS: copertura nevosa | 0,05°, mensile | **Ghiaccio** | Full |
| `MOD08_M3` | MODIS: aerosol (AOD), cioè quanta luce bloccano polvere e fumo | 1°, mensile | **Polvere** | Full |
| `M2TMNXAER` | MERRA-2 (rianalisi del clima): polvere in superficie e AOD della polvere | 0,5° × 0,625°, mensile, dal 1980 | **Polvere** | Full |
| `M2TMNXSLV` | MERRA-2: vento a 10 m, temperatura dell'aria, pioggia | 0,5° × 0,625°, mensile | **Vento**; pioggia ai poli dove IMERG non arriva | Full |
| `AG1km` / `AG100` | ASTER GED: emissività termica, legata a silice, carbonati e rocce basiche | 1 km / 100 m | **Composizione**, globale | Full |
| `EMITL2BMIN` | EMIT (spettrometro sulla ISS): minerali identificati (argille, carbonati, ossidi di ferro). Solo zone aride | 60 m | **Composizione**, dettaglio sui candidati | Zoom |
| `VNP46A4` | VIIRS Black Marble: luci notturne annuali | ~500 m | Costo di accesso | Twist T2 |
| SEDAC GPW v4 ⚠ | popolazione per cella | ~1 km | Costo di accesso | Twist T2 |

Per il twist T4 (Terra che cambia) si usano `MOD11C3` e `MOD13C2` su due periodi (es. 2001–05 e 2020–24).

### NASA Worldview
- **Link:** https://worldview.earthdata.nasa.gov/
- **Accesso:** libero.
- **Cos'è:** visualizzatore delle immagini satellitari NASA (servizio GIBS). Non si scaricano dati da analizzare.

| Collection / layer | A cosa serve | Priorità |
|---|---|---|
| MODIS / VIIRS Corrected Reflectance (True Color) | Controllo a occhio dei candidati | Full |
| Tile GIBS (WMTS, `https://gibs.earthdata.nasa.gov/wmts/`) | Lato Terra dell'Analog Card nel frontend (Timo) | Full |

---

## TERRA — agenzie partner

### ESA Copernicus Data Space Ecosystem
- **Link:** https://dataspace.copernicus.eu/
- **Accesso:** account gratuito.

| Collection | Cosa contiene | Risoluzione | A cosa serve | Priorità |
|---|---|---|---|---|
| Copernicus DEM **GLO-90** (e GLO-30) | quote dai satelliti radar TanDEM-X, copertura globale **poli compresi** | 90 m (30 m) | **Terreno:** pendenza, rugosità, rilievo. Basta GLO-90: tanto si ricampiona a ~460 m per confrontarlo con MOLA | MVP |
| Sentinel-2 L2A | immagini ottiche multispettrali | 10 m | Immagini dell'Analog Card; indici degli ossidi di ferro | Zoom |
| Sentinel-1 GRD | radar in banda C | 10 m | **Rugosità radar** | Stretch |
| ESA WorldCover ⚠ | copertura del suolo (suolo nudo, ghiaccio…) | 10 m | Controllo della vegetazione sui candidati | Zoom |

### ESA Open Science Catalog
- **Link:** https://opensciencedata.esa.int/
- **Accesso:** libero (è un catalogo: rimanda ai portali che ospitano i dati).

| Collection | Cosa contiene | Risoluzione | A cosa serve | Priorità |
|---|---|---|---|---|
| ESA CCI Permafrost ⚠ | estensione del permafrost e temperatura del suolo | 1 km, annuale | **Ghiaccio** | Full |
| ESA CCI Soil Moisture ⚠ | umidità del suolo | 0,25° | **Aridità**, in aggiunta a NDVI e pioggia | Stretch |

### JAXA G-Portal
- **Link:** https://gportal.jaxa.jp/
- **Accesso:** account gratuito.

| Collection | Cosa contiene | Risoluzione | A cosa serve | Priorità |
|---|---|---|---|---|
| GSMaP | pioggia, prodotto JAXA | 0,1°, 60°N–60°S | **Aridità**, alternativa a IMERG. Conta come dato di un'agenzia partner nella submission | Full |
| GCOM-W AMSR2 umidità del suolo / neve ⚠ | umidità del suolo, profondità della neve | ~10–25 km | **Aridità**, **ghiaccio** | Stretch |

### CSA RADARSAT-1 e RADARSAT Constellation Mission (RCM)
- **Link:** https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1 · https://donnees-data.asc-csa.gc.ca/en/dataset/rcm
- **Tutorial:** https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial (lettura del SAR in Python e QGIS)
- **Accesso:** archivio RADARSAT-1 con licenza aperta; modalità di download da verificare ⚠.

| Collection | Cosa contiene | A cosa serve | Priorità |
|---|---|---|---|
| Immagini SAR RADARSAT-1 / RCM | radar in banda C (~5,6 cm), di giorno e di notte, con qualsiasi meteo | **Rugosità radar** sui candidati, da confrontare con Mini-RF. Mini-RF lavora in bande S e X, quindi il confronto è solo indicativo | Stretch |

---

## LUNA E MARTE

### NASA Planetary Data System (PDS)
- **Link:** https://pds.nasa.gov/
- **Accesso:** libero.
- **Cos'è:** l'archivio di tutte le missioni planetarie NASA. Per Marte è **l'unica fonte**: la challenge non indica dataset specifici.

**Marte**

| Collection | Cosa contiene | Risoluzione | A cosa serve | Priorità |
|---|---|---|---|---|
| MOLA MEGDR | quote dall'altimetro laser di Mars Global Surveyor | 128 pixel/grado (~460 m) | **Terreno** del target; fissa la risoluzione comune | MVP |
| HiRISE (immagini + DTM di Jezero) | immagini a ~25 cm, modelli del terreno a ~1 m | locale | Profilo del terreno di Jezero; immagine dell'Analog Card | Full |
| CTX | immagini a ~6 m | regionale | Immagini di contesto | Zoom |
| THEMIS (inerzia termica) ⚠ | quanto il suolo trattiene il calore: polvere fine o roccia | ~100 m | **Temperatura** e granulometria | Full |
| TES | inerzia termica, albedo, indice di copertura di polvere, minerali | ~3 km | **Temperatura**, **polvere**, **composizione** a bassa risoluzione | Full |
| CRISM (mappe dei minerali) | argille, carbonati, solfati, olivina | ~18–200 m | **Composizione** del target (Jezero: carbonati, olivina, argille) | Full |
| MEDA (Perseverance), REMS (Curiosity) | stazioni meteo dei rover | sul posto | **Temperatura** reale a Jezero e Gale | Full |
| Mars Climate Sounder | profili di polvere e temperatura nell'atmosfera | globale | **Polvere** | Full |
| SHARAD, neutroni di Mars Odyssey | ghiaccio sotto la superficie | regionale | **Ghiaccio** (target Arcadia Planitia) | Stretch |
| Oxia Planum (CRISM, HiRISE, MOLA) | stesse collection, sul sito di ExoMars | — | Profilo del target | Twist T5 |

**Luna (immagini)**

| Collection | Cosa contiene | A cosa serve | Priorità |
|---|---|---|---|
| LROC NAC / WAC | immagini fino a ~0,5 m (NAC), mosaici a ~100 m (WAC) | Immagine lunare dell'Analog Card | Stretch (Luna) |

### NASA Lunar Reconnaissance Orbiter (LRO), nodo Geosciences del PDS
- **Link:** https://pds-geosciences.wustl.edu/missions/lro/
- **Accesso:** libero.

| Collection | Cosa contiene | Risoluzione | A cosa serve | Priorità |
|---|---|---|---|---|
| LOLA GDR (`LDEM_64`) | quote dall'altimetro laser | ~470 m, simile a MOLA | **Terreno** del target lunare | Stretch (Luna) |
| LOLA, DEM polari | quote del polo sud | 5–20 m | Terreno e ombre dei siti Artemis | Stretch (Luna) |
| Mini-RF ⚠ | radar: rugosità e indizi di ghiaccio | — | **Ghiaccio**, **radar** | Stretch |
| LEND ⚠ | neutroni, cioè idrogeno: possibile ghiaccio ai poli | — | **Ghiaccio** | Stretch |

### NASA LRO Diviner
- **Link:** https://pds-geosciences.wustl.edu/missions/lro/diviner.htm
- **Accesso:** libero.

| Collection | Cosa contiene | A cosa serve | Priorità |
|---|---|---|---|
| Diviner GDR L3 | temperature della superficie lunare, mappe globali | **Temperatura** del target lunare | Stretch (Luna) |
| Diviner, prodotti polari | temperature massime e medie ai poli, profondità di stabilità del ghiaccio | **Ghiaccio** e temperatura dei siti Artemis; pozzi lunari | Stretch (Luna), Twist T6 |

---

## Fuori dalla lista ufficiale (da decidere se usarli)

| Fonte | Ruolo previsto | Se la escludiamo |
|---|---|---|
| USGS Known Terrestrial Analog Sites | catalogo degli analoghi noti, per fittare i pesi e segnare i siti "nuovi" | Rocco compila `analogs.csv` dalla letteratura |
| USGS PAAD, IMEWG "Mars on Earth" | validazione e confronto con il concorrente | solo come riferimento citato |
| Mappa litologica GLiM | piano B per la composizione | EMIT + ASTER |
| Microsoft Planetary Computer, Meteomatics | altre vie d'accesso agli stessi dati | Earthdata e Copernicus Data Space |
| Strade OpenStreetMap | twist T2 | luci notturne VIIRS + popolazione SEDAC |
| Cesium terrain, Google 3D Tiles | solo grafica del frontend | decide Timo |

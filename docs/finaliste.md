# Finaliste: quali test mettiamo nel prodotto

Autore: Edo · rev. 6, 2026-11-14 19:05 · proposta da decidere col team, poi Rocco la riporta in `decisioni.md`.

**Rev. 6:**
- aggiunto il profilo **atterraggio e volo** (lander, hopper, droni) come secondo profilo, prima di ISRU;
- i test ambientali sull'hardware di volo (TVAC, vibrazioni) entrano solo nella copertura;
- il nome "Analog Atlas" è già usato da un altro team (`yos-ww/earth-analogs`): non usarlo.

Rev. 5 aveva aggiunto i requisiti di dati per proposta.
Base: `decisioni.md` (prodotto: dove testare hardware lunare, 9 siti Artemis III), `requirements-tecnici.md` (catalogo dei test), `test-aziende.md` (compratori, costi, giuria), `mercato.md` (competitor).

**Cosa cambia nella rev. 4:**
- **La luce radente non è più originale.** `earth-analog-explorer` (due team) calcola già la quota di ore con Sole basso per Shackleton e Malapert (pvlib + effemeridi NASA), con l'avviso "il terreno combacia ma la luce no". `analog_windows` annuncia "le settimane giuste per un obiettivo di test al Polo Sud" (repo ancora vuoto).
- L'originalità del rover passa a: **copertura con le strutture indoor**, **rifare la scelta reale di TAS-I** e **dossier di campagna**.
- ISRU va in anteprima e solo per l'anortosite: il basalto di cava, LUNA e ALTEC l'hanno già trovato da soli.

## Il confronto

Voti da 1 a 5, stimati da Edo. L'originalità rispetto agli altri team viene da due ricerche sui repo pubblici di Space Apps 2026 (17:00 e 18:30): è un campione, non un censimento.

| Finalista | Originalità rispetto agli altri team | Competitor esistenti (`mercato.md`) | Fattibilità | Dati | Compratore (`test-aziende.md`) |
|---|---|---|---|---|---|
| **Mobilità del rover** | 2: la fanno quasi tutti | PISCES (selezione a mano, solo Hawaii), Mission Control (Moonyard + campagne, senza spiegare la scelta), Astrobotic (spec generica), PANGU e Duality (terreno sintetico). **Nessuno misura la fedeltà rispetto a un sito Artemis** | **5** | 4: DEM; regolite stimata da temperatura e albedo MODIS | **forte**: team ULS/ETNA di TAS-I, tramite ALTEC; criteri del sito già scritti |
| **Copertura natura + strutture indoor** (funzione per tutti i test) | **5**: nessuno nel campione | LUNA, ALTEC, Astrobotic vendono fedeltà senza misurarla rispetto a un target. **Nessuno** | 4: `facilities.csv` a mano + regola `s < 0,3` | 4 | ALTEC, TAS-I |
| ISRU / materiale | 4: nessuno geolocalizza le sorgenti | Space Resource Tech ("Compare" solo sui suoi simulanti), Off Planet (a mano), database dei simulanti (non geografici) | 3 | 2–3: EMIT non vede l'anortosite; `materials.csv` a mano | medio: il basalto è già risolto (LUNA, ALTEC); il vuoto è l'**anortosite**, che LUNA ha fatto arrivare dalla Groenlandia |
| Luce radente | **2**: `earth-analog-explorer` (ore con Sole basso, avviso luce), `analog_windows` (settimane) | Moon Trek (solo il lato Luna) | **5** | **5**: calcolata | debole come test a sé → **dimensione della mobilità** |
| Trivella e volatili | 3 | Off Planet (regolite ghiacciata su misura): parziale | 3 | 3: permafrost ESA CCI | Leonardo (non è di Torino) |
| **Atterraggio e volo** (lander, hopper, droni: navigazione GNC, lidar, rilevamento dei pericoli) | 2 sul lato Luna (scelta del sito di atterraggio); **4 per i voli di test sulla Terra**: nessuno nel campione (gli altri repo su hopper e atterraggio sono simulazioni lunari) | Iris API (chiusa), LUMINA, ispace Lunar Data Platform: tutti lato Luna. Sulla Terra si costruiscono campi di pericoli **artificiali** (Morpheus, Astrobotic, Huailai) | 4: riusa i dati del rover, più i crateri | 4 | TAS-I (lander Argonaut, giuria), Evolunar (hopper LuNaDrone, navigazione senza GPS), PoliTo PIC4SeR (drone) |
| Test ambientali sull'hardware di volo (TVAC, vibrazioni, acustica) | — | — | solo indoor: **nessun analogo naturale** | — | Argotec (in giuria), TAS-I → **solo nella copertura**, come righe di `facilities.csv` |

Cosa fanno già gli altri team: piattaforme di similarità con l'AI; profili di missione (area-67, analogx); inerzia termica + EMIT (terrestrial-analog-finder); protocolli di test generati da LLM (TAVME); "cosa testare qui" per sito (analog-mappers); luce e Sole basso (earth-analog-explorer, analog_windows).

## Shortlist: tre proposte

La copertura con le strutture indoor è inclusa in tutte.

| Proposta | Originalità (team) | Originalità (competitor) | Fattibilità | Partner e giudici | Challenge |
|---|---|---|---|---|---|
| **1. "Dove testare il rover ETNA"**: mobilità + copertura + scelta TAS-I rifatta + dossier di campagna + filtro Italia/Europa | 3–4 | 4 | **5** | **5**: TAS-I compratore, ALTEC copertura, ESA BIC numeri | **5**: nucleo di dati NASA solido |
| 2. "L'anortosite giusta vicino a te": sorgenti di materiale degli altopiani + copertura | 4 | **5** | 3 | 4: ALTEC, habitat MPH di TAS | 3: lato Terra a mano, dati NASA deboli |
| 3. "Luce del Polo Sud: dove e quando": navigazione in luce radente + terreno + copertura | 2: già fatta o annunciata da altri | 4 | **5** | 3: AIKO, PIC4SeR, ORiS | 4 |

## Proposta: la 1, con il rover come esempio principale

**Spiegazione completa, con i due profili (rover e volo) e i requisiti di dati: `docs/proposta-rover-volo.md`.**

Il rover da solo è quello che fanno tutti. L'originalità viene da tre pilastri:

1. **Copertura natura → strutture indoor.** "Il terreno te lo dà questo sito; il vuoto, i −200 °C e la luce a 1,5–7° no (il letto di ALTEC ha le luci a ~8°): per quelli vai lì." Nessuno collega l'analogo naturale alla struttura che chiude il buco.
2. **Rifare la scelta reale di TAS-I.** Il profilo usa i criteri dichiarati per l'Etna (pendenze vicino a 20°, depositi portati dal vento, rocce, crateri, niente vegetazione, area grande, accesso). La prova: il tool rimette in cima **Piano delle Concazze e Cisternazza**, il sito principale e quello di riserva scelti in 10 mesi. Poi mostra i **siti nuovi** con punteggio vicino. Gli altri team validano su analoghi famosi; noi su una decisione industriale vera.
3. **Dossier di campagna, non solo ranking.** Sito, finestra stagionale, accesso (luci notturne VIIRS, dato NASA) e aree protette (Natura 2000 / WDPA, fuori dalla lista ufficiale, da dichiarare). Attacca il dolore vero di TAS-I: 4-5 mesi di permessi.

Contorno:
- **Luce radente** come dimensione della mobilità: serve alla fisica e alla challenge, ma non è il nostro messaggio.
- **Filtro Italia/Europa:** TAS-I preferisce siti "tanto rappresentativi quanto nostrani" (fondi ASI).
- **Facoltativo (Rocco, criterio Validity):** quantificare con la terramecanica il "si rompe" della gravità, cioè l'affondamento della stessa ruota a 1 g contro 1/6 g.
- **Secondo profilo: atterraggio e volo** (lander, hopper, droni), con pesi veri ma senza dossier. In `tests.yaml` v0 è diviso in due test: rilevamento dei pericoli con lidar e navigazione con camera. Le EVA ci sono come "coming soon". Riusa i dati del rover; in più servono i crateri (condizione 4). È il campo di crateri **naturale** al posto di quelli artificiali.
  - Dove si rompe: gravità a 1/6 e l'aria (aerodinamica, getto del motore, polvere sollevata), quindi la copertura rimanda alle camere a vuoto.
  - Nella demo: si passa da rover a volo e la mappa si ridisegna. Parla a TAS-I due volte (rover ETNA e Argonaut), a Evolunar e a PIC4SeR.
- **Test ambientali dell'hardware di volo** (TVAC, vibrazioni): solo nella copertura, come righe di `facilities.csv`. È la riga in cui si riconosce Argotec.
- **ISRU in anteprima** solo dopo il gate di dom 01:00 e solo per l'anortosite, con `materials.csv` a mano. Claim: "la roccia sorgente giusta vicino a te", non "un sostituto del simulante".
- Trivella: "coming soon" nella UI.

**Ordine di priorità:** 1. rover, completo · 2. atterraggio e volo, perché riusa i dati · 3. ISRU/anortosite, che richiede lavoro a mano.

## Requisiti di dati per proposta

I parametri vengono da `requisiti-test.md` §2, i dataset da `data/datasets_links.md`, i file da `requirements-tecnici.md` §6. Gate da `decisioni.md`: sab 20:00 export di prova · sab 22:30 primo test end-to-end · dom 01:00 ranking · dom 11:00 freeze.

Legenda: ✅ = fonte NASA o portale ufficiale della challenge · ➕ = fonte esterna, da dichiarare nella submission · ⚠ = nome o disponibilità da verificare.

**Strategia per il volume dei dati:** screening globale grossolano (celle H3 a risoluzione 5, DEM a 90 m, SoilGrids a 5 km), poi 30 m solo sui candidati. Le pendenze di Terra e Luna vanno calcolate **alla stessa baseline** (`requisiti-test.md` §7). L'export di prova delle 20:00 usa valori finti e non richiede dati reali.

### Comuni a tutte e tre le proposte

| Cosa | Dataset o fonte | Tipo | Chi | Entro |
|---|---|---|---|---|
| Griglia H3 e maschera delle terre emerse | libreria `h3` + maschera terra/acqua MODIS `MOD44W` | ✅ | Edo | sab 20:00 |
| Profilo dei 9 siti Artemis (`artemis.csv`) | prima la letteratura; poi DEM polari LOLA e prodotti polari Diviner; `geo_unit` dalla mappa geologica USGS (già in `data/raw/`) | ✅ + ➕ (USGS) | Rocco (letteratura), Edo (LOLA se c'è tempo) | 1 sito per le 22:30, tutti e 9 per le 01:00 |
| Filtro vegetazione e umidità | NDVI `MOD13A3`; carbonio organico SoilGrids `soc` (facoltativo) | ✅ (+ ➕) | Edo | sab 22:30 |
| Strutture indoor (`facilities.csv`) | a mano, da `requisiti-test.md` §4 e `mercato.md` | a mano | Rocco, aiuta Timo | dom 01:00 |
| Siti noti, per la validazione e il flag `new` | a mano, da `requisiti-test.md` §5. File nuovo proposto: `data/config/known_sites.csv` (`name,lat,lon,test,campaign,source`) | a mano | Rocco | dom 01:00 |
| Immagini della card | Terra: Sentinel-2 o tile GIBS di Worldview; Luna: LROC o Moon Trek | ✅ | Timo | dom 11:00 |

### Proposta 1 — "Dove testare il rover ETNA"

| Parametro (`requisiti-test.md` §2.1) | Luna (target) | Terra (per cella H3) | Tipo | Chi | Entro |
|---|---|---|---|---|---|
| Pendenza, alla stessa baseline | DEM polari LOLA, ricampionati | `SRTMGL3` / `NASADEM_HGT` (fino a 60°N), `ASTGTM` (fino a 83°); Copernicus GLO-90/30 come controllo | ✅ | Edo | sab 22:30 |
| Rocce e rugosità | rugosità LOLA; abbondanza di rocce Diviner ⚠ | rugosità dal DEM; SoilGrids `cfvo` (sassi); backscatter Sentinel-1 solo sui candidati | ✅ + ➕ | Edo | dom 01:00 |
| Crateri piccoli (condizione 4) | densità dalla letteratura o da LOLA | depressioni chiuse nel DEM (calcolate); Earth Impact Database e vulcani GVP come layer di punti | ✅ + ➕ | Edo | dom mattina |
| Regolite: granulometria e densità | valori di letteratura (Lunar Sourcebook) | inerzia termica apparente da `MOD11A2` + `MCD43A3`; SoilGrids `sand`/`silt`/`clay`/`bdod` a 5 km | ✅ + ➕ | Edo | dom 01:00 |
| Luce radente (dimensione) | elevazione massima del Sole per sito: (90° − \|lat\|) + 1,54° | calcolo con pvlib o astropy; nuvole MODIS `MOD08_M3` | calcolo + ✅ | Edo | sab 22:30 (calcolo), dom (nuvole) |
| Termico (per la card) | prodotti polari Diviner | `MOD11C3` | ✅ | Edo | dom 01:00 |
| Pesi e soglie (`tests.yaml`) | — | bozza in `requisiti-test.md` §3 | a mano | Rocco | sab 20:00 |
| Validazione sulla scelta TAS-I | — | coordinate di Piano delle Concazze e Cisternazza (relazione al Parco dell'Etna) | a mano | Rocco | sab 22:30 |
| Dossier: accesso | — | luci notturne VIIRS `VNP46A4` | ✅ | Edo | dom 11:00 |
| Dossier: aree protette | — | Natura 2000 (EEA) per l'Europa; WDPA per il mondo, pesante | ➕ | Edo | dom 11:00 |
| Dossier: finestra stagionale | — | neve `MOD10CM` (mesi senza neve) + luce calcolata | ✅ + calcolo | Edo | dom 11:00 |
| Filtro Italia/Europa | — | confini Natural Earth (admin-0) | ➕ | Edo o Timo | dom 11:00 |

Il nucleo di dati NASA della Terra (DEM, MODIS, VIIRS) sta tutto in questa proposta: è quello che regge il criterio Relevance.

### Secondo profilo della proposta 1 — atterraggio e volo (lander, hopper, droni)

Parametri da `requisiti-test.md` §2.4: tilt del lander ≤ 8°, pendenza di pianificazione < 10°, pericoli ≥ 0,3 m e pendenze ≥ 5°, crateri e rocce per il rilevamento dei pericoli, luce polare. Pesi indicativi in `requirements-tecnici.md` §2: terreno 0,50 · illuminazione 0,30.

| Parametro | Luna (target) | Terra (per cella H3) | Tipo | Chi | Entro |
|---|---|---|---|---|---|
| Pendenza (pianificazione < 10°, tilt ≤ 8°) | DEM polari LOLA | gli stessi DEM del rover (proposta 1) | ✅ | Edo | dom 01:00 |
| Crateri e campo di pericoli | densità dei crateri dalla letteratura o da LOLA | depressioni chiuse nel DEM (calcolate); Earth Impact Database e vulcani GVP come layer di punti | ✅ + ➕ | Edo | dom mattina |
| Rocce ≥ 0,3 m | abbondanza di rocce Diviner ⚠ | rugosità dal DEM, SoilGrids `cfvo`, Sentinel-1 sui candidati: proxy dichiarati | ✅ + ➕ | Edo | dom mattina |
| Luce polare | come la proposta 1 | calcolata come la proposta 1 | calcolo | Edo | già fatto per il rover |
| Texture per la navigazione visiva | — | rugosità dal DEM + Sentinel-2 (le dune lisce rompono la visione) | ✅ | Edo | facoltativo |
| Zone di volo per droni | — | zone geografiche UAS di ENAC (d-flight) ed EASA | ➕ | Edo | facoltativo |
| Tubi di lava e pozzi (per Evolunar) | pozzi lunari dalla letteratura | a mano (Lanzarote, Etna…); nessun dataset globale | a mano | Rocco | facoltativo |
| Pesi e soglie (`tests.yaml`) | — | profilo `landing_flight` | a mano | Rocco | dom 01:00 |
| Copertura | — | in `facilities.csv`: camere a vuoto (getto del motore), TVAC e vibrazioni (hardware di volo) | a mano | Rocco, Timo | dom 01:00 |

Nessun download nuovo oltre a quelli del rover: costa soprattutto il calcolo dei crateri.

### Proposta 2 — "L'anortosite giusta vicino a te" (in anteprima, dopo dom 01:00)

| Parametro (`requisiti-test.md` §2.2) | Luna (target) | Terra | Tipo | Chi | Entro |
|---|---|---|---|---|---|
| Litologia, FeO, TiO₂ | mappa geologica USGS (già scaricata); FeO e TiO₂ da Lunar Prospector e Clementine ⚠; Christiansen Feature di Diviner ⚠ | — | ✅ + ➕ | Rocco, Edo | dom mattina |
| Sorgenti di anortosite (`materials.csv`) | — | a mano: Sithampoondi (ISRO), Stillwater, Rogaland, Lac-Saint-Jean, Adirondacks, Groenlandia | a mano | Rocco | dom mattina |
| Conferma da satellite (facoltativa) | — | emissività ASTER `AG100` (segnale feldspatico); EMIT solo per escludere, perché non vede il plagioclasio | ✅ | Edo | dom mattina |
| Quantità e cava attiva | — | a mano (`evidence_url`); USGS MRDS facoltativo | a mano + ➕ | Rocco | dom mattina |
| Spessore scavabile, umidità | — | SoilGrids (profondità della roccia ⚠, `soc`) | ➕ | Edo | facoltativo |
| Distanza dal cliente | — | calcolata da Torino e da Colonia | calcolo | Edo | dom mattina |

Rischio: lato Terra quasi tutto a mano, con dati NASA deboli. Regge solo appoggiata alla proposta 1.

### Proposta 3 — "Luce del Polo Sud: dove e quando"

| Parametro (`requisiti-test.md` §2.3) | Luna (target) | Terra | Tipo | Chi | Entro |
|---|---|---|---|---|---|
| Elevazione e azimut del Sole | formula per sito; effemeridi NAIF SPICE o illuminazione polare LOLA ⚠ | pvlib o astropy, per data e luogo | calcolo + ✅ | Edo | sab 22:30 |
| Orizzonte e lunghezza delle ombre | DEM polari LOLA | DEM come nella proposta 1 | ✅ | Edo | dom mattina |
| Finestre senza neve | — | `MOD10A2` / `MOD10CM` | ✅ | Edo | dom 01:00 |
| Probabilità di cielo sereno | — | nuvole MODIS `MOD08_M3` / `MOD35` | ✅ | Edo | dom mattina |
| Texture (le dune lisce rompono la visione) | — | rugosità dal DEM + Sentinel-2 | ✅ | Edo | dom mattina |
| Terreno | come la proposta 1 | come la proposta 1 | ✅ | Edo | sab 22:30 |

Nessun download pesante oltre al terreno. Però `earth-analog-explorer` calcola già le ore con Sole basso: ci si distingue solo con le finestre stagionali e la copertura (luci di ALTEC a ~8°, laboratorio Ames POLAR).

## Verifica dei criteri

| Criterio | Esito | Nota |
|---|---|---|
| Originalità rispetto agli altri team | ⚠ | Restano unici nel campione la copertura con le strutture indoor, la validazione sulla scelta TAS-I, il dossier con i permessi e le sorgenti di materiale. Luce e "cosa testare" non lo sono più. Da ricontrollare domenica mattina |
| Originalità rispetto ad aziende e competitor | ✅ | Nessuno mette siti, strutture e materiali rispetto a un target preciso |
| Fattibilità | ✅ | Proposta 1 solida; ISRU solo in anteprima |
| Richieste delle aziende partner | ✅ | TAS-I: criteri del sito, permessi, preferenza Italia. ALTEC: copertura, luci a ~8° |
| Giudici | ⚠ | TAS-I compratore due volte (rover ETNA e lander Argonaut), ESA BIC numeri e la startup I3P Evolunar, ORiS luce e ombra. Argotec solo tramite la copertura (righe TVAC e vibrazioni) |
| Challenge (A1–A8) | ⚠ | Coperta, a patto di avere il flag "sito nuovo" (condizione 1) |

**Condizioni:**
1. **Flag `new` nell'export** (`data/export/sites/*.json`), con i siti di test già noti come layer di confronto. Chi: Edo + Rocco.
2. **Accesso e aree protette** nel dossier: VIIRS `VNP46A4` (NASA) per l'accesso; Natura 2000 / WDPA dichiarati come fonti esterne. Chi: Edo.
3. **Il pitch apre con la copertura e con la scelta TAS-I rifatta**, non con la mappa. Chi: Rocco.
4. **Crateri** nella dimensione terreno, oppure dichiarati tra i limiti. Chi: Edo.

## Numeri per il pitch (da `test-aziende.md`; le voci [A] sono stime)

- Scelta del sito: **da 57 a 20 giornate-persona**, ≈ 28 k€ per campagna; oggi ~10 mesi, di cui 4-5 di permessi.
- Letto di regolite: roccia di cava **8–20 volte meno** del simulante commerciale (precedente: la hall di LUNA, basalto di una cava a 30-40 km).
- Luce: a 78–80°N, tra metà e fine agosto, Sole tra 0° e 5,5° per 5–8 ore al giorno, senza neve. Calcolo approssimato: da rifare con una libreria.

## Da decidere nella riunione

1. Proposta 1 (rover ETNA con copertura, scelta TAS-I rifatta e dossier) come base: sì?
2. Il pitch apre con la copertura e con "rifacciamo in minuti la scelta che TAS-I ha fatto in 10 mesi"?
3. Aree protette (fonte esterna, da dichiarare) nel dossier: sì o no?
4. ISRU/anortosite in anteprima dopo dom 01:00, oppure fuori?
5. Profili dei 9 siti Artemis: DEM polari LOLA (pesanti) o prima la letteratura?
6. DEM della Terra: NASADEM + ASTER GDEM (spec di Edo) oppure Copernicus / ArcticDEM (CSV di Rocco)?
7. Le 4 condizioni: chi le fa ed entro quale gate?
8. Fonti esterne (➕) da ammettere e dichiarare: SoilGrids, Natura 2000 / WDPA, Natural Earth, Earth Impact Database e GVP, mappa geologica USGS, zone UAS di ENAC ed EASA?
9. Secondo profilo "atterraggio e volo" prima di ISRU: sì?
10. Nome del prodotto: "Analog Atlas" è già preso da un altro team. Quale usiamo?

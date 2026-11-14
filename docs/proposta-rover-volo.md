# Proposta: dove testare il rover e il volo (lander, hopper, droni)

Autore: Edo · 2026-11-14 19:30 · è la proposta 1 di `finaliste.md` spiegata per intero. Da decidere col team; poi Rocco riporta le decisioni in `decisioni.md`.

**Allineata a `data/config/tests.yaml` v0 e `data/config/params.csv` (Timo, 19:18):** nomi dei parametri e pesi vengono da lì. Questo documento spiega il perché, i dati che servono e chi li prepara.

Fonti interne:
- `decisioni.md` (gate);
- `requirements-tecnici.md` (flusso, modello, contratti);
- `requisiti-test.md` (parametri, siti noti);
- `test-aziende.md` (compratori, costi, giuria; "I tre tipi di test: dove si fanno oggi");
- `mercato.md` (competitor);
- `data/datasets_links.md` (dataset).

Legenda: ✅ = fonte NASA o portale ufficiale della challenge · ➕ = fonte esterna, da dichiarare nella submission · ⚠ = nome o disponibilità da verificare · [NV] = numero non verificato.

---

## 1. In una frase

**"Dacci il sito Artemis e il test che devi fare. Ti diciamo dove farlo sulla Terra, quanto è fedele, dove l'analogia si rompe e quale struttura indoor chiude il buco."**

Test nell'MVP (`tests.yaml`):
- **mobilità del rover**;
- **volo, rilevamento dei pericoli con lidar**;
- **volo, navigazione con camera sul terreno**.

Poi ISRU/anortosite in anteprima e **tute ed EVA** come "coming soon".

## 2. Il problema, con i numeri

- **Rover.** TAS-I ha scelto il sito della campagna del rover ETNA (ULS) in circa **10 mesi**, di cui 4-5 di soli permessi (area Natura 2000), con criteri scritti a mano. Il nostro modello stima **57 giornate-persona** per la scelta del sito [A]. Quando il sito è più facile del target il rover si rompe: Yutu era stato provato su una sabbia più liscia del sito vero.
- **Volo.** Per provare la navigazione di discesa (TRN) e il rilevamento dei pericoli (HDA) si **costruiscono a mano campi di crateri** che copiano il Polo Sud: Morpheus a KSC, Astrobotic LSPG a Mojave, Huailai, Challakere. Morpheus è costato ~14 M$ in 4 anni. I campi naturali esistono (Cinder Lake è nato così negli anni '60), ma nessuno li cerca in modo sistematico.
- **Tute.** Le EVA del Polo Sud si provano **di notte, con un "sole" artificiale su carrello** (JETT3 e JETT5 in Arizona), perché di giorno manca la luce radente.
- **Copertura.** Nessuno dice: "questo pezzo lo fa la natura, quest'altro solo una struttura indoor". Le strutture vendono fedeltà senza misurarla rispetto a un target.

## 3. Cosa fa il prodotto (il flusso)

1. **Scegli il sito Artemis**: mappa polare con i 9 siti candidati di Artemis III.
2. **Scegli il test**: rover · volo con lidar · volo con camera. Inoltre ISRU in "anteprima" e EVA in "coming soon".
3. **Mappa della Terra:**
   - heat map delle celle H3 con il punteggio per quel sito × test;
   - top 10 siti naturali;
   - pin delle strutture indoor e dei siti di test già usati;
   - filtro "Italia/Europa".
4. **Card del sito:**
   - barre per parametro;
   - **combacia / si rompe** (`s < 0,3`);
   - la **struttura indoor che chiude il buco**;
   - **flag "nuovo"**;
   - **dossier di campagna**: mesi senza neve, accesso, aree protette, zone di volo;
   - fonti dei dati.
5. **Vista benchmark**, che è anche la slide del pitch: matrice 9 siti × 3 test dell'MVP, con miglior sito naturale e struttura indoor per ogni casella.

## 4. Perché è originale

Il rover da solo lo fanno quasi tutti (~47 repo nel campione, vedi `finaliste.md`). La luce radente non è più nostra: `earth-analog-explorer` calcola le ore con Sole basso, `analog_windows` annuncia le "settimane giuste". L'originalità viene da quattro pilastri, che nel campione non ha nessuno:

1. **Copertura natura → strutture indoor.** Esempio: "il terreno te lo dà questo sito; il vuoto, i −200 °C e la luce a 1,5–7° no (il letto di ALTEC ha le luci a ~8°): per quelli vai lì".
2. **Rifare la scelta reale di TAS-I.** La prova di validità è che il tool rimette in cima **Piano delle Concazze e Cisternazza**, cioè una decisione industriale vera.
3. **Dossier di campagna, non solo ranking:** attacca i 4-5 mesi di permessi.
4. **Campo di crateri naturale per i voli di test,** al posto di quelli costruiti. Nel campione nessuno lo fa: gli altri repo su hopper e atterraggio sono simulazioni lunari.

## 5. Per chi: clienti e giudici

| Chi | Test | Perché gli serve | In sala? |
|---|---|---|---|
| **TAS-I**, team ULS/rover ETNA | rover | scelta del sito fatta a mano in 10 mesi; altre campagne in arrivo | **giuria** |
| **TAS-I**, lander Argonaut (862 M€ ESA) | volo lidar, volo camera | test di discesa e appoggio da pianificare: nessun piano pubblico | **giuria** |
| **ALTEC** | copertura | il centro lunare indoor è la "struttura che chiude il buco"; canale verso ispace-EUROPE | partner |
| **Evolunar** (startup I3P) | volo lidar, volo camera | l'hopper LuNaDrone e la navigazione senza GPS (POLARIS) hanno bisogno di siti di volo | ecosistema I3P (giudice ESA BIC) |
| **PoliTo PIC4SeR, Team DIANA** | volo, rover | drone e sensori del rover ETNA | — |
| **AIKO** | rover, volo camera | dati e immagini in luce radente per l'autonomia | — |
| **Argotec** | copertura | TVAC e vibrazioni per l'hardware di volo: righe di `facilities.csv` | **giuria** |
| **ORiS** | rover (luce e ombra) | ha studiato per TAS l'energia senza fili ai rover in ombra | sponsor del 1° premio |
| **ESA BIC** (giudice "più severo") | tutto | modello di business e numeri | **giuria** |
| NASA (JETT), ESA EAC (PANGAEA), Axiom con Prada | EVA | siti per le tute con luce radente; a Torino nessun compratore | no → "coming soon" |

## 6. Test A — Mobilità del rover (`rover_mobility`, MVP)

**Obiettivo:** siti naturali dove un rover affronta pendenze, rocce, crateri e suolo sciolto come nel sito Artemis scelto.

**Pesi** (`tests.yaml`; segnaposto, li corregge Rocco):

| Parametro | Peso | Perché |
|---|---|---|
| `slope_p90` | 0,30 | 20° è il requisito di TAS-I e NASA (V); i bordi al Polo Sud superano spesso i 15-20° |
| `roughness` | 0,15 | rocce e gradini (VIPER: 20 cm) |
| `grain_proxy` | 0,15 | affondamento: regolite fine, D50 ~60-80 µm [NV] |
| `rock_cover` | 0,10 | rocce ≥ 0,2-0,3 m sono un pericolo |
| `bulk_density` | 0,10 | 1,3 → 1,9 g/cm³ |
| `low_sun_frac` | 0,10 | navigazione con Sole radente |
| `crater_density` | 0,05 | crateri metrici |
| `rock_class` | 0,05 | litologia |

**Filtri rigidi:** `ndvi < 0,1`, `slope_p90 ≥ 15`.

**Validazione:**
- Piano delle Concazze e Cisternazza devono stare in alto (proposta: nel 5% migliore delle celle per il sito Artemis più simile).
- Devono uscire bene anche Teide, Black Point / SFVF e Meteor Crater.
- Le foreste pluviali devono uscire in basso.

**Dove si rompe → copertura** (`indoor: gravity_1_6, vacuum, electrostatic_dust`):

| Cosa non torna | Dove si fa |
|---|---|
| gravità 1/6 (affondamento e trazione cambiano) | rover alleggerito, SLOPE (NASA Glenn), offload di LUNA |
| vuoto, polvere elettrostatica, agglutinati | vasche di simulante (LUNA, ALTEC, KSC) |
| ombre ferme con cielo nero | luci di LUNA e ALTEC (~8°, più alte del Sole reale), Ames Lunar Lab |
| grani taglienti contro grani arrotondati | vasca di simulante (la roccia naturale combacia in chimica, non in geotecnica) |

**Facoltativo per il criterio Validity (Rocco):** con la terramecanica, l'affondamento della stessa ruota a 1 g contro 1/6 g.

## 7. Test B — Volo (lander, hopper, droni): due test

Oggi questi campi si costruiscono a mano; noi troviamo **campi di crateri e di rocce naturali** dove provare la discesa.

### B1. Rilevamento dei pericoli con lidar (`flight_hda_lidar`, MVP)

Il lidar del lander, o di un drone o elicottero che lo porta, deve vedere rocce da 30 cm e pendenze da 5° e scegliere un punto sicuro (ALHAT; Astrobotic è scesa a 15 cm).

| Parametro | Peso | Perché |
|---|---|---|
| `crater_density` | 0,30 | il campo di pericoli è fatto di crateri (KSC e LSPG ne copiano la distribuzione dai dati LRO) |
| `rock_cover` | 0,25 | rocce ≥ 0,3 m |
| `slope_p90` | 0,20 | pendenze ≥ 5° da riconoscere; area di atterraggio < 10° |
| `roughness` | 0,15 | ostacoli alla scala del requisito |
| `albedo` | 0,05 | risposta del suolo al lidar |
| `rock_class` | 0,05 | basalto e ceneri vicini alla Luna |

Filtro: `ndvi < 0,1`. Indoor: `gravity_1_6, plume_vacuum, vacuum`.

### B2. Navigazione con camera sul terreno (`flight_trn_camera`, MVP)

La camera confronta il suolo con una mappa per sapere dove si trova. Dipende dalla luce e dal contrasto; il lidar no, ed è per questo che i voli con lidar si fanno anche di notte.

| Parametro | Peso | Perché |
|---|---|---|
| `low_sun_frac` | 0,30 | ombre lunghe come al Polo Sud |
| `albedo` | 0,20 | contrasto: basalto e ceneri sono vicini alla Luna |
| `crater_density` | 0,20 | i crateri sono i riferimenti della mappa |
| `roughness` | 0,15 | texture sufficiente: le dune lisce rompono la visione |
| `slope_p90` | 0,10 | rilievo |
| `rock_class` | 0,05 | litologia |

Filtro: `ndvi < 0,1`. Indoor: `gravity_1_6, vacuum`.

### Dove si rompe → copertura (entrambi)

| Cosa non torna | Dove si fa |
|---|---|
| gravità 1/6 sul veicolo intero (dinamica di discesa e appoggio) | cavi e gantry (Langley, Huailai), DLR LAMA (Brema), New Shepard a gravità lunare |
| **aria**: aerodinamica, getto del motore e polvere sollevata diversi dal vuoto | sfera a vuoto di NASA Langley, camera di NASA Marshall |
| appoggio delle gambe su regolite | drop test su simulante (ISRO, ALTEC per ExoMars) |
| test ambientali sull'hardware di volo | TVAC e vibrazioni (Argotec in casa, ESTEC; TVAC "sporca" di ALTEC in arrivo) |

### Validazione e due correzioni proposte a `tests.yaml`

- **B2:** Death Valley (Lander Vision System di Mars 2020, LSPG) e Mojave (Xodiac): naturali, ok.
- **B1: `ksc_alhat_field` è un campo costruito** (~100×100 m sulla pista di KSC). Il DEM e i dati satellitari non lo vedono, quindi non può uscire in alto: la validazione fallirebbe per costruzione. **Proposta:** sostituirlo con Rogers Lakebed a Edwards (ALHAT da elicottero) o con SFVF, e tenere `cinder_lake`.
- **Vento:** ad ARCHES sull'Etna il vento ha bloccato alcuni voli del drone. **Proposta:** aggiungere a `params.csv` un parametro `wind_10m` (MERRA-2) con ruolo `dossier`, utile per hopper e droni.

## 8. Test C — Tute ed EVA (`eva_traverse`, coming soon)

Da `test-aziende.md`, sezione "Tute ed EVA".

- **Cosa si testa:** camminare in tuta su pendii fino a 20° entro 2 km dal lander, campionare, lavorare con Sole radente; da 2 a 5 EVA in 6,5 giorni, fino a 8 h in tuta.
- **Perché è interessante:** è il caso in cui la **luce radente** serve di più. Oggi si simula di notte con lampade (JETT3, JETT5, NBL al buio). Il nostro calcolo dei mesi senza neve con Sole basso risponde a un bisogno vero.
- **Pesi** (`tests.yaml`): `slope_p90` 0,30 · `low_sun_frac` 0,20 · `roughness` 0,15 · `rock_class` 0,15 · `grain_proxy` 0,10 · `rock_cover` 0,10. Filtri: `ndvi < 0,1`, `slope_p90 ≤ 25`.
- **Validazione:** SFVF, Black Point Lava Flow (JETT, D-RATS).
- **Siti italiani già usati:** Bletterbach (PANGAEA), Etna (Analog-1), grotta Sa Grutta in Sardegna (CAVES).
- **Perché resta "coming soon":** a Torino nessuno fa tute (Prada, a Milano, fa strati della AxEMU con Axiom). Il collegamento con TAS-I e ALTEC passa dall'habitat MPH.
- **Dati in più rispetto al rover:** varietà geologica entro 2 km (un parametro nuovo, da `rock_class` sulle celle vicine) e copertura delle comunicazioni (➕, facoltativa). Per il resto riusa i dati del rover.
- **Copertura:** NBL e ARGOS (1/6 g), Chamber B (termo-vuoto con persone, 93 K), Flat Floor di Marshall (luce del Polo Sud), voli parabolici Novespace.

## 9. Come si calcola (il motore, uguale per tutti i test)

Regole comuni in testa a `tests.yaml` (`tau: 0.1`, `eps: 0.01`, `break_below: 0.3`):

1. **Griglia:** celle H3 a risoluzione 5 (~250 km²) sulle terre emerse.
2. **Parametri per cella:** quelli di `params.csv` con ruolo `score`, `filtro`, `card` o `dossier`.
3. **Profilo del sito Artemis:** gli stessi parametri in `artemis.csv`: `site,lat,lon,slope_p90,roughness,crater_density,rock_cover,low_sun_frac,albedo,grain_proxy,bulk_density,rock_class,t_min_c,t_max_c,geo_unit,source`.
4. **Punteggio per parametro:** distanza `D` in percentili terrestri, poi `s = exp(−(D/τ)²)`.
5. **Totale:** media geometrica pesata con i pesi del test, dopo i filtri rigidi. Confidenza κ ≥ 0,7.
6. **Da celle a siti:** top 1% → unione delle celle vicine → al massimo un sito ogni 100 km.
7. **Flag `new`:** sito a più di 200 km da tutti i siti di `known_sites.csv` per quel test.
8. **Copertura:** i parametri con `s < 0,3` e i parametri `indoor` del test richiamano le strutture di `facilities.csv` con quel `covers`.
9. **Dossier:** `night_lights`, `snow_free_months`, `protected_area`, `uas_zone` (più `wind_10m`, se approvato).

**`low_sun_frac`, nel dettaglio:**
- Definizione di `params.csv`: frazione delle ore di luce con il Sole sotto 7°, nel mese migliore senza neve (≈ 1 al Polo Sud).
- Calcolo con pvlib o astropy per data e luogo, mesi senza neve da `MOD10CM`, eventualmente pesato per la probabilità di cielo sereno (`MOD08_M3`).
- In seguito si può sostituire la soglia fissa di 7° con l'elevazione massima del sito, (90° − |lat|) + 1,54°.
- Dove si rompe: sulla Terra le ombre si muovono ~30 volte più veloci e il cielo diffonde la luce.

**Scala:**
- Screening globale a 90 m, zoom a 30 m sui candidati; le pendenze lunari alla stessa baseline (`requisiti-test.md` §7).
- Rocce da 0,3 m e crateri da 10 m non si vedono nei DEM globali: allo zoom servono Sentinel-2 a 10 m e, alle alte latitudini, ArcticDEM a 2 m (➕). I proxy vanno dichiarati.

## 10. Requisiti di dati

### 10.1 Per parametro (`params.csv`)

Test: R = rover · H = volo lidar · T = volo camera · I = ISRU · E = EVA.

| Parametro | Ruolo | Terra (dataset) | Luna (dataset) | Tipo | Test | Entro |
|---|---|---|---|---|---|---|
| `slope_p90` | score | `SRTMGL3` / `NASADEM_HGT` (fino a 60°N), `ASTGTM` (fino a 83°); Copernicus GLO-90 come controllo | DEM polari LOLA, alla stessa baseline | ✅ | R H T I E | sab 22:30 |
| `roughness` | score | deviazione standard del DEM dopo detrend | rugosità LOLA | ✅ | R H T I E | sab 22:30 |
| `crater_density` | score | depressioni chiuse nel DEM + Earth Impact Database + vulcani GVP | letteratura o LOLA (crateri 10-100 m) | ✅ + ➕ | R H T | dom mattina |
| `rock_cover` | score | SoilGrids `cfvo` + rugosità; Sentinel-1 sui candidati | abbondanza di rocce Diviner ⚠ o letteratura | ✅ + ➕ | R H E | dom 01:00 |
| `low_sun_frac` | score | calcolo (pvlib/astropy) + `MOD10CM` (+ `MOD08_M3`) | ≈ 1 (calcolo) | calcolo + ✅ | R T I E | sab 22:30 |
| `albedo` | score | `MCD43A3` (in HDF4: alternativa albedo VIIRS) | albedo LOLA/LROC | ✅ | H T | dom 01:00 |
| `grain_proxy` | score | inerzia termica apparente da `MOD11A2` + `MCD43A3` | letteratura (D50 ~60-80 µm) | ✅ | R I E | dom 01:00 |
| `bulk_density` | score | SoilGrids `bdod` | letteratura (1,30 in superficie) | ➕ | R I | dom 01:00 |
| `rock_class` | score | `materials.csv` a mano; ASTER `AG100` facoltativo | mappa geologica USGS (già in `data/raw/`) → classe terrestre | a mano + ✅ / ➕ | R H T I E | dom 01:00 |
| `t_min_c`, `t_max_c` | card | `MOD11C3` | prodotti polari Diviner | ✅ | tutti | dom 01:00 |
| `elevation_m` | card | DEM | — | ✅ | tutti | sab 22:30 |
| `ndvi` | filtro | `MOD13A3` | 0 | ✅ | tutti | sab 22:30 |
| `night_lights` | dossier | VIIRS `VNP46A4` | — | ✅ | tutti | dom 11:00 |
| `snow_free_months` | dossier | `MOD10CM` | — | ✅ | tutti | dom 01:00 |
| `protected_area` | dossier | Natura 2000 (EEA) / WDPA | — | ➕ | tutti | dom 11:00 (stretch) |
| `uas_zone` | dossier | zone UAS ENAC d-flight / EASA | — | ➕ | H T | stretch |
| `wind_10m` (proposta) | dossier | MERRA-2 `M2TMNXSLV` | — | ✅ | H T | stretch |
| maschera delle terre emerse | griglia | `MOD44W` | — | ✅ | tutti | sab 20:00 |
| immagini della card | card | Sentinel-2 / tile GIBS | LROC / Moon Trek | ✅ | tutti | dom 11:00 |
| filtro Italia/Europa | UI | confini Natural Earth | — | ➕ | tutti | dom 11:00 |

Il nucleo NASA della Terra (DEM, MODIS, VIIRS, MERRA-2) è indispensabile: senza, il prodotto non esiste. È quello che regge il criterio Relevance.

### 10.2 File scritti a mano (`data/config/`)

| File | Stato | Cosa manca | Chi | Entro |
|---|---|---|---|---|
| `params.csv` | v0 (Timo) | aggiungere `wind_10m` e, per le EVA, la varietà geologica | Timo, Rocco | sab 22:30 |
| `tests.yaml` | v0 (Timo) | rivedere i pesi; sostituire `ksc_alhat_field` | Rocco | sab 22:30 |
| `targets/artemis.csv` | da fare | 9 siti con le colonne del §9 | Rocco (letteratura), Edo (LOLA se c'è tempo) | 1 sito per le 22:30, tutti per le 01:00 |
| `facilities.csv` | da fare | strutture con `covers`: LUNA, ALTEC, SLOPE, KSC, Ames, Langley, Marshall, LAMA, Huailai, LSPG, TVAC e vibrazioni (ESTEC, Argotec), NBL, ARGOS, Chamber B, Novespace | Rocco, aiuta Timo | dom 01:00 |
| `known_sites.csv` | da fare | almeno gli id usati in `tests.yaml`: `etna_piano_concazze`, `etna_cisternazza`, `cinder_lake`, `death_valley`, `mojave`, `sf_volcanic_field`, `black_point_lava_flow`, `sithampoondi_anorthosite`, `lofoten`, `greenland_anorthosite` (+ Teide, Meteor Crater, Rogers Lakebed) | Rocco | dom 01:00 |
| `materials.csv` | da fare | classi di roccia e sorgenti (per `rock_class` e ISRU) | Rocco | dom mattina |

### 10.3 Output della pipeline (Edo, `data/export/`)

- `scores.csv`: `h3` più una colonna per ogni parametro con ruolo `score`, `filtro`, `card` o `dossier`, ognuno 0–255, vuoto = nessun dato (nuovo contratto di `requirements-tecnici.md` §6).
- `sites/<site>__<test>.json`: top siti naturali, `s` per parametro, totale, `new`, "si rompe", struttura che copre, dossier.
- `benchmark.json`: matrice 9 siti × 3 test MVP, con miglior sito naturale e struttura indoor.

### 10.4 Ordine di lavoro della pipeline

1. Griglia H3 + `MOD44W` → **export di prova con valori finti (20:00)**.
2. DEM a 90 m → `slope_p90`, `roughness`, `elevation_m`.
3. `low_sun_frac` calcolato + `ndvi` → primo punteggio rover su 1 sito Artemis (**22:30**).
4. `MOD10CM`, LST + albedo, SoilGrids → `snow_free_months`, `grain_proxy`, `albedo`, `bulk_density`, `rock_cover`.
5. `crater_density` (depressioni + layer GVP / Impact Database).
6. 9 siti × 3 test (rover, volo lidar, volo camera), `new`, copertura (**01:00**).
7. Domenica mattina: zoom a 30 m sui candidati, dossier (`night_lights`, aree protette), nuvole, numeri di validazione.

## 11. Piano sui gate (`decisioni.md`)

| Quando | Edo | Rocco | Timo |
|---|---|---|---|
| sab 20:00 | export di prova (valori finti, colonne di `params.csv`) | revisione dei pesi di `tests.yaml` | mappa che legge l'export |
| sab 22:30 | rover su 1 sito Artemis: `slope_p90`, `roughness`, `low_sun_frac`, `ndvi` | `artemis.csv` almeno 1 sito; coordinate dei siti TAS-I | selettore dei test, heat map |
| dom 01:00 | 9 siti × 3 test, `new`, copertura | `artemis.csv` completo, `facilities.csv`, `known_sites.csv` | card con barre e "si rompe" |
| dom 09:00-11:00 | `crater_density`, dossier, numeri di validazione | testi di "si rompe" e "cosa testare"; terramecanica (facoltativa) | dossier nella card, vista benchmark, deploy |
| dom 11:00 | freeze | freeze | freeze, app online |
| dom 11:00-15:30 | figura di validazione, testo del metodo | 7 slide, pitch | video da 30 s, pagina del progetto, submit alle 15:30 |

## 12. Rischi e piani B

| Rischio | Piano B |
|---|---|
| DEM polare LOLA troppo pesante | profili dei siti Artemis dalla letteratura; LOLA solo per 1-2 siti |
| Abbondanza di rocce Diviner non scaricabile (un altro team non l'ha trovata) | rugosità LOLA su distanze brevi |
| Crateri da 1-50 m invisibili a 90 m | layer GVP ed Earth Impact Database; zoom con Sentinel-2 o ArcticDEM; dichiararlo |
| SoilGrids debole su roccia nuda | più peso a `grain_proxy`; controllare sui siti noti |
| `MCD43A3` in HDF4 | albedo VIIRS |
| `ksc_alhat_field` non validabile | Rogers Lakebed o SFVF (§7) |
| Piano delle Concazze non esce in alto | controllare scala e pesi; se resta basso, dirlo e spiegare perché |
| Tre test dell'MVP sono troppi | i due test di volo condividono i parametri: se manca tempo, resta solo il volo con lidar |

## 13. Demo e pitch

**Video da 30 s:**
1. scegli Malapert → test rover → heat map → Etna in cima (la scelta di TAS-I rifatta) → un sito **nuovo** vicino;
2. card con "si rompe" e struttura indoor;
3. cambio test su volo con lidar → la mappa si ridisegna → campo di crateri naturale contro il campo costruito di Morpheus.

**Pitch di 4 minuti (7 slide):**
1. **Problema:** 10 mesi per scegliere il sito del rover; campi di crateri costruiti a mano per i voli; EVA provate di notte con lampade.
2. **Soluzione:** "dacci il sito e il test, ti diamo dove, quanto è fedele, cosa resta indoor".
3. **Demo:** il video sopra.
4. **Scienza e dati:** dati NASA, validazione sulla scelta di TAS-I e sui siti dei sensori di volo, i limiti dichiarati.
5. **Mercato e business:** da 57 a 20 giornate-persona per campagna [A]; economia lunare fino a 127 miliardi $ (PwC); report o abbonamento; ALTEC come canale.
6. **Concorrenza:** le strutture vendono fedeltà senza misurarla; gli altri team rispondono solo al *dove*.
7. **Team e invito all'azione:** "un pilota con il team del rover ETNA e con Argonaut".

## 14. Domande aperte

- Rocco: pesi dei 3 test MVP in `tests.yaml`.
- `ksc_alhat_field` → Rogers Lakebed o SFVF?
- `wind_10m` in `params.csv` come dossier?
- EVA: resta "coming soon" o diventa anteprima, visto che è il caso più forte per la luce radente?
- Fonti esterne da dichiarare: SoilGrids, USGS, GVP / Impact Database, Natura 2000 / WDPA, zone UAS, Natural Earth, ArcticDEM.
- Nome del prodotto: "Analog Atlas" è già preso.

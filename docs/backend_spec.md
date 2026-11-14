# Backend spec — la pipeline spiegata passo per passo (per Edo)

Autore: Edo · 2026-11-14 20:50 (rev. 2: riscritta per spiegare che cosa fa ogni pezzo).

Basata su:
- `docs/proposta-finale.md`;
- `data/config/tests.yaml` e `data/config/params.csv`;
- `docs/reference-codice.md` (tecniche da riprendere da altri repo);
- il formato dati che l'app di Timo già usa (`src/web/src/data.js`).

**Scope (AGENTS.md):** scrivo in `src/pipeline/` e `data/`; `data/config/` lo leggo soltanto (ne è responsabile Rocco); `src/web/` è di Timo. Il formato dei file di export è il **contratto** con l'app: se lo cambio, lo scrivo qui e lo dico a Rocco.

**Decisioni confermate (20:40):**
1. DEM sopra i 60°N: AW3D30 di JAXA.
2. File intermedi in `data/raw/interim/`.
3. Risoluzione massima: Luna nativa (5-20 m), Terra 30 m, confronto a 30 m + esponente di Hurst.
4. Formato JSON approvato.

**Come leggere ogni passo:** *In parole semplici* → *Perché serve* → *Cosa fai* → *Cosa ottieni* → *Fatto quando* → *Dettaglio tecnico* (codice). Il codice serve quando lo scrivi; le prime cinque voci servono a capire che cosa stai facendo.

Legenda: ⚠ = ID o comportamento da verificare alla prima esecuzione.

---

## A. Il quadro generale in una pagina

**La domanda a cui risponde il prodotto:** *"Devo fare il test Y per il sito X (3 sulla Luna, 2 su Marte). Quali posti sulla Terra gli somigliano di più, in che cosa, e che cosa invece manca?"*

La pipeline è un imbuto in sei tappe:

1. **Descrivere la Terra.** Divido la superficie in ~600.000 esagoni da ~250 km² ciascuno. Per ogni esagono calcolo una **carta d'identità**: una manciata di numeri misurati dai satelliti (quanto è ripido, quanto è accidentato, quanta luce radente ha, se c'è vegetazione, quanti crateri, ecc.).
2. **Descrivere la Luna.** Per ognuno dei 5 siti della demo (Luna: Malapert Massif, Haworth, Nobile Rim 1; Marte: Phoenix, Gale) compilo la **stessa carta d'identità**, con gli stessi numeri calcolati allo stesso modo, ma dai dati lunari (LOLA, Diviner, …) e marziani (DTM CTX/HiRISE, THEMIS, TES).
3. **Confrontare.** Per un test (es. rover) confronto ogni esagono con il sito Artemis, numero per numero. Ogni numero prende un **voto da 0 a 1** (1 = identico). I voti si combinano con i **pesi del test** in un voto totale. Per il rover conta molto la pendenza; per il volo con lidar contano crateri e rocce.
4. **Trasformare gli esagoni in siti.** Prendo gli esagoni migliori, unisco quelli vicini in "siti", gli do un nome, controllo se sono **nuovi** (lontani dai siti di test già usati), elenco **cosa non torna** e **quale struttura indoor lo copre**, aggiungo le **informazioni pratiche** (stagione, accesso, aree protette, vento).
5. **Scrivere i file per l'app.** JSON che l'app di Timo legge così come sono.
6. **Dimostrare che funziona.** I siti già usati (l'Etna per il rover di TAS-I, Death Valley per il volo) devono uscire in alto. Se succede, il metodo è credibile e i siti **nuovi** con voto simile diventano il risultato da presentare.

**Esempio per fissare le idee** (numeri inventati): sito Malapert × test rover.

| Numero | Malapert (Luna) | Esagono dell'Etna | Esagono del Sahara piatto |
|---|---|---|---|
| pendenza (p90, a 30 m) | 24° | 21° → voto 0,9 | 2° → voto 0,01 |
| rugosità | alta | alta → 0,8 | bassissima → 0,05 |
| luce radente | 1 (sempre) | bassa → 0,1 (si rompe) | bassa → 0,1 |
| **voto totale** | — | **~0,7** | **~0,03** |

La luce dell'Etna "si rompe", e la card dice dove si recupera: luci radenti di ALTEC o laboratorio Ames.

## B. Glossario

| Parola | Cosa vuol dire qui |
|---|---|
| **Pipeline** | una catena di programmi: ognuno legge l'output del precedente e produce il suo |
| **Raster** | un'immagine fatta di numeri invece che di colori: una griglia dove ogni pixel contiene un valore (quota, temperatura, …) |
| **Pixel / risoluzione** | la casella del raster; "30 m" vuol dire che ogni pixel copre 30 × 30 m |
| **DEM** | Digital Elevation Model: un raster in cui ogni pixel è la quota del terreno. Da qui si calcolano pendenze, rugosità, crateri |
| **Baseline** | la distanza su cui misuri la pendenza. Più è corta, più la pendenza è alta: per confrontare Terra e Luna serve la stessa baseline |
| **Pendenza p90** | il 90° percentile delle pendenze in un'area: "il 10% del terreno è più ripido di così". Descrive i tratti ripidi senza farsi ingannare da un solo pixel strano |
| **Rugosità** | quanto il terreno è irregolare a piccola scala: la deviazione standard della quota attorno alla sua media locale |
| **Esponente di Hurst (H)** | dice come cambia la pendenza al cambiare della baseline. Serve a stimare la pendenza terrestre a 5-20 m, dove non abbiamo dati, partendo da 30-240 m |
| **NDVI** | indice di vegetazione da satellite (−1…1). Sotto 0,1 vuol dire suolo nudo |
| **Maschera** | un raster di sì/no che dice quali pixel usare. La nostra: terra emersa **e** NDVI mediano dei mesi senza neve < 0,2 |
| **H3 / cella** | griglia di esagoni della Terra (sistema H3 di Uber). Alla risoluzione 5 ogni cella è ~250 km². Ha un identificativo tipo `851e8053fffffff` |
| **valid_share** | quota della cella che passa la maschera: quanta area utile c'è |
| **Google Earth Engine (GEE)** | servizio di Google che contiene i dataset satellitari (MODIS, NASADEM, …) e li elabora **sui suoi server**: io mando la ricetta, lui calcola e mi restituisce il risultato. Niente download di terabyte |
| **reduceResolution** | in GEE: riassume tanti pixel piccoli in un pixel grande (media, percentile, somma) |
| **computePixels** | in GEE: "dammi i numeri di questa area come array". Lo uso per scaricare i raster a pezzi (tile) |
| **Percentile terrestre** | dove sta un valore rispetto a tutta la Terra: "più ripido dell'80% delle celle" = 80° percentile. Mette sulla stessa scala gradi, metri e frazioni |
| **s (voto per parametro)** | numero da 0 a 1: quanto un parametro della cella somiglia al sito Artemis |
| **τ (tau)** | quanto è severo il voto: con τ = 0,1, una differenza di 10 punti percentuali dà già un voto di ~0,37 |
| **Media geometrica pesata** | il modo di combinare i voti: un voto pessimo su un parametro importante affossa il totale (con la media normale verrebbe compensato) |
| **κ (kappa)** | quanta parte del peso ha dati: se mancano troppi dati (κ < 0,7) la cella non entra in classifica |
| **Filtro** | condizione rigida: se non la rispetti sei fuori (es. rover: pendenza p90 ≥ 15°) |
| **Indoor / copertura** | cose che la Terra non dà mai (gravità 1/6, vuoto, …) o che non tornano: la card dice dove farle al chiuso |
| **Export / contratto** | i file che scrivo per l'app. Il formato è un patto con Timo: se lo cambio, la sua app si rompe |
| **GeoTIFF / Parquet / JSON** | formati di file: raster con coordinate / tabelle compresse / testo strutturato per l'app |
| **Mock** | dati finti con il formato vero, per far lavorare l'app prima che i dati veri siano pronti |

## C. I pezzi della pipeline

```
data/config/ (Rocco) ──┐                                                         ┌──► app di Timo
                       │   GEE: maschera + raster   features.py:   score.py:      │
dataset della Terra ───┼─► (gee_export.py) ───────► raster → celle ► voti ► sites.py ► export.py
 (su Earth Engine)     │                                ▲             ▲           │
                       │   sun.py: tabella luce ────────┘             │           └──► validate.py
dati lunari ───────────┴─► lunar.py: carta d'identità dei 5 siti ─────┘                (numeri per la slide)
```

| Modulo | Cosa fa, in parole semplici | Legge | Scrive |
|---|---|---|---|
| `config.py` ✅ | il "pannello di controllo": percorsi delle cartelle, costanti, lettura di `tests.yaml` e `params.csv` | `data/config/` | — |
| `run.py` ✅ | il pulsante di avvio: `python -m src.pipeline.run --step <passo>` lancia un passo | — | — |
| `mock_export.py` | crea i file per l'app con numeri finti, per sbloccare Timo subito | `config` | `data/export/` |
| `gee_common.py` | le ricette comuni per Earth Engine: maschera, DEM, "riassumi i pixel", "scarica a pezzi" | — | — |
| `gee_export.py` | per ogni parametro chiede a GEE il raster globale e lo salva | GEE | `data/raw/gee/*.tif` |
| `grid.py` | crea l'elenco degli esagoni di terra | raster terra/maschera | `cells.parquet` |
| `sun.py` | calcola una volta sola la tabella "quanta luce radente c'è a ogni latitudine in ogni mese" | — | `low_sun_table.npy` |
| `features.py` | riempie la carta d'identità di ogni esagono partendo dai raster | raster, tabella luce | `features.parquet` |
| `lunar.py` | compila la carta d'identità dei 5 siti (3 Luna, 2 Marte) dai dati lunari e marziani | `artemis.csv`, LOLA | `targets.json` |
| `score.py` | dà i voti: per parametro e totale, per ogni esagono × sito × test | feature, target, `tests.yaml` | voti in memoria |
| `sites.py` | dagli esagoni migliori ai siti: nome, nuovo/noto, cosa non torna, dossier | voti, `known_sites`, `facilities` | — |
| `export.py` | scrive i file finali per l'app | tutto | `data/export/` |
| `validate.py` | controlla che i siti noti escano in alto e prepara la figura per la slide | voti, `known_sites` | `validation.json`, `.png` |

`✅` = già scritto (passo 0).

## D. Tabella di marcia

| # | Passo | Entro |
|---|---|---|
| 0 | Ambiente e Earth Engine | **fatto, tranne GEE** (tocca a te, §1.3) |
| 1 | Export di prova (mock) | subito: sblocca Timo |
| 2 | Griglia di esagoni e maschera | 21:45 (poi si esce dal Politecnico) |
| 3 | Raster del terreno a 30 m + tabella della luce | 22:15 |
| 4 | Carta d'identità degli esagoni + primo voto (Malapert × rover) | **22:30: primo end-to-end** |
| 5 | Gli altri raster (albedo, suolo, neve, crateri) | 23:30 |
| 6 | Carta d'identità dei 5 siti (3 Luna, 2 Marte) | 00:15 |
| 7 | 5 siti × 3 test: voti, siti, copertura | **01:00** |
| 8 | Dossier, zoom, immagini | dom 10:00 |
| 9 | Validazione + EVA in anteprima | **dom 11:00 (freeze)** |
| 10 | Testi per la submission | dom 14:30 |

## E. Cosa è cambiato stasera rispetto al piano (e perché)

Scoperte fatte facendo girare il codice (sab 20:50-23:15). Il codice segue queste scelte; i paragrafi più sotto descrivono ancora il piano originale dove non sono stati riscritti.

| # | Cosa | Prima | Ora | Perché |
|---|---|---|---|---|
| 1 | Maschera "suolo nudo" | NDVI **massimo** < 0,1 | NDVI **mediano** < **0,2**, sul pixel da 1 km, **solo nei mesi senza neve e senza nuvole** (`SummaryQA` ≤ 1) | Con il massimo < 0,1 metà dei siti di validazione spariva: Black Point, SFVF, Meteor Crater e Mojave hanno lo 0% di area sotto 0,1 entro 5 km, ~100% sotto 0,2. 0,2 è la soglia standard per "suolo nudo o vegetazione rada". I mesi con neve vanno esclusi: con la mediana di tutto l'anno la neve invernale abbassava l'NDVI e la **tundra verde passava** (Taymyr −0,01 sull'anno, 0,55 senza neve; Svalbard e Quebec ~0,5). Nei deserti non cambia nulla; Devon Island/Haughton resta valida (0,16). Corretto alle 23:00. **Va detto a Rocco** (`tests.yaml` ha ancora `ndvi < 0.1`) |
| 2 | Maschera terra/acqua | MODIS `MOD44W` v061 | **v006** (immagine 2015) | la collezione v061 su Earth Engine esiste ma è vuota |
| 3 | DEM sopra i 60°N | AW3D30 V3_2 su tutto il mondo | **AW3D30 V4_1** solo sopra 59,5°N | la V3_2 è deprecata; comporre tutti i 24.000 tasselli anche sugli oceani rallentava ogni richiesta |
| 4 | Terreno su tutto il mondo | 30 m (poi 90 m) | **due fasi**: screening a **500 m** su tutti i pixel, poi **30 m esatti** esagono per esagono | Earth Engine rifiuta richieste oltre ~67 milioni di pixel di partenza e oltre ~100 MB per oggetto; a 90 m un quadrato da 3° richiedeva 4 minuti. La fase a 30 m va veloce sul singolo esagono (~1 s), ma su tutti i ~253 mila esagoni sono 4-10 ore: si fa solo su campione, siti noti e candidati (vedi riga 13) |
| 5 | Riferimento dei percentili a 30 m | — | un **campione casuale di 3.000 esagoni** validi, calcolato per primo | se i percentili si calcolassero solo sui candidati (già i più simili), i voti sarebbero distorti. Se la fase a 30 m finisce su tutti gli esagoni, il riferimento diventa l'intera Terra |
| 6 | Crateri | minimo locale entro 150 m, 3 m sotto la media | entro **300 m**, almeno **20 m sotto il bordo**; ogni gruppo di pixel minimi connessi conta **1**; laghi esclusi (JRC Global Surface Water) | con la soglia bassa contavamo il **rumore del DEM** sulle piane (7-21 "crateri"/km² a Mojave, ~0 sull'Etna); ora i valori più alti escono a Cinder Lake e SFVF, veri campi di crateri. Poi un secondo difetto: un fondo piatto (lago, conca, fondo del Meteor Crater) ha molti pixel minimi alla pari e ognuno contava come un cratere, quindi 100-400/km² nello scudo canadese e nell'Artico. Contando i gruppi connessi si scende a 2-4/km² lì, e Cinder Lake 0,65, SFVF 0,45, Meteor Crater 0,18. Stesso detector da usare su LOLA |
| 7 | Neve | MOD10A1 giornaliero | **MOD10A2** (compositi di 8 giorni) | ~8 volte meno immagini, stessa informazione per i mesi senza neve |
| 8 | Albedo | MCD43A3 giornaliero, 3 anni | un'immagine **ogni 16 giorni** | tutte e 1.100 le immagini sforavano la memoria; per una mediana ne bastano ~70 |
| 9 | Luce radente | solo `low_sun_frac` | anche **`low_sun_hours`** (ore al giorno con il Sole tra 0° e 7°) | la frazione vale 1 anche a 64°N d'inverno con 4 ore di luce; le ore distinguono (78°N ad agosto: 6,4 h). **Proposta a Rocco:** usare le ore nel voto |
| 10 | Robustezza | — | tempo massimo di 5 minuti per richiesta; quadrati salvati appena finiti; i quadrati troppo pesanti si dividono in 4 | alle 21:31 la rete è caduta e i calcoli sono rimasti appesi: abbiamo perso 49 quadrati. Ora un'interruzione costa al massimo i quadrati in corso |
| 11 | Modalità test | — | `--sample`: solo le zone campione (Sicilia, Arizona e California, Canarie, Sahara), in cartelle separate | permette di provare tutta la catena in pochi minuti senza toccare i dati globali né l'export dell'app |
| 12 | DEM sopra i 60°N | NASADEM con i buchi riempiti da AW3D30 (`unmask`) | **mosaico** AW3D30 sotto e NASADEM sopra | `unmask` non riempie fuori dall'impronta di NASADEM: sopra i 60°N il DEM restituiva **zero pixel**. Il 23% del campione (Scandinavia, Siberia, Canada, Groenlandia) era vuoto. Trovato e corretto alle 22:30; il 500 m nordico e il campione nordico sono stati ricalcolati |
| 13 | 30 m per tutti gli esagoni | calcolo esatto su tutti (4-10 ore) | **calibrazione** dal 500 m sul campione di 3.000 esagoni (`calibrate.py`), poi **30 m esatti solo per i candidati** e i siti noti | ogni prova del backend richiederebbe ore. Modello: gradient boosting sui logaritmi (tra due scale la pendenza cambia come una legge di potenza, la stessa fisica di Hurst), con ingressi 500 m, quota, latitudine, albedo, temperature, neve e grana. Prima versione: R² 0,90 per la pendenza p90 (errore mediano 1,2°) e 0,87 per la rugosità; una retta tra i logaritmi dava 0,73 e sottostimava di ~6° i pendii sopra 30°. L'errore si misura su esagoni che il modello non ha visto (validazione incrociata a 5 parti) e si dichiara. Le stime servono solo a scegliere i candidati: nelle card e nella classifica finale ci sono i valori esatti (`terrain_src = 30m`) |
| 14 | Quota di Earth Engine | — | piano **Community** (150 EECU-ore al mese), in **restricted mode** da sabato sera | le prove a 30 m e 90 m hanno esaurito la quota mensile. Earth Engine funziona ancora, con meno richieste in parallelo: il codice ora aspetta e riprova (fino a 2 minuti, 6 tentativi) invece di saltare. Il piano Contributor (1.000 EECU-ore) richiede un account di fatturazione con pagamento anticipato: per ora no. La quota torna il 1° dicembre |
| 15 | Perimetro della demo | 9 siti Artemis × 3 test MVP + EVA in anteprima + ISRU e trivella coming soon | **5 siti** (Luna: Malapert Massif, Haworth, Nobile Rim 1; Marte: Phoenix, Gale) × **5 test** tutti nella demo: rover, lidar, camera, EVA, touchdown | decisione del team (sab sera): nella demo solo quello che funziona davvero. Gli stessi siti sono nell'app di Timo |
| 16 | Resistenza del suolo | solo nella card | test **`landing_touchdown`**: pendenza 0,30, densità 0-5 cm 0,25, grana 0,20, sassi 0,15, rugosità 0,10; filtro pendenza p90 ≤ 15° (pesi proposti da Edo, da confermare con Rocco) | serve a gambe del lander e getto del motore sulla regolite. Non esiste una mappa globale della portanza: proxy densità + grana + sassi, da dichiarare. Zero runtime in più: i parametri c'erano già |
| 17 | Test della demo | 5 test (rover, lidar, camera, EVA, touchdown) | **3 test**: `flight_hda_lidar`, `rover_mobility`, **`isru_resources`** | decisione del team sul testo della challenge (dom 00:20). ISRU = ghiaccio nel suolo (proxy: temperatura media annua MODIS < −1 °C, `permafrost_share`) + materiali (tessitura SoilGrids `sand_pct`, `clay_pct`; densità; grana). Il carbonio organico SoilGrids è inaffidabile nell'alto Artico: solo card. Il touchdown della riga 16 esce |
| 18 | Velocità della fase a 30 m | — | maschera calcolata a 1 km e poi ingrandita; crateri con 1 cm di rumore al posto di `connectedPixelCount` | dopo i fix delle 23:00 un gruppo da 20 esagoni durava ~100 s (Earth Engine rifaceva la mediana NDVI a 30 m per ogni pixel, e contava i gruppi connessi). Ora 25 s, con crateri nello stesso ordine (Cinder Lake 0,46, SFVF 0,28, Meteor Crater 0,12) |
| 19 | Quota di Earth Engine | Community, restricted mode | **Contributor** (1.000 EECU-ore al mese), attivato dom 00:00 | fatturazione collegata al progetto; Earth Engine non commerciale non si paga |

**Limiti noti da dichiarare:**
- **L'Antartide manca:** l'NDVI MODIS non la copre.
- **Le calotte di ghiaccio** (Groenlandia) escono già dalla maschera, perché non hanno mesi senza neve; in più il voto esclude gli esagoni senza mesi liberi da neve.

**Comandi aggiunti:**
- `--step terrain --scale 500` (screening);
- `--step surface [--groups thermal soil snow dossier isru]`;
- `--step fine --scope sample|all` (30 m);
- `--step calibrate`: relazione 500 m → 30 m con l'errore dichiarato;
- `--step earth`: tutta la Terra in fila (terreno 500 m, superficie, campione a 30 m, calibrazione, carta d'identità); i passi già fatti si saltano;
- `--step export [--publish] [--no-refine] [--no-dossier]`: tutti i siti × test fino ai file per l'app; senza `--publish` scrive in `data/raw/export_preview/`. Il voto gira in locale in ~30 s; Earth Engine serve solo per i candidati nuovi e il dossier;
- `--sample` per la modalità test.

---

## 1. Passo 0 — ambiente e account ✅ (manca solo GEE)

**In parole semplici:** preparo il banco di lavoro: una cartella per il codice, le librerie Python che servono, e l'accesso a Earth Engine.

**Perché serve:** senza l'ambiente il codice non gira; senza Earth Engine non ho i dati della Terra.

### 1.1 Cosa è già fatto

- **Cartelle create:**
  - `src/pipeline/` (codice);
  - `data/raw/gee/`, `data/raw/lola/`, `data/raw/interim/` (dati scaricati e intermedi, fuori da git perché `data/raw/` è ignorato);
  - `data/export/` (file per l'app, che invece vanno su git).
- **Ambiente Python 3.11** in `src/pipeline/.venv`, che è ignorato da git grazie a `src/pipeline/.gitignore`. Librerie in `src/pipeline/requirements.txt`, una riga per libreria con a cosa serve.
- **`config.py`:** il pannello di controllo. Contiene i percorsi, le costanti (risoluzione 0,05°, H3 livello 5, baseline 30 m, periodo 2021-2023), i nomi dei 5 siti della demo (`SITES`; i 9 siti Artemis restano solo per il mock) e lo `slug` che trasforma "Malapert Massif" in `malapert_massif`, e le funzioni che leggono `tests.yaml`, `params.csv` e il file `.env`.
- **`run.py`:** il pulsante di avvio. Per ora c'è il passo `check`.

### 1.2 Come si usa

```bash
cd ~/dev/nasa-space-apps/hackathon_NASA/hackaton_NASA
source src/pipeline/.venv/bin/activate        # "entra" nell'ambiente Python della pipeline
python -m src.pipeline.run --step check       # controlla che tutto sia a posto
```

Il `check` verifica 4 cose:
1. le librerie;
2. i file di config del team (e che i pesi di ogni test sommino a 1);
3. le cartelle;
4. l'accesso a Earth Engine.

Oggi passano le prime 3; la 4 aspetta te.

### 1.3 Cosa devi fare tu: Earth Engine (10 minuti)

1. **Registra un progetto** su https://code.earthengine.google.com/register, scegliendo **uso non commerciale** (ricerca o istruzione) e un progetto Google Cloud, nuovo o esistente. Annota l'**ID del progetto**.
2. **Autenticati** dal terminale di Claude Code:

   ```
   ! src/pipeline/.venv/bin/earthengine authenticate
   ```

   Si apre il browser e dai il consenso con il tuo account Google.
3. **Scrivi l'ID del progetto nel file `.env`** nella radice della repo (è ignorato da git): `GEE_PROJECT=il-tuo-id`. C'è un esempio in `src/pipeline/.env.example`.
4. **Rilancia il check:** al punto 4 deve stampare le bande di NASADEM (`['elevation', 'num', 'swb']`).

**Fatto quando:** `--step check` termina senza errori.

**Piano B (se GEE non va entro le 21:30):** scaricare da Earthdata le versioni già riassunte a 0,05° (`MOD13C2`, `MOD11C3`) e il DEM a 90 m (`SRTMGL3`). È più grossolano, ma funziona in locale.

---

## 2. Passo 1 — export di prova (mock)

**In parole semplici:** creo **adesso** i file che l'app leggerà, con il formato definitivo ma con numeri finti.

**Perché serve:** Timo può collegare l'app ai file veri da subito, invece di aspettare che i dati veri siano pronti. Quando arrivano i dati veri cambio solo i numeri, non il formato.

**Cosa fai:** scrivi `mock_export.py`, che produce un file per ogni coppia sito Artemis × test (9 × 4 = 36 file), più i file di contorno. L'export vero (`export.py`) è 5 siti × 3 test = 25 file, stesso formato.

**Cosa ottieni:** `data/export/` con `sites/*.json`, `targets.json`, `benchmark.json`, `facilities.json`, `known_sites.json`, `manifest.json`.

**Fatto quando:** i 36 JSON sono validi e Timo conferma che l'app li legge. Poi commit di `data/export/` e messaggio a Rocco ("il contratto è §2 di backend_spec").

### 2.1 Come si chiamano le cose

- **Siti della demo:** Luna `malapert_massif`, `haworth`, `nobile_rim_1`; Marte `phoenix`, `gale`. (Il mock usava i 9 siti Artemis: `peak_near_cabeus_b`, `haworth`, `malapert_massif`, `mons_mouton_plateau`, `mons_mouton`, `nobile_rim_1`, `nobile_rim_2`, `de_gerlache_rim_2`, `slater_plain`.)
- **Test:** `rover_mobility`, `flight_hda_lidar`, `flight_trn_camera` (MVP), `eva_traverse` (anteprima).
- **Nome del file:** `data/export/sites/<sito>__<test>.json`, per esempio `malapert_massif__rover_mobility.json`.

### 2.2 Cosa c'è dentro un file sito × test

È la stessa forma che l'app usa già con i suoi dati finti (`results` + `cells`), con qualche campo in più.

- **`results`:** i 10 migliori siti naturali sulla Terra. Per ognuno:
  - **dove:** `name`, `lat`, `lon`, `country`;
  - **quanto somiglia:** `score` (voto totale 0-1) e `kappa` (quanto è affidabile);
  - **se è nuovo:** `new`, `known_site`;
  - **voti per parametro** (`params`, 0-1);
  - **valori fisici sulla Terra** (`values`) e **sulla Luna** (`target`), per le barre Terra contro Luna;
  - **cosa non torna e dove si recupera** (`breaks`);
  - **informazioni pratiche** (`dossier`).
- **`cells`:** gli esagoni da colorare nella mappa di calore (al massimo 20.000, i migliori).

```json
{
  "site": "malapert_massif", "test": "rover_mobility", "status": "mvp",
  "generated_at": "2026-11-14T21:00:00+01:00", "mock": true,
  "results": [{
    "id": "r01", "name": "Etna, Piano delle Concazze", "lat": 37.77, "lon": 15.03, "country": "Italy",
    "score": 0.87, "kappa": 0.95, "new": false, "known_site": "etna_piano_concazze",
    "h3_cells": ["851e8053fffffff"],
    "params": {"slope_p90": 0.91, "roughness": 0.74, "grain_proxy": 0.62, "rock_cover": 0.55,
               "low_sun_frac": 0.12, "crater_density": 0.70, "rock_class": 0.40},
    "values": {"slope_p90": 21.4, "roughness": 6.2, "low_sun_frac": 0.05, "rock_class": "basalt_volcanic"},
    "target": {"slope_p90": 24.0, "roughness": 7.0, "low_sun_frac": 1.0, "rock_class": "anorthosite"},
    "breaks": [
      {"param": "low_sun_frac", "why": "la Terra non arriva al Sole radente lunare",
       "covered_by": ["Ames Lunar Lab", "ALTEC (luci a ~8°)"]},
      {"param": "gravity_1_6", "why": "indoor", "covered_by": ["LUNA (offload)", "ARGOS, NASA JSC"]}],
    "dossier": {"snow_free_months": 7, "night_lights": 3.1, "protected_area": true,
                "protected_area_name": "Parco dell'Etna", "wind_10m": null}
  }],
  "cells": [{"h3": "851e8053fffffff", "score": 0.87}]
}
```

**Regole:**
- `params` contiene solo i parametri che pesano in quel test.
- `breaks` = parametri con voto < 0,3 + le voci `indoor` del test.
- `wind_10m` vale `null` se il test non è di volo.

### 2.3 Gli altri file

| File | Cosa contiene, in parole semplici |
|---|---|
| `targets.json` | la carta d'identità dei 5 siti della demo (valori, fonte di ogni valore, dati per la card: temperature, idrogeno, densità della crosta, unità geologica) |
| `benchmark.json` | la tabella 5 siti × 3 test: miglior sito, miglior sito nuovo, strutture indoor. È la slide del pitch |
| `facilities.json` | le strutture indoor (da `facilities.csv` di Rocco) |
| `known_sites.json` | i siti di test già usati (da `known_sites.csv`), per i pin sulla mappa |
| `manifest.json` | il "frontespizio": versione, data, se è mock, elenco dei file, dataset usati con licenza |

---

## 3. Passo 2 — griglia di esagoni e maschera

**In parole semplici:** costruisco il "mosaico" della Terra: l'elenco di tutti gli esagoni di terra emersa, e per ognuno quanta parte è utilizzabile (senza vegetazione).

**Perché serve:** l'esagono è l'unità su cui confronto tutto. La maschera evita di scartare un sito buono solo perché nell'esagono c'è anche un bosco: l'Etna ha boschi sui fianchi, ma la cima è nuda.

**Cosa fai:**
1. Su Earth Engine costruisci la **maschera**: pixel di terra (MODIS `MOD44W`) **e** senza vegetazione (NDVI massimo 2021-23 < 0,1).
2. Scarichi due raster a 0,05°: "quanta terra" e "quanta area valida" (`valid_share`).
3. In locale, per ogni pixel di terra calcoli in quale esagono H3 cade, e così ottieni l'elenco degli esagoni.

**Cosa ottieni:** `data/raw/interim/cells.parquet`, una riga per esagono (~600.000) con id, coordinate del centro, `land_share`, `valid_share`.

**Fatto quando:** ~600k esagoni; quello dell'Etna (37,75; 15,0) ha `valid_share > 0`.

### 3.1 Due concetti di Earth Engine

- **"Riassumi i pixel"** (`to_grid`): i dati nativi hanno pixel da 30 m-1 km; io li riassumo in pixel da 0,05° (~5,5 km) con una regola (media, percentile, somma), **usando solo i pixel che passano la maschera**. È qui che i filtri si applicano ai pixel e non alle celle.
- **"Scarica a pezzi"** (`fetch`): il mondo a 0,05° è 7.200 × 3.600 pixel; lo chiedo a GEE in quadrati da 30° (600 × 600 pixel) e li ricompongo in un GeoTIFF. Niente Google Drive.

### 3.2 Il DEM: NASADEM + AW3D30

Fino a 60°N uso **NASADEM** (NASA, 30 m). Sopra uso **AW3D30** (JAXA, agenzia partner della challenge, 30 m, fino a 82°). ASTER GDEM non è nel catalogo ufficiale di GEE.

### Dettaglio tecnico (`gee_common.py`, `grid.py`)

```python
import ee
RES = 0.05
GRID = [RES, 0, -180, 0, -RES, 90]       # griglia mondiale a 0,05° in lat/lon
YEARS = ("2021-01-01", "2024-01-01")

def valid_mask():
    """Sì/no per pixel: terra emersa E senza vegetazione (NDVI massimo < 0,1)."""
    water = (ee.ImageCollection("MODIS/061/MOD44W").sort("system:time_start", False)
             .first().select("water_mask"))                                      # ⚠ ID
    ndvi_max = (ee.ImageCollection("MODIS/061/MOD13A3").filterDate(*YEARS)
                .select("NDVI").max().multiply(1e-4))                            # scala MODIS
    return water.eq(0).And(ndvi_max.lt(0.1))

def dem():
    """Quota a 30 m: NASADEM dove c'è (fino a 60°N), AW3D30 di JAXA per il resto."""
    nasadem = ee.Image("NASA/NASADEM_HGT/001").select("elevation")
    aw3d = ee.ImageCollection("JAXA/ALOS/AW3D30/V3_2").select("DSM")
    aw3d = aw3d.mosaic().setDefaultProjection(aw3d.first().projection())
    return nasadem.unmask(aw3d).rename("elev")

def to_grid(img, reducer, native_m):
    """Riassume i pixel nativi (solo quelli non mascherati) in pixel da 0,05°."""
    return (img.setDefaultProjection(crs="EPSG:4326", scale=native_m)
               .reduceResolution(reducer=reducer, maxPixels=65535)
               .reproject(crs="EPSG:4326", crsTransform=GRID))
```

```python
import numpy as np, rasterio
from rasterio.transform import from_origin

def fetch(img, band, path, tile_deg=30):
    """Scarica il raster globale a quadrati e lo salva come GeoTIFF."""
    n = int(tile_deg / RES)
    out = np.full((int(180 / RES), int(360 / RES)), np.nan, dtype="float32")
    for r, lat0 in enumerate(range(90, -90, -tile_deg)):
        for c, lon0 in enumerate(range(-180, 180, tile_deg)):
            arr = ee.data.computePixels({
                "expression": img.select(band), "fileFormat": "NUMPY_NDARRAY",
                "grid": {"dimensions": {"width": n, "height": n},
                         "affineTransform": {"scaleX": RES, "shearX": 0, "translateX": lon0,
                                             "shearY": 0, "scaleY": -RES, "translateY": lat0},
                         "crsCode": "EPSG:4326"}})
            out[r*n:(r+1)*n, c*n:(c+1)*n] = arr[band]
    with rasterio.open(path, "w", driver="GTiff", height=out.shape[0], width=out.shape[1], count=1,
                       dtype="float32", crs="EPSG:4326", transform=from_origin(-180, 90, RES, RES),
                       nodata=np.nan, compress="deflate") as dst:
        dst.write(out, 1)
```

Se un quadrato va in timeout (calcoli pesanti), si rimpiccioliscono i quadrati a 10-15°, oppure si usa `Export.image.toCloudStorage`.

**`grid.py`:**
1. `fetch` di `water.eq(0)` e di `valid_mask().unmask(0)`, riassunti con la media.
2. Per ogni pixel con terra > 0: `h3.latlng_to_cell(lat, lon, 5)`.
3. `groupby` per cella → `cells.parquet`.

---

## 4. Passo 3 — raster del terreno e tabella della luce

**In parole semplici:** misuro, su tutta la Terra a 30 m, quanto è ripido e quanto è accidentato il terreno, e preparo una tabella di quanta luce radente c'è a ogni latitudine.

**Perché serve:** pendenza e rugosità sono i parametri più pesanti del rover e del volo; la luce radente è l'elemento del Polo Sud che serve alla navigazione con camera e alle EVA.

**Cosa fai:**
1. Su GEE: pendenze a 4 scale (30, 60, 120, 240 m), rugosità a 30 m, quota.
2. In locale: la tabella della luce (`sun.py`).

**Cosa ottieni:**
- `slope_p90.tif`, `slope_med_30/60/120/240.tif`, `roughness.tif`, `elevation_m.tif`;
- `low_sun_table.npy`.

**Fatto quando:** i file esistono, e a occhio l'Etna è ripida e il Sahara piatto è piatto; l'esponente di Hurst sta quasi ovunque tra 0,5 e 1.

### 4.1 Perché la scala conta (e cos'è Hurst)

Se misuri la pendenza ogni 5 m trovi gradini e sassi; ogni 240 m vedi solo il versante. LOLA arriva a 5-20 m, la Terra (ovunque) a 30 m. Per un confronto onesto:
- **il voto usa la pendenza a 30 m su entrambi i corpi**, misurata davvero, mai inventata;
- **la card mostra anche le scale più fini:** il valore lunare a 5-20 m accanto alla stima terrestre, ottenuta con l'**esponente di Hurst**.

**Come funziona Hurst:** misuri la pendenza a 30, 60, 120 e 240 m e guardi come cala. Su un grafico logaritmico è quasi una retta, e la sua inclinazione ti dice H. Prolunghi la retta fino a 5-20 m e ottieni la stima, segnata "estrapolato". È il metodo usato per la rugosità di LOLA (Rosenburg et al. 2011).

### 4.2 La luce radente

La frazione di ore di luce con il Sole sotto 7° dipende quasi solo da **latitudine e mese**: la longitudine sposta solo l'orario. Quindi non serve calcolarla per 600.000 esagoni. Si calcola una volta per 1.800 latitudini × 12 mesi (pochi secondi), e ogni esagono legge la sua riga della tabella e sceglie **il mese migliore senza neve** (la neve arriva al passo 5).

### Dettaglio tecnico

```python
m = valid_mask()
d30 = dem().reproject(crs="EPSG:4326", scale=30)

def at_baseline(d, L):
    """DEM portato alla risoluzione L (media dei pixel): la base per misurare la pendenza a quella scala."""
    if L == 30:
        return d
    return d.reduceResolution(ee.Reducer.mean(), maxPixels=1024).reproject(crs="EPSG:4326", scale=L)

# ee.Terrain.slope usa i 4 vicini (differenze centrali) ⚠: sulla Luna si replica identico in numpy
slopes = {L: ee.Terrain.slope(at_baseline(d30, L)).updateMask(m) for L in (30, 60, 120, 240)}

slope_p90 = to_grid(slopes[30], ee.Reducer.percentile([90]), 30)          # entra nel voto
slope_med = {L: to_grid(s, ee.Reducer.median(), L) for L, s in slopes.items()}   # serve a Hurst

relief = d30.subtract(d30.focalMean(150, "circle", "meters")).updateMask(m)   # quota meno la media locale
roughness = to_grid(relief, ee.Reducer.stdDev(), 30)

elev = to_grid(d30.updateMask(m), ee.Reducer.mean(), 30)                  # quota media (card)
```

Hurst per pixel, in locale: `H = 1 + inclinazione della retta di log(tan(slope_med)) contro log(L)`.

```python
# sun.py
import numpy as np, pandas as pd, pvlib
times = pd.date_range("2025-01-01", "2026-01-01", freq="1h", tz="UTC", inclusive="left")
lats = np.round(np.arange(-89.95, 90, 0.1), 2)
table = np.zeros((len(lats), 12))
for i, lat in enumerate(lats):
    el = pvlib.solarposition.get_solarposition(times, lat, 0.0)["apparent_elevation"].to_numpy()
    for mo in range(12):
        e = el[times.month == mo + 1]
        table[i, mo] = ((e > 0) & (e < 7)).sum() / max((e > 0).sum(), 1)   # ore radenti / ore di luce
np.save("data/raw/interim/low_sun_table.npy", table)
```

**Costo:** il terreno a 30 m su tutto il mondo è pesante per GEE. Se va in timeout: quadrati da 10°; poi export su Cloud Storage in parallelo; in ultima istanza 90 m per lo screening e 30 m solo sugli esagoni candidati (il voto resta a 30 m).

---

## 5. Passo 4 — carta d'identità degli esagoni e primo voto

**In parole semplici:** riempio la carta d'identità di ogni esagono con i numeri dei raster, poi do il primo voto vero: Malapert × rover.

**Perché serve:** è il **primo end-to-end**. Dati veri entrano, la mappa vera esce nell'app. Da qui in poi si aggiungono parametri, ma la catena è dimostrata.

**Cosa fai:**
1. **`features.py`:** per ogni esagono, la media dei pixel da 0,05° che ci cadono dentro, pesata per area valida.
2. **`score.py`:** confronto con Malapert e voto.
3. Sostituisci il mock di `malapert_massif__rover_mobility.json` con il file vero.

**Cosa ottieni:** `data/raw/interim/features.parquet` e il primo JSON vero.

**Fatto quando:** l'app mostra la mappa vera e vedi dove cade l'Etna.

### 5.1 Come si dà il voto, in parole semplici

1. **Si mette tutto in percentili.** Pendenze in gradi, rugosità in metri, luce in frazione: non si possono confrontare direttamente. Le traduco in "dove sto rispetto a tutta la Terra", da 0 a 100%. Anche il valore lunare viene tradotto in percentile terrestre.
2. **Distanza:** quanti punti percentuali separano l'esagono dal sito Artemis (se il sito ha un intervallo, la distanza dall'intervallo).
3. **Voto:** `s = exp(−(distanza/τ)²)`. Distanza 0 → 1; 3 punti → 0,91; 10 punti → 0,37; 20 punti → ~0.
4. **Se la Luna è fuori dalla Terra** (es. la luce radente lunare vale 1, la Terra non ci arriva mai), la distanza si misura dal valore più estremo che la Terra raggiunge: i posti più radenti della Terra prendono il voto pieno, e la card dice "si rompe" con la differenza fisica.
5. **Totale:** media geometrica pesata con i pesi del test. Un voto pessimo su un parametro pesante affossa il totale.
6. **Dati mancanti:** se in un esagono manca un parametro, si fa la media sugli altri. Se manca troppo peso (κ < 0,7), l'esagono non entra in classifica.
7. **Filtri del test:** rover `slope_p90 ≥ 15°`, EVA `≤ 25°`, più `valid_share ≥ 5%`.

### Dettaglio tecnico (`score.py`)

```python
import numpy as np

def s_param(x, lo, hi, earth, tau=0.1, eps=0.01):
    """Voto 0-1 di ogni esagono per un parametro, rispetto al target [lo, hi]."""
    q = np.sort(earth[~np.isnan(earth)])                       # tutti i valori della Terra, ordinati
    F = lambda v: np.searchsorted(q, v, side="right") / len(q) # valore → percentile terrestre
    p1, p99 = np.quantile(q, [0.01, 0.99])
    if lo > p99:   D = np.maximum(0, F(p99) - F(x))            # Luna oltre il massimo terrestre
    elif hi < p1:  D = np.maximum(0, F(x) - F(p1))             # Luna sotto il minimo terrestre
    else:          D = np.maximum.reduce([np.zeros_like(x), F(lo) - F(x), F(x) - F(hi)])
    s = np.maximum(eps, np.exp(-(D / tau) ** 2))
    return np.where(np.isnan(x), np.nan, s)

def total(S, w, kappa_min=0.7):
    """S: esagoni × parametri (NaN = manca); w: pesi. Media geometrica pesata + kappa."""
    avail = ~np.isnan(S)
    kappa = (w * avail).sum(1)
    logS = np.where(avail, np.log(np.where(avail, S, 1)) * w, 0).sum(1) / np.maximum(kappa, 1e-9)
    return np.where(kappa >= kappa_min, np.exp(logS), np.nan), kappa
```

**`rock_class`** è una categoria, non un numero: il voto viene da una tabella di somiglianza scritta da Rocco. Proposta: stessa classe 1; anortosite contro breccia d'impatto 0,6; basalto contro anortosite 0,4; sedimentario 0,1; sconosciuta = dato mancante.

Per il primo end-to-end i valori di Malapert sono provvisori (da `artemis.csv` di Rocco, o segnaposto dichiarati: pendenza p90 24°, luce 1).

---

## 6. Passo 5 — gli altri raster

**In parole semplici:** aggiungo alla carta d'identità quello che non è terreno:
- **albedo:** quanto il suolo riflette la luce;
- **indicatore della granulometria:** quanto il suolo si scalda di giorno e si raffredda di notte, che dipende dalla grana;
- **temperature;**
- **sassi e densità del suolo** (SoilGrids);
- **neve per mese;**
- **crateri.**

**Perché serve:**
- il volo con camera dipende da albedo e contrasto;
- il rover dalla grana e dai sassi;
- la neve decide i mesi utili e la luce radente "vera";
- i crateri sono il campo di pericoli del volo con lidar.

**Cosa fai:** altri raster con `gee_export.py`, poi rilanci `features.py`.

**Cosa ottieni:**
- raster di `albedo`, `grain_proxy`, `t_min_c`, `t_max_c`, `rock_cover`, `bulk_density` (3 profondità), `snow_monthly` (12 mesi), `crater_density`;
- `features.parquet` completo;
- `rock_class` per esagono.

**Fatto quando:** tutte le colonne di `params.csv` con ruolo `score` e `card` sono piene, dove c'è il dato.

### 6.1 I parametri spiegati

| Parametro | Cosa misura | Come lo misuriamo |
|---|---|---|
| `albedo` | quanto il suolo è chiaro o scuro | MODIS `MCD43A3`, mediana 2021-23 |
| `grain_proxy` | grana del suolo: la sabbia fine si scalda e si raffredda più della roccia | inerzia termica apparente = (1 − albedo) / (T giorno − T notte), da MODIS `MOD11A2` |
| `t_min_c`, `t_max_c` | temperature estreme (solo card: la Luna è molto più fredda) | MODIS `MOD11A2` |
| `rock_cover` | quota di sassi nel suolo | SoilGrids `cfvo` (0-5 cm) |
| `bulk_density` | densità del suolo a 3 profondità (solo card) | SoilGrids `bdod`, da confrontare con il profilo lunare Hayne/Apollo |
| `snow_monthly` | neve media in ogni mese | MODIS `MOD10A1` |
| `crater_density` | crateri per km² | minimi locali nel DEM, vedi sotto |
| `rock_class` | tipo di roccia | vulcano GVP entro 25 km → basalto; dentro un cratere d'impatto → breccia; sorgente di `materials.csv` → la sua classe |

### 6.2 I crateri: stesso metodo sulla Terra e sulla Luna

Un cratere, in un DEM, è un punto più basso di tutto ciò che ha intorno. Cerco i pixel che sono il **minimo locale** entro 150 m e stanno almeno 3 m sotto la media locale; li conto per km². A 30 m vedo crateri da ~100-150 m in su. **Sulla Luna faccio lo stesso con LOLA portato a 30 m**, così confronto crateri della stessa taglia. I crateri più piccoli, che solo LOLA vede, vanno nella card (`crater_density_small`). Le soglie (3 m, 150 m) si tarano su Cinder Lake e Meteor Crater.

### Dettaglio tecnico

```python
lst = ee.ImageCollection("MODIS/061/MOD11A2").filterDate(*YEARS)
td = lst.select("LST_Day_1km").median().multiply(0.02)       # temperatura di giorno (K)
tn = lst.select("LST_Night_1km").median().multiply(0.02)     # temperatura di notte (K)
alb = (ee.ImageCollection("MODIS/061/MCD43A3").filterDate(*YEARS)
       .select("Albedo_WSA_shortwave").median().multiply(1e-3))
dT = td.subtract(tn)

albedo      = to_grid(alb.updateMask(m), ee.Reducer.mean(), 500)
grain_proxy = to_grid(ee.Image(1).subtract(alb).divide(dT).updateMask(dT.gt(1)).updateMask(m),
                      ee.Reducer.mean(), 1000)               # inerzia termica apparente; vuoto se ΔT ≤ 1 K
t_min_c = to_grid(lst.select("LST_Night_1km").min().multiply(0.02).subtract(273.15).updateMask(m), ee.Reducer.mean(), 1000)
t_max_c = to_grid(lst.select("LST_Day_1km").max().multiply(0.02).subtract(273.15).updateMask(m), ee.Reducer.mean(), 1000)

sg = lambda p: ee.Image(f"projects/soilgrids-isric/{p}_mean")                                 # ⚠ ID
rock_cover = to_grid(sg("cfvo").select("cfvo_0-5cm_mean").divide(1000).updateMask(m), ee.Reducer.mean(), 250)
bdod = sg("bdod")                                             # cg/cm³ → g/cm³ dividendo per 100
bulk = {z: to_grid(bdod.select(f"bdod_{z}_mean").divide(100).updateMask(m), ee.Reducer.mean(), 250)
        for z in ("0-5cm", "30-60cm", "100-200cm")}

snow = ee.ImageCollection("MODIS/061/MOD10A1").filterDate(*YEARS).select("NDSI_Snow_Cover")
snow_m = ee.Image.cat([snow.filter(ee.Filter.calendarRange(i, i, "month")).mean().rename(f"m{i:02d}")
                       for i in range(1, 13)])
snow_monthly = to_grid(snow_m.updateMask(m), ee.Reducer.mean(), 500)    # mese senza neve = media < 10

k = ee.Kernel.circle(150, "meters")
is_min = d30.eq(d30.focalMin(kernel=k))
crater = is_min.And(d30.focalMean(kernel=k).subtract(d30).gt(3)).updateMask(m)
n = to_grid(crater.unmask(0).updateMask(m), ee.Reducer.sum(), 30)
a = to_grid(ee.Image.pixelArea().divide(1e6).updateMask(m), ee.Reducer.sum(), 30)
crater_density = n.divide(a)                                  # crateri per km² di area valida
```

---

## 7. Passo 6 — carta d'identità dei 5 siti (3 lunari, 2 marziani)

**In parole semplici:** compilo per ogni sito Artemis la stessa carta d'identità degli esagoni terrestri, usando i dati lunari alla risoluzione più alta disponibile.

**Perché serve:** è il "bersaglio" del confronto. Se i numeri lunari sono calcolati in modo diverso da quelli terrestri, il confronto non vale.

**Cosa fai:**
1. **Leggi `artemis.csv` di Rocco:** valori dalla letteratura e dai prodotti pronti, con la fonte.
2. **Da LOLA** (il DEM lunare), per ogni sito:
   - leggi una finestra di ~5 km attorno al sito al dettaglio massimo (5 m vicino al polo, altrimenti 10-20 m), senza scaricare il file intero;
   - calcoli le pendenze a più scale con **lo stesso operatore** di Earth Engine;
   - alla scala di 30 m ricavi pendenza p90, rugosità e crateri (voto); alla scala nativa, la pendenza fine, Hurst e i crateri piccoli (card).
3. **Valori fissi o dalla letteratura:**
   - luce radente = 1 (il Sole non supera ~7,5° a 84-90°S);
   - densità della regolite = profilo Hayne/Apollo (card);
   - tipo di roccia dalla mappa geologica USGS;
   - temperature da Diviner, idrogeno da LEND, densità della crosta da GRAIL (card).

**Cosa ottieni:** `data/export/targets.json`, con la fonte di ogni numero.

**Fatto quando:** i 5 siti sono completi; Malapert ha i valori di LOLA calcolati da te.

**Piano B:** se LOLA è troppo lento, valori dalla letteratura per tutti, dichiarati come tali.

### Dettaglio tecnico (`lunar.py`)

- **Prodotti LOLA** ⚠: DEM polari a 5 m (vicino al polo), 10 m o 20 m (fino a 80°S). Si leggono via `/vsicurl` dai file di PGDA (come tauseef) o dai COG `astrogeo-ard` / `barker_south_pole_dems` (come shishir), con `rasterio.open(url)` e una finestra (`window`) attorno al sito, in stereografica polare.
- **Pendenza alla baseline L:**
  1. media a blocchi da nativa a L;
  2. differenze centrali sui 4 vicini: `dz/dx = (z[x+1] − z[x−1]) / 2L`, idem per y;
  3. `slope = atan(√(dzdx² + dzdy²))`.
- **Hurst:** retta di `log(tan(slope_mediana))` contro `log(L)` per L = nativa, 10, 20, 30, 60, 120, 240 m.
- **Crateri:** lo stesso detector del §6.2 su LOLA a 30 m (voto) e a risoluzione nativa (`crater_density_small`, card).
- **Tipo di roccia:** `geopandas.read_file(GeoUnits.shp)`, punto nel poligono → unità → classe terrestre (tabella di Rocco).

---

## 8. Passo 7 — 5 siti × 3 test

**In parole semplici:** per ogni combinazione sito Artemis × test do il voto a tutti gli esagoni, raggruppo i migliori in siti veri e propri, gli do un nome e dico che cosa non torna e dove si recupera.

**Perché serve:** è il prodotto. Questi file sono quello che l'app mostra e che la giuria vede.

**Cosa fai** (`sites.py`, per ognuna delle 27 combinazioni):
1. **Voto** di tutti gli esagoni (passo 4, con i pesi del test).
2. **Prendi l'1% migliore** e unisci gli esagoni che si toccano: ogni gruppo è un **sito**. Il voto del sito è la mediana dei suoi esagoni.
3. **Non più di un sito ogni 100 km**, così non escono 10 siti tutti sull'Etna. Tieni i primi 10.
4. **Nuovo o noto?** Se un sito di test già usato per quel test sta entro 200 km, è noto; altrimenti è **nuovo**.
5. **Nome:**
   - il sito noto entro 30 km;
   - altrimenti il vulcano o il cratere d'impatto più vicino entro 50 km;
   - altrimenti paese + coordinate.
6. **Cosa non torna:** i parametri con voto < 0,3 e le voci `indoor` del test, e per ognuno le strutture di `facilities.csv` che lo coprono.
7. **Dossier:** stagione, accesso, aree protette, vento (passo 8; finché mancano, `null`).
8. **Celle per la mappa:** le 20.000 migliori.

Poi `benchmark.json`: per ogni casella sito × test, il miglior sito, il miglior sito **nuovo** e le strutture indoor.

**Cosa ottieni:** 27 file veri (l'EVA resta mock fino al passo 9) e `benchmark.json`.

**Fatto quando:** l'app mostra i risultati veri per tutti i siti e i test MVP. **Commit e push.**

---

## 9. Passo 8 — dossier, zoom, immagini

**In parole semplici:** aggiungo le informazioni che servono a organizzare davvero una campagna:
- quando andarci (mesi senza neve);
- se è raggiungibile (luci notturne = strade e paesi vicini);
- se ci sono permessi da chiedere (aree protette);
- se il vento blocca i droni.

Per i siti migliori faccio anche uno **zoom** più preciso e prendo un'**immagine satellitare**.

**Perché serve:** il dossier è uno dei pilastri dell'originalità: attacca i 4-5 mesi di permessi di TAS-I. Lo zoom rende più solido il confronto sui siti che mostriamo.

| Informazione | Fonte (su GEE ⚠) | Come |
|---|---|---|
| mesi senza neve | MODIS neve (già scaricato) | mesi con neve media < 10% |
| accesso | luci notturne VIIRS (`NOAA/VIIRS/DNB/ANNUAL_V21`, o Black Marble NASA se c'è) | media annua |
| aree protette | WDPA (`WCMC/WDPA/current/polygons`) | quota dell'esagono in area protetta; nome dell'area per i siti migliori |
| vento (solo volo) | MERRA-2 (`NASA/GSFC/MERRA/slv/2`, `U10M`/`V10M`) | velocità media a 10 m su un anno |
| paese (filtro Italia/Europa) | confini `USDOS/LSIB_SIMPLE/2017` | paese del centro dell'esagono |

- **Zoom:** per i siti migliori, in una finestra di 10 km, l'**istogramma completo** delle pendenze a 30 m confrontato con quello di LOLA a 30 m (distanza di Wasserstein), più la stima a scala fine con Hurst.
- **Immagini:** composito Sentinel-2 senza nuvole → `data/export/img/<sito>__<test>__<id>.png`.

---

## 10. Passo 9 — validazione ed EVA

**In parole semplici:** controllo che il metodo dia risposte sensate.
- I siti già usati per un test devono uscire in alto.
- Posti chiaramente sbagliati (deserti piatti, per il rover) devono uscire in basso.
- La classifica non deve cambiare tutta se sposto un po' i pesi.

**Perché serve:** è quello che rende credibile il risultato davanti a un giudice severo. "Il nostro tool rimette in cima la scelta che TAS-I ha fatto in 10 mesi" vale più di qualunque mappa.

| Controllo | Come | Soglia |
|---|---|---|
| siti noti in alto | percentile del voto dell'esagono di ogni sito di `validazione` | ≥ 95° percentile |
| controlli negativi | Rub' al Khali, Salar de Uyuni bassi per rover e lidar | sotto il 50° |
| test di permutazione (da yos-ww) | siti noti contro esagoni casuali senza vegetazione | p < 0,05 |
| sensibilità | pesi spostati del ±20% per 100 volte: quante volte un sito resta nella top 10 | nella card |

**Cosa ottieni:** `validation.json` + `validation.png` (la figura per la slide 4).

**ISRU:** stessi passi del §8 con i pesi di `isru_resources` (riga 17 della sez. E).

**Se l'Etna non esce in alto:** si controllano soglie, scala e pesi. Se resta basso lo si dice e si spiega (per esempio con il materiale: basalto contro anortosite). È un risultato anche quello.

---

## 11. Passo 10 — testi per la submission

- **Metodo** (mezza pagina): esagoni, filtri sui pixel, percentili, media geometrica, copertura, validazione con i numeri.
- **Dati NASA** con ID: NASADEM, MODIS (`MOD44W`, `MOD13A3`, `MOD11A2`, `MCD43A3`, `MOD10A1`), MERRA-2, VIIRS, LRO (LOLA, Diviner, LEND, LROC), GRAIL.
- **Dati partner ed esterni:** AW3D30 (JAXA), SoilGrids, GVP, Earth Impact Database, WDPA, mappa geologica USGS, Google Earth Engine.
- **Codice di riferimento:** yos-ww, shishir-kuet, tauseefkhan007, azrialahmad (`reference-codice.md`), citati, con la licenza controllata prima di copiare qualunque riga.

---

## 12. Cosa mi serve dagli altri

| Da chi | Cosa | Entro |
|---|---|---|
| **io** | progetto GEE + `earthengine authenticate` + `GEE_PROJECT` nel `.env` (§1.3) | **subito** |
| Edo + Rocco | valori dei 5 siti (3 Luna, 2 Marte) per gli 8 parametri del voto + `bulk_density_0_5` (formato: `targets.json`) | 00:15 |
| Rocco | `known_sites.csv` con coordinate (inclusi Piano delle Concazze e Cisternazza) | 00:15 |
| Rocco | `facilities.csv` con `covers` = nomi dei parametri e delle voci `indoor` | 00:15 |
| Rocco | tabella di somiglianza di `rock_class`; `materials.csv` | 00:15 |
| ~~Rocco~~ | ~~`tests.yaml`: stati EVA/ISRU, `ksc_alhat_field`~~ → fatto da Edo alle 23:30 (v1: 5 test tutti nella demo, ISRU tolto, NDVI 0,2); **Rocco conferma i pesi di `isru_resources`** | 00:15 |
| Rocco | `params.csv` aggiornato da Edo (23:30); in `decisioni.md`: 5 siti, 5 test, AW3D30, NDVI 0,2 (vedi sez. E) | 00:15 |
| Timo | conferma che l'app legge il formato del §2 | dopo il passo 1 |

## 13. Rischi e piani B

| Rischio | Piano B |
|---|---|
| GEE non si attiva | Earthdata: `MOD13C2`, `MOD11C3`, `SRTMGL3`, in locale |
| Terreno a 30 m troppo pesante | quadrati da 10°; export su Cloud Storage; in ultima istanza 90 m per lo screening |
| ID del catalogo sbagliati (⚠) | verifica con `ee.data.getInfo(id)` prima di lanciare tutto |
| LOLA lento o troppo grande | finestra da 5 km via `/vsicurl`; prodotto a 20 m; letteratura |
| SoilGrids vuoto sulla roccia nuda | κ gestisce i dati mancanti; più peso alla rugosità |
| L'Etna non esce in alto | rivedere soglie, scala e pesi; altrimenti dirlo |
| Tempo | ordine dei tagli: zoom → immagini → vento → EVA → volo con camera |

## 14. Comandi

```bash
source src/pipeline/.venv/bin/activate
python -m src.pipeline.run --step check       # passo 0 ✅ (manca solo GEE)
python -m src.pipeline.run --step mock        # passo 1
python -m src.pipeline.run --step grid        # passo 2
python -m src.pipeline.run --step terrain     # passo 3 (GEE, 30 m)
python -m src.pipeline.run --step sun         # passo 3 (luce)
python -m src.pipeline.run --step features    # passo 4
python -m src.pipeline.run --step score --site malapert_massif --test rover_mobility   # passo 4
python -m src.pipeline.run --step surface     # passo 5 (GEE)
python -m src.pipeline.run --step lunar       # passo 6
python -m src.pipeline.run --step sites       # passo 7
python -m src.pipeline.run --step dossier     # passo 8
python -m src.pipeline.run --step validate    # passo 9
```

Dopo ogni passo che cambia `data/export/`: `git pull`, commit **solo** di `src/pipeline/` e `data/export/`, push.

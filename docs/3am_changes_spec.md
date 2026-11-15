# Modifiche delle 3 di notte: cosa serve all'app per usare il backend vero

Autore: Edo · dom 15/11/2026, 02:45 · per **Timo** (parte 1) e per noi (parte 2).
Il backend è finito. Questo file elenca **tutto** quello che l'app deve cambiare per mostrare l'export reale, con i campi esatti e i criteri per dire "fatto". Decisioni e motivi: `docs/decisioni.md`, `docs/allineamento-edo.md`, `docs/backend_spec.md` sez. E.

---

## 0. Cosa è cambiato rispetto a quello che l'app si aspetta

| Prima (mock e `data.js`) | Ora (export reale) |
|---|---|
| 9 siti Artemis, poi 5 scritti a mano | **6 siti**: Luna `malapert_massif`, `haworth`, `nobile_rim_1`, `aristarchus_plateau`; Marte `phoenix`, `gale`. Elenco e coordinate in `data/export/targets.json` |
| 4-5 test (rover, lidar, camera, EVA, touchdown) | **3 test**: `flight_hda_lidar`, `rover_mobility`, `isru_subsurface` (`data/config/tests.yaml` v3) |
| "si rompe" calcolato nell'app con una tabella `FACILITIES` finta | **`result.breaks`**, già con nome in italiano e strutture vere |
| niente | **`result.campaign`**: strutture indoor, simulanti, fonti di roccia, con coordinate e fonti |
| etichette dei parametri scritte a mano (`PARAM_LABEL`) | **`data/export/labels.json`** con nome, dimensione della challenge e unità |
| 36 file finti | **18 file veri** (6 × 3), `mock: false` |

**Aristarchus Plateau** è a 25°N, 51,5°W: sulla faccia visibile della Luna, lontano dal Polo Sud dove oggi è centrata la vista lunare.

---

## Parte 1 — Compiti per Timo

Ordine consigliato: **T1-T6 sono il minimo** perché la demo mostri tutto e non si rompa. T7-T10 la completano. Tempi indicativi.

### T1 · Test da `data/config/tests.yaml` v3 (20 min)
- **Dove:** `src/web/src/data.js` righe 1-9 importano la copia ferma `src/web/src/tests.yaml` (v1, commit `a3e77e1`) e nascondono `landing_touchdown`.
- **Cosa fare:**
  - importare `../../../data/config/tests.yaml?raw`;
  - togliere la copia ferma e il trucco su `landing_touchdown`, che non esiste più.
- **Perché si rompeva la v2:** i `requisiti` ora elencano **tutti** i parametri, compresi quelli con peso `0.00` (temperature, quota, atmosfera, `density_profile_0_2m`) e i nuovi `permafrost_share`, `bulk_density_0_5`. Mostrare solo quelli con **peso > 0** e prendere le etichette da `labels.json` (T5).
- **Altri campi nuovi in testa al file:** `kappa_min: 0.8` e `night_lights_max: 3.5`, da ignorare nell'app. Tutti i test hanno `stato: mvp`, quindi via i tag "anteprima" e "presto".
- **Fatto quando:** il selettore mostra esattamente 3 test e tutti si aprono.

### T2 · Modelli 3D (10 min)
- **Dove:** `data.js` `MODELS`.
- **Cosa fare:** le chiavi diventano `rover_mobility`, `flight_hda_lidar` e **`isru_subsurface`**. Per l'ISRU serve un modello: una trivella, un escavatore, o anche il rover come ripiego. Togliere `flight_trn_camera` ed `eva_traverse`.
- **Fatto quando:** ogni test ha il suo modello, oppure nessun pannello resta vuoto.

### T3 · Siti da `targets.json`, con Aristarchus (30 min)
- **Dove:** `data.js` `SITES`, scritti a mano.
- **Cosa fare:** leggere `data/export/targets.json`. Ogni elemento ha `id`, `name`, `lat`, `lon` (−180/+180), `world` (`"moon"` o `"mars"`), `values`, `card`, `sources`, `dimensions`. Tenere in `data.js` solo le cose di presentazione (es. `tag` per sito, chiave `id`).
- **Phoenix:** `lon` è già −125.7492, niente più `- 360`.
- **Aristarchus:** controllare che sia visibile e cliccabile sulla Luna. Oggi la vista è centrata sul Polo Sud (`trek.js`, `toView`): serve una rotazione o un volo verso il sito.
- **Fatto quando:** 6 siti sulle mappe, il clic su ciascuno apre i 3 test.

### T4 · Via i dati finti, caricamento a richiesta (20 min)
- **Dove:** `data.js` `MOCK_PLACES` e `getResults` (righe ~45-75).
- **Cosa fare:**
  - togliere `MOCK_PLACES` e il ramo finto di `getResults`: esistono tutte le 18 coppie;
  - l'export pesa ~6 MB (ogni file ha fino a 10.000 esagoni in `cells`, che l'app non disegna). Passare a `import.meta.glob('../../../data/export/sites/*.json', { import: 'default' })` **senza** `eager` e caricare il file quando si sceglie sito × test, così `getResults` diventa asincrona.
- **Fatto quando:** nessun dato finto, primo caricamento dell'app leggero.

### T5 · Barre dei parametri nella card del risultato (30 min)
Campi del risultato (`results[i]`):

```json
"params": {"slope_p90": 1.0, "roughness": 0.989, "grain_proxy": 0.01},
"values": {"slope_p90": 25.881, "roughness": 2.607, "grain_proxy": 0.469},
"target": {"slope_p90": [24.88, 26.88], "roughness": [2.15, 2.55], "rock_class": "anorthosite"}
```

- `params[p]`: voto 0-1 per parametro, cioè la barra.
- `values[p]`: valore del posto sulla Terra. `target[p]`: intervallo `[min, max]` del sito lunare o marziano, già **convertito in unità terrestri**. Per `rock_class` è una stringa.
- Etichetta, unità e dimensione da `data/export/labels.json`:
  ```json
  "crater_density": {"label": "crateri", "definition": "Conche <=300 m, profondità >=20 m (km⁻²)", "dimension": "Topografia", "unit": "crateri/km²"}
  ```
- **Raggruppare le barre per `dimension`**, cioè le categorie del testo della challenge: Topografia; Geologia e materiali di superficie; Temperatura e illuminazione; Acqua, ghiaccio e permafrost; Atmosfera, polvere e vento. Nel pitch ogni barra si collega così a una richiesta dei giudici.
- Togliere `PARAM_LABEL` da `App.jsx` (riga 11).
- **Fatto quando:** ogni barra mostra nome italiano, valore Terra contro intervallo del sito con l'unità, raggruppata per dimensione.

### T6 · "Dove si rompe" da `result.breaks` (15 min)
- **Dove:** `App.jsx` righe ~294 (`broken`) e ~380 (`[...test.indoor, ...broken]` con `FACILITIES`).
- **Cosa fare:** usare direttamente `result.breaks`. Contiene già sia i parametri con voto < 0,3 sia i limiti fissi del test (gravità, vuoto…):
  ```json
  {"param": "grain_proxy", "label": "grana della regolite", "why": "voto sotto 0,3",
   "covered_by": ["Mars Terrain Simulator e centro lunare ALTEC", "LUNA (DLR + ESA)", "SLOPE, NASA Glenn"]}
  ```
- Togliere `FACILITIES` da `data.js` e il calcolo di `broken`.
- **Fatto quando:** la lista "si rompe" coincide con `breaks` e non compare mai "da cercare in facilities.csv".

### T7 · Sezione "Campagna consigliata" (45 min) ← funzione nuova
In ogni risultato c'è `campaign`:

```json
"campaign": {
  "outdoor": {"name": "Terra di Francesco Giuseppe, 80.0°N 49.9°E", "lat": 79.95, "lon": 49.87},
  "facilities": [{"id": "luna_cologne", "name": "LUNA (DLR + ESA)", "place": "Colonia, Germany", "lat": 50.856, "lon": 7.118,
                  "km_client": 645, "covers": ["grain_proxy", "gravity_1_6", "soil_density"],
                  "covers_labels": ["grana della regolite", "gravità a 1/6", "densità e compattazione della regolite"],
                  "source": "docs/test-aziende.md"}],
  "uncovered": [{"param": "agglutinates", "label": "agglutinati e ferro nanofase della regolite"}],
  "simulants": [{"id": "lhs1", "name": "LHS-1 (Lunar Highlands Simulant)", "producer": "Space Resource Technologies",
                 "terrain": "altipiani (anortosite)", "price": "LHS-1E ~9.500 $/t", "source": "https://spaceresourcetech.com/"}],
  "rock_source_near_client": {"id": "rogaland_anorthosite", "name": "Provincia anortositica del Rogaland (Egersund)", "rock": "anorthosite",
                              "lat": 58.45, "lon": 6.0, "km": 1492, "use": "…", "source": "…"},
  "rock_source_near_site": { "…stessa forma…" },
  "rock_note": "Roccia naturale da cava: 8-20 volte più economica del simulante commerciale (…) combacia in chimica, non in geotecnica.",
  "client": "Torino"
}
```

**Da mostrare, in quest'ordine:**
1. **All'aperto:** `outdoor.name`.
2. **Strutture indoor:** per ognuna `name`, `place`, "copre: " + `covers_labels`, "a `km_client` km da Torino", link a `source` se è un URL. Sono già scelte dal backend: l'insieme minimo che copre tutti i gap, prima chi ne copre di più e a parità la più vicina a Torino.
3. **Non coperto da nessuno:** `uncovered[].label`, se la lista non è vuota. Oggi esce solo "agglutinati", ed è corretto: nessun simulante li riproduce.
4. **Simulanti** (non ci sono sempre: nel lidar marziano mancano): `name`, `producer`, `terrain`, `price` se c'è, link a `source`.
5. **Roccia naturale:** "più vicina a Torino" e "più vicina al sito" (`name`, `rock`, `km`, `use`), più `rock_note` in piccolo.

**Fatto quando:** la card di ogni risultato mostra la campagna completa e i link funzionano.

### T8 · Pin sulla mappa della Terra (30 min)
- Quando un risultato è aperto: **pin delle strutture** della sua campagna (`campaign.facilities[].lat/lon`) e **pin delle due fonti di roccia** (`rock_source_near_client`, `rock_source_near_site`), con icone diverse dal pin del sito. Al clic: nome e cosa copre.
- **Opzionale:** un livello "tutte le strutture" da `data/export/facilities.json` (18 voci con `lat`, `lon`, `type`, `covers`, `capacity`, `source`) e "tutte le fonti di roccia" da `rock_sources.json`.
- **Fatto quando:** aprendo un risultato si vedono sito, strutture e rocce della sua campagna.

### T9 · Dossier e qualità del dato (20 min)
`result.dossier`:

```json
{"snow_free_months": 2, "night_lights": null, "protected_area": true, "protected_area_name": "Russkay  Arktik (National Park)",
 "wind_10m": 5.9, "low_sun_hours": 4.0, "terrain_src": "30m", "valid_share": 0.067}
```

- `terrain_src`: `"30m"` → badge "terreno a 30 m"; `"est"` → "terreno stimato dal 500 m". Oggi `est` compare in pochi risultati (Gale × rover).
- **`valid_share`:** quota dell'esagono che è suolo nudo. Sotto 0,15 mostrare un avviso tipo "solo il 7% dell'esagono è suolo nudo". Succede ad alcuni campi coltivati (Sterling, Colorado, per Aristarchus).
- Aree protette: se `protected_area` è vero, mostrare `protected_area_name` (servono permessi).
- `night_lights` può essere `null`.

### T10 · Lista dei risultati, card del sito, benchmark (30 min)
- **Lista:** `name` e `country`, `score` in percentuale, `kappa`, badge "nuovo" se `new`, badge "sito noto" se `known_site`. Come chiave React usare `id` (`r01`…), non `name`.
- **Card del sito lunare o marziano** (`targets.json`): `values` (con le unità di `labels.json`), `card` (`t_mean_c`, `elevation`, `subsurface_ice_wt_pct`, `feo_wt_pct`, `air_density_kgm3`, `wind_ms`; per i siti polari anche `slope_p90_literature`, `roughness_literature`, `crater_density_literature`, i valori pubblicati da Wueller 2025), `sources[p]` (la fonte di ogni parametro, da mostrare in piccolo o al passaggio del mouse).
- **Vista benchmark** (slide del pitch): `data/export/benchmark.json` → 6 siti × 3 test, ognuno con `best` (id del risultato), `best_new` e `facility` (nomi delle strutture della campagna del primo risultato).
- **"Metodo e dati":** un pannello con `manifest.json` → `datasets` (elenco dei dataset NASA e degli altri) e i limiti dichiarati della §3.

### T11 · LLM explainer (Timo implementa; 45 min)
- **Scopo:** una spiegazione in italiano per ogni risultato (180 in tutto), per il cliente: perché il posto è analogo, cosa non torna (anche le anomalie della §3), quale campagna fare.
- **Generarle in anticipo**, non dal browser: l'app è statica su Vercel e una chiave API nel codice del browser sarebbe pubblica.
- **Ingresso** per ogni risultato: il risultato intero (`params`, `values`, `target`, `breaks`, `dossier`, `campaign`), il sito (`targets.json` per quell'`id`), le etichette (`labels.json`).
- **Regole del prompt:**
  - usare **solo** numeri, strutture, simulanti e fonti presenti nell'ingresso;
  - niente nomi inventati;
  - 80-120 parole;
  - dire sempre cosa non torna.
- **Dove salvarle:** file separati `data/export/explanations/<sito>__<test>.json` con forma `{"<h3_cells[0]>": "testo", …}`. La chiave è l'esagono migliore del risultato. File separati perché la ripubblicazione dell'export riscrive i file dei siti e cancellerebbe le spiegazioni. L'app mostra il testo in cima alla card; se manca, niente.
- **Da dichiarare** nella submission come uso dell'AI.

### T12 · Pulizia finale (15 min)
- Togliere da `data.js` e da `App.jsx` ogni riferimento a `flight_trn_camera`, `eva_traverse`, `landing_touchdown`, `isru_anorthosite`, `MOCK_PLACES`, `FACILITIES`.
- `test.html` funziona già con i dati veri. Se carichi i file a richiesta (T4) non cambia nulla, perché ha il suo `import.meta.glob`.
- **Build e deploy su Vercel:** controllare che `data/export/` finisca nel bundle (`vite.config.js` ha già `fs.allow: ['../..']`) e il peso finale.

### Checklist di accettazione (da provare insieme)
- [ ] 6 siti cliccabili (Aristarchus compreso), 3 test per sito, nessun dato finto.
- [ ] Ogni risultato: nome e paese, voto, κ, "nuovo", barre con unità raggruppate per dimensione.
- [ ] "Si rompe" da `breaks`, campagna completa (strutture, scoperti, simulanti, rocce) con link.
- [ ] Pin di strutture e rocce sulla Terra.
- [ ] Dossier con avviso su `valid_share` e badge su `terrain_src`.
- [ ] Benchmark 6 × 3 e pannello "metodo e dati".
- [ ] (Se fatto) spiegazione LLM in cima alla card.

---

## Parte 2 — Piano per noi (Edo e Rocco), mentre e dopo che Timo lavora

### Mentre Timo lavora (Edo, ~1 ora)
| # | Cosa | Tempo |
|---|---|---|
| E1 ✅ (02:50) | **`known_sites.json` vero**: 19 siti in `data/config/known_sites.csv`, pubblicato in `data/export/known_sites.json`: coordinate da `test-aziende.md` (Etna Concazze e Cisternazza, Teide, Black Point, SFVF, Meteor Crater, Cinder Lake, Death Valley, Mojave/LSPG, Kilbourne Hole, Rye, Kumtag, Tottori, Mauna Kea) con i test per cui sono usati. Decide i flag "nuovo" e "sito noto". Poi ripubblicare | 20 min |
| E2 | **Escludere i campi coltivati** con la copertura del suolo MODIS (MCD12Q1) su Earth Engine: via gli esagoni dove i campi dominano e il suolo nudo è poco (Sterling, Linghai) | 20 min |
| E3 | **Numeri per il pitch** dalla validazione, in una tabella pronta per la slide (es. "i siti di test reali escono nel 5-15% migliore della Terra") | 15 min |
| E4 | Riprovare il gruppo saltato (5 risultati di Gale × rover con il terreno stimato) | 5 min |
| E5 | Spegnere il server di prova `localhost:5173` | — |

### Rocco (~30 min, quando può)
- Confermare `data/config/rock_similarity.csv` (bozza di Edo, già in uso).
- Verificare le voci `[NV]` in `facilities.csv` (offload di LUNA, laboratorio polvere di Swamp Works, Ames Lunar Lab, ESTEC), `rock_sources.csv` (coordinate di Rogaland, Stillwater, Adirondack, Sittampundi) e `simulants.csv`.
- Sapere che: lo **scenario B** del ghiaccio è stato tenuto per i 3 siti polari (nel suo file a 6 siti era tornato a 0,2%); il terreno di **Aristarchus** viene dalla letteratura, perché il DEM LOLA polare non lo copre.

### Dopo le modifiche di Timo (tutti)
1. **Prova di integrazione** (Edo + Timo, 30 min): giro completo dei 6 × 3 con la checklist della Parte 1; ogni discrepanza di formato si sistema nel backend o nell'app, chi fa prima.
2. **Spiegazioni LLM** (Timo + Edo, 45 min): script lanciato una volta con la chiave API, poi ripubblicazione.
3. **Pitch** (Rocco + tutti):
   - slide del metodo (dati NASA, maschera, 30 m, calibrazione, voto, campagna);
   - slide del benchmark (`benchmark.json`);
   - slide della validazione (E3);
   - slide dei limiti (§3);
   - video da 30 s o 7 slide; dichiarazione dell'uso dell'AI.
4. **Freeze alle 11:00**, submit interno alle 15:30, consegna alle 16:00 (gate in `decisioni.md`).

---

## 3. Anomalie note e limiti da dichiarare (servono all'explainer e alle slide)
- **Gale × lidar:** i primi risultati hanno voto 1,0 pieno. I valori di Gale sono "normali" per la Terra, quindi molti esagoni coincidono.
- **ISRU lunare con voti bassi (~0,25):** la densità e i massi della regolite lunare non esistono su nessun suolo terrestre. Sono "si rompe" per tutti, e la campagna li chiude con le vasche di simulante.
- **I 3 siti polari danno classifiche simili:** i loro valori sono molto vicini. Una campagna sulla Terra serve a tutti e tre.
- **Poco suolo nudo:** alcuni esagoni hanno il 6-10% di suolo nudo (campi coltivati, o vulcani come l'Etna, dove il sito vero è piccolo). Vedi `valid_share`.
- **La heat map del lidar è rada** (~3.300 esagoni): i crateri ci sono solo dove abbiamo calcolato il terreno a 30 m esatto. I 10 siti vengono comunque da tutta la Terra.
- **Dati:**
  - Marte e Aristarchus con il terreno di letteratura;
  - ghiaccio terrestre stimato da un proxy MODIS (temperatura media annua < −1 °C);
  - tipo di roccia GLiM grossolano (celle da ~55 km);
  - niente Antartide (l'NDVI MODIS non la copre);
  - alcune voci delle strutture da verificare (`[NV]`).

---

## 4. Decisioni delle 03:00 e piano della mattina

**Aggiunte:**
- finestra di test (mese migliore): **sì**, la fa Edo;
- stima dei costi: **in pausa** (fonti poco solide);
- brief scaricabile: **dopo**, quando tutto funziona;
- **casi studio per la giuria: sì**, bozza in `docs/case_studies.md`, con un bottone per caso nell'app (Timo);
- LLM explainer: **dopo**, quando tutto funziona.

| Ora | Edo | Timo | Rocco |
|---|---|---|---|
| 08:00-09:30 | finestra di test, via i campi coltivati, numeri di validazione, ripubblicazione | T1-T6 (app sui dati veri) | verifiche `[NV]`, rifinitura dei casi studio |
| 09:30-11:00 | prova di integrazione (checklist), correzioni al backend | T7-T8 (campagna, pin), bottoni dei casi studio, benchmark, **deploy** | testi delle slide |
| **11:00** | **freeze delle funzionalità**: da qui solo bug | | |
| 11:00-14:30 | numeri e screenshot per le slide | slide e video da 30 s | slide, descrizione per il form |
| 14:30-15:30 | revisione finale | link pubblici controllati | form (dataset NASA, uso dell'AI), prova del pitch |
| **15:30** | **submit interno** · 16:00 consegna · 16:15 pitch | | |

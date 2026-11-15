# Handoff web — sessione di Timo, dom 15/11 ore 01:40

Per la prossima sessione di Claude Code. Scope: `src/web/` (Timo). Deadline submission: **dom 15/11 ore 16:00**, pitch 16:15.

## Stato della repo

- `main` allineato a `origin/main` (ultimo commit: `6f1530d`, export vero di Edo).
- **Non committato** (tutto in `src/web/`):
  - `src/App.jsx`, `src/data.js`, `src/app.css`: "Ricomincia" sempre attivo, zone del modello sulla mappa, pin bianchi.
  - `test.html`, `src/test.js`: pagina interna di test del modello (nuovi file).
- Stash vecchio `params.csv: ' #'`: non è nostro, non toccarlo.
- Dev server: `npm run dev` in `src/web`, porta 5179.

## Cosa fa oggi il web

- Flusso: pianeta → sito → test → "Dove" (Terra intera) → scheda del posto.
- **Test:** legge una copia fissa `src/web/src/tests.yaml` (v1: rover, lidar, camera, EVA). Motivo: la v2 di Edo aveva rotto il pannello dei test.
- **Risultati:** `getResults` in `data.js` legge `data/export/sites/<sito>__<test>.json`; se il file non c'è usa dati finti.
- **Zone (solo test, da togliere prima della demo):** gli esagoni `h3_cells` di ogni risultato disegnati sulla Terra; il numero in classifica è il pin. Segnato `TEST (solo per noi)` in `data.js` e `App.jsx`.
- **Heat map:** tolta su richiesta di Timo.
- **Click:** un click nell'ultimo secondo di un volo che rallenta ne taglia la coda e parte subito (`fly`, `act` in `App.jsx`). "Ricomincia" durante un'animazione aspetta la fine e poi torna all'inizio (`restart`).
- **Modelli 3D:** precaricati dopo l'arrivo sul pianeta (`preload` in `DotModel.jsx`).
- **Pagina di test:** `http://localhost:5179/test.html`, solo in dev. Menu sito e test, planisfero con i 10 risultati numerati, tabella con voti e link a Google Maps.

## Problema aperto principale: app disallineata dall'export vero

L'export vero ha 5 siti (`haworth`, `malapert_massif`, `nobile_rim_1`, `phoenix`, `gale`) × 3 test (`rover_mobility`, `flight_hda_lidar`, `isru_subsurface`).

- `flight_trn_camera` e `eva_traverse` (v1) non hanno più file: nell'app ricadono sui dati finti.
- `isru_subsurface` non è tra i test dell'app.
- Da fare: portare l'app ai 3 test dell'export. Attenzione: `data/config/tests.yaml` è di Edo e Rocco e il nome lì può essere diverso (`isru_resources` nella v2): controllare prima. `isru_*` non ha un modello 3D in `MODELS`: il riquadro del modello sparisce al passaggio del mouse, serve un modello o un riquadro fisso.

## Cosa restituisce il modello (da dire a Edo e Rocco)

- I risultati sono zone sparse nel mondo, ma i nomi sono coordinate: nessuno cade vicino a un sito noto (Etna, Teide, Arizona). Era la validazione prevista.
- Voti bassi sulla Luna: il primo risultato va da 0,26 a 0,48. Gale arriva a 0,96–1,0.
- Haworth × rover: 7 risultati su 10 sopra i 74°N.
- Gale × lidar, terzo risultato a 35,65°N 139,93°E (baia di Tokyo): probabile errore del filtro sul suolo.
- `rock_class` manca dai parametri usati.
- Proposte per `build` in `src/pipeline/sites.py` (codice di Edo, non toccato): distanza minima tra zone da 100 km a 500–1000 km, oppure un tetto di zone per regione; ordinare per cella migliore oltre che per mediana.

## Non verificato

- "Ricomincia" a metà animazione: build ok, mai provato nel browser.
- Zone e pin bianchi con l'export vero: build ok, non guardati.
- Blocco di ~0,2 s del modello 3D dopo il precaricamento: non rimisurato.
- Il browser di cmux ferma le animazioni quando la finestra non è in primo piano: per provarle serve la finestra visibile (`cmux focus-window`), e spesso perde il fuoco.

## Altre cose viste e non fatte

Dalla prova dell'interfaccia (decise da Timo come non prioritarie): pannello poco leggibile sopra le immagini lunari; titolo che si sovrappone alla mappa; poligoni scuri sul mare nella vista Terra; lista dei test tagliata dal modello 3D; barre della scheda tutte dello stesso colore; scritta "Dati di prova" su ogni passo (ora falsa per i file veri).

## Regole di lavoro di questa sessione

- Timo scrive solo in `src/web/`, nei propri file in `docs/` e nei file in root. `docs/decisioni.md` lo scrive solo Rocco.
- Commit e push solo quando Timo lo chiede. Mai `--force`.
- Risposte brevi, in italiano.
- Log di sessione in `~/Desktop/safe/lifeOS/claude/log.md`: la riga delle 00:13 dice "web allineato a tests.yaml v2", non più vero (revert). Correzione proposta a Timo, senza risposta.

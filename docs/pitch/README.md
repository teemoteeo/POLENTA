# Pitch di POLENTA: deck nel browser (scheletro)

**POLENTA** = **P**lanetary **O**utcrop & **L**anding **E**nvironment **N**earby **T**estbed **A**ssistant (nome deciso dal team il 15/11).

Autore: Edo · dom 15/11, 11:30. Bozza da rifinire con Rocco (slide e pitch) e Timo (video, deploy).

## Cosa c'è

- `index.html`: deck di **7 slide** (titolo incluso), 16:9, stessa estetica dell'app (token di `src/web/src/app.css`, pianeti a puntini, vetro, arancio `#ff5a1f`). Animazioni a passi: ogni → mostra il blocco successivo, poi passa alla slide dopo.
- `data.js`: numeri presi dall'export (`data/export/`), generati da `snapshot.py`. Non si modifica a mano.
- `snapshot.py`: va rilanciato **dopo ogni ripubblicazione dell'export**: `python3 docs/pitch/snapshot.py`.

Formato scelto: 7 slide servono sia per la submission (limite: 7 slide **oppure** video ≤ 30 s) sia per il pitch dal vivo di 4 minuti, **con ~70 s di demo dal vivo dentro il deck** (slide 3). Senza link dell'app, o premendo `V`, la slide 3 mostra il video (`demo.mp4` nella cartella) e la scheda del risultato coi dati veri: è la versione per la submission.

## Come si apre

```
cd docs/pitch && python3 -m http.server 5192
```
poi `http://localhost:5192`. Funziona anche con doppio click su `index.html` (file://), tranne il video.

Tasti: `→`/spazio/telecomando avanti · `←` indietro · `1-7` vai alla slide · `N` note · `P` finestra presentatore (note, timer, slide dopo, sincronizzata) · `T` timer nel piè di pagina · `S` avvia il timer · `R` azzera · `L` apre l'app · `D` tema chiaro/scuro · `G` nasconde i tratteggi della bozza · `F` schermo intero · `B` schermo nero · `?` aiuto.

## Scaletta (4:00, demo dal vivo compresa)

Struttura decisa dal team: chi siamo → cosa facciamo → come lo facciamo → che vantaggio portiamo → prospettive di crescita. Obiettivo finale: diventare lo strumento che **prepara e preventiva una campagna di test** in soldi, tempo e persone.

| # | Slide | Fine entro | Durata | Animazione |
|---|---|---|---|---|
| 1 | **Chi siamo**: POLENTA e il team | 0:20 | 20 s | la frase intera compare parola per parola; click: le iniziali si colorano una alla volta e la frase lascia il posto a POLENTA (dissolvenza, nessuna lettera si sposta); click: frase dell'app e team |
| 2 | **Cosa facciamo**: il problema in una riga + cosa fa l'app | 0:45 | 25 s | tre numeri del problema; click: 4 carte e arco Haworth → primo posto nuovo sulla Terra |
| 3 | **Cosa facciamo, dal vivo**: demo | 1:55 | 70 s | l'app si apre dal riquadro a tutto schermo |
| 4 | **Come lo facciamo**: dati NASA, stessa metrica, validazione | 2:30 | 35 s | mappa del mondo a esagoni; barre di validazione; sorpresa e limiti |
| 5 | **Che vantaggio portiamo**: tempo, soldi, qualità, concorrenza | 3:05 | 35 s | Terra con la campagna da Torino; barra 57 → 20; matrice 2×2 |
| 6 | **Prospettive**: roadmap fino al preventivo della campagna | 3:40 | 35 s | linea del tempo in 4 tappe (oggi, pilota, piano, preventivo); scheda "preventivo" con le righe vere di oggi e quelle di domani (soldi, tempo, persone) in caricamento; chi paga e modello |
| 7 | **Obiettivo** e richiesta | 4:00 | 20 s | frase finale, richiesta di un pilota, team |

Le note per chi parla (punti chiave, non copione) sono in ogni slide, tasto `N` o `P`.

## Demo dal vivo (slide 3)

- **Come funziona:** il deck carica l'app in un iframe nascosto appena si apre (così alla slide 3 è già calda: modelli 3D e tessere scaricati). Alla slide 3 l'app si apre dal riquadro fino a tutto schermo e si usa col mouse come sempre. Si torna alle slide con `PageDown` del telecomando, con la pillola "Next slide →" in basso (mostra anche il timer) o dalla finestra presentatore.
- **Link dell'app:** `APP_URL` in cima allo script, oppure `index.html?app=<url>` (per le prove: `?app=http://localhost:5173`).
- **Telecomando dentro l'app:** funziona solo se deck e app hanno la stessa origine, cioè se il deck sta in `src/web/public/pitch/` (Timo) e si apre da `<app>/pitch/`. Da origini diverse restano la pillola e la finestra presentatore.
- **Percorso (70 s), app di `main` di adesso:** Moon → Haworth → Rover mobility → Terra con la lista: i primi 3 (Nevada, Svalbard) hanno l'etichetta *Already used for tests* → click sul primo *Not used for tests yet* (#4, Mabton, Washington) → scheda con percentuale e sensore per parametro → Campaign view → `PageDown`. Solo se si è in anticipo: *Near you* · Turin · 1.500 km (per il Polo Sud lunare vicino a Torino non c'è niente di buono; su Marte sì: Gale × rover 0,99 in Montana, 0,84 entro 3.000 km da Torino). Le frasi per ogni passo sono nelle note della slide 3.
- **Piano B:** `V` passa al video e alla scheda statica in qualunque momento; `A` ricarica l'app. Sul palco non si fa debug.
- **Prove (da fare almeno 3 volte a velocità vera):**
  - [ ] sulla rete della sala, con l'hotspot del telefono pronto (tessere NASA GIBS, Moon Trek ed Esri arrivano da internet);
  - [ ] al proiettore della sala (risoluzione, zoom del browser al 100%, `F` per lo schermo intero);
  - [ ] **Start over** nell'app prima di salire;
  - [ ] chi parla e chi clicca: decidere se è la stessa persona.

## Criteri di giudizio → dove li copriamo

Ogni slide ha i suoi criteri in `data-criteria`: compaiono in testa alle note (`N`, `P`).

| Criterio | Slide | Prova da dire |
|---|---|---|
| **Impact** | 2, 5, 6, 7 | 10 mesi per scegliere un sito; 57 → 20 giornate-persona e ~€28k a campagna [A]; ~€100k se va rifatta; obiettivo: preventivo di soldi, tempo e persone prima di partire |
| **Creativity** | 2, 4, 5 | l'analogo dipende dal test; campo naturale + strutture indoor in un solo piano; 63 posti su 90 nuovi; Near you; nessuno nel quadrante in alto a destra |
| **Validity** | 3, 4, 6 | stessa definizione su LOLA e sulla Terra; SP Crater primo per Haworth × rover senza dirlo al modello; sensore per ogni valore; roadmap con un pilota reale |
| **Relevance** | 1, 2, 4 | siti candidati per basi lunari e atterraggi su Marte; dove l'analogia si rompe; limiti della Terra; dati NASA al centro |
| **Presentation** | tutte | problema → soluzione → demo → prova → mercato → richiesta; una frase da ricordare in chiusura; 4:00 con il timer (`P`) |

## Da fare quando la piattaforma è finita

- [ ] **Rocco:** testi e frase finale (alternative nelle note della slide 7); decidere se nominare TAS-I sul palco (slide 2, tratteggiata); voci della roadmap (slide 6).
- [ ] **Timo:** link pubblico dell'app in `APP_URL`; copiare `docs/pitch/` in `src/web/public/pitch/` (stessa origine = telecomando dentro l'app); registrare il video di riserva da 30 s (stesso percorso della demo) come `demo.mp4`.
- [ ] **Edo:** dopo l'ultimo export, `python3 docs/pitch/snapshot.py` e ricontrollare: primo posto di Haworth × rover, righe di validazione (`VALIDATION_ROWS`), "Tibetan Plateau" per Phoenix × ISRU (oggi: 195 km da Qimantag, Qinghai).
- [ ] Verificare i tratteggiati: 57 giornate-persona e 28 k€ sono stime [A] di `docs/test-aziende.md`; la frase su Curiosity va controllata.
- [ ] Caso della demo: oggi `haworth__rover_mobility` (`DEMO_CASE` nello script). Si cambia con una riga.
- [ ] Prima del pitch: `DRAFT = false` nello script (toglie tratteggi e badge).
- [ ] Lingua del pitch: slide e note sono in inglese, come l'app.
- [ ] **Timo:** il nome nell'app è ancora "FVG Station" (titolo della pagina e intestazione): da cambiare in POLENTA.

## Numeri usati (branch `main`, export del 15/11, 11:03 UTC)

- **"Nuovo" con la regola dell'app** (`knownReason` in `src/web/src/data.js`, replicata in `snapshot.py`): fuori dalle regioni di analoghi famosi (`data/config/known_analogue_regions.json`) e a più di 150 km da un sito di test noto. Con questa regola: **63 dei 90** primi 5 posti sono nuovi, e lo sono **12 primi posti su 18** (prima della regola erano 18 su 18).
- **Validazione** (percentile sulla Terra, 100 = migliore): SP Crater 100 (Haworth, rover), Mojave LSPG 96 (Malapert, lidar), Rogers Dry Lake 95 (Haworth, lidar), Etna Concazze 89 (Malapert, rover), Mauna Kea 95 (Phoenix, ISRU). Sono righe in cui il sito noto si usa davvero per quel test; la tabella intera è in `data/export/validation.json` (il pannello Method non c'è più nell'app).
- **Haworth × rover:** #1 97 km da Winnemucca, Nevada (0,43, già usato: US Southwest); primo posto nuovo #4 Mabton, Washington (0,33).
- **Near you** (`data/export/near/`): funziona su Marte e Aristarchus, non sui siti polari lunari. Sedi: Torino e ISRO Bengaluru (Amman tolta l'11:55). Esempi: Gale × rover 0,99 sulla Terra, 0,84 entro 3.000 km da Torino (Armenia), 0,78 entro 1.500 km da ISRO Bengaluru (Rajasthan); Haworth × rover 0,43 sulla Terra, 0,17 entro 1.500 km da Torino.
- **Sensori:** la scheda della slide 3 (senza app) usa `data/config/sensors.json`, lo stesso file della scheda dell'app.

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

| # | Slide | Fine entro | Durata | Contenuto |
|---|---|---|---|---|
| 1 | **Chi siamo**: POLENTA e il team (Timoteo, Edoardo, Rocco) | 0:15 | 15 s | frase intera → le iniziali scivolano in POLENTA → frase dell'app e team |
| 2 | **Cosa facciamo**: Oggi / Con POLENTA | 0:40 | 25 s | lista dei candidati 3 settimane → minuti; siti noti → 61 su 90 nuovi; 57 → 20 giornate-persona; click: come funziona (ogni punto della Terra senza oceano né vegetazione) |
| 3 | **Come lo facciamo**: stesse metriche su Terra, Luna e Marte, poi il confronto | 1:10 | 30 s | dati NASA, mappa del caso con anelli di 1.500 / 3.000 / 5.000 km da Torino, validazione, limiti della Terra |
| 4 | **Cosa abbiamo trovato** | 1:35 | 25 s | matrice 6 siti × 3 test col primo posto inesplorato; sorprese: Tibet, Patagonia, Montana |
| 5 | **Vantaggio** sul caso guida | 2:05 | 30 s | Best on Earth contro Near you (regione: Middle East · Syria); box delle strutture indoor che chiudono le mancanze; tempo: −37 giornate-persona, 4-8 settimane prima |
| 6 | **Roadmap** | 2:35 | 30 s | dove testare → pilota → piano → preventivo; preventivo del caso |
| 7 | **Obiettivo** | 3:00 | 25 s | frase finale, richiesta di un pilota, team |
| — | **Demo dal vivo** della piattaforma | 4:00 | 60 s | percorso nella sezione "Demo della piattaforma" |

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

## Caso guida: Luna → Aristarchus Plateau → Rover mobility (deciso il 15/11, 13:40)

Slide e demo mostrano sempre questo caso (`DEMO_CASE` nello script). Numeri dall'export delle 11:34 UTC (`python3 docs/pitch/snapshot.py` per aggiornarli):

| | Best on Earth | Unexplored | Near you · Torino · 1.500 km | Near you · Torino · 3.000 km |
|---|---|---|---|---|
| Primo posto | Sterling, Colorado | Conrad, Montana | Bin Qirdan, Tunisia | 52 km da Ath Thawrah, Ar-Raqqah, **Siria** |
| Somiglianza | 0,88 | 0,69 | 0,46 | 0,49 |
| Già usato per test | sì (US Southwest: tutti e 5 i primi) | no | no | no |
| Test sul campo / finestra | 95% / 6 mesi | | | 65% / 12 mesi |
| Da Torino | 8.276 km | | 1.383 km | 2.781 km (−66%) |

Scelta del team (15/11, 13:50): in slide e demo resta il **primo risultato entro 3.000 km** (Ar-Raqqah, Siria). `NEAR_PICK` nello script lo decide.

Dove compare il caso: slide 2 (arco Aristarchus → posto vicino a Torino), slide 3 (scheda del posto se la demo dal vivo non va), slide 4 (mappa: posti non usati, migliori già usati, anelli di 1.500 e 3.000 km da Torino), slide 5 (confronto Best on Earth / Near you + preparazione della campagna 57 → 20 giornate-persona, €31k → €12k [A]), slide 6 (preventivo del caso).

### Demo della piattaforma (60 s in fondo al video, e dal vivo nella slide 3)

| Tempo | Azione nell'app | Cosa si vede / cosa dire |
|---|---|---|
| 0:00 | apertura, click **Moon** | volo sulla Luna |
| 0:05 | click **Aristarchus Plateau** | il sito: basalti e depositi piroclastici |
| 0:12 | click **Rover mobility** | modello 3D del rover, poi la Terra |
| 0:18 | **Best on Earth**, scroll veloce della lista | tutti e 5 "Already used for tests" (Colorado, Utah, Nevada) |
| 0:26 | **Unexplored**, scroll | i posti più simili dove nessuno testa: Montana, Cina, Bolivia, Brasile |
| 0:35 | **Near you** · Turin · **1.500 km** | Bin Qirdan (Tunisia), 1.383 km |
| 0:42 | **3.000 km**, click sul **primo risultato** | volo sul posto (Ar-Raqqah, Siria) |
| 0:46 | **scheda del posto** (scroll lento) | 65% del test sul campo, 12 mesi l'anno, sensore per ogni valore, ALTEC a Torino e LUNA per il resto |
| 1:00 | fine | |

Per registrarla serve l'app vera con le mappe (internet). Si decide insieme come: a mano (⌘⇧5 con l'app a tutto schermo) oppure con uno script che fa i click; la clip va in `video/demo/demo-platform.mp4` e la pipeline la mette in coda al video.

## Video (MP4 ad alta risoluzione)

⚠️ **Regola della submission** (Project Submission Guide, verificata il 15/11): *"Video (30 seconds or less) or slide deck (up to seven slides)"*; chi supera i limiti **non entra nel giudizio globale**. Per questo la pipeline ha due profili:

| Profilo | Cosa contiene | Durata | Uso |
|---|---|---|---|
| `submission` | slide principali + slot demo | **≤ 30 s, bloccante** (se `timeline.json` supera i 30 s, si ferma) | submission NASA |
| `full` | tutto il deck (senza la slide 3) + **slot di 60 s per la demo vera** in fondo | ~2:20 | pitch, YouTube, LinkedIn: **non** per la submission |

In alternativa al video, per la submission vale anche il deck stesso (7 slide) come link pubblico.

**Una volta sola:** `cd docs/pitch/video && npm install` (Chrome di sistema; ffmpeg arriva da `@ffmpeg-installer`, perché quello di Homebrew su questo Mac è rotto: manca `libx265`).

**Comandi** (da `docs/pitch/video/`):
- `npm run preview`: profilo full a 1920×1080, veloce, per controllare i tempi;
- `npm run full`: 3840×2160, 30 fps (~7 min di calcolo);
- `npm run submission`: 3840×2160, 30 fps, ≤ 30 s (~2-3 min);
- opzioni: `--fps 60`, `--crf 12` (qualità più alta), `--limit 5` (solo i primi 5 s, prova).

Il risultato è in `video/out/polenta-<profilo>-2160p30.mp4` (H.264 High, yuv420p, faststart: va bene per YouTube e Drive).

**Scaletta del video:** `video/timeline.json`, una riga per passo `[slide, passo, secondi]`. Si cambia lì, senza toccare il deck.

**Demo della piattaforma (slot in fondo):** metti la clip in `video/demo/demo-platform.mp4` (profilo full, 60 s) o `video/demo/demo-platform-30s.mp4` (submission). La pipeline la scala a 4K, la taglia alla durata dello slot e la unisce. Finché manca, al suo posto c'è un segnaposto nello stile del deck. Per registrarla:
- a mano: app a tutto schermo, macOS ⌘⇧5 (registra schermo), salvare la clip nella cartella;
- in automatico: uno script Playwright con i click della demo, da scrivere quando decidiamo cosa mostrare (serve internet per le tessere delle mappe).

**Come funziona:** con `index.html?record` il deck usa un orologio virtuale (`__advance`): timer, contatori, transizioni CSS, SVG animati e pianeti avanzano di 1/30 s per fotogramma. Chrome headless cattura un PNG per volta e ffmpeg li codifica: ogni fotogramma è esatto anche se in 4K la cattura è ~5 volte più lenta del tempo reale. Nessun accesso a internet durante la registrazione: i font sono in `fonts/` (copiati da `video/fonts.mjs`), e servono anche per il pitch offline.

**Testi:** il video non ha voce. Se aggiungiamo un parlato in italiano, la regola chiede sottotitoli in inglese.

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

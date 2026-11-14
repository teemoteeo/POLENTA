# Findings — Team FVG Station

Report vivo. Ogni sessione aggiunge le scoperte nuove in cima a "Log aggiornamenti" e aggiorna le sezioni interessate.
**Deadline:** dom 15 nov 2026, 16:00 (Roma). ~~Dato dichiarato dal team, da ricontrollare sulla Project Submission Guide.~~ Verificata il 14/11 sul programma della pagina evento; pitch alle 16:15.

---

## Decisioni prese

- **Challenge:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars* (sera del 13/11).
- **Prodotto:** una mappa della Terra con filtri a parametri. Ogni parametro calcola la similarità con il target (Luna o Marte) e restringe i risultati. Per ogni luogo si mostra cosa combacia e cosa no.
- **Direzione UI:** sito d'impatto visivo più che complesso. Menu iniziale con una navicella in stile arcade anni '80 che sceglie tra Luna e Marte.
- **Reference preferita dal team:** il portfolio con la navicella (Three.js forum, "Spaceship Exploration Interstellar Portfolio"): "ce l'immaginavamo così".
- **Esperienza chiave:** non girare tra i pianeti, ma **simulare l'arrivo dall'alto** su un luogo con una navicella piccola, leggere le caratteristiche del posto rispetto a Luna o Marte durante la discesa, poi atterrare e vedere il luogo.
- **Piano operativo unico (14/11):** `analog-atlas-plan.md`. Se due documenti non tornano, vale il piano.
- **Orari ufficiali (pagina evento Torino):** accoglienza sab 13:00, team 14:30, intro 15:00, **inizio hackathon 16:00**, cena 20:00–21:00; dom colazione 09:00, pranzo 13:00, finalizzazione 15:00, **deadline 16:00**, **pitch 16:15**, premiazione 17:30. La deadline globale (dom 23:59) per noi non conta.
- **Requisiti submission (Submission Guide):** demo = 7 slide **oppure** video ≤30 s (oltre si è esclusi dal giudizio globale); link pubblici senza login; almeno un dato NASA; uso dell'AI dichiarato, e l'idea deve essere del team.
- **Ruoli (14/11):** download e pipeline dati a Edo (una prima versione del piano li dava a Timo); Timo: app, navicella, UI del twist, deploy, video, submission; Rocco: config, testi, report, 7 slide, pitch.
- **Target MVP:** Jezero (Marte); Luna come extra.
- **Logica dei parametri:** punteggio 0–1 per dimensione + media geometrica pesata; nella UI ogni parametro si attiva/disattiva e ha una soglia minima. È il "restringe" della decisione sul prodotto.
- **Twist:** non ancora deciso. 10 candidati combinabili (T1 Analog Kit … T10 Mission planner) nel piano §1b e in `AGENTS.md`; si sceglie sab entro le 17:00, dopo le info in presenza.

## Dati

- Le risorse ufficiali della challenge sono in `clipboard/fonti/resources.txt`. Tabella parametro → dataset in `AGENTS.md`.
- **Per Marte la challenge non dà dataset specifici**, solo il PDS. MOLA, THEMIS e CRISM vanno presi da noi.
- **USGS Known Terrestrial Analog Sites** (https://catalog.data.gov/dataset/known-terrestrial-analog-sites-for-planetary-science): un layer di analoghi già noti (crateri, dune, vulcani). Serve da **ground truth**: se la nostra metrica li ritrova, è credibile. Poi il valore aggiunto sono i luoghi nuovi.
- **USGS PAAD:** database di analoghi eolici (dune, vento).
- **Concorrente diretto:** IMEWG "Mars on Earth – Analogues" (https://imewg.org/joint-initiatives/mars-on-earth-analogues), un database di analoghi marziani su un globo 3D. Risultava ancora in sviluppo.
- **Contratto pipeline→mappa (14/11):** config in `data/config/` (Rocco), export per l'app in `data/export/<target>/` (Edo): `scores.csv`, `sites.json`, `target.json`, `weights.json`. Formato nel piano §7; file di prova sab 18:00.

## Strumenti (Global Offers)

- Microsoft (Azure, **Planetary Computer**, Copilot), Google Cloud (Firebase, Maps), Meteomatics, GoDaddy (dominio + hosting), Miro.
- Si riscattano solo dopo il login su spaceappschallenge.org. **Limiti e crediti non ancora verificati.**
- Il più utile è il Planetary Computer: dati della Terra già pronti via STAC API.

## Stack tecnico consigliato (3D e atterraggio)

- **CesiumJS** (open source, Apache 2.0): Terra navigabile col terreno reale, e la discesa dall'orbita al suolo è nativa (`camera.flyTo`).
- **Cesium ion, account gratuito per uso non commerciale:**
  - Terra: World Terrain + immagini satellitari.
  - **Cesium Moon Terrain:** Luna 3D dai dati LRO della NASA.
  - **Cesium Mars:** terreno MOLA/HRSC a ~200 m + mosaico a colori Viking a ~232 m.
  - Sono gli stessi dataset NASA della challenge, già in 3D. Niente Blender.
- **Città 3D e Street View (14/11):**
  - Street View è proprietario Google: **nessun globo open source lo contiene**. Si combina un globo open source con le API di Google.
  - **Google Photorealistic 3D Tiles** (Map Tiles API), caricati in CesiumJS con `Cesium.createGooglePhotorealistic3DTileset()`: città 3D fotogrammetriche come in Google Earth. Prodotto Enterprise: probabilmente 1.000 sessioni gratis al mese, poi $6 ogni 1.000. Ogni root request apre una sessione di qualche ora, quindi per una demo basta. Dato da confermare sulla pagina prezzi di Google.
  - **Street View:** pannello `google.maps.StreetViewPanorama` (Maps JS API) aperto dopo l'atterraggio. In alternativa le Street View Tiles della Map Tiles API: 100.000 eventi gratis al mese.
  - Entrambi richiedono una chiave API e un account di fatturazione Google Cloud. La Global Offer di Google Cloud include le Maps API: da verificare se copre questi SKU.
  - **Alternativa open:** Mapillary (Meta), con il viewer open source MapillaryJS e immagini CC-BY-SA, API gratis.
  - **Limite reale:** gli analoghi sono deserti, crateri e grotte, dove Street View quasi non c'è. Le 3D Tiles e il terreno funzionano ovunque. Street View conviene come bonus quando c'è copertura, non come funzione portante.
- **Trucco per l'atterraggio:**
  1. La camera Cesium scende sul punto guardando in giù (pitch −90°).
  2. La navicella è uno sprite piccolo fisso al centro; con gsap si rimpicciolisce durante la discesa. I dati scorrono come un HUD.
  3. Negli ultimi secondi la camera si inclina e si vede il terreno 3D.
- **Il momento wow:** dopo l'atterraggio, schermo diviso tra il luogo sulla Terra e il suo corrispettivo su Luna o Marte, alla stessa scala, con le barre dei parametri.
- **Look retro:** vettoriale al fosforo (stile Asteroids e Lunar Lander, non Space Invaders). Shader RetroZone per il canvas del menu; `PostProcessStage` di Cesium per scanline e glow nella vista 3D. Un solo linguaggio visivo dal menu alla mappa.
- **Engine della mappa (14/11):** il piano propone deck.gl (`H3HexagonLayer`) su MapLibre, perché ~600k esagoni H3 in Cesium rischiano di pesare troppo. Timo decide entro sab 17:00 dopo il prototipo delle 16:00 (criteri: 600k celle fluide, atterraggio con flyTo, post-process retro).

## Repo `2005-Citadel` (clonato in `./2005-Citadel`)

- **Nessuna licenza:** pubblico ma non open source, cioè tutti i diritti riservati. Si può studiare, **non copiare** il codice nel progetto.
- Stack: `three` 0.167 + `gsap` + `howler` (audio) + `vite`. Facile da rifare da zero.
- I pianeti sono texture generiche di Poly Haven (rocce, terreno), non dati reali. Per noi conta il feeling: navicella, audio, HUD.
- Il modello della navicella (`public/models/new_ship_model_c.glb`, 6,8 MB) ha licenza ignota: non va riusato.

## Reference visive

Lista completa in `clipboard/references.md`. Aperte nel browser cmux: NASA Trek, Bruno Simon, Spaceship Interstellar Portfolio, earth.nullschool.

## Rischi

- **Lo stile retro dentro Cesium:** va provato nella prima ora, prima di costruirci sopra.
- **Data wrangling Terra↔Luna↔Marte in 24 h:** partire con 2-3 parametri (vedi l'MVP in `clipboard/fonti/BRIEFING-DIVISIONE.md`).
- **Un menu bellissimo seguito da una mappa standard:** i giudici notano lo stacco.
- **"Una mappa con dei pallini":** senza un analogo sorprendente e difendibile coi dati, l'idea perde forza.
- **Deadline locale anticipata:** submission alle 16:00 e pitch alle 16:15. Demo e slide pronte prima; invio entro le 15:30.
- **Fuso della pagina evento indicato come "Greenwich":** confermare all'intro delle 15:00 che gli orari sono di Roma.

## Da fare

- [ ] Creare il token Cesium ion (stasera)
- [ ] Riscattare le Global Offers (login di Rocco) e verificare i limiti
- [x] Verificare deadline e orari (14/11: pagina evento + Submission Guide)
- [ ] Scegliere il twist entro sab 17:00 (candidati nel piano §1b)
- [ ] All'intro delle 15:00: fuso orario, formato e durata del pitch, chi è il Team Owner che invia
- [ ] Prototipo: Cesium + post-process retro + `flyTo` su un punto
- [ ] Scaricare il layer USGS degli analoghi noti per validare la metrica
- [ ] Scegliere il luogo "surprise" (candidati FVG da verificare coi dati: Carso, Tagliamento, ghiaioni delle Dolomiti friulane)

---

## Log aggiornamenti

- **2026-11-14 12:37 (Edo):** documenti allineati al piano `analog-atlas-plan.md`. Orari presi dalla pagina evento di Torino (inizio sab 16:00, deadline dom 16:00, pitch 16:15) e requisiti dalla Submission Guide. Download dati spostati a Edo; formato dei file per l'app in `data/export/`; 10 twist candidati da scegliere sab entro le 17:00.
- **2026-11-14 12:10:** repo riorganizzata in `data/`, `src/web/`, `src/pipeline/`, `clipboard/`. In `AGENTS.md` ogni agent identifica il membro via `git config user.name` e scrive solo nel suo scope (frontend = Timo, pipeline = Edo, `data/` = Edo e Rocco, `clipboard/` = tutti).
- **2026-11-14 02:40:** provata la demo Sandcastle "Google Photorealistic 3D Tiles" (https://sandcastle.cesium.com/?id=google-photorealistic-3d-tiles): città 3D come Google Earth, zoom fluido, gira **via Cesium ion** (attribuzione "Cesium ion · Google Maps"). Quindi probabilmente basta il token ion, senza chiave Google. Da confermare col nostro token.
- **2026-11-14 02:30:** il globo con le città. Scelto CesiumJS + Google Photorealistic 3D Tiles; Street View come pannello Google separato; Mapillary come alternativa open; Street View poco presente sui siti analoghi.
- **2026-11-14 02:20:** primo report. Challenge scelta, dati e tool mappati, reference visive, stack Cesium per l'atterraggio, analisi del repo Citadel.

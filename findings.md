# Findings — Team FVG Station

Report vivo. Ogni sessione aggiunge le scoperte nuove in cima a "Log aggiornamenti" e aggiorna le sezioni interessate.
**Deadline:** dom 15 nov 2026, 16:00 (Roma). Dato dichiarato dal team, da ricontrollare sulla Project Submission Guide.

---

## Decisioni prese

- **Challenge:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars* (sera del 13/11).
- **Prodotto:** una mappa della Terra con filtri a parametri. Ogni parametro calcola la similarità con il target (Luna o Marte) e restringe i risultati. Per ogni luogo si mostra cosa combacia e cosa no.
- **Direzione UI:** sito d'impatto visivo più che complesso. Menu iniziale con una navicella in stile arcade anni '80 che sceglie tra Luna e Marte.
- **Reference preferita dal team:** il portfolio con la navicella (Three.js forum, "Spaceship Exploration Interstellar Portfolio"): "ce l'immaginavamo così".
- **Esperienza chiave:** non girare tra i pianeti, ma **simulare l'arrivo dall'alto** su un luogo con una navicella piccola, leggere le caratteristiche del posto rispetto a Luna o Marte durante la discesa, poi atterrare e vedere il luogo.

## Dati

- Le risorse ufficiali della challenge sono in `fonti/resources.txt`. Tabella parametro → dataset in `AGENTS.md`.
- **Per Marte la challenge non dà dataset specifici**, solo il PDS. MOLA, THEMIS e CRISM vanno presi da noi.
- **USGS Known Terrestrial Analog Sites** (https://catalog.data.gov/dataset/known-terrestrial-analog-sites-for-planetary-science): un layer di analoghi già noti (crateri, dune, vulcani). Serve da **ground truth**: se la nostra metrica li ritrova, è credibile. Poi il valore aggiunto sono i luoghi nuovi.
- **USGS PAAD:** database di analoghi eolici (dune, vento).
- **Concorrente diretto:** IMEWG "Mars on Earth – Analogues" (https://imewg.org/joint-initiatives/mars-on-earth-analogues), un database di analoghi marziani su un globo 3D. Risultava ancora in sviluppo.

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

## Repo `2005-Citadel` (clonato in `./2005-Citadel`)

- **Nessuna licenza:** pubblico ma non open source, cioè tutti i diritti riservati. Si può studiare, **non copiare** il codice nel progetto.
- Stack: `three` 0.167 + `gsap` + `howler` (audio) + `vite`. Facile da rifare da zero.
- I pianeti sono texture generiche di Poly Haven (rocce, terreno), non dati reali. Per noi conta il feeling: navicella, audio, HUD.
- Il modello della navicella (`public/models/new_ship_model_c.glb`, 6,8 MB) ha licenza ignota: non va riusato.

## Reference visive

Lista completa in `references.md`. Aperte nel browser cmux: NASA Trek, Bruno Simon, Spaceship Interstellar Portfolio, earth.nullschool.

## Rischi

- **Lo stile retro dentro Cesium:** va provato nella prima ora, prima di costruirci sopra.
- **Data wrangling Terra↔Luna↔Marte in 24-38 h:** partire con 2-3 parametri (vedi l'MVP in `fonti/BRIEFING-DIVISIONE.md`).
- **Un menu bellissimo seguito da una mappa standard:** i giudici notano lo stacco.
- **"Una mappa con dei pallini":** senza un analogo sorprendente e difendibile coi dati, l'idea perde forza.

## Da fare

- [ ] Creare il token Cesium ion (stasera)
- [ ] Riscattare le Global Offers (login di Rocco) e verificare i limiti
- [ ] Verificare deadline e orari sulla Project Submission Guide
- [ ] Prototipo: Cesium + post-process retro + `flyTo` su un punto
- [ ] Scaricare il layer USGS degli analoghi noti per validare la metrica
- [ ] Scegliere il luogo "surprise" (candidati FVG da verificare coi dati: Carso, Tagliamento, ghiaioni delle Dolomiti friulane)

---

## Log aggiornamenti

- **2026-11-14 02:40:** provata la demo Sandcastle "Google Photorealistic 3D Tiles" (https://sandcastle.cesium.com/?id=google-photorealistic-3d-tiles): città 3D come Google Earth, zoom fluido, gira **via Cesium ion** (attribuzione "Cesium ion · Google Maps"). Quindi probabilmente basta il token ion, senza chiave Google. Da confermare col nostro token.
- **2026-11-14 02:30:** il globo con le città. Scelto CesiumJS + Google Photorealistic 3D Tiles; Street View come pannello Google separato; Mapillary come alternativa open; Street View poco presente sui siti analoghi.
- **2026-11-14 02:20:** primo report. Challenge scelta, dati e tool mappati, reference visive, stack Cesium per l'atterraggio, analisi del repo Citadel.

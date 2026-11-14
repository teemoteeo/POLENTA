# Reference visive

Direzione: sito d'impatto, interattivo, estetica arcade anni '80. Il menu iniziale è una navicella che vola nello spazio e sceglie tra Luna e Marte, poi si passa alla mappa con i filtri.

Twist candidati che toccano l'esperienza visiva: itinerario del kit (T1), "quanto è marziano casa tua?" (T8), modalità Lunar Lander (T9). Dettagli in `analog-atlas-plan.md` §1b.

Nota sullo stile: una navicella che vola libera e ruota è più vicina ad *Asteroids* (Atari 1979, grafica vettoriale a linee luminose) che a *Space Invaders* (pixel, navicella che si muove solo in orizzontale). Per la transizione verso la Luna, il riferimento naturale è *Lunar Lander* (Atari 1979). Sono ispirazioni di linguaggio visivo, non giochi da ricreare.

## 1. Strumenti ufficiali (cosa fanno i "seri")

| Reference | Cosa guardare | Link |
|---|---|---|
| NASA Solar System Treks (Moon Trek, Mars Trek) | mappe 2D/3D di Luna e Marte con layer di dati sovrapposti e strumenti di misura. È il "tool serio" da battere sull'esperienza | https://trek.nasa.gov |
| NASA Eyes on the Solar System | 3D nel browser, navigazione fluida, tour guidati. Si può embeddare con `?embed=true` | https://eyes.nasa.gov/apps/solar-system |
| IMEWG "Mars on Earth – Analogues" | database di analoghi marziani su un globo 3D. È il concorrente diretto della nostra idea | https://imewg.org/joint-initiatives/mars-on-earth-analogues |
| USGS Known Terrestrial Analog Sites | layer di punti (crateri, dune, vulcani) su ArcGIS. Utile anche come dataset di **ground truth** per validare la nostra similarità | https://catalog.data.gov/dataset/known-terrestrial-analog-sites-for-planetary-science |
| USGS PAAD (Planetary Aeolian Analog Database) | analoghi eolici (dune, vento) | https://www.usgs.gov/data/paad-planetary-aeolian-analog-database |
| ESA: catalogare paesaggi extraterrestri sulla Terra | come racconta gli analoghi l'ESA | https://www.esa.int/Our_Activities/Preparing_for_the_Future/Discovery_and_Preparation/Cataloguing_otherworldly_landscapes_on_Earth |
| earth.nullschool.net | globo con dati animati (vento, temperatura), minimale e scuro. Riferimento per i "dati come visual" | https://earth.nullschool.net |
| Windy | UI per attivare e disattivare layer di parametri su una mappa. Riferimento diretto per il pannello filtri | https://www.windy.com |

## 2. Interpretazioni giocose e visivamente forti

| Reference | Cosa guardare | Link |
|---|---|---|
| Bruno Simon, portfolio | il sito come videogioco (guidi una macchinina). Il benchmark del "sito d'impatto" | https://bruno-simon.com |
| Three.js forum: open world space portfolio | navicella libera nello spazio, approvato su Awwwards | https://discourse.threejs.org/t/an-open-world-space-experience-as-a-portfolio/74951 |
| Three.js forum: Spaceship Exploration Interstellar Portfolio | voli con la navicella e "scansioni" i pianeti per sbloccare info. Molto vicino al nostro menu | https://discourse.threejs.org/t/spaceship-exploration-interstellar-portfolio/92550 |
| Atlas of Space | explorer del sistema solare in Three.js | https://discourse.threejs.org/t/atlas-of-space-interactive-solar-system-explorer/76389 |
| Eyad Radwan, sci-fi portfolio | retro + terminale + navicella con le frecce + mappa interattiva | https://contra.com/p/NMWX2AkF-sci-fi-portfolio-concept-project |
| Tiny Pixel Planets | navigazione tra pianeti in pixel art, HTML5 open source | https://sp-possibilities.itch.io/tiny-pixel-planets |
| Bobgar's Space Game (PICO-8) | rotazione + spinta + atterraggio sui pianeti: la meccanica del menu in 1 file | https://bobgar.itch.io/bobgars-space-game |
| Stellar Drifter | roguelike spaziale a bassa risoluzione, fatto in 2 settimane | https://polumrak.itch.io/stellar-drifter |
| Framer "space invaders" component | navicella retro guidata col mouse, usata come header | https://marketplace.framer.com/marketplace/components/space-invaders |

## 3. Kit tecnici per il look (per fare in fretta)

| Kit | A cosa serve | Link |
|---|---|---|
| RetroZone | shader WebGL open source con modalità **Vector** (bloom, scie al fosforo, aberrazione cromatica). Funziona su Canvas2D, Three.js, PixiJS, Phaser. Il modo più rapido per il look Asteroids | https://editor.phaser.io/news/2026/03/retrozone-open-source-retro-display-engine-phaser |
| WebGL CRT Shader | effetto CRT leggero (scanline, curvatura) | https://blog.gingerbeardman.com/2026/01/04/webgl-crt-shader/ |
| Cathode | dashboard dati in stile CRT al fosforo. Riferimento per la mappa e i filtri nello stesso stile del menu | https://discourse.threejs.org/t/cathode-a-crt-phosphor-trading-workspace-with-a-three-js-barrel-lens-candlestick-renderer/92767 |
| Arwes | framework UI sci-fi. Attenzione: le animazioni pesano sul web | https://arwes.dev |
| Font | Press Start 2P (titoli), VT323 (testo e dati). Entrambi su Google Fonts | https://fonts.google.com/specimen/Press+Start+2P |
| Asset pixel | pacchetti di pianeti e navicelle 8-bit | https://itch.io/game-assets/new-and-popular/tag-8-bit/tag-space |

** Profili Asset & Vincoli di Sistema (MBSE / Go-No-Go)**

* [1] **Editor Specifiche Asset:** Permettere di impostare soglie tecniche rigide (es. pendenza massima del lander, ore minime di luce continua, profondità di scavo).
* [2] **Maschere di Fattibilità (Go/No-Go):** Sovrapporre sulla mappa 3D le zone sicure vs. fuori specifica, calcolando la percentuale di area atterrabile/operativa.
* [3] **Analisi di Sensitività (Trade-Off):** Mostrare come varia la superficie disponibile modificando un parametro di progetto (es. tolleranza del carrello da 12° a 15°).

** Simulazione Operativa Temporale ("4D ConOps")**

* [6] **Timeline Dinamica di Missione:** Evolvere il calcolo dell'illuminazione lungo finestre temporali reali (giorni/mesi) invece che su una singola istantanea statica.
* [7] **Stima Cicli Termici & Comunicazioni:** Calcolare l'alternanza giorno/notte (escursioni termiche) e le finestre di visibilità diretta Terra-Luna o necessità di satelliti relè.

** Pianificazione Multi-Asset & Infrastruttura di Superficie**

* [8] **Layout Multi-Nodo:** Permettere il posizionamento simultaneo di più asset sulla mappa (es. lander cargo, modulo abitativo e impianto ISRU).
* [9] **Ottimizzazione Percorsi & Distanze di Sicurezza:** Calcolare il tragitto ottimale per i rover tra i vari nodi, bilanciando consumo energetico e distanza di sicurezza dai getti di atterraggio (*plume impingement*).

** Interoperabilità & Export Ingegneristico**

* [10] **Export Mesh e Dati Geospaziali:** Esportare le griglie del terreno ad alta risoluzione in formati standard CAD/GIS (`.stl`, `.obj`, `.geotiff`).

** Dati e test (da fare con rigore)**

* [14] **Bivio ISRU: ghiaccio / terreno.** Dividere isru_subsurface in due test: "ISRU ghiaccio" (come l'attuale, con il filtro sui posti senza permafrost) e "ISRU terreno" (scavo, sinterizzazione, ossigeno: pesa roccia/FeO, granulometria e densità, niente ghiaccio). Con il ghiaccio nessun posto supera 0,28 (export 70ad283): probabilmente la campagna ISRU richiede due posti. Da fare: pesi decisi da Rocco nella matrice, nuova colonna in siti_e_pesi.csv e test in tests.yaml, scelta nell'app, export e confronto prima/dopo.
* [15] **Raffinamento a convergenza.** Ogni export raffina a 30 m i nuovi candidati, che possono entrare nelle classifiche: ripetere il raffinamento finché non compaiono candidati nuovi, così l'export dipende solo dalla configurazione (Edoardo, 19/11). Fino ad allora si pubblica con --no-refine l'anteprima controllata.
* [16] **Terreno di Marte con la stessa definizione della Terra.** Per la Luna pendenza, rugosità e crateri sono calcolati da noi su LOLA (lunar.py); per Phoenix e Gale sono ancora valori di letteratura (HiRISE/CTX) con definizioni diverse. Segnale: per Phoenix × rover tutti i posti prendono 0,01-0,04 sulla rugosità. Da calcolare su DTM HiRISE/CTX con la definizione terrestre.
* [17] **Pendenza per test.** Rover: pendenza sul terreno percorribile e quota di area percorribile, soglia 20° = requisito LTV ("safely traverse up and down 20° slopes", Creager et al. 2025, NASA NTRS 20250003470, §1.3 p.5); calcolare anche a 15° per verificare il 13,5° di Wueller 2025; lidar: pendenza su tutta la regione. Stessa definizione su Luna e Terra (approvato da Rocco il 19/11).
** Dati per Simulink (lista del 20/11; regola: fonte con pagina o tabella per ogni numero)**

* [19] **Fonti della matrice da correggere (dopo che Edoardo applica EDO_pendenza.patch, che tocca siti_e_pesi.csv).** Quota di Gale −4520 m: Martínez et al. 2017 p.309 (Phoenix −4,1 km, Tab. 1 p.299). Massi di Phoenix: la matrice cita Golombek 2012 sui siti di Curiosity; fonte giusta Golombek et al. 2008 (doi:10.1029/2007JE003065), coerente con Arvidson et al. 2008 Fig. 16 p.12 (sotto il 5%). Pendenza di Phoenix 10 ± 1,5° non confermata: Arvidson 2008 p.12 dice solo "molto sotto i requisiti"; numeri in Kirk et al. 2008 (doi:10.1029/2007JE003000). Valori di Gale: Golombek et al. 2012 (doi:10.1007/s11214-012-9916-y). Servono i tre PDF.
* [20] **Colonne nuove dalla pipeline (Edoardo, dopo l'export di [17]).** Pressione al suolo MERRA-2 (PS, già usata per la densità dell'aria; sostituisce la stima dalla quota con la U.S. Standard Atmosphere 1976), profondità del ghiaccio Diviner (già letta in ice_access.py), emissività MODIS (bande 31-32 di MOD11A2). Buchi isolati da controllare: quota e temperatura mancanti vicino a Zhaozhou (45,5 N 125,6 E); densità 0-2 m SoilGrids assente in 5 posti (Hooper Bay, Stansbury, Homedale, Altamira, Qimantage).
* [21] **Grandezze termiche.** Emissività; conducibilità e calore specifico (Luna: Vasavada et al. 2012 doi:10.1029/2011JE003987, Hayne et al. 2017 doi:10.1002/2017JE005387). Terra: inerzia termica SI non misurata (oggi NaN, "no Earth equivalent"); possibile stima per suolo secco dalla densità e dalla tessitura, da decidere.
* [22] **Massi per dimensione.** Dalla copertura di massi al numero di massi per dimensione (Golombek & Rapp 1997 doi:10.1029/96JE03319; Phoenix: Golombek et al. 2008): ostacoli per rover e lidar. Verificare se il modello vale anche per la Luna.
* [23] **Lidar e composizione.** Riflettanza a 1064 nm (Luna: LOLA, Lucey et al. 2014; Terra: bande MODIS da interpolare; Marte: MOLA); TiO2 / ilmenite (mappe LROC WAC); FeO sulla Terra (oggi NaN).
* [24] **Pendenza su pochi metri** per il lidar (DTM ad alta risoluzione, non ovunque). Collegato a [10] (mappe delle quote nel pacchetto) e a [6], [7] (Sole e temperatura nel tempo).

** Personalizzazione Demo per la Visita**

* [12] **Preset "TAS / Argonaut":** Creare e precaricare nella pipeline un profilo dedicato ai parametri tipici di un lander lunare europeo da mostrare dal vivo durante l'incontro.

** AMBIZIOSO**

* [25] **Classifica in tempo reale con pesi scelti dall'utente.** Il voto per parametro non dipende dai pesi: solo il totale (media geometrica pesata, κ, filtri; score.py) li usa, quindi l'app può ricalcolare la classifica in millisecondi. Serve: (1) export dei valori terrestri di tutti gli esagoni, uguale per tutti i siti, più le tabelle dei percentili (6-10 MB compressi, caricati solo in modalità "pesi personalizzati"; permette di cambiare anche i target); (2) logica dei posti di sites.py in JS (top 1%, componenti H3, un posto ogni 100 km, nomi, cosa si rompe, strutture), con un test che con i pesi standard riproduca esattamente le classifiche pubblicate; (3) il terreno a 30 m esiste solo per i candidati dei pesi standard: gli altri mostrano la stima a 500 m, già marcata "estimated"; (4) report e pacchetto Simulink devono dichiarare "pesi personalizzati" con i pesi usati; (5) slider per parametro nel grafico dei pesi, rinormalizzati a somma 1 (Timo). Stima: Edoardo ½ giorno, Claude ~1 giorno, Timo ~1 giorno. Da fare dopo l'export di [17].
* [26] **Tutta la Terra a 30 m (per esagono, non per pixel).** Calcolare le grandezze di terreno a 30 m (pendenza, pendenza percorribile, quota percorribile, rugosità, crateri) su tutti gli esagoni di terra, non solo su candidati, campione e siti noti (oggi ~7.800). Dati: ~500.000 esagoni × 5 valori ≈ 10 MB; i pixel a 30 m (2-3 TB) restano su Earth Engine. Calcolo: 1-3 giorni di Earth Engine (7.791 esagoni ≈ 1 h), con Export task in background a blocchi per regione e ripresa, non getInfo dal Mac; prima misurare i tempi dei crateri (focalMin/focalMax) su una regione. Vantaggi: niente più calibrate.py né valori "estimated", [15] non serve più, percentili su tutta la Terra invece del campione di 5.054, [25] affidabile con qualsiasi peso. Da fare dopo [17], con le definizioni finali (soglia 20°, tetto della pendenza percorribile).

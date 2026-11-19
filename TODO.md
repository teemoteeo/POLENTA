** Profili Asset & Vincoli di Sistema (MBSE / Go-No-Go)**

* [1] **Editor Specifiche Asset:** Permettere di impostare soglie tecniche rigide (es. pendenza massima del lander, ore minime di luce continua, profondità di scavo).
* [2] **Maschere di Fattibilità (Go/No-Go):** Sovrapporre sulla mappa 3D le zone sicure vs. fuori specifica, calcolando la percentuale di area atterrabile/operativa.
* [3] **Analisi di Sensitività (Trade-Off):** Mostrare come varia la superficie disponibile modificando un parametro di progetto (es. tolleranza del carrello da 12° a 15°).

** Supporto Campagne di Test & "Analogue Twin" (AIV)**

* [4] **Gap Analysis Ambientale:** Evidenziare le differenze tra il sito planetario scelto e l'analogo terrestre più simile (es. divario su gravità, granulometria o angolo solare).
* [5] **Raccomandazioni di Test:** Generare suggerimenti operativi per compensare in laboratorio (es. camere termovuoto o testbed rover) i parametri mancanti sul campo terrestre.

** Simulazione Operativa Temporale ("4D ConOps")**

* [6] **Timeline Dinamica di Missione:** Evolvere il calcolo dell'illuminazione lungo finestre temporali reali (giorni/mesi) invece che su una singola istantanea statica.
* [7] **Stima Cicli Termici & Comunicazioni:** Calcolare l'alternanza giorno/notte (escursioni termiche) e le finestre di visibilità diretta Terra-Luna o necessità di satelliti relè.

** Pianificazione Multi-Asset & Infrastruttura di Superficie**

* [8] **Layout Multi-Nodo:** Permettere il posizionamento simultaneo di più asset sulla mappa (es. lander cargo, modulo abitativo e impianto ISRU).
* [9] **Ottimizzazione Percorsi & Distanze di Sicurezza:** Calcolare il tragitto ottimale per i rover tra i vari nodi, bilanciando consumo energetico e distanza di sicurezza dai getti di atterraggio (*plume impingement*).

** Interoperabilità & Export Ingegneristico**

* [10] **Export Mesh, Dati Geospaziali & Simulink:** (Simulink .mat + init_polenta.m: fatto, vedi README; restano .stl/.obj/.geotiff) Esportare le griglie del terreno ad alta risoluzione in formati standard CAD/GIS (es. `.stl`, `.obj`, `.geotiff`) e dataset ambientali/traiettorie in formati compatibili con **Simulink** (es. `.mat` / script di inizializzazione) per simulazioni di dinamica di volo e controllo.
* [11] **Report di Trade-Off Automatico:** Generare una scheda tecnica esportabile (PDF/CSV) con pesi, fonti dati e punteggi per revisioni di progetto.

** Dati e test (da fare con rigore, dopo l'export Simulink)**

* [14] **Bivio ISRU: ghiaccio / terreno.** Dividere isru_subsurface in due test: "ISRU ghiaccio" (come l'attuale, con il filtro sui posti senza permafrost) e "ISRU terreno" (scavo, sinterizzazione, ossigeno: pesa roccia/FeO, granulometria e densità, niente ghiaccio). Con il ghiaccio nessun posto supera 0,28 (export 70ad283): probabilmente la campagna ISRU richiede due posti. Da fare: pesi decisi da Rocco nella matrice, nuova colonna in siti_e_pesi.csv e test in tests.yaml, scelta nell'app, export e confronto prima/dopo.

* [15] **Raffinamento a convergenza.** Ogni export raffina a 30 m i nuovi candidati, che possono entrare nelle classifiche: ripetere il raffinamento finché non compaiono candidati nuovi, così l'export dipende solo dalla configurazione (Edoardo, 19/11). Fino ad allora si pubblica con --no-refine l'anteprima controllata.
* [16] **Terreno di Marte con la stessa definizione della Terra.** Per la Luna pendenza, rugosità e crateri sono calcolati da noi su LOLA (lunar.py); per Phoenix e Gale sono ancora valori di letteratura (HiRISE/CTX) con definizioni diverse. Segnale: per Phoenix × rover tutti i posti prendono 0,01-0,04 sulla rugosità. Da calcolare su DTM HiRISE/CTX con la definizione terrestre.
* [17] **Pendenza per test.** Rover: pendenza sul terreno percorribile e quota di area percorribile, soglia 20° = requisito LTV ("safely traverse up and down 20° slopes", Creager et al. 2025, NASA NTRS 20250003470, §1.3 p.5); calcolare anche a 15° per verificare il 13,5° di Wueller 2025; lidar: pendenza su tutta la regione. Stessa definizione su Luna e Terra (approvato da Rocco il 19/11).

** Personalizzazione Demo per la Visita**

* [12] **Preset "TAS / Argonaut":** Creare e precaricare nella pipeline un profilo dedicato ai parametri tipici di un lander lunare europeo da mostrare dal vivo durante l'incontro.
* [13] **Architettura "Plugin-Ready":** Documentare o predisporre un file di configurazione pulito per mostrare come integrare facilmente modelli proprietari dei loro sensori o sottosistemi.

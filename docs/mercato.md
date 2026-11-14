# Ricerca di mercato: education o nicchia B2B?

Autore: Timo · 2026-11-14 · fonti: conversazione con la mentor (registrazione), welcome dell'evento, web.

## Recap della sera (14/11, dopo l'analisi in `mercato.md`) — da discutere col team

Non sono decisioni prese: è la proposta da discutere con Edo e Rocco.

**Cosa abbiamo capito dal mercato**
- I player B2B (LUNA, ALTEC, Astrobotic, PISCES, Space Resource Technologies, Off Planet) vendono strutture di test e simulanti. Le loro pagine sono statiche e nessuno misura quanto la propria struttura o il proprio materiale somigli a un target preciso.
- Correzione: non vendono simulanti perché ci guadagnano. Chi ha provato a farlo per profitto è quasi sempre fallito (Zybek, ORBITEC, DSI). Li vendono perché un test richiede il materiale in mano.
- Nessuno offre una visualizzazione interattiva che spieghi perché un luogo o un materiale somiglia al sito di atterraggio che ti interessa. Però l'interattività da sola non ci distingue: almeno 15 team di questo Space Apps fanno mappe interattive di similarità.
- **Vincolo di validità** (detto dalla mentor): i grani terrestri sono arrotondati da aria e acqua, quelli lunari sono taglienti da impatto. Un affioramento naturale può combaciare in chimica e mineralogia, non in geotecnica. Anche i simulanti commerciali sono roccia terrestre macinata.
  - Il claim da non fare: "trovi il materiale al posto del simulante".
  - Il claim difendibile: "trovi dove sta la roccia sorgente giusta vicino a te", per chi deve muovere centinaia di tonnellate (scavo, costruzione, ISRU, riempire una hall). A quei volumi 35-120 $/kg sono proibitivi. Precedenti: LUNA usa anortosite della Groenlandia; il paper del 2026 indica l'Etna.

**Forma proposta per l'app**
- Il prodotto è la **scelta del sito di test**, non la mappa: si parte dalla domanda dell'utente, non dal target.
- Una mappa sola con tre tipi di punti:
  1. **siti naturali** per test all'aperto;
  2. **strutture indoor** (LUNA, ALTEC, Moonyard, Astrobotic, PISCES…: lista di circa 10 punti scritta a mano);
  3. **sorgenti di materiale** (affioramenti e cave).
- Flusso: scegli il target (Jezero), scegli il **tipo di test** (mobilità, atterraggio, trivella, ISRU/materiale, costruzione). Il tipo di test imposta i pesi delle dimensioni:
  - mobilità → pendenza, rugosità, granulometria;
  - trivella → ghiaccio, durezza;
  - ISRU → mineralogia.
- Ogni risultato apre una card con le barre di cosa combacia e cosa no, e dove l'analogia si rompe.
- Il B2B sta nei preset per tipo di test; il mainstream nella UI che chiunque capisce. L'education (Moon Camp, ESERO) è la versione gratuita e fa da canale.
- Costo sul piano attuale: basso. I preset sono un file di config, le strutture indoor sono una lista statica.

**Proposta di MVP:** due tipi di test, **mobilità** (usa i dati di terreno che Edo sta già preparando) e **ISRU/materiale** (racconta il "perché questo materiale"). Gli altri compaiono nella UI come "coming soon".

**Da verificare subito (Edo e Rocco):** la mineralogia. EMIT copre solo le zone aride e misura una decina di minerali delle polveri (argille, carbonati, gesso, ossidi di ferro). Jezero è olivina, carbonati e argille, e l'olivina potrebbe mancare. Se EMIT non regge, il layer materiali si fa a mano con 5-10 sorgenti note dalla letteratura (Etna, Stillwater, Groenlandia, Lanzarote) e lo si dichiara.

**Gancio per il pitch:** Space Resource Technologies vende un simulante di Jezero (JEZ-1). Noi diciamo dove sulla Terra si trova la roccia che ci somiglia, e dove l'analogia si rompe.

---

## Verdetto

Nicchia B2B. Target: chi deve testare hardware lunare (rover, lander, ISRU, stampa 3D da regolite) e università o agenzie che vogliono accedere ad ambienti analoghi spendendo poco. L'education resta un layer secondario sullo stesso motore (vista pubblica della mappa), non il prodotto.

## Cosa ha detto la mentor

- Il settore si sta aprendo ai privati: si può lavorare nello space senza un contratto diretto con un'agenzia, e i privati possono rischiare e saltare certificazioni.
- Il mercato privato più caldo è la Luna, non Marte: regolite, simulanti, rover, strutture di lander, Moonbase, stampa 3D per edilizia lunare. L'Italia è tra i paesi principali su questo (contratti ASI).
- La regolite è il problema tecnico n.1: grani appuntiti da impatto, laceranti, entrano nelle giunture.
- Il pubblico ed educativo "non ha soldi": servirebbe roba super economica. Esistono tender ESA di divulgazione, ma con richieste molto diverse.
- La sua preferenza: nicchia, perché ha meno vincoli, più soldi e basta la traction di un singolo caso. Puntare su agenzie e università che devono accedere a questi ambienti senza spendere troppo.
- Spunto chiave: trovare "non simulanti, ma equivalenti" naturali di quegli ambienti, che costano poco, mentre le strutture dedicate costano moltissimo. Esempio citato: l'Etna, dove hanno già portato rover.
- Il training è un'applicazione possibile (Islanda, Giordania). Premio da guardare: T-TeC di Leonardo e Telespazio.

## Evidenze di mercato (B2B)

- **Domanda di regolite e test:** chi costruisce rover, lander e razzi lunari ha bisogno di regolite simulata "a tonnellate" (Fox Weather). NASA parla di carenza di simulanti, alcuni non sono più prodotti.
- **Prezzo dei simulanti:** LHS-1 costa circa 45 $/kg per 1 kg e 65-120 $/kg nei preventivi INAF-IAPS (varianti LHS-1D). Un bulk LHS-1E è listato a 20.000 $, senza quantità indicata. Più aziende hanno provato a venderli a scopo di lucro (Zybek, ORBITEC, Deep Space Industries) senza grande successo.
- **Equivalenti naturali:** un paper del 2026 (Materials Today Advances) valuta i depositi vulcanici dell'Etna come simulanti ad alta fedeltà per l'ISRU lunare. Conferma lo spunto della mentor.
- **Cliente locale:** ALTEC (Torino, partecipata da Thales Alenia Space e ASI) sta costruendo un Lunar Simulation and Mission Control Center con terreno analogo indoor pieno di simulante e una camera termo-vuoto "sporca" per il Polo Sud lunare. Il 12/10/2026 ha firmato un MoU con ispace-Europe per test di rover, simulazioni e training degli operatori.
- **Sponsor dell'evento:** Thales Alenia Space e Argotec danno premi speciali. Thales Alenia guida il Multi-Purpose Habitat (MPH) per Artemis, che ha superato la SRR NASA il 19/05/2026 e ha il primo modulo previsto nel 2033.
- **Dimensione:** secondo PwC (2026) l'economia lunare vale fino a 127 miliardi $ al 2050. Mobilità e abitazione sono due dei cinque pilastri.
- **Siti usati oggi:** Etna (ESA e DLR, campagna Analog-1), Lanzarote (PANGAEA, MIT), Islanda (DIGMARS, CHILL-ICE, Iceland Space Agency), Ries in Germania e Dolomiti (PANGAEA), Teide. DLR si è costruita un campo prova di 630 m² perché andare in sito remoto costa troppo.

## Il buco (dove sta la creatività)

- I cataloghi esistenti sono vecchi o statici: il Catalogue of Planetary Analogues ESA/CAFE è del 2012 (aveva anche logistica, permessi e contatti), Europlanet PFA ha 5 siti, il database IMEWG è "in sviluppo". Una review del 2013 dice che mancano criteri definiti per valutare gli analoghi.
- Nessuno risponde alla domanda di un'azienda: "il mio target è il sito X sul Polo Sud lunare: dove sulla Terra trovo terreno, pendenze, materiale e temperature equivalenti, e cosa non torna?"
- Attenzione: c'è già almeno un team con un ranking per sola similarità di terreno (github.com/shishir-kuet/terrestrial-analog-finder, DEM di LOLA, CTX e Copernicus). La sola topografia è commodity. Serve differenziarsi su mineralogia (EMIT), uso concreto e limiti dichiarati.

## Education: perché no come core

- Soldi: confermato dalla mentor. Il B2C che esiste vende esperienze, non dati: LunAres costa 2.600 € (2.100 € per studenti) per 18 giorni.
- Pro: la challenge cita "educate the public" come opzione per documentare i risultati, quindi una vista pubblica non è fuori tema. Va usata come addendum, non come tesi.

## Implicazioni per la pipeline (per Edo e Rocco)

- Il target MVP del piano è Jezero (Marte). Il mercato privato secondo la mentor è soprattutto lunare (Polo Sud: Artemis, MPH, ALTEC, dati Diviner). Passare alla Luna è una decisione del team, con un costo sulla pipeline. Restando su Marte, il gancio B2B c'è comunque: il rover ExoMars sarà gestito da ALTEC a Torino (twist T5).
- Twist coerenti con il B2B: T10 (mission planner: dove testo questa tecnologia), T2 (costo di accesso), T5 (ALTEC).
- SRTM copre solo 60N-56S. Islanda (63-66N) e Haughton (75N) sono fuori: per le alte latitudini serve Copernicus DEM.
- Asse da aggiungere alla similarità: il materiale (mineralogia e granulometria come proxy della regolite), non solo la forma del terreno.

## Vincoli del pitch (dal welcome)

- Criteri: impatto, creatività (nuovo o completa qualcosa che esiste), validità scientifica, rilevanza alla challenge, presentazione.
- Pitch di 4 minuti, tagliano chi sfora.
- La submission su spaceappschallenge.org serve anche per la fase internazionale, a prescindere dal risultato locale. Per noi la deadline è dom 15/11 alle 16:00 (vedi `findings.md`), non le 23:59 dette al welcome.

## Fonti

- https://www.foxweather.com/earth-space/the-business-of-space-dirt-making-lunar-martian-and-asteroid-soil
- https://ares.jsc.nasa.gov/projects/simulants/
- https://www.ucf.edu/news/ucf-experimental-space-dirt-used-by-nasa-private-companies-to-advance-space-exploration/
- https://spaceresourcetech.com/products/lhs-1-lunar-highlands-simulant
- https://acquisti.iaps.inaf.it/docs/D1611-ErinaPizzi-638737627124538266.pdf
- https://iris.unive.it/retrieve/6077759b-95e2-49c9-9641-50f088304a57/Melchiori_MTA2026.pdf
- https://publications.spaceops.org/2025/download_by_id.php?id=0507
- https://www.satellitetoday.com/space-economy/2026/10/12/ispace-and-altec-combine-for-new-lunar-testing/
- https://europeanspaceflight.com/italys-lunar-habitat-clears-nasa-system-requirements-review/
- https://spaceq.ca/pwc-report-lunar-economy-projected-to-generate-up-to-us127-billion-by-2050/
- https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Rover_plus_astronaut_complete_Mount_Etna_challenge
- https://www.dlr.de/en/latest/news/2021/04/dlrs-scout-rover-trains-for-the-moon-and-mars
- https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/CAVES_and_PANGAEA/What_is_PANGAEA
- https://www.esa.int/Our_Activities/Preparing_for_the_Future/Discovery_and_Preparation/Cataloguing_otherworldly_landscapes_on_Earth
- https://link.springer.com/article/10.1007/s11214-017-0369-1
- https://imewg.org/joint-initiatives/mars-on-earth-analogues
- https://github.com/shishir-kuet/terrestrial-analog-finder
- https://lunares.space/apply
- https://spacedata.swapniltamse.com/challenges/earth-analogs-moon-mars/


---

# Mercato: competitor e clienti

Autore: Timo · 2026-11-14 sera. Ricerca web fatta da agenti. Le homepage sono state verificate via HTTP dove indicato; il resto è segnato "non verificato".

## TL;DR

- **Il rischio più grosso è in sala.** Almeno 15 repo pubblici di altri team Space Apps 2026 fanno la nostra stessa cosa: una mappa che classifica i siti della Terra per somiglianza con un target su Luna o Marte. Alcuni hanno "why it ranks", pesi regolabili e una pagina sui limiti. La mappa di similarità di terreno da sola è commodity.
- **Il buco vero:** nessuno mette sulla stessa scala, rispetto a un target preciso, i siti naturali, le strutture indoor (LUNA, ALTEC) e i simulanti, dicendo dove l'analogia si rompe. Nessuno mappa i materiali naturali della Terra come alternativa economica ai simulanti.
- **Nicchia proposta:** il flusso di lavoro, non la mappa. In entrata il requisito di test ("ruota del rover, 20° di pendenza, regolite del Polo Sud"); in uscita una shortlist di siti, strutture e materiali, con le lacune di fedeltà, i permessi e la logistica.
- **Clienti a Torino:** ALTEC, Thales Alenia Space (rover Etna), PoliTo PIC4SeR e Team DIANA, AIKO, Evolunar. ispace-EUROPE arriva tramite ALTEC.
- **Canale education gratuito:** ESA Moon Camp ed ESERO Italia. Migliaia di studenti scelgono ogni anno un sito per una base lunare.

---

## Competitor — A. Accesso pubblico, studenti, ricerca

| Nome | Link | Cosa fa | Overlap | Buco | Stato |
|---|---|---|---|---|---|
| NASA Moon Trek / Mars Trek | https://trek.nasa.gov/moon/ · https://trek.nasa.gov/mars/ | GIS web dei dati planetari: DEM, pendenze, illuminazione | Stessi layer lato Luna e Marte | Niente lato Terra, niente analoghi, UI per esperti | Attivo |
| NASA Analog Explorer | https://science.nasa.gov/solar-system/analog-explorer/ | 11 coppie di immagini Terra/altro mondo con slider | Il confronto pubblico ufficiale più vicino | Coppie scelte a mano, niente punteggio né dimensioni | Attivo (agg. 03/2026) |
| ESA Catalogue of Planetary Analogues (CAFE) | https://www.esa.int/articles/cataloguing-otherworldly-landscapes-on-earth | Catalogo di siti su 7 continenti con logistica, permessi e contatti | Stesso inventario, con la logistica | Documento statico (~2013), nessuna metrica | Statico |
| IMEWG "Mars on Earth" | https://imewg.org/joint-initiatives/mars-on-earth-analogues/ | Database interattivo e globo 3D degli analoghi di Marte, annunciato | È quasi la nostra idea pubblica | Mai uscito, pagina del 2022 | Fermo |
| USGS Known Terrestrial Analog Sites / TADP | https://tadp.astrogeology.usgs.gov/ · https://www.usgs.gov/data/known-terrestrial-analog-sites-planetary-science | Layer di punti dei siti analoghi, portale dati | Lista autorevole da cui partire | "For identification, not analysis" | Attivo; USGS fa un sondaggio sui bisogni nel 2026 |
| USGS PAAD | https://www.usgs.gov/data/paad-planetary-aeolian-analog-database | 45 campi di dune analoghi | Una dimensione (vento) | Solo dune, è una tabella | Statico |
| Europlanet TA1 Field Analogues | https://www.europlanet.org/?p=8693 | Accesso finanziato a siti sul campo (Islanda, Rio Tinto…) | I siti dove vanno i ricercatori | Nessun tool per scegliere il sito giusto per il target | Call 2026 attive |
| PANGAEA mineral DB / PTAL | https://data.mendeley.com/datasets/6dfkgnh9bp · https://erica.uva.es/PTAL/ | Spettri e mineralogia di analoghi | Dimensione mineralogia | Solo dati, nessun legame geografico | Statici (PTAL non raggiungibile) |
| Similar Earth | https://similar.earth | Metti un pin e ottieni una heatmap dei posti simili (embedding AlphaEarth) | Stessa interazione | Solo Terra | Attivo, open source |
| Mearth | https://github.com/sighmon/mearth-apple | Dove la temperatura sulla Terra è come su Marte o sulla Luna | Dimensione temperatura | Una sola dimensione | Hobby |
| Google Earth Pro Moon/Mars, NASA Eyes, Zooniverse | https://eyes.nasa.gov/apps/solar-system/ · https://www.zooniverse.org/projects/mschwamb/planet-four | Visualizzazione pubblica e citizen science | Abitudine del pubblico | Nessun confronto con la Terra | Google Earth Pro in dismissione (06/2027) |

## Competitor — B. B2B, scope stretto

| Nome | Link | Cosa vende | Overlap | Buco | Stato |
|---|---|---|---|---|---|
| ESA/DLR LUNA (Colonia) | https://luna-analog-facility.de/en/ | Hall di 700 m² con simulante EAC-1A, aperta a industria e startup | Vende fedeltà analogica per i test | Nessuna metrica di quanto LUNA somiglia a un target preciso | Attivo, campagne nel 2026 |
| ALTEC (Torino) | https://www.altecspace.it | Mars Terrain Simulator (ExoMars), Lunar Simulation Centre in costruzione | Struttura indoor, ma anche cliente o partner | Stessa lacuna di metrica | Centro lunare non ancora confermato aperto |
| PISCES / Pacific Spaceport (Hawaii) | https://pacificspacecenter.com/aerospace/analog-sites/ | Siti vulcanici con selezione, permessi, preparazione e prenotazione online | Il più vicino a "analog site as a service" | Solo Hawaii, selezione fatta a mano | Attivo |
| Mission Control Space Services | https://missioncontrolspace.com/about/facilities/moonyard/ | Moonyard indoor, campagne sul campo (Arizona, Islanda) | Organizza campagne per clienti | Non spiega perché sceglie un sito | Attivo |
| Astrobotic Lunar Surface Proving Ground | https://www.astrobotic.com/astrobotic-unveils-terrestrial-moonscape-for-payload-testing/ | Moonscape all'aperto di 100×100 m nel Mojave | Sede di test | Spec generica, non legata a un target | Attivo |
| NASA JSC Rock Yard, KSC Swamp Works, DLR Oberpfaffenhofen | https://www.nasa.gov/reference/jsc-rovers/ | Test bed istituzionali | Stesso bisogno di testare prima di volare | Accesso difficile, nessuna metrica | Attivi |
| Space Resource Technologies | https://spaceresourcetech.com/ | Simulanti (LHS-1, LMS-1, LSP-2 Polo Sud, MGS-1, JEZ-1 Jezero!) e un database con modalità "Compare" | Overlap diretto con l'idea degli equivalenti di regolite | Il confronto copre solo i suoi prodotti, niente materiali naturali | Attivo. Prezzi: 35-120 $/kg; bulk LHS-1E 20.000 $ |
| Off Planet Research | https://www.offplanetresearch.com/simulants | Simulanti su misura per qualsiasi sito lunare, regolite ghiacciata | Stesso bisogno di abbinare il materiale al sito | Abbinamento fatto a mano | Attivo, NSF SBIR |
| Hispansion (Spagna, ESA BIC) | non verificato | Simulanti TerraLun in bulk dal 03/2026 | Competitor o canale | — | Homepage non risolve |
| Open Database of Lunar Regolith and Simulants | https://arxiv.org/abs/2602.03829 | Proprietà geotecniche di regolite e simulanti | Dimensione geotecnica | Non è geografico | Nuovo, 2026 |
| PANGU (STAR-Dundee), OmniLRS, Duality Falcon | https://www.star-dundee.com/products/pangu-planet-and-asteroid-natural-scene-generation-utility/ · https://www.duality.ai | Terreno sintetico e gemelli digitali per testare GNC e rover | Si contendono lo stesso budget di test | Solo virtuali. NASA: per un rover serve un DEM 20x più fine di quelli disponibili | Attivi |
| Iris Data Labs Landing Site API | https://ldp-api-beta.vercel.app | 1,18 M di siti del Polo Sud già classificati, con spiegazione | Stesso pattern di punteggio e spiegazione | **Morto**: una API di solo scoring non ha retto | Archiviato |
| ispace Lunar Data Platform | https://www.ispace-inc.com/data-service/ | Dati lunari per la pianificazione delle missioni | Stessi clienti | Solo Luna | In sviluppo |
| LUMINA (Ohio State), LunarSite | https://news.osu.edu/could-next-gen-artificial-intelligence-help-map-out-future-space-outposts/ | AI per scegliere siti di atterraggio | Scoring AI lato Luna | Niente lato Terra | Ricerca |

## Competitor — C. In sala questo weekend (Space Apps 2026)

| Repo | Cosa ha | Perché preoccupa |
|---|---|---|
| https://github.com/shishir-kuet/terrestrial-analog-finder | DEM LOLA, CTX e Copernicus; rilievo, pendenza, rugosità; pesi regolabili; "why it ranks"; limiti dichiarati | È la nostra dimensione terreno, già fatta |
| https://github.com/sadriddinjamolsadriziyoda-creator/moon-mars-analogs | 30 siti Terra, 18 target, 6 criteri, globo 3D, ricerca inversa, fonte per ogni punteggio | È la nostra UX |
| https://github.com/pr1hm/TAVME | Planetary Computer (DEM, rugosità SAR, MODIS), 8 dimensioni, protocolli di test generati da LLM | È il più vicino al nostro angolo B2B |
| altri ~12 (TERR-ANALOG, solmate, TerraTwin, danakil-mars-analog…) | Indici di similarità su mappa | Commodity |

**Cosa ci distingue, se lo costruiamo:** (1) partire dal requisito di test, non dal target; (2) siti naturali, strutture indoor e materiali sulla stessa scala; (3) la mancanza di corrispondenza è un risultato, non una nota a piè di pagina; (4) il contesto di Torino (ALTEC, rover Etna).

---

## Clienti — B. Hardware e campagne (ordinati per fit)

| # | Nome | Link | Perché gli serviamo | Prova (2025-26) |
|---|---|---|---|---|
| 1 | ALTEC (Torino; Thales Alenia + ASI) | https://www.altecspace.it | Centro di simulazione lunare in arrivo: scegliere siti all'aperto complementari e materiale naturale per riempirlo | MoU con ispace-EUROPE il 12/10/2026 ([SatNews](https://satnews.com/2026/10/12/ispace-europe-and-altec-partner-for-lunar-rover-testing-and-mission-simulations/)) |
| 2 | Thales Alenia Space Italia (Torino) | https://www.thalesaleniaspace.com | Rover Etna (programma ASI ULS) testato ad ALTEC e poi sull'Etna: è il flusso che automatizziamo. Fa anche MPH e il lander Argonaut | [PoliTo, 30/07/2026](https://www.polito.it/ateneo/comunicazione-e-ufficio-stampa/poliflash/il-politecnico-collabora-alla-realizzazione-di-etna-il-nuovo). Sponsor e giuria qui |
| 3 | PoliTo PIC4SeR (Prof. Chiaberge) e Team DIANA | https://pic4ser.polito.it · https://www.teamdiana.it | Drone e sensori del rover Etna; rover studentesco ARDITO | Stessa notizia PoliTo |
| 4 | ispace-EUROPE (MAGPIE) | https://ispace-inc.com | Primo rover polare ESA (2029): servono analoghi del Polo Sud | Contratto ESA da 65 M€ a 07/2026; MoU con ALTEC |
| 5 | AIKO (Torino, nata in I3P) | https://www.aiko.ai | Software di autonomia: l'addestramento della navigazione ha bisogno di terreni analoghi | Forbes IT 05/2026 (ruolo sul rover Etna da una sola fonte) |
| 6 | Evolunar (Torino, I3P) | https://www.i3p.it/en/startup/evolunar | Drone hopper LuNaDrone per tubi di lava e pozzi: servono analoghi di tubi di lava | Profilo I3P; nessuna notizia 2026 |
| 7 | Univ. Padova CISAS (Pozzobon, Massironi) | https://cisas.unipd.it | Partner per dati e validazione: hanno pubblicato che il materiale dell'Etna equivale ad Apollo 14 | [Paper 2026](https://iris.unive.it/retrieve/6077759b-95e2-49c9-9641-50f088304a57/Melchiori_MTA2026.pdf) |
| 8 | PoliMi Aerospace (Prof. Lavagna) | https://www.aero.polimi.it | Estrazione di acqua dalla regolite con OHB Italia; coautrice del paper sull'Etna | LUMIO in fase C (03/2026) |
| 9 | Venturi Space (MONA LUNA) | https://www.venturispace.com | Rover testato a LUNA, studio ESA su ruote e sospensioni | Prima campagna 12/2025 |
| 10 | Space Applications Services | https://www.spaceapplications.com | Rover LUVMI-M, linea ISRU, studio ESA Lunar Remote Camp | Test a LUNA 04/2026 |
| 11 | Leonardo (trivella PROSPECT/ProSEED) | https://www.leonardo.com | Test in regolite ghiacciata: servono analoghi di permafrost | [ESA 10/2026](https://www.esa.int/ESA_Multimedia/Images/2026/10/Drilling_down_for_the_Moon) |
| 12 | Maana Electric, DFKI Team BREMEN | https://maanaelectric.com · https://robotik.dfki-bremen.de | ISRU e scavo: servono grandi volumi di materiale e siti sul campo | Space Resources Challenge 2025 |
| 13 | Austrian Space Forum (AMADEE-27) | https://oewf.org | Scegliere siti analoghi è il loro lavoro | Missione in Portogallo 04/2027 |
| 14 | Interlune, Venturi Astrolab, ICON (USA) | https://www.interlune.space · https://www.astrolab.space · https://www.iconbuild.com | Scavo e costruzione: a quei volumi conta il materiale naturale economico | NASA STTR, test sul campo, 57,5 M$ NASA |
| 15 | LunAres, MDRS, HI-SEAS | https://lunares.space · https://www.marssociety.org | Habitat analoghi a pagamento: un "perché questo posto è come Marte" | Missioni 2026 |

Fit debole ma presente in sala: Argotec (https://www.argotecgroup.com), sponsor.

## Clienti — A. Education e mainstream

| # | Nome | Link | Perché ci adotterebbero | Fondi |
|---|---|---|---|---|
| 1 | ESA Moon Camp | https://www.esa.int/Education/Moon_Camp | Team di studenti progettano una base lunare e scelgono il sito (5.354 studenti nel 2022-23). Noi mostriamo dove sulla Terra è quel sito | ESA Education + Airbus Foundation |
| 2 | ESERO Italia | https://www.esero.it | Moon Camp in Italia e corsi per docenti su "Sabbie spaziali" | ASI/ESA |
| 3 | ASI Education, "Maratona per lo Spazio" | https://www.asi.it | Le superiori progettano una missione: il modulo per scegliere il sito ci sta | ASI |
| 4 | Infini.to, Planetario di Torino | https://www.planetarioditorino.it | Postazione kiosk o laboratorio per le scuole | Dipartimento educazione |
| 5 | EXPLORE / NUCLIO (Erasmus+) | https://nuclio.org | Missione analoga su Marte per le superiori, con toolkit virtuale | **Erasmus+ KA2**: è il precedente di finanziamento |
| 6 | I3P / ESA BIC Torino | https://www.i3p.it | Canale, non cliente: nel 2025 il 2° premio includeva la pre-incubazione | Regione Piemonte FSE+ |
| 7 | Astroland, LunAres workshop, crew MDRS universitarie | https://www.astrolandagency.com · https://lunares.space | Pubblico pagante esiste (workshop LunAres a 950 €; MDRS 2.000 $ per studente) | Privati |

## Per il pitch

- Mercato: l'economia lunare vale fino a 127 miliardi $ al 2050 secondo PwC. I clienti diretti sono pochi e concentrati, ma il primo è a Torino.
- Business model possibile: un abbonamento o un report per ogni campagna di test (B2B) e una versione gratuita per education come canale (Moon Camp, ESERO).
- Competition: strutture indoor e simulanti vendono fedeltà senza misurarla rispetto a un target. Gli altri team fanno la mappa. Noi facciamo la scelta del sito di test.
- Prova scientifica: il paper Padova-PoliMi del 2026 dice che il materiale dell'Etna equivale ad Apollo 14. I simulanti commerciali costano 35-120 $/kg.
- Top 5 da nominare: ALTEC, Thales Alenia (rover Etna), ispace-EUROPE (MAGPIE), Evolunar, ESA Moon Camp / ESERO.

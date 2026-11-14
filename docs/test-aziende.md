# Test delle aziende di Torino — business e risparmio

Autore: Timo (per Rocco), copia della nota nella vault. Ricerca web del 2026-11-14 sera, per il B2B dell'hackathon (FVG Station). Dove c'è scritto *inferenza* o [A] non è un dato con fonte.

---

## Shortlist

| Azienda | Link | Cosa fanno | Cosa la distingue | Test legati alla superficie | Clienti |
|---|---|---|---|---|---|
| **Thales Alenia Space Italia** (sito di Torino) | [sito](https://www.thalesaleniaspace.com/en) · [Argonaut](https://www.thalesaleniaspace.com/en/press-releases/thales-alenia-space-signs-contract-esa-develop-argonaut-lunar-lander-cargo-delivery) · [MPH](https://www.thalesaleniaspace.com/en/news/lunar-multi-purpose-habitat-activities-officially-underway) | Prime contractor per l'esplorazione: ExoMars, Gateway, il lander Argonaut (≈862 M€ ESA, gen 2025), l'habitat MPH, il rover ETNA/ULS per ASI | L'unica a Torino che costruisce sistemi di superficie completi | Campagna del rover sull'Etna (lug-ago 2026), indoor nel Mars Terrain Simulator di ALTEC, drop test ExoMars, TVAC/vibrazioni (a Cannes) | ASI, ESA, NASA via ASI. Gruppo TAS: 2,36 mld€ nel 2025 |
| **ALTEC** (63,75% TAS-I, 36,25% ASI) | [sito](https://www.altecspace.it) · [MTS](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Exploration/ExoMars/ExoMars_rover_twin_begins_Earth-based_mission_in_Mars_Terrain_Simulator) | Operazioni e test: ROCC di ExoMars, Mars Terrain Simulator (20×16 m), supporto ISS. In costruzione il Lunar Simulation Centre | L'unica a Torino che **vende** test di superficie indoor | Mobilità su terreno simulato, illuminazione e camere, drop test. In arrivo: letto lunare da 420 m² (basalto di cava italiana, rampa a 25°, luci a ~8°) e una camera termo-vuoto con polvere | ASI (3,5 M€ per il centro lunare), ESA, TAS-I, Airbus. MoU con ispace-EUROPE (12/10/2026) |
| **Argotec** | [sito](https://www.argotecgroup.com) · [LUMIO](https://argotecgroup.com/missions/lumio) | Piccoli satelliti in serie (IRIDE, LICIACube, ArgoMoon, LUMIO) | Produzione in serie nello SpacePark, crescita del +60% | TVAC e test termici in casa. **Niente superficie** | ESA, ASI, Rheinmetall. 57 M€ nel 2025, round da 50 M€ (ott 2026) |
| **AIKO** | [sito](https://aikospace.com) · [Forbes](https://forbes.it/2026/05/21/aiko-azienda-italiana-semplifica-missioni-spaziali-ia) | Software di autonomia con AI per satelliti e rover | La startup AI di Torino, subcontractor su ULS/ETNA (ruolo specifico non verificato) | Validazione del software in simulazione. Nessuna struttura propria | ESA, TAS-I, OHB, GMV, Telespazio. Serie A da 3,5 M€ (2024) |
| **Evolunar** (I3P) | [sito](https://www.evolunar.com) · [I3P](https://www.i3p.it/en/startup/evolunar) | LuNaDrone: hopper da 15 kg per tubi di lava e PSR. Oggi il core è POLARIS, navigazione per droni senza GNSS | L'unica che punta a tubi di lava e PSR | Nessuna campagna pubblica. Prossimo passo: un dimostratore in scala reale | Cerca un seed da 2,5 M€. Nessun cliente pubblico |

**Chi compra:**
- **Buyer principale:** il team ULS/ETNA di TAS-I, raggiungibile tramite ALTEC.
- **ALTEC:** è un canale e un partner più che un utente.
- **AIKO:** fit laterale, per sapere dove raccogliere immagini in luce radente.
- **Evolunar:** caso dimostrativo, non può pagare.
- **Argotec:** nessun fit, ma è in giuria.

---

## Giuria e sponsor all'hackathon (Space Apps Torino 2026)

Fonti: banner dei premi sulla [pagina ufficiale dell'evento](https://www.spaceappschallenge.org/2026/local-events/turin/) e registrazione del welcome. **I nomi sono trascritti dall'audio: la grafia va verificata**, tranne quelli confermati sul web (✓).

| Azienda o ente | Premio | Persone citate al welcome | Ruolo |
|---|---|---|---|
| **Thales Alenia Space** | Premio speciale "Thales Alenia Space Award" | Tania Gress (ingegnera aerospaziale, cofondatrice di WIA Torino) · Carolina Morteni (system engineering) | **Giuria**: "they will judge you tomorrow" |
| **Argotec** | Premio speciale "Argotec Award" | Serena Campioli (system engineer, PhD in MBSE, WIA) · Francesco Ferrari · Rosario Basile | **Giuria** (Campioli tramite WIA; Ferrari e Basile presentati come i giurati Argotec) |
| **I3P / ESA BIC Turin** | 3° posto, 500 € | **Leo Italiano** ✓ (Program Manager di ESA BIC Turin) · Roberta Guglietti ✓ (Local Lead, organizzazione) | Italiano è "il giurato più severo" |
| **ORiS** ✓ (startup I3P, energia via laser in orbita) | 1° posto, 1.000 € | **Andrea Villa** ✓ (CEO) · **Francesco Lopez** ✓ (COO) | Sponsor principale e mentor. In giuria probabilmente sì, ma non detto esplicitamente. ORiS ha fatto uno studio di fattibilità per TAS sull'energia wireless ai rover lunari |
| **Merani Amministrativisti** (studio legale) | 2° posto, 750 € | — | Sponsor |
| **Center for Near Space** | Premio speciale "The Next Possible Future" | — | Sponsor |
| Women in Aerospace Europe, Torino | — | Campioli, Gress, Morteni | Workshop sul pitch. Sono le stesse persone della giuria TAS e Argotec |

Mentor delle startup ESA BIC citate al welcome (grafia incerta): Roberto Morano (startup "COURSE"), Alberto Rovera e Giovanni Ningoya (sala Agorà).

**Per il pitch:** in giuria ci sono TAS-I, cioè il buyer principale, e Argotec. ORiS lavora già con TAS sui rover lunari. Leo Italiano guarda il potenziale da startup: business model e mercato.

---

## Business: come fanno i test oggi

**Test più costosi**
- I test ambientali sui sistemi di volo: TVAC, vibrazioni, acustica. Le camere a vuoto costano circa 30 k$ al giorno (contratto NASA JSC con Sandia: 1,19 M$ per 5 settimane di test). Una camera piccola in Belgio costa 110 €/h.
- Al secondo posto le campagne sul campo. Quella del rover ULS sull'Etna è durata 32 giorni, con fino a 6 persone, un container portato con camion e gru a 2.800 m, il generatore, un drone autorizzato ENAC e la valutazione di incidenza ambientale per l'area Natura 2000.
- Per ALTEC il costo più grosso è l'investimento nella struttura: 3,5 M€ per la fase iniziale del centro lunare.

**Test più frequenti (il core business)**
- **TAS-I:** integrazione e test funzionali a Torino, e campagne indoor nel Mars Terrain Simulator di ALTEC. Il piano ULS ha due sprint: il primo si chiude indoor, il secondo all'aperto.
- **ALTEC:** operazioni nel ROCC e nel simulatore, più campagne su commessa. Esempio: oltre un mese di drop test ExoMars con TAS e Airbus, gen-mag 2026.
- **Argotec:** test di accettazione sui satelliti in produzione.
- **AIKO:** validazione del software in simulazione (*inferenza*).

**Come scelgono il sito oggi (caso ULS, documenti depositati al Parco dell'Etna)**
- Lo sceglie il team TAS-I internamente.
- Sequenza: sopralluogo a settembre 2025 → piano esecutivo il 10/02/2026 → valutazione di incidenza ambientale → campagna a luglio-agosto 2026. In tutto circa **10 mesi**, di cui 4-5 solo di permessi.
- Criteri dichiarati: pendenze vicino a 20°, depositi portati dal vento, superfici rocciose, crateri, niente vegetazione, area grande, logistica e accesso.
- Hanno un sito principale (Piano delle Concazze) e uno di riserva (Cisternazza), su versanti diversi per il rischio vulcanico.
- Vogliono un sito "tanto rappresentativo quanto nostrano": c'è una preferenza per l'Italia legata al finanziamento ASI. **È un rischio per il pitch.**
- Hanno comprato un centro di controllo mobile che "apre future opportunità di campagne in siti remoti": altre campagne sono probabili.
- Anche NASA sceglie i siti per Artemis "leveraging academic research", cioè a mano sulla letteratura. AMADEE-24 ha cambiato sito a metà della preparazione, che è durata oltre un anno.
- LUNA (Colonia) chiede almeno 2 mesi di preavviso e ha una coda di richieste.

**Clientela**
È quasi tutta istituzionale: ASI, ESA, NASA tramite ASI. Il primo cliente commerciale vero è ispace-EUROPE, che entra tramite ALTEC con il rover MAGPIE (contratto ESA da 65 M€).

---

## Quanto gli facciamo risparmiare

Tariffa usata: 47 €/h (costo standard MIMIT, livello medio nelle imprese) × 1,25 di costi indiretti ≈ **60 €/h, cioè 480 € per giornata-persona** [A].

**1. Scelta e preparazione del sito, per campagna** [A, calibrato su ULS e AMADEE]

| | Oggi | Con il tool |
|---|---|---|
| Studio a tavolino | 2 ingegneri × 3 settimane = 30 gg-persona | 1 ingegnere × 3 giorni = 3 gg-persona |
| Sopralluogo | 3 persone × 4 giorni + 2,5 k€ | sopralluogo mirato: 2 persone × 3 giorni + 1,5 k€ |
| Caratterizzazione dei campioni | 5 gg-persona + 1 k€ | 3 gg-persona + 1 k€ |
| Dossier per i permessi | 10 gg-persona | 8 gg-persona, con i dati del sito già pronti |
| **Totale** | **57 gg-persona, ≈ 31 k€** | **20 gg-persona, ≈ 12 k€** |

- **Risparmio diretto: ≈ 19 k€ e 37 giornate-persona per campagna, più 4-8 settimane di calendario.**
- **Rischio evitato:** una campagna come ULS costa ≈ 90-100 k€ (132 gg-persona più la logistica). Con un 10% di probabilità di doverla rifare per sito o terreno sbagliato, il valore atteso è ≈ **9-10 k€**.
- **Totale: ≈ 28 k€ per campagna**, ≈ 85 k€ all'anno con 3 campagne.
- Esempi reali di terreno di test non rappresentativo, con fonte:
  - le ruote di Curiosity si sono danneggiate dopo meno di 4 km perché erano state testate su terreno liscio;
  - la sonda HP3 di InSight si è fermata a ~40 cm per un suolo che i test non avevano previsto;
  - Spirit è rimasto bloccato nel 2009, con 8 mesi di tentativi.

**2. Materiale sfuso** (i prezzi del simulante hanno fonte, quelli della roccia sono [A])

| Caso | Simulante commerciale | Roccia naturale (cava + macinazione + 500 km di camion) |
|---|---|---|
| Vasca da 20 t, highlands | LHS-1E 9.500 $/t → ≈ **171 k€** più la spedizione dagli USA | 150-380 €/t → **3-8 k€** |
| Hall da 900 t, mare (scala LUNA) | LMS-1E 3.550 $/t → ≈ **2,9 M€** (con LHS-1 ad alta fedeltà: 26 M$) | **135-340 k€**, cioè da 8 a 20 volte meno |

- **Precedente reale:** LUNA ha riempito la hall con 750-900 t di basalto di una cava a 30-40 km da Colonia, e ha preso 20 t di anortosite dalla Groenlandia. ALTEC usa basalto di cava italiana. Il tool dice dove si trova la roccia giusta e dove l'analogia si rompe: forma dei grani, agglutinati.

**3. Tempo e persone in una riga per il pitch**
"Oggi scegliere dove testare un rover lunare richiede circa 10 mesi e 57 giornate-persona. Noi lo portiamo a 20 giornate-persona, e il letto di regolite costa 20 volte meno."

---

## I tre tipi di test: dove si fanno oggi

Ricerca web del 2026-11-14 sera. Il flusso del prodotto: test da fare + sito Artemis di destinazione → punto analogo sulla Terra. Qui c'è, per ognuno dei tre tipi di test (rover, volo, tute), dove e come si fa oggi. [NV] = non verificato. Dettaglio dei parametri del rover in `docs/requisiti-test.md`; profilo volo in `docs/finaliste.md`.

**In una riga per tipo:**
- **Rover:** all'aperto su vulcani e deserti (Etna, Teide, Arizona, Meteor Crater, Kumtag, Tottori); al chiuso in vasche di simulante (LUNA a Colonia, ALTEC a Torino, NASA Glenn e KSC).
- **Volo (lander, hopper, droni):** quasi sempre su **campi di crateri costruiti** a mano copiando il Polo Sud (KSC, Astrobotic a Mojave, Huailai in Cina, Challakere in India); i sensori si provano da elicottero su deserti naturali (Death Valley, Mojave, Edwards); l'1/6 g solo con cavi, gru o voli suborbitali.
- **Tute ed EVA:** all'aperto sui campi vulcanici dell'Arizona, di notte per avere il sole radente (JETT3, JETT5); in Europa la formazione geologica PANGAEA (Lanzarote, Ries, Bletterbach, Lofoten); al chiuso piscina NBL, gru ARGOS e Chamber B a Houston, voli parabolici a Bordeaux.

**Cosa ci dice per il prodotto:** per il volo si spendono soldi per costruire campi di crateri artificiali, anche se esistono campi naturali (Cinder Lake è nato così negli anni '60). È lo spazio del secondo profilo di Edo: trovare il campo di crateri **naturale** che somiglia al sito Artemis. Per le tute il vincolo forte è la luce: oggi si simula di notte con lampade.

### Rover

Sintesi da `docs/requisiti-test.md` §5-6.

| Dove | Chi | Tipo | Cosa | Perché lì |
|---|---|---|---|---|
| Etna (Piano delle Concazze, Cisternazza) | TAS-I + ASI (ULS 2026); DLR + ESA (ARCHES 2022) | naturale | rover, ISRU, drone scout | pendenze ~20°, depositi eolici, rocce, crateri, niente vegetazione |
| Teide, Tenerife | ESA + GMV (LUCID 2017) | naturale | traversate lunghe, visione notturna | percorribile per > 13 km, la notte imita la luce polare |
| San Francisco Volcanic Field / Black Point (Arizona) | NASA (D-RATS, JETT) | naturale | rover pressurizzato | strada sterrata, logistica a Flagstaff, varietà geologica |
| Meteor Crater (Arizona) | Intuitive Machines (2024) | naturale | LTV | cratere da impatto |
| Rye (Colorado) | Lunar Outpost (2025) | naturale | LTV | pendenze fino a 20° |
| Kumtag (Cina) | CAST (Yutu, 2011-13) | naturale | rover | sabbia a 70 µm. Il sito vero era più roccioso: danni al rover |
| Dune di Tottori (Giappone) | ispace, amulapo | naturale | ruote, SLAM | meccanica della sabbia |
| Mauna Kea (Hawaii) | NASA + CSA (PISCES 2008, 2012) | naturale | ISRU, trivella | suolo vulcanico |
| LUNA, Colonia | DLR + ESA (dal 2024) | indoor | rover, EVA | 700 m² di basalto di cava, vasca profonda 3 m |
| Mars Terrain Simulator, Torino | ALTEC | indoor | rover ExoMars | terreno riconfigurabile; centro lunare in arrivo (rampa a 25°, luci a ~8°) |
| SLOPE (NASA Glenn), Swamp Works (KSC) | NASA | indoor | VIPER, scavo | simulanti GRC-1, LHS-1, BP-1 |

**Requisito chiave:** pendenza di 20° (TAS-I e NASA). **Non si riproduce:** 1/6 g (si usano rover alleggeriti o l'offload di LUNA), vuoto, polvere elettrostatica.

### Volo: lander, hopper, droni

**Cosa si testa:** guida e navigazione di discesa (GNC), navigazione sul terreno (TRN: la camera confronta il suolo con una mappa), rilevamento e scansamento dei pericoli (HDA: lidar che vede rocce e pendenze), dinamica dell'appoggio a 1/6 g, gambe del lander, getto del motore sulla regolite.

| Campagna | Chi | Dove (tipo) | Anni | Cosa | Perché lì | Fonte |
|---|---|---|---|---|---|---|
| Morpheus + ALHAT | NASA JSC/KSC | Shuttle Landing Facility, KSC, Florida (**costruito**) | 2012-14 | HDA con flash lidar, TRN, lidar Doppler; 5 voli sul campo, 1 di notte | campo di ~100×100 m con crateri e rocce distribuiti come nei dati LRO del Polo Sud; spazio aereo controllato | [NTRS](https://ntrs.nasa.gov/api/citations/20140000960/downloads/20140000960.pdf) |
| ALHAT su elicottero | NASA | Rogers Lakebed, Edwards AFB, California (naturale + ostacoli posati) | 2008-12 | flash lidar: vedere ostacoli di 30 cm da 500 m | fondo piatto, ostacoli noti = verità a terra facile | [NTRS](https://ntrs.nasa.gov/api/citations/20130013472/downloads/20130013472.pdf) |
| COBALT / Draper TRN su Xodiac | NASA Flight Opportunities, Masten (oggi Astrobotic), Draper | Mojave, California (aeroporto nel deserto) | 2017-19 | lidar Doppler, Lander Vision System, TRN | deserto, voli verticali a bassa quota, GPS come riferimento | [NASA](https://www.nasa.gov/directorates/spacetech/flightopportunities/One_Giant_Leap_for_Lunar_Landing_Navigation) |
| Lunar Surface Proving Ground (LSPG) | Astrobotic, NASA | Mojave (**costruito**, ~100×100 m) + Death Valley (naturale) | dal 2024, campagna chiusa apr 2025 | TRN e HDA per il lander Griffin, da elicottero e Xodiac; ostacoli fino a 15 cm, TRN entro 50 m, voli notturni | replica topografia e proprietà ottiche di un'area del Polo Sud e la luce polare | [Astrobotic](https://www.astrobotic.com/astrobotic-tech-passes-critical-tests-for-safe-moon-landings/) |
| SPLICE su New Shepard | NASA + Blue Origin | volo suborbitale, West Texas | 2020 | TRN, lidar Doppler, computer di discesa | il rientro del booster somiglia in parte a una discesa lunare | [NASA](https://www.nasa.gov/centers-and-facilities/langley/nasa-matures-lunar-landing-tech-through-suborbital-flights/) |
| New Shepard a gravità lunare | Blue Origin, NASA | volo suborbitale | feb 2025 | ~2 min a 1/6 g facendo ruotare la capsula; 30 payload | l'unico 1/6 g "vero" oltre ai voli parabolici | [Space.com](https://www.space.com/space-exploration/human-spaceflight/blue-origin-to-simulate-moon-gravity-on-jan-28-new-shepard-suborbital-launch) |
| LLRV/LLTV, Lunar Landing Research Facility | NASA | Edwards, Ellington (Houston), Langley (gantry **costruito**) | 1964-72 | pilotaggio degli ultimi metri di discesa: turbofan o cavi che tolgono 5/6 del peso | spazio aereo militare | [NASA](https://www.nasa.gov/history/lunar-landing-training-vehicle/) |
| Cinder Lake Crater Fields | USGS + NASA | Flagstaff, Arizona (naturale + crateri fatti con esplosivo) | 1967-72 | addestramento Apollo | replica del sito di Apollo 11 | [Universe Today](https://www.universetoday.com/115895/making-the-moon-the-practice-crater-fields-of-flagstaff-arizona/) |
| Huailai | CASC (Cina) | Hebei (**costruito**) | Marte 2019; lander Lanyue ago 2025 | hover, riconoscimento del terreno, scansamento ostacoli; 1/6 g con torri e cavi | campo di crateri artificiale con un solo punto sicuro | [SCMP](https://www.scmp.com/news/china/science/article/3321150/china-completes-key-lander-test-preparation-crewed-moon-mission-2030) |
| Chandrayaan-2/3 | ISRO | Challakere, Karnataka, India (crateri **costruiti**) | 2019-23 | sensori su elicottero dell'aeronautica indiana (Integrated Cold Test); gru a torre (Hot Test); drop test delle gambe a Bengaluru | crateri di ~10 m di diametro [NV] | [ISRO](https://www.isro.gov.in/Making_Chandrayaan3_ISRO_culture.html) |
| ARCHES | DLR, KIT, ESA | Etna (naturale) | giu-lug 2022 | lander, 2 rover, drone ARDEA come scout | superficie granulare e lave simili alla geologia lunare. **Il vento ha bloccato alcuni voli del drone** | [DLR](https://www.dlr.de/en/latest/news/2022/03/20220701_robotics-team-practises-lunar-exploration-on-mount-etna) |
| Lander Vision System di Mars 2020 | NASA JPL | Death Valley (naturale) | 2019, 17 voli in elicottero in 3 settimane | TRN visiva | terreno brullo e montuoso; è per Marte, ma il metodo vale per la Luna | [JPL](https://www.jpl.nasa.gov/news/nasas-mars-2020-mission-drops-in-on-death-valley/) |

**Europa e Torino:**
- **Argonaut (ESA):** TAS-I guida assemblaggio, integrazione e test del modulo di discesa (contratto da 862 M€, gen 2025, lancio 2030). Piani pubblici di test di volo o drop test: nessuno [NV]. È l'aggancio per il pitch: dovranno farli.
- **Themis (Esrange, Svezia) e Callisto (Kourou):** atterraggio verticale di booster riutilizzabili. Utili solo per la GNC di atterraggio, non sono lander lunari.
- **DLR LAMA (Brema):** facility con offload di gravità e suolo inclinabile fino a 30° per l'appoggio dei lander.
- Intuitive Machines, ispace, JAXA SLIM: test aerei a terra non pubblici [NV]. ispace M2 è fallita per un guasto del telemetro laser e l'azienda promette più test in condizioni diverse.

**Cosa deve avere un sito naturale per il volo:**
- ostacoli alla scala del requisito: rocce da 30 cm e pendenze da 5° (ALHAT), Astrobotic è scesa a 15 cm;
- crateri e rocce con una distribuzione per dimensione simile al sito Artemis (KSC e LSPG la copiano dai dati LRO); soglie numeriche pubblicate di densità di massi: [NV];
- pendenze: l'area di atterraggio è < 10° su ~100 m di raggio, il tilt del lander ≤ 8°;
- luce radente: la TRN con camera ne dipende, il lidar no (per questo si vola anche di notte);
- albedo e tessitura: basalto e ceneri danno un contrasto vicino a quello lunare; le dune lisce rompono la visione;
- spazio aereo e permessi (in Italia zone UAS di ENAC/d-flight), vento per i droni.

**Solo in facility:** 1/6 g sul veicolo intero (cavi, gantry, LAMA, New Shepard), getto del motore sulla regolite nel vuoto (sfera da 60 ft a NASA Langley, camera a NASA Marshall), drop test delle gambe su simulante.

**Costi e durate pubbliche:** Morpheus ~14 M$ di procurement in 4 anni con ~40 persone in media ([NTRS](https://ntrs.nasa.gov/citations/20140017130)); campagna in elicottero ALHAT 2 settimane; LVS 3 settimane; ARCHES ~4 settimane. Tariffe di LSPG, Xodiac, Huailai: [NV].

### Tute ed EVA (astronauti in superficie)

**Cosa si testa:** mobilità della tuta, camminata su pendenze e regolite, polvere, termica, luce radente con ombre lunghe, procedure di campionamento geologico, tempi delle EVA, gravità parziale.

**Campagne sul campo (siti naturali):**

| Campagna | Chi | Dove | Anno | Cosa | Perché lì | Fonte |
|---|---|---|---|---|---|---|
| JETT1 | NASA | Kilbourne Hole, vicino a El Paso (Texas) | 2022 [NV] | prima uscita delle tute mockup, stazioni di campionamento | cratere vulcanico | [NTRS](https://ntrs.nasa.gov/citations/20230006762) |
| JETT2 | NASA | altopiani dell'Islanda | 2022 | EVA completa di 4 h | terreno lunare con poca vegetazione | idem |
| JETT3 | NASA + Draper + USGS | SP Crater e Black Point Lava Flow, ~40 km a nord di Flagstaff (Arizona) | ott 2022 | EVA di Artemis III: **4 EVA notturne con un "sole" artificiale su carrello** che fa ombre dure; navigatore di Draper | cono di scorie e colata basaltica; strada, alloggi, copertura cellulare, varietà geologica entro 2 km | [NASA](https://www.nasa.gov/humans-in-space/nasa-to-practice-artemis-moonwalking-roving-operations-in-arizona-desert) |
| JETT5 | NASA + USGS | San Francisco Volcanic Field (Arizona) | 13-17 mag 2024 | 4 moonwalk simulati di Artemis III, di giorno e di notte, supporto collegato da Houston | sito analogo già consolidato | [USGS](https://www.usgs.gov/centers/astrogeology-science-center/news/artemis-iii-mission-tests-san-francisco-volcanic-field) |
| Desert RATS | NASA (dal 2022 con JAXA) | Black Point Lava Flow (Arizona) | anni '90-2011, ott 2022 | rover pressurizzato, traversate, soccorso | colata lavica, terreno difficile | [NASA](https://www.nasa.gov/analogs/desert-rats) |
| Addestramento geologico Apollo | NASA + USGS | Meteor Crater, Cinder Lake (Arizona), Hawaii, Islanda | 1963-72 | geologia di campo, campionamento | l'Islanda era considerata "la più lunare" | [USGS](https://www.usgs.gov/media/images/cinder-lake-crater-field-2jpg) |
| PANGAEA | ESA EAC | **Bletterbach (Alto Adige)**, Ries (Germania), Lanzarote (Spagna), Lofoten (Norvegia) | dal 2016 circa | formazione geologica degli astronauti (anche NASA e JAXA) | Lofoten: anortosite come gli altopiani lunari; Ries: impatto, studiato dagli equipaggi di Apollo 14 e 17 | [ESA](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/CAVES_and_Pangaea/What_is_Pangaea) |
| CAVES | ESA EAC | grotta Sa Grutta (**Sardegna**) | dal 2011 circa | lavoro di squadra al buio, ~6 giorni sottoterra | isolamento, buio, rischio reale | [ESA](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Going_underground) |
| ARCHES / Analog-1 | DLR + ESA | Etna, ~2.600 m | giu-lug 2022 | un astronauta guida il rover da Catania come se fosse sul Gateway | criteri geologici di una missione lunare vera | [ESA](https://esa.int/ESA_Multimedia/Images/2022/06/Lunar_science_stirring_on_Mount_Etna) |
| AMADEE (tuta Aouda) | Forum Spaziale Austriaco (OeWF) | Dhofar (Oman) 2018, Ramon Crater (Israele) 2021, Armenia 2024 | 3-4 settimane ciascuna | simulatore di tuta pesante con sensi limitati | aridità, geologia. Pensati per Marte. AMADEE-24 ha cambiato sito durante la preparazione | [OeWF](https://oewf.org/en/amadee-program/) |
| MDRS, HI-SEAS | Mars Society (Utah); IMA + EuroMoonMars (Mauna Loa, Hawaii) | rotazioni di 2 settimane | simulatori di tuta, ISRU sul basalto | deserto (Utah), basalto e quota (Hawaii) | [HI-SEAS](https://pacificspacecenter.com/2020/02/03/analog-astronauts-explore-moon-during-two-week-simulation-at-hi-seas/) |

**Strutture al chiuso:**

| Struttura | Dove | Cosa fa |
|---|---|---|
| NBL, Neutral Buoyancy Lab | JSC, Houston | piscina profonda 12 m con fondale lunare; 1/6 g con zavorra; EVA del Polo Sud a luci spente. Primo test con equipaggio della tuta Axiom AxEMU a mag 2025 ([Axiom](https://axiomspace.com/news/axiom-space-next-gen-spacesuit-is-crew-tested-for-first-time-in-nasa-neutral-buoyancy-lab)) |
| ARGOS | JSC, Houston | gru robotica che toglie peso (1/6 g, Marte, 0 g); 23 test della AxEMU ([NTRS](https://ntrs.nasa.gov/citations/20230002430)) |
| Rock Yard | JSC, Houston | terreno lunare all'aperto con lampade e pareti nere, per gli attrezzi |
| Flat Floor Facility | NASA Marshall, Huntsville | luce del Polo Sud: sole radente, ombre lunghe ([NASA](https://www.nasa.gov/wp-content/uploads/2023/03/artemis-lighting-considerations-overview-technical-brief-ochmo.pdf)) |
| Chamber B | JSC, Houston | unica camera termo-vuoto NASA certificata per l'uomo; pavimento ad azoto liquido; requisito 93 K nei punti freddi del Polo Sud ([NTRS](https://ntrs.nasa.gov/citations/20240004521)) |
| LUNA | DLR + ESA, Colonia | sala da 700 m² con simulante EAC-1A; offload di gravità e rampa regolabile previsti [stato NV] |
| Voli parabolici | Novespace, Bordeaux | 20-30 s a 1/6 g per parabola; nel 2025 una campagna ESA tutta lunare ([ESA](https://www.esa.int/ESA_Multimedia/Images/2025/11/Flying_for_the_Moon)) |
| NEEMO (Aquarius) | habitat sottomarino, Florida Keys | barella LESA con peso equivalente lunare (2017, 2019) |

**Cosa deve avere un sito naturale per le EVA** ([NASA, overview Artemis per Space Apps 2025](https://ntrs.nasa.gov/api/citations/20250009323/downloads/ArtemisOverview2025IntSPAPPSChallenge.pdf)):
- pendenze fino a **20°** entro 2 km dal lander (la tuta deve salire, scendere e traversare un pendio di 20°); al Polo Sud ci sono tratti a 21-25°;
- raggio delle escursioni fino a 2 km (TBR), da 2 a 5 EVA in 6,5 giorni, fino a 8 h in tuta;
- regolite fine o scorie, massi, crateri, basalto o anortosite, poca vegetazione;
- varietà geologica entro 2 km, accesso, alloggi vicini, copertura per le comunicazioni (criteri JETT3);
- luce radente: oggi si lavora di notte con luce artificiale (JETT3, JETT5, NBL al buio).

**Solo al chiuso:** vuoto, 1/6 g prolungato, termo-vuoto, terreno a temperature criogeniche.

**Italia e Torino:** nessun hardware per tute ed EVA trovato da TAS-I, ALTEC o Argotec. Prada (Milano) fa lo strato esterno e il sottotuta della AxEMU con Axiom. TAS-I e ALTEC lavorano sull'habitat MPH, dove gli astronauti vivranno tra un'EVA e l'altra. Siti italiani già usati: Bletterbach, Sa Grutta, Etna.

**Costi:** nessun costo pubblico per JETT, NBL, ARGOS, LUNA o i voli Novespace [NV].

### Lacune

- Nessuna campagna JETT pubblica dopo il 2024 [NV].
- Test di volo del lander Argonaut: nessun piano pubblico.
- Test di Chang'e 3/4/5 proprio a Huailai: [NV].
- Data dell'allunaggio Artemis: le fonti si contraddicono.

---

## Da verificare prima del pitch
- Tutti i passi [A] del modello: chiedere un ordine di grandezza a qualcuno di TAS-I o ALTEC in sala.
- Il ruolo di AIKO sul rover ETNA.
- Lo stato operativo del centro lunare ALTEC.
- La tariffa di LUNA: non è pubblica.
- Il cambio USD/EUR usato: 0,90.

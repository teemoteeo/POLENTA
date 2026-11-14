# Ricerca di mercato: education o nicchia B2B?

Autore: Timo · 2026-11-14 · fonti: conversazione con la mentor (registrazione), welcome dell'evento, web.

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

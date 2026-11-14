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

## Da verificare prima del pitch
- Tutti i passi [A] del modello: chiedere un ordine di grandezza a qualcuno di TAS-I o ALTEC in sala.
- Il ruolo di AIKO sul rover ETNA.
- Lo stato operativo del centro lunare ALTEC.
- La tariffa di LUNA: non è pubblica.
- Il cambio USD/EUR usato: 0,90.

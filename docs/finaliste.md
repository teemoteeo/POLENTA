# Finaliste: quali test mettiamo nel prodotto

Autore: Edo · rev. 3, 2026-11-14 18:20 · proposta da decidere col team, poi Rocco la riporta in `decisioni.md`.
Base: `decisioni.md` (prodotto: dove testare hardware lunare, 9 siti Artemis III), `requirements-tecnici.md` (catalogo dei test), `test-aziende.md` (compratori, costi, giuria).

**Cosa cambia dalla rev. 1:** con `test-aziende.md` il compratore conta quanto l'originalità.
- ISRU/materiale sale: ha il caso di business più forte.
- La luce radente scende da test a sé a **dimensione della mobilità**: il suo unico cliente, AIKO, è interessato solo di lato.
- La proposta torna in linea con `decisioni.md`: MVP mobilità + ISRU/materiale.

## Il confronto

Voti da 1 a 5. L'originalità è stimata su una ricerca dei repo pubblici di Space Apps 2026 (sab pomeriggio, ~47 repo sugli analoghi): è un campione, non un censimento.

| Finalista | Originalità rispetto agli altri team | Competitor esistenti (`mercato.md`) | Fattibilità | Dati | Compratore (`test-aziende.md`) |
|---|---|---|---|---|---|
| **Mobilità del rover** | 2: la fanno quasi tutti | PISCES (selezione a mano, solo Hawaii), Mission Control (Moonyard + campagne, senza spiegare la scelta), Astrobotic (spec generica), PANGU e Duality (terreno sintetico). **Nessuno misura la fedeltà rispetto a un sito Artemis** | **5** | 4: DEM; regolite stimata da temperatura e albedo MODIS | **forte**: team ULS/ETNA di TAS-I, tramite ALTEC; criteri del sito già scritti |
| **ISRU / materiale** | 4: nessuno lavora sulle sorgenti naturali | Space Resource Tech ("Compare" solo sui suoi simulanti), Off Planet (abbinamento a mano), Open Database of Lunar Regolith (non geografico). **Nessuno geolocalizza le sorgenti naturali** | 3 | 2–3: EMIT non vede l'anortosite; `materials.csv` scritto a mano | **forte**: chi riempie un letto o una hall (ALTEC, LUNA); 8–20 volte meno del simulante |
| **Copertura natura + strutture indoor** (vale per tutti i test) | **5**: nessuno mette siti, strutture e materiali sulla stessa scala | LUNA, ALTEC, Astrobotic vendono fedeltà senza misurarla rispetto a un target. **Nessuno** | 4: `facilities.csv` a mano + regola `s < 0,3` | 4 | ALTEC, TAS-I |
| Luce radente | **5**: nessun altro team sul *quando* | Moon Trek (illuminazione solo sulla Luna), Mearth (Terra↔Luna, solo temperatura). **Nessuno sul lato Terra** | **5** | **5**: calcolata, nessun download | debole come test a sé (AIKO, solo di lato) → **dimensione della mobilità** |
| Trivella e volatili | 3 | Off Planet (regolite ghiacciata su misura): parziale | 3 | 3: permafrost ESA CCI | Leonardo (non è di Torino) |
| Atterraggio (GNC) | 2: punteggi di siti di atterraggio già visti | Iris Landing Site API (chiusa), LUMINA, ispace Lunar Data Platform: **affollato** | 3: serve un DEM fine | 3 | TAS-I (Argonaut), ma non è un test di superficie |

## Verifica dei criteri (rev. 3)

**Verdetto:** si sceglie tra le finaliste di questo file. Rispettano i criteri e coprono la challenge, a patto di chiudere i 4 punti più sotto.

| Criterio | Esito | Nota |
|---|---|---|
| Originalità rispetto agli altri team | ⚠ | Copertura natura + indoor, sorgenti di materiale e luce radente: nessuno nel campione. **La mobilità da sola è quella che fanno tutti.** Campione delle 17:00, da ricontrollare domenica mattina |
| Originalità rispetto ad aziende e competitor | ✅ | Vedi la colonna "Competitor esistenti": nessuno mette siti, strutture e materiali rispetto a un target preciso |
| Fattibilità | ✅ | Mobilità e luce solide; ISRU possibile solo con il layer scritto a mano |
| Richieste delle aziende partner | ⚠ | TAS-I: pendenze, rocce, niente vegetazione e filtro Italia ci sono. **Mancano accesso, logistica e permessi** (4-5 mesi di permessi, area Natura 2000) e i crateri. ALTEC è coperta (strutture, materiale, luci a ~8°) |
| Giudici | ⚠ | TAS-I è il compratore; ESA BIC trova i numeri di business; ORiS si aggancia a luce e ombra. **Argotec non è servita da nessuna finalista**: accettabile, perché i giudici valutano con i criteri e non con il proprio business |
| Challenge (obblighi A1–A8) | ⚠ | Target, siti caratterizzati, dati NASA, "si rompe", più dimensioni e tool ci sono. **Manca il flag "sito nuovo"**: senza, non dimostriamo "look beyond well-known analog sites". Nell'ISRU i dati NASA sono deboli: il nucleo NASA resta la mobilità |

**Condizioni per la conferma piena:**
1. **Flag `new` nell'export** (`data/export/sites/*.json`, `requirements-tecnici.md` §6), con i siti di test già noti (Etna, Lanzarote, Teide, Ries, Islanda…) come layer di confronto. Chi: Edo + Rocco.
2. **Filtro accesso e aree protette:** per esempio luci notturne VIIRS (`VNP46A4`, dato NASA) come indicatore dell'accesso; le aree protette (Natura 2000, WDPA) sono fuori dalla lista ufficiale, quindi vanno dichiarate. Chi: Edo.
3. **Il pitch apre con la copertura e i materiali**, non con la mappa della mobilità. Chi: Rocco.
4. **Crateri** nella dimensione terreno (era nel piano vecchio: "crater-likeness"), oppure dichiarati tra i limiti. Chi: Edo.

## Proposta

- **MVP: mobilità + ISRU/materiale** (come `decisioni.md`).
  - **Mobilità:** il profilo nasce dai criteri dichiarati da TAS-I per l'Etna: pendenze vicino a 20°, depositi portati dal vento, rocce, crateri, niente vegetazione, area grande, accesso. **Validazione:** Piano delle Concazze e Cisternazza devono uscire in alto.
  - **ISRU/materiale:** sorgenti di roccia scritte a mano (Groenlandia, Stillwater, Etna, Lanzarote, cave di basalto italiane…), dichiarate come tali. Claim: "la roccia sorgente giusta vicino a te", non "un sostituto del simulante".
- **Luce radente dentro la mobilità:** è la dimensione originale, e costa quasi zero. Spunti:
  - le luci del letto lunare di ALTEC sono a ~8°, più alte del Sole nei siti Artemis (~1,5–7°): il tool lo può dire;
  - parla a ORiS (sponsor del 1° premio), che ha studiato per TAS l'energia senza fili ai rover lunari in ombra.
- **Il wow è la copertura con le strutture indoor:** "la natura ti dà terreno e luce; per il vuoto e i −200 °C vai alla camera termo-vuoto di ALTEC". Risponde al buco di mercato trovato da Timo.
- **Filtro "Italia / Europa":** TAS-I preferisce siti "tanto rappresentativi quanto nostrani" (legame con i fondi ASI). È un rischio per il pitch che diventa una funzione: il miglior sito vicino a te.
- Trivella e atterraggio: "coming soon" nella UI.

## Numeri per il pitch (da `test-aziende.md`; le voci [A] sono stime)

- Scelta del sito: **da 57 a 20 giornate-persona**, ≈ 28 k€ per campagna (≈ 19 k€ diretti + rischio evitato); oggi ci vogliono ~10 mesi, di cui 4-5 di permessi.
- Letto di regolite: roccia di cava **8–20 volte meno** del simulante commerciale. Precedente reale: LUNA ha riempito la hall con 750-900 t di basalto di una cava a 30-40 km.
- Luce: a 78–80°N, tra metà e fine agosto, il Sole resta tra 0° e 5,5° per 5–8 ore al giorno, con il terreno senza neve. Calcolo approssimato, senza rifrazione: da rifare con una libreria.

## Da decidere nella riunione

1. MVP mobilità + ISRU/materiale, con la luce come dimensione della mobilità: confermato?
2. La copertura con le strutture indoor diventa il messaggio principale del pitch?
3. Il filtro "Italia/Europa" entra nell'MVP?
4. Profili dei 9 siti Artemis: dai DEM polari LOLA (pesanti) o prima dai valori in letteratura, con LOLA solo se avanza tempo?
5. Le 4 condizioni della verifica: chi le fa ed entro quale gate?

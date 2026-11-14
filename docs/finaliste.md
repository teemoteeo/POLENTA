# Finaliste: quali test mettiamo nel prodotto

Autore: Edo · rev. 4, 2026-11-14 18:35 · proposta da decidere col team, poi Rocco la riporta in `decisioni.md`.
Base: `decisioni.md` (prodotto: dove testare hardware lunare, 9 siti Artemis III), `requirements-tecnici.md` (catalogo dei test), `test-aziende.md` (compratori, costi, giuria), `mercato.md` (competitor).

**Cosa cambia nella rev. 4:**
- **La luce radente non è più originale.** `earth-analog-explorer` (due team) calcola già la quota di ore con Sole basso per Shackleton e Malapert (pvlib + effemeridi NASA), con l'avviso "il terreno combacia ma la luce no". `analog_windows` annuncia "le settimane giuste per un obiettivo di test al Polo Sud" (repo ancora vuoto).
- L'originalità del rover passa a: **copertura con le strutture indoor**, **rifare la scelta reale di TAS-I** e **dossier di campagna**.
- ISRU va in anteprima e solo per l'anortosite: il basalto di cava, LUNA e ALTEC l'hanno già trovato da soli.

## Il confronto

Voti da 1 a 5, stimati da Edo. L'originalità rispetto agli altri team viene da due ricerche sui repo pubblici di Space Apps 2026 (17:00 e 18:30): è un campione, non un censimento.

| Finalista | Originalità rispetto agli altri team | Competitor esistenti (`mercato.md`) | Fattibilità | Dati | Compratore (`test-aziende.md`) |
|---|---|---|---|---|---|
| **Mobilità del rover** | 2: la fanno quasi tutti | PISCES (selezione a mano, solo Hawaii), Mission Control (Moonyard + campagne, senza spiegare la scelta), Astrobotic (spec generica), PANGU e Duality (terreno sintetico). **Nessuno misura la fedeltà rispetto a un sito Artemis** | **5** | 4: DEM; regolite stimata da temperatura e albedo MODIS | **forte**: team ULS/ETNA di TAS-I, tramite ALTEC; criteri del sito già scritti |
| **Copertura natura + strutture indoor** (funzione per tutti i test) | **5**: nessuno nel campione | LUNA, ALTEC, Astrobotic vendono fedeltà senza misurarla rispetto a un target. **Nessuno** | 4: `facilities.csv` a mano + regola `s < 0,3` | 4 | ALTEC, TAS-I |
| ISRU / materiale | 4: nessuno geolocalizza le sorgenti | Space Resource Tech ("Compare" solo sui suoi simulanti), Off Planet (a mano), database dei simulanti (non geografici) | 3 | 2–3: EMIT non vede l'anortosite; `materials.csv` a mano | medio: il basalto è già risolto (LUNA, ALTEC); il vuoto è l'**anortosite**, che LUNA ha fatto arrivare dalla Groenlandia |
| Luce radente | **2**: `earth-analog-explorer` (ore con Sole basso, avviso luce), `analog_windows` (settimane) | Moon Trek (solo il lato Luna) | **5** | **5**: calcolata | debole come test a sé → **dimensione della mobilità** |
| Trivella e volatili | 3 | Off Planet (regolite ghiacciata su misura): parziale | 3 | 3: permafrost ESA CCI | Leonardo (non è di Torino) |
| Atterraggio (GNC) | 2 | Iris Landing Site API (chiusa), LUMINA, ispace Lunar Data Platform: **affollato** | 3: serve un DEM fine | 3 | TAS-I (Argonaut), ma non è un test di superficie |

Cosa fanno già gli altri team: piattaforme di similarità con l'AI; profili di missione (area-67, analogx); inerzia termica + EMIT (terrestrial-analog-finder); protocolli di test generati da LLM (TAVME); "cosa testare qui" per sito (analog-mappers); luce e Sole basso (earth-analog-explorer, analog_windows).

## Shortlist: tre proposte

La copertura con le strutture indoor è inclusa in tutte.

| Proposta | Originalità (team) | Originalità (competitor) | Fattibilità | Partner e giudici | Challenge |
|---|---|---|---|---|---|
| **1. "Dove testare il rover ETNA"**: mobilità + copertura + scelta TAS-I rifatta + dossier di campagna + filtro Italia/Europa | 3–4 | 4 | **5** | **5**: TAS-I compratore, ALTEC copertura, ESA BIC numeri | **5**: nucleo di dati NASA solido |
| 2. "L'anortosite giusta vicino a te": sorgenti di materiale degli altopiani + copertura | 4 | **5** | 3 | 4: ALTEC, habitat MPH di TAS | 3: lato Terra a mano, dati NASA deboli |
| 3. "Luce del Polo Sud: dove e quando": navigazione in luce radente + terreno + copertura | 2: già fatta o annunciata da altri | 4 | **5** | 3: AIKO, PIC4SeR, ORiS | 4 |

## Proposta: la 1, con il rover come esempio principale

Il rover da solo è quello che fanno tutti. L'originalità viene da tre pilastri:

1. **Copertura natura → strutture indoor.** "Il terreno te lo dà questo sito; il vuoto, i −200 °C e la luce a 1,5–7° no (il letto di ALTEC ha le luci a ~8°): per quelli vai lì." Nessuno collega l'analogo naturale alla struttura che chiude il buco.
2. **Rifare la scelta reale di TAS-I.** Il profilo usa i criteri dichiarati per l'Etna (pendenze vicino a 20°, depositi portati dal vento, rocce, crateri, niente vegetazione, area grande, accesso). La prova: il tool rimette in cima **Piano delle Concazze e Cisternazza**, il sito principale e quello di riserva scelti in 10 mesi. Poi mostra i **siti nuovi** con punteggio vicino. Gli altri team validano su analoghi famosi; noi su una decisione industriale vera.
3. **Dossier di campagna, non solo ranking.** Sito, finestra stagionale, accesso (luci notturne VIIRS, dato NASA) e aree protette (Natura 2000 / WDPA, fuori dalla lista ufficiale, da dichiarare). Attacca il dolore vero di TAS-I: 4-5 mesi di permessi.

Contorno:
- **Luce radente** come dimensione della mobilità: serve alla fisica e alla challenge, ma non è il nostro messaggio.
- **Filtro Italia/Europa:** TAS-I preferisce siti "tanto rappresentativi quanto nostrani" (fondi ASI).
- **Facoltativo (Rocco, criterio Validity):** quantificare con la terramecanica il "si rompe" della gravità, cioè l'affondamento della stessa ruota a 1 g contro 1/6 g.
- **ISRU in anteprima** solo dopo il gate di dom 01:00 e solo per l'anortosite, con `materials.csv` a mano. Claim: "la roccia sorgente giusta vicino a te", non "un sostituto del simulante".
- Trivella e atterraggio: "coming soon" nella UI.

## Verifica dei criteri

| Criterio | Esito | Nota |
|---|---|---|
| Originalità rispetto agli altri team | ⚠ | Restano unici nel campione la copertura con le strutture indoor, la validazione sulla scelta TAS-I, il dossier con i permessi e le sorgenti di materiale. Luce e "cosa testare" non lo sono più. Da ricontrollare domenica mattina |
| Originalità rispetto ad aziende e competitor | ✅ | Nessuno mette siti, strutture e materiali rispetto a un target preciso |
| Fattibilità | ✅ | Proposta 1 solida; ISRU solo in anteprima |
| Richieste delle aziende partner | ✅ | TAS-I: criteri del sito, permessi, preferenza Italia. ALTEC: copertura, luci a ~8° |
| Giudici | ⚠ | TAS-I compratore, ESA BIC numeri, ORiS luce e ombra. Argotec non è servita: accettabile |
| Challenge (A1–A8) | ⚠ | Coperta, a patto di avere il flag "sito nuovo" (condizione 1) |

**Condizioni:**
1. **Flag `new` nell'export** (`data/export/sites/*.json`), con i siti di test già noti come layer di confronto. Chi: Edo + Rocco.
2. **Accesso e aree protette** nel dossier: VIIRS `VNP46A4` (NASA) per l'accesso; Natura 2000 / WDPA dichiarati come fonti esterne. Chi: Edo.
3. **Il pitch apre con la copertura e con la scelta TAS-I rifatta**, non con la mappa. Chi: Rocco.
4. **Crateri** nella dimensione terreno, oppure dichiarati tra i limiti. Chi: Edo.

## Numeri per il pitch (da `test-aziende.md`; le voci [A] sono stime)

- Scelta del sito: **da 57 a 20 giornate-persona**, ≈ 28 k€ per campagna; oggi ~10 mesi, di cui 4-5 di permessi.
- Letto di regolite: roccia di cava **8–20 volte meno** del simulante commerciale (precedente: la hall di LUNA, basalto di una cava a 30-40 km).
- Luce: a 78–80°N, tra metà e fine agosto, Sole tra 0° e 5,5° per 5–8 ore al giorno, senza neve. Calcolo approssimato: da rifare con una libreria.

## Da decidere nella riunione

1. Proposta 1 (rover ETNA con copertura, scelta TAS-I rifatta e dossier) come base: sì?
2. Il pitch apre con la copertura e con "rifacciamo in minuti la scelta che TAS-I ha fatto in 10 mesi"?
3. Aree protette (fonte esterna, da dichiarare) nel dossier: sì o no?
4. ISRU/anortosite in anteprima dopo dom 01:00, oppure fuori?
5. Profili dei 9 siti Artemis: DEM polari LOLA (pesanti) o prima la letteratura?
6. DEM della Terra: NASADEM + ASTER GDEM (spec di Edo) oppure Copernicus / ArcticDEM (CSV di Rocco)?
7. Le 4 condizioni: chi le fa ed entro quale gate?

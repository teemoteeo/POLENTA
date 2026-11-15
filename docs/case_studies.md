# Casi studio per la demo e il pitch (bozza)

Autore: Edo · dom 15/11, 03:10 · numeri presi dall'export del backend (`data/export/`, generato alle 02:48). **Rocco** rifinisce i testi; **Timo** fa un bottone per caso, che apre direttamente sito × test e il primo risultato.
I nomi delle aziende e dei loro programmi vengono da `docs/test-aziende.md`.

---

## Caso 1 · TAS-I, rover per Malapert Massif
**Preset:** sito `malapert_massif` · test `rover_mobility` · risultato `r01`

**Il problema:** il team ULS/ETNA di TAS-I deve provare un rover per le pendenze e la regolite di un sito Artemis III. Oggi lo prova sull'Etna (campagna ULS 2026).

**Cosa dice il tool:**
- **Valida la scelta di oggi.** L'Etna, Piano delle Concazze, esce nell'**87% migliore** degli esagoni della Terra per Malapert. Anche SP Crater (89%) e Meteor Crater (86%), siti NASA, escono in alto.
- **Propone posti nuovi**, tutti a più di 200 km da siti di test noti:
  - Terra di Francesco Giuseppe (Russia, 80°N), voto 0,32;
  - 62 km da Blanding, Utah, 0,30;
  - Groenlandia (76,8°N), 0,29.
- **Dice la verità sui limiti.** Il voto massimo è ~0,32: **nessun posto sulla Terra è Malapert**. Si rompono grana e densità della regolite, crateri, gravità, vuoto, polvere.
- **Campagna consigliata:**
  - terreno all'aperto;
  - **LUNA a Colonia** per grana, 1/6 g e densità della regolite;
  - **TVAC ALTEC a Torino** (in arrivo) per il vuoto;
  - campi crateri costruiti per i crateri;
  - **Swamp Works (NASA KSC)** per la polvere.
- **Materiale:** simulanti LHS-1 / LSP-2 (Polo Sud), oppure anortosite naturale del Rogaland (Norvegia, ~1.500 km da Torino) per un letto di regolite.

**Frase per il pitch:** *"Per Malapert nessun posto sulla Terra basta da solo. Il tool conferma l'Etna, propone posti nuovi e dice quali strutture combinare."*

---

## Caso 2 · Lander con lidar per Haworth (TAS-I Argonaut, Evolunar)
**Preset:** sito `haworth` · test `flight_hda_lidar` · risultato `r01`

**Il problema:** il lidar del lander deve riconoscere crateri e massi in discesa. Le campagne si fanno su campi di crateri **costruiti a mano** (KSC, Mojave, Huailai), piccoli e costosi.

**Cosa dice il tool:**
- **Valida:** Meteor Crater esce nel **93% migliore**, Black Point Lava Flow nell'86%.
- **Propone posti naturali nuovi**, grandi decine di km² invece di un ettaro:
  - Shelby, Montana, voto 0,56;
  - Miles City, Montana, 0,51;
  - 30 km da Winnemucca, Nevada, 0,47.
- **Si rompe:** pendenze (Haworth è più ripido), albedo, gravità, getto del motore nel vuoto, vuoto.
- **Campagna consigliata:**
  - voli sul sito naturale;
  - **sfera a vuoto da 60 ft della NASA Langley** per il getto del motore sulla regolite;
  - **LUNA** per 1/6 g e pendenze;
  - **Flat Floor Facility della NASA Marshall** per la luce del Polo Sud.

**Frase per il pitch:** *"Invece di costruire un campo di crateri da un ettaro, il tool trova campi naturali di decine di km² con la stessa densità di crateri."*

---

## Caso 3 · ALTEC, risorse in situ (Aristarchus e Phoenix)
**Preset A:** sito `aristarchus_plateau` · test `isru_subsurface` · `r01`
**Preset B:** sito `phoenix` · test `isru_subsurface` · `r01`

**Il problema:** ALTEC costruisce il centro lunare di Torino e gestisce il Mars Terrain Simulator (ExoMars). Per le prove di ISRU servono suolo e roccia giusti, e per Marte il ghiaccio nel suolo.

**Cosa dice il tool:**
- **Aristarchus** (regolite basaltica e piroclastica, secca) ha analoghi quasi perfetti:
  - Battle Mountain, Nevada, voto 0,99;
  - Harran al-Awamid (Siria), 0,97;
  - Winnemucca, Nevada, 0,92.

  Restano solo i limiti che nessun posto terrestre ha: vuoto, freddo delle zone in ombra, agglutinati. Per il materiale: simulanti LMS-1 / EAC-1A, oppure **basalto dell'Eifel a ~590 km da Torino**, la stessa roccia da cui viene il simulante ESA usato da LUNA.
- **Phoenix** (ghiaccio a pochi cm, 55% in peso):
  - vince l'**altopiano del Tibet**, deserto freddo con permafrost, voto 0,71;
  - poi la Mongolia (Bayanhongor) e il Qinghai, 0,62;
  - il Mauna Kea, sito ISRU della NASA (PISCES), esce nel 91% migliore.

  Per estrarre acqua dal ghiaccio questi posti sono **nuovi** rispetto ai classici (Antartide, Islanda, Hawaii).
- **Campagna:** TVAC ALTEC a Torino (in arrivo) per vuoto e freddo; simulante MGS-1 per Marte.

**Frase per il pitch:** *"Per l'ISRU marziano il miglior analogo non è l'Antartide: è l'altopiano del Tibet."*

---

## Da sistemare prima della demo
- **Cinder Lake** non entra nella classifica: l'esagono include Flagstaff, che supera la soglia delle luci notturne (3,5). È un sito di validazione: valutare se alzare la soglia o descrivere il sito con le sue coordinate precise (`[NV]` in `known_sites.csv`).
- I posti con poco suolo nudo (Terra di Francesco Giuseppe 7%, Groenlandia 6%) vanno presentati con l'avviso `valid_share` (spec T9).
- Testi da rifinire con Rocco. Numeri da ricontrollare dopo l'ultimo export del mattino.

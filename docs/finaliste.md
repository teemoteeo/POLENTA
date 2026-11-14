# Finaliste: quali test mettiamo nel prodotto

Autore: Edo · 2026-11-14 17:55 · proposta da decidere col team, poi Rocco la riporta in `decisioni.md`.
Base: `decisioni.md` (prodotto: dove testare hardware lunare, 9 siti Artemis III) e `requirements-tecnici.md` (catalogo dei test).

## Il confronto

Voti da 1 a 5. L'originalità è stimata su una ricerca dei repo pubblici di Space Apps 2026 (sab pomeriggio, ~47 repo sugli analoghi): è un campione, non un censimento.

| Finalista | Originalità | Fattibilità | Dati | Cliente a Torino |
|---|---|---|---|---|
| **Navigazione in luce radente** | **5**: nessun altro team sul *quando* | **5** | **5**: luce calcolata, nessun download | AIKO, PIC4SeR, Thales Alenia |
| **Copertura natura + strutture indoor** (vale per tutti i test) | **5**: nessuno mette siti naturali, strutture e materiali sulla stessa scala | 4: `facilities.csv` a mano + regola `s < 0,3` | 4: lista a mano | ALTEC, Thales Alenia |
| ISRU / materiale | 4: nessuno lavora sulle sorgenti naturali | 3 | 2–3: EMIT non vede l'anortosite; GLiM è fuori dalla lista ufficiale; serve `materials.csv` a mano | ALTEC (riempire la hall), PoliMi |
| Mobilità del rover | 2: la fanno quasi tutti | **5** | 4: DEM; regolite stimata con aridità e litologia | Thales Alenia (rover Etna), DIANA |
| Trivella e volatili | 3 | 3 | 3: permafrost ESA CCI | Leonardo (non è di Torino) |
| Atterraggio (GNC) | 2: punteggi di siti di atterraggio già visti (API Iris chiusa, LUMINA) | 3: serve un DEM fine | 3 | Thales Alenia (Argonaut) |

Cosa fanno già gli altri team: "piattaforme di similarità con l'AI", profili di missione (area-67, analogx), inerzia termica + minerali EMIT (terrestrial-analog-finder), protocolli di test generati da LLM (TAVME). Ombre e illuminazione compaiono solo come mappa statica facoltativa (area-67).

## Proposta

- **MVP: mobilità + luce radente.**
  - La **mobilità** fa da base e da validazione: l'Etna, dove Thales Alenia ha testato il rover, deve uscire in alto.
  - La **luce radente** è l'elemento originale e costa quasi zero: si calcola, non si scarica.
- **Il wow è la copertura con le strutture indoor**, per entrambi i test: "la natura ti dà terreno e luce, per il vuoto e i −200 °C vai alla camera termo-vuoto di ALTEC". Risponde al buco di mercato trovato da Timo.
- **ISRU in anteprima** con `materials.csv` scritto a mano (Groenlandia, Stillwater, Etna, Lanzarote…), dichiarato come tale.
- Trivella e atterraggio: "coming soon" nella UI.

**Differenza da `decisioni.md`:** oggi l'MVP proposto è mobilità + ISRU. Questa proposta sposta ISRU in anteprima, perché i dati sui materiali sono i più deboli, e mette al suo posto la luce radente.

## Il numero per il pitch (luce radente)

Al Polo Sud il Sole resta a pochi gradi sull'orizzonte e ci gira tutto intorno: ~1,5° al polo esatto, fino a ~5–7° nei siti Artemis (es. Malapert ~86°S: fino a ~5,5°).

Sulla Terra, **a 78–80°N tra metà e fine agosto, il Sole resta tra 0° e 5,5° per 5–8 ore al giorno**, con il terreno senza neve: è la fine del sole di mezzanotte. È un calcolo approssimato, senza rifrazione: da rifare con una libreria e da incrociare con la neve MODIS.

Frase: *"Le notti di fine agosto nell'Artico hanno la luce del Polo Sud lunare."*

Dove si rompe: sulla Terra l'atmosfera diffonde la luce, quindi ombre più morbide e cielo non nero.

## Due correzioni a `requirements-tecnici.md` §4 (per Timo)

- "sole ≤ ~1,5°": vale solo al polo esatto; nei siti Artemis arriva a ~5–7°.
- "il sole radente c'è solo d'inverno": falso, vedi il calcolo sopra (fine agosto, alte latitudini, senza neve).

## Da decidere nella riunione

1. MVP: mobilità + luce radente (questa proposta) oppure mobilità + ISRU (`decisioni.md`)?
2. La copertura con le strutture indoor diventa il messaggio principale del pitch?
3. ISRU: anteprima con `materials.csv` a mano, oppure fuori?
4. Chi verifica il calcolo della luce con la neve MODIS: Edo, entro le 20:00 insieme all'export di prova?

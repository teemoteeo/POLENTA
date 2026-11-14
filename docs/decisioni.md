# Decisioni — FVG Station

**Fonte unica.** Se un altro file non torna con questo, vale questo. Aggiornato: 2026-11-14 17:45 (riunione del team registrata alle 17:10).

## Prodotto

- **Cosa:** un tool che dice dove sulla Terra testare hardware lunare. Si parte dal test da fare, non dal target.
- **Per chi:** le aziende di Torino che testano hardware lunare (B2B). In giuria ci sono Thales Alenia Space e Argotec, che fanno esattamente questo. La UI deve essere comprensibile a chiunque: la versione education (ESA Moon Camp, ESERO) è gratuita e fa da canale.
- **Target:** le 9 regioni candidate per l'atterraggio di Artemis III al Polo Sud lunare (lista NASA di ott 2024: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, Slater Plain; verificare se aggiornata). **Jezero esce.**
- **Benchmark e pitch:** per ogni sito Artemis e per ogni azienda di Torino, quali test servono e dove farli sulla Terra.
- **Mappa con tre tipi di punti:**
  - siti naturali per test all'aperto;
  - strutture indoor (LUNA, ALTEC, Moonyard, Astrobotic, PISCES…);
  - sorgenti di materiale (affioramenti e cave).
- **Il tipo di test imposta i pesi delle dimensioni:**
  - mobilità → pendenza, rugosità, granulometria;
  - trivella → ghiaccio, durezza;
  - ISRU → mineralogia.
  - MVP proposto: mobilità + ISRU/materiale. Da confermare dopo l'analisi di Rocco.
- **Card di ogni risultato:** cosa combacia, cosa no, dove l'analogia si rompe.
- **Claim sul materiale:** "la roccia sorgente giusta vicino a te", non "un sostituto del simulante". I grani terrestri sono arrotondati, quelli lunari taglienti (lo ha detto la mentor).

## Spunti per le dimensioni

- **Illuminazione:** al Polo Sud il sole non sale oltre ~1,5°, quindi ombre lunghissime e contrasti estremi.
- **Alta quota e ghiacciai:** proxy di radiazione più alta e atmosfera rarefatta. La gravità non si riproduce.

## Prossimi passi, in ordine

1. **Rocco:** quali test fanno le 5 aziende di Torino e di quali dati hanno bisogno → `docs/test-aziende.md`.
2. **Tutti:** requirements tecnici del prodotto (dimensioni, dati, output), ricavati dai test.
3. **Edo:** sceglie i dataset e scrive lo script di download. I dati restano fuori da git finché non sono strutturati.
4. **Timo:** app e UI, una volta fissati i requirements.

## Ruoli (invariati dal piano)

- **Edo:** pipeline dati, scoring, ML, export per l'app.
- **Timo:** app, card, deploy, video, submission.
- **Rocco:** fisica dell'analogia, test delle aziende, report, slide, pitch.

## Aperto

- Kit di analoghi (T1, "nessun posto basta, tre insieme sì"): non convince, non deciso.
- Motore della mappa: Cesium o deck.gl.

## Orari e submission

- **Deadline: dom 15/11 alle 16:00.** Submit interno entro le 15:30. Pitch alle 16:15, premiazione alle 17:30.
- **Pitch:** 4 minuti cronometrati. Struttura e criteri in `docs/requirements.md`.
- **Demo:** 7 slide oppure un video di massimo 30 secondi. Link pubblici senza login. Almeno un dato NASA. Uso dell'AI dichiarato.

## Dove sta il resto

- `docs/requirements.md`: requisiti di challenge, giuria e pitch.
- `docs/mercato.md`: ricerca di mercato, competitor e clienti.
- `docs/fonti/`: testo della challenge e risorse ufficiali.
- `archive/`: il piano vecchio (Jezero, twist), `findings.md`, il briefing e le reference visive. Solo consultazione.

# Decisioni — FVG Station

**Fonte unica.** Se un altro file non torna con questo, vale questo. Aggiornato: 2026-11-15 00:20 (3 test: Edo, decisione del team). Prima: 14/11 23:30 (perimetro e parametri), riunione delle 17:10. Prima versione: riunione delle 17:10.

## Prodotto

- **Cosa:** un tool che dice dove sulla Terra testare hardware per la Luna e per Marte. Si sceglie un sito e un test; il tool dice dove farlo, quanto è fedele, dove l'analogia si rompe e quale struttura indoor chiude il buco.
- **Per chi:** le aziende di Torino che testano hardware lunare (B2B). In giuria ci sono Thales Alenia Space e Argotec, che fanno esattamente questo. La UI deve essere comprensibile a chiunque: la versione education (ESA Moon Camp, ESERO) è gratuita e fa da canale.
- **Target (sab 23:30): 5 siti.**
  - Luna, 3 candidati di Artemis III al Polo Sud: Malapert Massif, Haworth, Nobile Rim 1.
  - Marte: Phoenix (68,2°N) e Gale (4,6°S).
  - Gli altri 6 siti Artemis e Jezero escono.
- **Benchmark e pitch:** matrice 5 siti × 3 test, con il miglior sito sulla Terra e la struttura indoor per ogni casella.
- **Mappa con tre tipi di punti:**
  - siti naturali per test all'aperto;
  - strutture indoor (LUNA, ALTEC, Moonyard, Astrobotic, PISCES…);
  - sorgenti di materiale (affioramenti e cave).
- **Test della demo (dom 00:20): 3**, scelti sul testo della challenge ("landing, mobility", "water, ice, permafrost and other potential resources", "geology… surface materials"). Pesi in `data/config/tests.yaml` v2:
  - `flight_hda_lidar`: atterraggio, il lidar del lander riconosce i pericoli in discesa;
  - `rover_mobility`: rover su pendii, rocce e regolite;
  - `isru_resources`: risorse in situ per una base permanente, cioè ghiaccio nel suolo e regolite da lavorare.
  - Fuori: camera, EVA, contatto col suolo, trivella.
- **Card di ogni risultato:** cosa combacia, cosa no, dove l'analogia si rompe.
- **Claim sul materiale:** "la roccia sorgente giusta vicino a te", non "un sostituto del simulante". I grani terrestri sono arrotondati, quelli lunari taglienti (lo ha detto la mentor).

## Parametri (sab 23:30)

Per ogni sito serve il valore (o un intervallo min-max) e la fonte, **calcolati con la stessa definizione** usata sulla Terra. Dettagli: `docs/allineamento-edo.md`; motivi tecnici: `docs/backend_spec.md` sez. E.

**Nel voto** (pesi: lidar / rover / ISRU):

| Parametro | Definizione | Luna | Marte | Pesi |
|---|---|---|---|---|
| `slope_p90` | pendenza al 90° percentile, DEM a 30 m | LOLA | DTM CTX o HiRISE | 0,20 / 0,35 / 0,10 |
| `roughness` | scarto della quota dalla media su 150 m | LOLA | CTX / HiRISE | 0,15 / 0,15 / — |
| `crater_density` | conche entro 300 m, ≥ 20 m sotto il bordo, per km² | LOLA | CTX / HiRISE | 0,30 / 0,05 / — |
| `rock_cover` | quota di sassi e massi | Diviner | TES / THEMIS | 0,25 / 0,15 / — |
| `grain_proxy` | inerzia termica: suolo fine e sciolto contro compatto (confronto per percentile) | Diviner | THEMIS | — / 0,15 / 0,15 |
| `albedo` | quanto riflette la superficie | LROC / LOLA | TES | 0,05 / — / — |
| `low_sun_frac` | quota di luce con il Sole a 0-7° | ~1,0 | da latitudine | — / 0,10 / — |
| `permafrost_share` | quota di area con temperatura media annua < −1 °C (proxy MODIS del ghiaccio nel suolo) | ghiaccio nelle zone in ombra (LEND, Diviner) | Phoenix sì, Gale no | — / — / 0,30 |
| `sand_pct`, `clay_pct` | tessitura dei primi 5 cm (SoilGrids) | regolite: ~metà sabbia fine, poca argilla | Phoenix, Curiosity | — / — / 0,20 e 0,15 |
| `bulk_density_0_5` | densità dei primi cm (g/cm³) | Apollo ~1,5 | Phoenix, Curiosity | — / — / 0,10 |
| `rock_class` | tipo di roccia (fonte terrestre da decidere) | anortosite | basalto, sedimentario | 0,05 / 0,05 / — |

**Fuori dal voto** (card e "dove si rompe"): temperature (anche la media annua), carbonio organico (SoilGrids, inaffidabile nell'alto Artico), profilo di densità 0-2 m, quota, atmosfera (vento per i siti finali), comunicazioni (luci notturne come proxy dell'isolamento), mesi senza neve, Hurst, aree protette. Sulla Luna e su Marte questi valori sono uguali per tutti i siti terrestri o non confrontabili, quindi non cambiano la classifica.

**Gap indoor fissi:** gravità 1/6, vuoto, polvere elettrostatica, getto del motore nel vuoto.

**Dati della Terra:**
- tutto su Google Earth Engine; dati NASA come base (NASADEM, MODIS, VIIRS, MERRA-2) + AW3D30 di JAXA sopra i 60°N + SoilGrids (esterno, da dichiarare);
- maschera "suolo nudo": NDVI mediano dei mesi senza neve < 0,2, applicata al pixel da 1 km;
- terreno alla baseline di 30 m: esatto sui candidati, stima calibrata sul resto (errore dichiarato).

## Spunti per le dimensioni

- **Illuminazione:** al Polo Sud il Sole resta a pochi gradi sull'orizzonte (~1,5° al polo esatto, fino a ~5–7° nei siti Artemis), quindi ombre lunghissime e contrasti estremi.
- **Alta quota e ghiacciai:** proxy di radiazione più alta e atmosfera rarefatta. La gravità non si riproduce.

## Prossimi passi, in ordine (sab 23:30)

1. **Edo + Rocco:** valori dei 5 siti per i parametri del voto, con la fonte (formato `targets.json`).
2. **Rocco:** conferma i pesi di `isru_resources` e sceglie la fonte di `rock_class`. Proposta: vulcani (GVP) e crateri da impatto (Earth Impact Database) a regole.
3. **Edo:** export vero in `data/export/`: 15 file (5 siti × 3 test), stesso formato del mock.
4. **Timo:** l'app legge l'export vero; immagini, deploy.
5. **Tutti:** validazione sui siti noti (Etna, Death Valley, Cinder Lake…), poi slide e pitch.

## Ruoli (invariati dal piano)

- **Edo:** pipeline dati, scoring, ML, export per l'app.
- **Timo:** app, card, deploy, video, submission.
- **Rocco:** fisica dell'analogia, test delle aziende, report, slide, pitch.

## Aperto

- Kit di analoghi (T1, "nessun posto basta, tre insieme sì"): non convince, non deciso.
- Motore della mappa: Cesium o deck.gl.
- Fonte di `rock_class` sulla Terra (vedi Prossimi passi). Attenzione: EMIT non misura il plagioclasio, cioè l'anortosite del Polo Sud.
- `low_sun_hours` (ore al giorno con il Sole a 0-7°) al posto di `low_sun_frac` nel voto: distingue meglio le alte latitudini.

## Orari e submission

**Gate** (decisi alle 17:40; la notte si lavora fuori dal Politecnico):

| Quando | Cosa |
|---|---|
| sab 20:00 | file di prova in `data/export/` (1 sito Artemis) |
| sab 21:45 | si esce dal Politecnico (il cancello chiude alle 22:00), si continua da remoto |
| sab 22:30 | primo test end-to-end: mobilità sulla mappa |
| dom 01:00 | ranking completo, poi si dorme |
| dom 09:00 | rientro al Politecnico (ingresso pedonale) |
| dom 11:00 | freeze delle funzionalità |
| dom 15:30 | submit interno |

- **Deadline: dom 15/11 alle 16:00.** Submit interno entro le 15:30. Pitch alle 16:15, premiazione alle 17:30.
- **Pitch:** 4 minuti cronometrati. Struttura e criteri in `docs/requirements.md`.
- **Demo:** 7 slide oppure un video di massimo 30 secondi. Link pubblici senza login. Almeno un dato NASA. Uso dell'AI dichiarato.

## Dove sta il resto

- `docs/requirements.md`: requisiti di challenge, giuria e pitch.
- `docs/mercato.md`: ricerca di mercato, competitor e clienti.
- `docs/fonti/`: testo della challenge e risorse ufficiali.
- `docs/allineamento-edo.md`: siti, test e parametri nel dettaglio. `docs/backend_spec.md`: la pipeline.
- `archive/`: il piano vecchio (Jezero, twist), `findings.md`, il briefing e le reference visive. Solo consultazione.

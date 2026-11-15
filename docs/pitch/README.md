# Pitch: deck nel browser (scheletro)

Autore: Edo · dom 15/11, 11:30. Bozza da rifinire con Rocco (slide e pitch) e Timo (video, deploy).

## Cosa c'è

- `index.html`: deck di **7 slide** (titolo incluso), 16:9, stessa estetica dell'app (token di `src/web/src/app.css`, pianeti a puntini, vetro, arancio `#ff5a1f`). Animazioni a passi: ogni → mostra il blocco successivo, poi passa alla slide dopo.
- `data.js`: numeri presi dall'export (`data/export/`), generati da `snapshot.py`. Non si modifica a mano.
- `snapshot.py`: va rilanciato **dopo ogni ripubblicazione dell'export**: `python3 docs/pitch/snapshot.py`.

Formato scelto: 7 slide servono sia per la submission (limite: 7 slide **oppure** video ≤ 30 s) sia per il pitch dal vivo di 4 minuti. Il video da 30 s va dentro la slide 4 (`demo.mp4` nella cartella: il deck lo riproduce da solo).

## Come si apre

```
cd docs/pitch && python3 -m http.server 5192
```
poi `http://localhost:5192`. Funziona anche con doppio click su `index.html` (file://), tranne il video.

Tasti: `→`/spazio/telecomando avanti · `←` indietro · `1-7` vai alla slide · `N` note · `P` finestra presentatore (note, timer, slide dopo, sincronizzata) · `T` timer nel piè di pagina · `S` avvia il timer · `R` azzera · `L` apre l'app · `D` tema chiaro/scuro · `G` nasconde i tratteggi della bozza · `F` schermo intero · `B` schermo nero · `?` aiuto.

## Scaletta (4:00)

| # | Slide | Fine entro | Animazione |
|---|---|---|---|
| 1 | Titolo e promessa | 0:15 | Luna e Marte a puntini che si formano; poi la Terra |
| 2 | Problema: 10 mesi per scegliere il sito del rover | 0:50 | Terra su Etna e Torino; linea del tempo che si disegna; contatori |
| 3 | Soluzione: sito + test → campagna | 1:25 | 4 carte con un punto che scorre; arco Haworth → primo posto sulla Terra |
| 4 | Demo: Haworth × rover | 2:15 | video (o segnaposto) + scheda del risultato coi dati veri |
| 5 | Dati NASA e validazione | 2:55 | mappa del mondo a esagoni (migliori posti + siti noti); barre di validazione; sorpresa e limiti |
| 6 | Mercato, modello, concorrenza | 3:35 | Terra con la campagna da Torino; barra 57 → 20; matrice 2×2 |
| 7 | Frase finale, richiesta, team | 4:00 | Luna, Terra e Marte in fila |

Le note per chi parla (punti chiave, non copione) sono in ogni slide, tasto `N` o `P`.

## Da fare quando la piattaforma è finita

- [ ] **Rocco:** testi e frase finale (alternative nelle note della slide 7); decidere se nominare TAS-I sul palco (slide 2, tratteggiata).
- [ ] **Timo:** registrare il video da 30 s del percorso Luna → Haworth → Rover → primo posto → Campaign view e salvarlo come `docs/pitch/demo.mp4`; mettere il link pubblico dell'app in `APP_URL` (in cima allo script di `index.html`).
- [ ] **Edo:** dopo l'ultimo export, `python3 docs/pitch/snapshot.py` e ricontrollare: primo posto di Haworth × rover, righe di validazione (`VALIDATION_ROWS`), "Tibetan Plateau" per Phoenix × ISRU (oggi: 195 km da Qimantag, Qinghai).
- [ ] Verificare i tratteggiati: 57 giornate-persona e 28 k€ sono stime [A] di `docs/test-aziende.md`; la frase su Curiosity va controllata.
- [ ] Caso della demo: oggi `haworth__rover_mobility` (`DEMO_CASE` nello script). Si cambia con una riga.
- [ ] Prima del pitch: `DRAFT = false` nello script (toglie tratteggi e badge).
- [ ] Deploy: per avere un link pubblico, Timo copia la cartella in `src/web/public/pitch/` (il deck usa solo `index.html`, `data.js` e il video).
- [ ] Lingua del pitch: slide e note sono in inglese, come l'app.

## Numeri usati (export del 15/11, 09:26 UTC)

- 18 su 18 primi posti sono nuovi (nessun sito di test noto).
- Validazione (percentile sulla Terra, 100 = migliore): Mojave LSPG 97 (Malapert, lidar), Rogers Dry Lake 95 (Haworth, lidar), SP Crater 89 e Etna Concazze 87 (Malapert, rover), Mauna Kea 91 (Phoenix, ISRU). Sono le righe in cui il sito noto si usa davvero per quel test; la tabella intera è nel pannello "Method & data" dell'app.
- Haworth × rover, primo posto: 97 km da Winnemucca, Nevada, somiglianza 0,42.

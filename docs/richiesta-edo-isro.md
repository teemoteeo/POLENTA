# Richiesta per Edo: export "Near you" per la sede ISRO

Da: Timo · dom 15/11/2026, 11:55 · branch `night`.
Per: Edo e i suoi agent. Scope: `src/pipeline/` e `data/` sono tuoi, io non li tocco.

## In una riga

Rigira l'export "Near you" con la sede **`isro`** al posto di `amman`, e pusha i 18 file `data/export/near/isro__<sito>__<test>.json`.

## Cosa cambiare

In `src/pipeline/export.py`, riga 270:

```python
# oggi
HOMES = {"turin": ("Torino", 45.07, 7.69), "amman": ("Amman", 31.95, 35.93)}
# serve
HOMES = {"turin": ("Torino", 45.07, 7.69), "isro": ("ISRO Bengaluru", 12.9592, 77.6611)}
```

- **`id`:** deve essere esattamente `isro`. L'app cerca il file `near/isro__<sito>__<test>.json` (`src/web/src/homes.js`, `src/web/src/near.js`).
- **Coordinate:** 12.9592, 77.6611. È la voce `isro_bengaluru` di `data/config/space_agencies_top10.json` (U R Rao Satellite Centre, Bengaluru).
- **Nome:** `ISRO Bengaluru`. Finisce in `home.name` e in `campaign.client`.

Tutto il resto resta com'è: stessa forma dei file, stessi tre raggi (`results_by_radius` con `1500`, `3000`, `5000`), stessi filtri, stessa regola sui siti noti, `km_home`, campagna calcolata dalla sede.

## File attesi

18 file, uno per coppia sito × test:

```
data/export/near/isro__<sito>__<test>.json
sito: malapert_massif, haworth, nobile_rim_1, aristarchus_plateau, phoenix, gale
test: rover_mobility, flight_hda_lidar, isru_subsurface
```

I file `turin__*` servono ancora. I file `amman__*` non vengono più letti: puoi lasciarli o toglierli.

## Perché serve la pipeline e non basta l'app

Senza i file `isro__*` l'app ripiega sui `cells`, cioè i 10.000 esagoni più simili del mondo per quella coppia. Da Bengaluru questo dà due problemi:

- **Entro 1.500 km la lista è vuota per 9 coppie su 18:** tutti i rover e ISRU dei tre siti polari, Phoenix rover e ISRU, Aristarchus ISRU. Nessuno dei 10.000 migliori del mondo cade in quel raggio. La pipeline invece classifica tutti gli esagoni nel raggio, quindi qualcosa esce sempre, anche con voto basso.
- **A 3.000 e 5.000 km escono posti, ma con scheda ridotta:** solo coordinate, voto e km. Mancano nome, paese, parametri, sensori, `breaks`, `dossier` e campagna.

Numeri dai `cells` dell'export delle 11:19, sede Bengaluru (voto del migliore nel raggio):

| Coppia | Migliore sulla Terra | 1.500 km | 3.000 km | 5.000 km |
|---|---|---|---|---|
| Gale × rover | 0,99 | 0,78 | 0,98 | 0,99 |
| Gale × lidar | 0,99 | 0,72 | 0,98 | 0,99 |
| Gale × ISRU | 0,86 | 0,54 | 0,78 | 0,86 |
| Phoenix × ISRU | 0,72 | vuota | 0,72 | 0,72 |
| Aristarchus × ISRU | 0,99 | vuota | 0,87 | 0,97 |
| Haworth × rover | 0,43 | vuota | 0,29 | 0,29 |
| Haworth × ISRU | 0,28 | vuota | 0,28 | 0,28 |

## Controlli prima di pushare

- In `data/export/near/` ci sono 18 file `isro__*.json`.
- Ogni file ha `home.id == "isro"` e `results_by_radius` con le chiavi `"1500"`, `"3000"`, `"5000"`.
- Ogni risultato ha gli stessi campi di oggi: `id`, `name`, `country`, `lat`, `lon`, `score`, `kappa`, `new`, `known_site`, `h3_cells`, `params`, `values`, `target`, `breaks`, `dossier`, `campaign`, `km_home`.
- `campaign.client` è `ISRO Bengaluru` e i `km_client` delle strutture sono calcolati da Bengaluru.
- Nessun `NaN` nel JSON (come dal tuo commit `fba7ef2`).
- Se in una coppia a 1.500 km non c'è davvero nessun esagono valido, va bene una lista vuota per quel raggio: l'app lo dice.

## Cosa succede dal lato app

Niente da cambiare: quando i file sono su `night`, faccio pull e riavvio il server (Vite vede la cartella solo al riavvio). La scheda completa parte da sola.

## Tempi

Submission alle 16:00, submit interno alle 15:30. Se il giro completo costa troppo, in ordine di priorità: prima i tre raggi per **Gale** e **Phoenix** (dove "vicino" funziona e fa la storia del pitch), poi Aristarchus, per ultimi i tre siti polari.

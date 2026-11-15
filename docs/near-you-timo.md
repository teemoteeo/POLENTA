# "Near you": posti vicini alla sede del cliente (Timo → Edo)

Autore: Timo · dom 15/11/2026, 10:55. Branch `night`.

## Perché

Dallo staff: i posti migliori (Utah, Etna…) sono inflazionati, ci testano tutti. Il valore è offrire **un'alternativa vicina alla sede di chi usa il tool**, dicendo quanto si perde in somiglianza. Esempio di bisogno: MENA, missione analoga marziana in Giordania (Wadi Rum).

## Cosa dicono già i dati (dai `cells` dell'export delle 10:30)

| Coppia | Migliore sulla Terra | Entro 1.500 km da Torino | Entro 1.500 km da Amman |
|---|---|---|---|
| Gale × lidar | 0,99 | 0,78 | 0,96 |
| Gale × rover | 0,99 | 0,61 | 0,95 |
| Gale × ISRU | 0,86 | 0,76 | 0,86 |
| Aristarchus × ISRU | 0,99 | 0,84 | 0,97 |
| Haworth × rover | 0,51 | 0,17 | 0,19 |

- Funziona per Marte e Aristarchus. Per i siti polari lunari no (0,12-0,27): va dichiarato.
- Entro 500 km da Torino non c'è quasi nulla (la maschera del suolo nudo scarta l'Europa).
- Wadi Rum **non** è tra i 10.000 esagoni più simili di nessuna coppia: non usarlo come validazione.

## Cosa serve da Edo (contratto dei dati)

L'app oggi ha parametri, `breaks`, `dossier` e `campaign` solo per i primi 20 posti globali. Per i posti vicini ha solo il voto (dai `cells`). Senza il resto la scheda è incompleta.

**File nuovi:** `data/export/near/<home>__<sito>__<test>.json`, uno per sede × sito × test.

```json
{
  "home": {"id": "amman", "name": "Amman", "lat": 31.95, "lon": 35.93},
  "radius_km": 1500,
  "site": "gale", "test": "rover_mobility",
  "best_on_earth": 0.99,
  "results": [ { "…stessa identica forma di results[] dei file in sites/…", "km_home": 412 } ]
}
```

- **Sedi:** `turin` (45.07, 7.69) e, dalle 11:45, **`isro`** (ISRO, U R Rao Satellite Centre, Bengaluru: 12.9592, 77.6611, da `space_agencies_top10.json`) **al posto di `amman`**. Servono i file `isro__<sito>__<test>.json`; quelli `amman__*` non vengono più letti.
- **Raggio:** l'utente sceglie 1.500, 3.000 o 5.000 km in linea d'aria dalla sede (aggiunto alle 11:20). Servono i primi 5 per **ognuno** dei tre raggi: al posto di `results` metti `"results_by_radius": {"1500": [...], "3000": [...], "5000": [...]}`. Se fai un solo raggio, lascia `results` e `radius_km`: l'app usa il file solo per quel raggio e per gli altri ripiega sulla lista ridotta.
- **Risultati:** i primi 5 per voto dentro il raggio, dopo gli stessi filtri di oggi (suolo nudo, campi, città, κ) e senza gli esagoni dei siti noti (`excluded_known_analogues.json`). Zone distinte, come nei file globali.
- **Ogni risultato:** stessi campi di oggi (`params`, `values`, `target`, `breaks`, `dossier`, `campaign`, `h3_cells`, `name`, `country`…) più `km_home`.
- **`campaign` calcolata per quella sede:** `km_client` e la scelta "la più vicina al cliente" riferiti alla sede, non a Torino. `campaign.client` = nome della sede.
- **`best_on_earth`:** il voto del primo posto globale della stessa coppia, per mostrare quanto si perde.
- Se in una coppia non c'è nessun esagono nel raggio: `results: []`.

## Cosa fa l'app intanto

- Selettore della sede e modalità "Near you" nella lista dei posti.
- Se il file `near/` esiste: scheda completa, identica a quella globale, con i km dalla sede.
- Se non esiste ancora: lista calcolata nel browser dai `cells` (voto, km, perdita rispetto al migliore), con la scritta che parametri e campagna arrivano con il prossimo export.

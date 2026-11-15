# Lavoro della notte: branch `night` (Timo)

Autore: Timo, con Claude · dom 15/11/2026, notte.
Tutto sta sul branch **`night`**, in un worktree a parte (`../hackaton-night`). `main` non è stato toccato e niente è stato pushato.

## Come guardarlo

```
cd ../hackaton-night/src/web && npm run dev
```

Percorso della storia del pitch: Luna → Haworth → Rover mobility → primo posto → "Campaign view".

## Come portarlo su `main`

```
git checkout main && git pull && git merge night
```

Tocca solo `src/web/` e questo file. Se non convince, basta non fare il merge.

## Cosa è cambiato nell'app

- **Lingua:** interfaccia in inglese. L'export resta in italiano: l'app traduce per id (`src/web/src/i18n.js`).
- **Lista dei posti:** ordinata per campagna più semplice, non più per somiglianza. Il voto di somiglianza resta visibile.
- **Scheda del posto = piano di campagna:**
  - tre numeri in testa: quota del test coperta sul campo, strutture partner, km da Torino;
  - passo 1 sul campo: barre per dimensione della challenge, finestra utile, permessi;
  - passo 2 al chiuso: strutture partner, dalla più vicina a Torino, con cosa chiude ognuna;
  - passo 3: cosa resta scoperto.
- **Mappa della logistica:** rotte da Torino al posto e alle strutture, con il bottone "Campaign view" che allontana la camera.
- **Frase di verdetto** in cima alla scheda: il piano in una riga ("Run rover mobility for Haworth here: 55% of the test holds in the field… Close the rest at…").
- **Copy brief:** copia il piano di campagna come testo, da incollare in una mail.
- **Mappa di calore:** nella vista della Terra intera, i 10.000 esagoni più simili al sito per quel test (caricati a richiesta, il bundle non cresce).
- **Vista campagna:** tappe a lettere (T = Torino, A, B, C = strutture) con l'elenco accanto.
- **Case studies:** 4 casi di `docs/case_studies.md` (senza nomi di aziende) che aprono da soli sito, test e primo posto, in circa 20 s. Utili per il video da 30 s.
- **Benchmark:** matrice 6 siti × 3 test con la campagna migliore per casella; ogni casella apre la sua campagna.
- **Method & data:** come si calcola il voto, come si costruisce la campagna, dataset NASA, limiti dichiarati, uso dell'AI.
- **Animazioni:** il blocco delle animazioni in `App.jsx` è identico byte per byte a `main` (verificato a ogni giro con `diff`).

## La nostra lettura B2B (interpretazione di stanotte, da confermare)

Il prodotto non è "un posto con un voto": è un piano di campagna per un'azienda di Torino.

- **Il campo dà gratis quello che combacia, il resto si compra al chiuso dalle strutture partner.** Le strutture (ALTEC, LUNA…) sono partner e clienti del tool, mai un costo da evitare.
- **Niente cifre in euro.** Mostriamo solo quello che si misura: quota coperta sul campo, numero di strutture, km.
- **Niente "roccia al posto del simulante".** I simulanti compaiono solo come nome, senza prezzi. Le cave non compaiono.
- **Soglie** (`src/web/src/campaign.js`):
  - un parametro regge sul campo con voto ≥ 0,5;
  - è parziale tra 0,3 e 0,5;
  - si rompe sotto 0,3 (la soglia di Edo).
- **Quota coperta sul campo** = peso dei parametri che reggono, sul peso totale del test.
- **Classifica dei 5 posti** (restano i primi 5 del modello di Edo, solo riordinati):
  1. prima i posti dove si può lavorare davvero: almeno 15% di suolo nudo nell'esagono e più di 3 mesi senza neve;
  2. poi la quota coperta sul campo;
  3. poi i km totali da Torino (posto più strutture);
  4. poi la somiglianza.
- **Sole radente:** se il posto ha almeno 1 h al giorno di Sole a 0-7°, la scheda dice che si copre sul campo scegliendo l'ora, senza struttura.

Effetto sulla storia del pitch: per Haworth × rover il primo posto diventa **61 km da Grantsville, Utah** (55% sul campo, 9 mesi utili, 4 strutture). Con la sola quota sul campo vincevano Groenlandia e Terra di Francesco Giuseppe (76%), con 2 mesi senza neve e il 7% di suolo nudo.

## Punti aperti da portare allo staff

- **Chi apre lo strumento:** l'ingegnere di test o chi firma il budget? Oggi i tre numeri in testa parlano a tutti e due.
- **La soglia 0,5 per "regge sul campo"** è una nostra scelta: va difesa o cambiata.
- **Le soglie di praticabilità** (15% di suolo nudo, 3 mesi senza neve) sono nostre: chiedere se un'azienda le riconosce.
- **Swamp Works in Florida** per la polvere elettrostatica: il backend non propone il Dust Lab di LUNA a Colonia. Errore o voluto? (Edo)
- **Km totali:** sommiamo andata da Torino al posto e a ogni sede indoor. È una misura grezza della logistica, non un itinerario.

## Verifiche fatte

- Blocco animazioni identico a `main` a ogni commit (`diff`).
- Render di tutte le 90 schede (18 coppie × 5 posti), lista, benchmark, metodo e brief: 471 controlli, 0 errori, nessun "undefined" o "NaN".
- Prova dal vivo in Chrome a 1512×900: 4 casi in sequenza, "Start over" a metà, cambio posto, indietro, cambio tema, Copy brief. 0 errori in console.
- Layout controllato a 1512×900, 1280×720 e 1920×1080.
- `night` si unisce a `origin/main` senza conflitti (controllato alle 05:00 circa).

## Cosa non è stato verificato

- Nessuno di noi l'ha ancora guardato a occhio: i controlli sono di script e screenshot.
- Tema chiaro e mobile controllati solo a campione.
- Dopo la ripubblicazione dell'export di Edo vanno riguardati i numeri (classifica, benchmark).

## Nota su `main`

In `App.jsx`, nell'effetto dei puntini, `radiusScale` è finito dentro un commento (`// Marte ha meno punti…`) ed è codice morto. È così anche su `main`. Non l'ho toccato perché cambierebbe l'aspetto dei pianeti.

## Per Edo e Rocco

- Il contratto dei dati non cambia: l'app legge gli stessi file di `data/export/`.
- "18 su 18 primi posti sono nuovi, 0 siti noti": lo dice il benchmark con l'export delle 02:48. Da ricontrollare dopo la ripubblicazione.
- Rocco: se la lettura B2B va bene, riportala in `decisioni.md`.

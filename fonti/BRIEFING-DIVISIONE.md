# BRIEFING — Divisione delle sfide aperte per capacità

**Team FVG Station** · NASA Space Apps 2026 · Torino, 14-15 nov 2026
**Uso:** briefing di domani mattina, prima di andare all'hackathon.
**Nota:** questo è un *matching per capacità*, non un'assegnazione di lavoro. Decidiamo insieme al briefing cosa porta ognuno.

**Scadenza:** dom 15 nov, 16:00 (Roma) — ~38h 30' dal briefing (sab 01:30).

---

## I 3 profili

| Membro | Base forte | Angolo naturale |
|---|---|---|
| **Rocco** | Ingegneria nanotecnologie · chimica · fisica | La *fisica/chimica del materiale* e dei processi: mineralogia, acqua/ghiaccio, polvere/vento, sottosuolo, estremofili |
| **Edo** | Matematica · ML · pipeline dati | Il *motore quantitativo*: metrica di similarità, modello, pipeline, normalizzazione Terra↔Luna↔Marte |
| **Timo** | Web dev · frontend · UI | L'*interfaccia*: la mappa, i filtri a parametri, il "cosa combacia / cosa no", deploy |

---

## Le sfide aperte della challenge → chi le porta

La challenge elenca queste **dimensioni di confronto**. Le raggruppo in 3 cluster, uno per profilo. Nessun cluster è un compito chiuso: è il "terreno" dove il profilo è più forte.

### 🔬 Rocco — cluster MATERIALE & PROCESSI (chimica + fisica)
I punti dove la sua base chimica/fisica fa la differenza. Qui la *scienza* del dato, non il codice.

- **Mineralogia e composizione superficiale** — legare la firma spettroscopica (CRISM/TES su Marte, LROC su Luna) a minerali reali. *La sua area: chimica dei minerali.*
- **Acqua, ghiaccio, permafrost** — stati della materia, fasi, come l'acqua/ghiaccio cambia le proprietà del suolo.
- **Polvere e processi eolici (vento)** — fisica delle particelle, sedimentazione, trasporto di polvere (tempeste marziane).
- **Sottosuolo (grotte, tubi di lava)** — struttura, porosità, isolamento termico: la nano/cristallografia aiuta a ragionare su texture.
- **Biologia & abitabilità (estremofili)** — chimica della sopravvivenza in ambienti estremi.
- **Limiti dell'analogia** — gravità, vuoto, atmosfera sottile, radiazioni: è fisica pura. *Punto chiave per i giudici: dichiarare dove l'analogia non regge.*

> Perché Rocco: i giudici chiedono di "andare oltre la somiglianza visiva" e spiegare *cosa* è analogo e *dove non regge*. È un ragionamento fisico-chimico, il suo.

### 📐 Edo — cluster METRICA & DATI (matematica + ML)
Il cuore computazionale. Qui si decide se il tool "pensa" bene.

- **Metrica di similarità** — come si misura quanto un luogo terrestre è simile al target, per ogni parametro.
- **Normalizzazione tra corpi** — unire misure non comparabili (K vs °C, gravità, pressione, vuoto) in un punteggio comune.
- **Pipeline dati** — estrarre, ri-campionare, allineare Terra/Luna/Marte su griglie coerenti (GIS/STAC).
- **Modello** — ML o scoring pesato: quali parametri pesano di più, come combinarsi (il "restringe i risultati" della UI).
- **Scalabilità** — far girare il calcolo su un cratere/una valle, non su un deserto intero (la challenge lo chiede esplicitamente).

> Perché Edo: è l'unico che può trasformare i dataset grezzi in un punteggio di similarità affidabile e difendibile davanti ai giudici.

### 🗺️ Timo — cluster INTERFACCIA & TOOL (web + UI)
Il modo in cui l'idea diventa un prodotto dimostrabile.

- **La mappa** — base interattiva con i risultati geolocalizzati.
- **Selettore del target** — l'utente sceglie Luna / sito specifico / Marte.
- **Filtri a parametri** — toggle per quota, pendenza, temperatura, ghiaccio, mineralogia... ogni uno *restringe* i risultati.
- **Il "cosa combacia / cosa non combacia"** — per ogni luogo, il giudizio parametro per parametro (l'output che convince i giudici).
- **Immagini per l'occhio** — affiancare LROC / HiRISE / Worldview ai dati.
- **Deploy** — hosting (Google Cloud / GoDaddy), URL della demo pronto per la submission.

> Perché Timo: il premio vuole un *tool/map/visualizzazione*. Il frontend è la faccia di tutto il lavoro scientifico.

---

## Come si incardinano (schema)

```
        Rocco (scienza)          Edo (motore)              Timo (faccia)
  minerali, acqua,        metrica + normalizzazione   mappa + filtri
  polvere, sottosuolo,  pipeline, ML, scoring  +   target + giudizio
  estremofili, limiti  --> Terra/Luna/Marte -->  + immagini + deploy
        --------------------------------- "cosa e analogo e dove non regge" ----------------
```

**Regola d'oro della challenge:** il premio va all'analogo **inatteso** ("Surprise us"), non a Atacama/Antartide/Islanda/Hawaii.
**Aggancio FVG (da verificare coi dati, non dare per buono):** Carso (grotte), Tagliamento, ghiaioni delle Dolomiti friulane.

---

## MVP per le ~38h (ordine d'attacco)

1. **Edo** — 2-3 parametri che *funzionano* (es. quota/pendenza + temperatura + vegetazione), normalizzati Terra↔target.
2. **Rocco** — la *storia* di uno di quei luoghi: perché è analogo, dove non lo è.
3. **Timo** — la mappa con quei 2-3 filtri + giudizio per luogo.
4. **Tutti** — 1 luogo "surprise" pulito e dimostrabile > 10 parametri grezzi.

*Poi si allarga: più parametri, più target, più luoghi.*

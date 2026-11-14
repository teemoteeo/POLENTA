# BRIEFING — Divisione delle sfide aperte per capacità

**Team FVG Station** · NASA Space Apps 2026 · Torino, 14-15 nov 2026
**Uso:** briefing di domani mattina, prima di andare all'hackathon.
**Nota:** questo è un *matching per capacità*, non un'assegnazione di lavoro. Decidiamo insieme al briefing cosa porta ognuno.

**Orari ufficiali (pagina evento Torino):** inizio hackathon sab 16:00 · submission entro dom 16:00 · pitch dom 16:15 · 24 h di hacking. Piano operativo, ruoli e timeline ora per ora: `analog-atlas-plan.md`.

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
- **Config e contenuti** — catalogo analoghi (partendo dal layer USGS), profilo Jezero, pesi, classi minerali, testi "breaks down"; report, le 7 slide e il pitch. Se scelti: profili per epoca (T3), Oxia Planum (T5), base sotterranea (T6), preset per tecnologia (T10), lettura scientifica di T4.

> Perché Rocco: i giudici chiedono di "andare oltre la somiglianza visiva" e spiegare *cosa* è analogo e *dove non regge*. È un ragionamento fisico-chimico, il suo.

### 📐 Edo — cluster METRICA & DATI (matematica + ML)
Il cuore computazionale. Qui si decide se il tool "pensa" bene.

- **Metrica di similarità** — come si misura quanto un luogo terrestre è simile al target, per ogni parametro.
- **Normalizzazione tra corpi** — unire misure non comparabili (K vs °C, gravità, pressione, vuoto) in un punteggio comune.
- **Pipeline dati** — scaricare, estrarre, ri-campionare, allineare Terra/Luna/Marte su griglie coerenti (GIS/STAC); export per la mappa in `data/export/`.
- **Modello** — ML o scoring pesato: quali parametri pesano di più, come combinarsi (il "restringe i risultati" della UI).
- **Scalabilità** — far girare il calcolo su un cratere/una valle, non su un deserto intero (la challenge lo chiede esplicitamente).
- **Matematica del twist** — se scelti: kit di siti (T1), fronte di Pareto (T2), confronto tra due periodi (T4), ricerca globale (T7).

> Perché Edo: è l'unico che può trasformare i dataset grezzi in un punteggio di similarità affidabile e difendibile davanti ai giudici.

### 🗺️ Timo — cluster INTERFACCIA & TOOL (web + UI)
Il modo in cui l'idea diventa un prodotto dimostrabile.

- **La mappa** — base interattiva con i risultati geolocalizzati.
- **Selettore del target** — l'utente sceglie Luna / sito specifico / Marte.
- **Filtri a parametri** — toggle per quota, pendenza, temperatura, ghiaccio, mineralogia... ogni uno *restringe* i risultati.
- **Il "cosa combacia / cosa non combacia"** — per ogni luogo, il giudizio parametro per parametro (l'output che convince i giudici).
- **Immagini per l'occhio** — affiancare LROC / HiRISE / Worldview ai dati.
- **Deploy** — hosting (Google Cloud / GoDaddy), URL della demo pronto per la submission.
- **Navicella e UI del twist** — intro retro e discesa sul luogo; se scelti: itinerario del kit (T1), slider delle epoche (T3), "casa tua" (T8), Lunar Lander (T9), mission planner (T10).
- **Demo e submission** — video ≤30 s, pagina del progetto, link testati in finestra privata.

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
**Aggancio FVG (da verificare coi dati, non dare per buono):** Carso (grotte), Tagliamento, ghiaioni delle Dolomiti friulane. Con il twist T1 l'FVG può fare da base del kit.
**Twist candidati (si sceglie sab entro le 17:00, combinabili):** T1 Analog Kit · T2 Analoghi raggiungibili · T3 Marte nel tempo · T4 Terra che cambia · T5 Allenarsi da Torino (Oxia Planum) · T6 Base lunare sotterranea · T7 Gemello di ogni punto · T8 Quanto è marziano casa tua? · T9 Modalità Lunar Lander · T10 Mission planner. Dettagli nel piano §1b.

---

## MVP per le 24h (ordine d'attacco)

1. **Edo** — 2-3 parametri che *funzionano* (es. quota/pendenza + temperatura + vegetazione), normalizzati Terra↔target.
2. **Rocco** — la *storia* di uno di quei luoghi: perché è analogo, dove non lo è.
3. **Timo** — la mappa con quei 2-3 filtri + giudizio per luogo.
4. **Tutti** — 1 luogo "surprise" pulito e dimostrabile > 10 parametri grezzi.
5. **Tutti** — target MVP Jezero (Marte), Luna come extra; twist scelto entro sab 17:00.

*Poi si allarga: più parametri, più target, più luoghi.*

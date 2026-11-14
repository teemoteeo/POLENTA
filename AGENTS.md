# AGENTS.md — NASA Space Apps 2026 · Team FVG Station

## 0. Prima di tutto: chi è l'utente?

Questa repo è condivisa da Timo, Edo e Rocco. **Prima di modificare qualsiasi file**, identifica l'utente:

1. Esegui `git config user.name` e confronta con la tabella sotto (match parziale, maiuscole ignorate).
2. Nessun match o dubbio → **chiedi all'utente chi è** prima di scrivere. Fino alla risposta lavori in sola lettura.
3. Dichiara all'inizio della sessione: "Lavoro come <nome>, posso scrivere in: <cartelle>".

| Membro | `git config user.name` contiene | Ruolo |
|---|---|---|
| Timo | `Timoteo`, `teemoteeo` | web dev, frontend, UI della mappa, deploy |
| Edo | `Edo` | matematica, ML, pipeline dati |
| Rocco | `Rocco` | chimica e fisica, ricerca scientifica |

Se un compagno usa un nome git diverso, aggiunge il suo alias in questa tabella.

## 1. Struttura della repo

```
AGENTS.md        regole per gli agent (questo file)
CLAUDE.md        rimanda qui, per Claude Code
analog-atlas-plan.md  piano operativo: concept, twist, metodo, ruoli, timeline (riferimento unico)
data/            dataset: grezzi, processati, export per la mappa
src/web/         frontend: mappa, UI, navicella, deploy
src/pipeline/    pipeline dati, metrica di similarità, ML
clipboard/       appunti, markdown, file sparsi, ricerca
  findings.md    report vivo del team
  references.md  reference visive
  fonti/         testo della challenge, risorse, briefing
```

## 2. Scope: chi può toccare cosa

| Cartella | Timo | Edo | Rocco |
|---|---|---|---|
| `src/web/` | ✏️ scrive | 👁️ legge | 👁️ legge |
| `src/pipeline/` | 👁️ legge | ✏️ scrive | 👁️ legge |
| `data/` | 👁️ legge | ✏️ scrive | ✏️ scrive |
| `clipboard/` | ✏️ scrive | ✏️ scrive | ✏️ scrive |
| file in root (`AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`) | ✏️ scrive | 👁️ legge | 👁️ legge |

Regole:
- **Fuori dal proprio scope non si scrive, anche se l'utente lo chiede di passaggio.** Avvisa che la cartella è di un altro membro e proponi l'alternativa: una nota in `clipboard/` per il proprietario, oppure chiedi conferma esplicita ("sì, tocca src/web anche se non è mio").
- Leggere tutto è sempre permesso.
- Il **contratto tra pipeline e mappa** è il formato dei file in `data/` che il frontend consuma. Chi lo cambia lo scrive in `clipboard/findings.md`.
- In `clipboard/` ognuno modifica i propri file. Nei file comuni (`findings.md`) si **aggiunge**, non si riscrive il lavoro degli altri.
- `2005-Citadel/` è fuori dalla repo (in `.gitignore`): non toccarla.

## 3. Git: regole per lavorare in tre

- `git pull` prima di iniziare e prima di ogni commit.
- Commit piccoli, solo dei file nel proprio scope. Mai `git add -A` alla cieca: controlla `git status`.
- Mai `git push --force`, mai riscrivere la storia di `main`.
- Conflitto su un file di un altro membro → non risolverlo da solo, chiedi.
- Niente segreti nei commit: chiavi API (Cesium ion, Google, Earthdata) vanno in `.env`, che è ignorato.

## Contesto

- **Evento:** NASA Space Apps Challenge 2026, evento locale di Torino (incubatore del Politecnico), 14-15 novembre 2026.
- **Pagina evento:** https://www.spaceappschallenge.org/2026/local-events/turin/
- **Orari ufficiali (pagina evento):** inizio hackathon sab 16:00 · deadline submission dom 16:00 · pitch dom 16:15 · premiazione 17:30. Timeline del team ora per ora: `analog-atlas-plan.md` §9.
- **Submission (Project Submission Guide):** demo = 7 slide (titolo incluso) **oppure** video ≤30 s, oltre si è esclusi dal giudizio globale; link pubblici senza login; almeno un dato NASA; uso dell'AI dichiarato nel form.
- **Team:** FVG Station
  - Timo: web dev, frontend e UI della mappa
  - Edo: matematica, ML, pipeline dati
  - Rocco: ingegnere delle nanotecnologie, ricerca; sfrutta le basi di chimica e fisica
- **Challenge scelta:** *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*
  https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/
- **Testo completo:** `clipboard/fonti/challenge.txt`. **Risorse ufficiali:** `clipboard/fonti/resources.txt`

## Cosa chiede la challenge (in breve)

Usare dati aperti su Terra, Luna e Marte per trovare e caratterizzare posti sulla Terra analoghi a future basi lunari o a siti di atterraggio su Marte. Il risultato va presentato come mappa, visualizzazione o tool.

Cosa conta per i giudici, dal testo:
- **Non** riscoprire gli analoghi noti (Atacama, Antartide, Islanda, Hawaii). Il premio va all'analogo inatteso ("Surprise us").
- Andare oltre la somiglianza visiva: spiegare coi dati **cosa** è analogo e **dove l'analogia non regge**.
- Le dimensioni di confronto: geologia e mineralogia, topografia (quota, pendenza, rugosità, crateri), temperatura e illuminazione, acqua, ghiaccio e permafrost, polvere e vento, biologia ed estremofili, sottosuolo (grotte, tubi di lava), operatività (atterraggio, mobilità, costruzione).
- La scala conta: un singolo cratere o una singola valle vale più di un deserto intero.
- Dichiarare i limiti della Terra come analogo: gravità, vuoto lunare, atmosfera marziana sottile, radiazioni.
- Vanno bene metriche di similarità, ML e GIS.

## La nostra idea

**Analog Atlas**: una mappa della Terra con una UI particolare. Piano completo in `analog-atlas-plan.md`: se un altro documento non torna, vale il piano. L'utente sceglie un target (MVP: Jezero su Marte; Luna come extra) e attiva dei **parametri** (temperatura, pendenza, quota, ghiaccio, mineralogia…). Per ogni parametro si calcola la similarità dei luoghi terrestri col target, da 0 a 1. Il totale è una media geometrica pesata: un parametro molto lontano affossa il luogo, quindi ogni parametro in più **restringe** i risultati. Nella UI ogni parametro si attiva o disattiva e può avere una soglia minima. Per ogni risultato si mostra cosa combacia e cosa no.

Aggancio narrativo possibile: analoghi poco studiati in Italia o in FVG (il Carso con le sue grotte, il Tagliamento, i ghiaioni delle Dolomiti friulane). Va verificato coi dati, non dato per buono. Con il twist T1 l'FVG può diventare la "base" del kit.

### Twist (non ancora deciso)

Si sceglie sabato **entro le 17:00**, dopo le info in presenza; si possono combinare. Dettagli, costi e criteri dei giudici nel piano §1b. Regola Space Apps: l'idea deve essere del team e l'uso dell'AI va dichiarato.

| # | Twist | In una riga |
|---|---|---|
| T1 | Analog Kit | Nessun posto è Marte, ma 3 posti insieme sì: il set minimo di siti che copre tutte le dimensioni, entro un raggio da una base; la navicella vola l'itinerario |
| T2 | Analoghi raggiungibili | Fronte di Pareto tra punteggio di analogia e costo di accesso (strade, popolazione, luci notturne) |
| T3 | Marte nel tempo | Profili per epoca (lago antico → Marte secco di oggi), slider che trasforma la mappa |
| T4 | Terra che cambia | Stesso punteggio su due periodi: il clima crea nuovi analoghi e cancella quelli usati |
| T5 | Allenarsi da Torino | Target Oxia Planum: il rover ExoMars sarà gestito da ALTEC a Torino |
| T6 | Base lunare sotterranea | Pozzi e tubi di lava lunari come sito di base; grotte e tubi di lava terrestri come analoghi |
| T7 | Gemello di ogni punto | Clicchi un punto di Marte e trovi il gemello sulla Terra (versione light: 5–10 siti preimpostati) |
| T8 | Quanto è marziano casa tua? | Pin o geolocalizzazione → Analog Card condivisibile |
| T9 | Modalità Lunar Lander | Gioco arcade: atterri sul miglior analogo, il punteggio è l'analogia |
| T10 | Mission planner | Scegli la tecnologia da testare (trivella, ruote, polvere, ghiaccio, habitat) → dove testarla |

## Dati: cosa ci danno

Legenda: ✅ = nelle risorse ufficiali della challenge · ➕ = non elencato, suggerito da noi (accesso da verificare)

```mermaid
flowchart LR
  subgraph TERRA["🌍 Terra"]
    EDS["✅ NASA Earthdata Search"]
    WV["✅ NASA Worldview"]
    COP["✅ ESA Copernicus (Sentinel)"]
    OSC["✅ ESA Open Science Catalog"]
    JAXA["✅ JAXA G-Portal"]
    SAR["✅ CSA RADARSAT-1 / RCM (SAR)"]
    MPC["➕ Microsoft Planetary Computer"]
    MET["➕ Meteomatics API"]
  end
  subgraph LUNA["🌕 Luna"]
    LRO["✅ LRO: LOLA, LROC, Mini-RF, LEND"]
    DIV["✅ LRO Diviner (temperature, poli)"]
  end
  subgraph MARTE["🔴 Marte"]
    PDS["✅ NASA PDS (archivio)"]
    MOLA["➕ MOLA topografia"]
    THM["➕ THEMIS inerzia termica"]
    CRISM["➕ CRISM / TES mineralogia"]
  end
  TERRA --> SIM(("Similarità per parametro"))
  LUNA --> SIM
  MARTE --> SIM
  SIM --> MAP["🗺️ Mappa: filtri a parametri"]
```

### Parametro → sorgente per ogni corpo

| Parametro | Terra | Luna | Marte |
|---|---|---|---|
| Quota, pendenza, rugosità | SRTM / NASADEM (Earthdata) ➕ Copernicus DEM (Planetary Computer) | ✅ LOLA (LRO) | ➕ MOLA (PDS) |
| Temperatura ed escursione termica | ✅ MODIS LST (Earthdata) ➕ Meteomatics | ✅ Diviner | ➕ THEMIS / TES (PDS) |
| Illuminazione e ombra permanente | calcolabile da DEM + latitudine | ✅ LOLA / Diviner (prodotti polari) | ➕ da MOLA |
| Ghiaccio, permafrost, acqua | ✅ Sentinel / RADARSAT, ✅ JAXA (neve) | ✅ LEND, Mini-RF, Diviner | ➕ PDS (dati di neutroni e radar) |
| Mineralogia e materiali di superficie | ✅ Sentinel-2 / Landsat (Earthdata), ASTER | ✅ LROC + PDS | ➕ CRISM / TES |
| Vegetazione (assente = più analogo) | ✅ MODIS NDVI, ➕ ESA WorldCover | n/a (zero) | n/a (zero) |
| Rugosità radar e struttura di superficie | ✅ RADARSAT SAR, Sentinel-1 | ✅ Mini-RF | ➕ PDS (SHARAD) |
| Polvere e vento | ✅ Earthdata (aerosol), ➕ Meteomatics | n/a | ➕ PDS (atmosfera) |
| Immagini per l'occhio | ✅ Worldview | ✅ LROC | ➕ HiRISE / CTX (PDS) |

Nota: per Marte la challenge elenca solo il PDS, senza dataset specifici. I global map di MOLA, THEMIS e CRISM vanno presi lì da noi.

## Fonti dati (link)

**Terra**
- NASA Earthdata Search: https://search.earthdata.nasa.gov (serve un account Earthdata Login, gratuito)
- NASA Worldview: https://worldview.earthdata.nasa.gov
- ESA Copernicus Data Space: https://dataspace.copernicus.eu
- ESA Open Science Catalog: https://opensciencedata.esa.int
- JAXA G-Portal: https://gportal.jaxa.jp/gpr/
- CSA RADARSAT Constellation (RCM): https://donnees-data.asc-csa.gc.ca/en/dataset/rcm
- CSA RADARSAT-1: https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1
- Tutorial SAR in Python + QGIS: https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial

**Luna e Marte**
- NASA PDS: https://pds.nasa.gov
- LRO (PDS Geosciences): https://pds-geosciences.wustl.edu/missions/lro/
- LRO Diviner: https://pds-geosciences.wustl.edu/missions/lro/diviner.htm

## Strumenti gratuiti (Global Offers)

Si riscattano da https://www.spaceappschallenge.org/2026/global-offers/ (serve il login Space Apps). I limiti esatti (crediti, durata, carta di credito) non sono ancora verificati.

| Provider | Cosa offre | Utile per noi |
|---|---|---|
| Microsoft | Azure, **Planetary Computer**, GitHub Copilot, Teams | Planetary Computer: dati della Terra pronti via STAC API, senza download manuali |
| Google Cloud | GCP, Firebase, Maps API | hosting, base della mappa |
| Meteomatics | API meteo, clima, ambiente | temperature estreme e vento sulla Terra |
| GoDaddy | dominio gratis + 1 anno di hosting | URL della demo |
| Miro | piano Education e Business, template ufficiali | brainstorming e pitch |

Avviso dalla mail NASA: alcune offerte chiedono la carta di credito per la verifica, ma sono gratuite e non obbligano ad acquistare nulla.

## Link utili dell'hackathon

- Project Submission Guide: https://www.spaceappschallenge.org/resources/project-submission-guide/
- Judging & Awards Guide: https://www.spaceappschallenge.org/resources/judging-awards-guide/
- Participant FAQs: https://www.spaceappschallenge.org/resources/participant-faqs/
- Space Apps Connect (forum, domande agli esperti): https://www.spaceappschallenge.org/resources/space-app-connect-guide/
- Repo NASA Space Apps: https://github.com/nasa/spaceapps

## Regole per l'agente

- **`clipboard/findings.md` è il report vivo del team.** A ogni scoperta, decisione o rischio nuovo, aggiorna la sezione pertinente e aggiungi una riga datata in cima a "Log aggiornamenti". Non riscriverlo da zero.
- Le scadenze di submission si verificano sulla Project Submission Guide, non si deducono.
- Ogni dataset ➕ va verificato (accesso, formato, risoluzione) prima di costruirci sopra.
- Prima un MVP con 2 o 3 parametri che funzionano (es. quota/pendenza + temperatura + vegetazione), poi si aggiunge il resto.
- **ORARIO / SCADENZA (check ricorrente):** la submission chiude **domenica 15 novembre 2026, 16:00 (ora di Roma)**, pitch alle 16:15. Verificato sul programma della pagina evento di Torino; la pagina indica il fuso "Greenwich", da confermare all'intro delle 15:00. La deadline globale della Submission Guide (dom 23:59, ora locale) per noi non conta: vale quella locale.
  - A inizio di quasi ogni sessione — e a ogni cambio di focus, *non* a ogni singolo messaggio — l'agente controlla l'ora corrente e dichiara quante ore/minuti mancano alla deadline.
  - Sotto le **~6 ore** restanti lo segnala in modo prominente e mette la submission prima di tutto il resto.

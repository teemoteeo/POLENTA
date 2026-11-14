# Requirements — NASA Space Apps Torino 2026

Autore: Timo · 2026-11-14. Raccoglie tutto ciò che è dato come requisito, con la fonte di ogni punto.

Fonti:
- **[C]** testo ufficiale della challenge (`docs/fonti/challenge.txt`)
- **[W]** welcome di I3P registrato il 14/11 (trascrizione automatica: nomi propri storpiati, due tratti persi)
- **[S]** slide proiettate al welcome (foto del 14/11)
- **[G]** Project Submission Guide, già riportata in `AGENTS.md`

---

## 1. Regole del gioco

- Il progetto deve rispondere a una delle challenge ufficiali. "It is not acceptable other activities or ideas which are not included in these challenges." [W]
- La competizione locale si fa qui, con una giuria locale. Per entrare nella fase internazionale bisogna caricare il progetto su spaceappschallenge.org ("create your project", poi submit), che si vinca o no il locale. [W]
- L'idea deve essere del team e l'uso dell'AI va dichiarato nel form. [G]
- Serve almeno un dato NASA. [G] Il criterio Relevance chiede di più: i dati NASA devono essere "a core component of the proposed solution". [S]

## 2. Scadenze e formato

- **Deadline locale: domenica 15/11 alle 16:00, pitch alle 16:15, premiazione alle 17:30** (programma della pagina evento, già verificato; gate in `decisioni.md`). Al welcome hanno detto "present your idea at 4 o'clock". [W]
- ⚠️ Al welcome hanno detto anche che la submission internazionale chiude "tomorrow at 11.59pm". [W] Il team ha fissato la deadline alle 16:00 perché il pitch locale viene prima. Restiamo sulle 16:00, interne alle 15:30.
- **Pitch: 4 minuti, cronometrati.** "They're gonna be super strict. They're gonna cut you." [W]
- Demo per la submission: 7 slide (titolo incluso) **oppure** un video di massimo 30 secondi. Oltre, si è esclusi dal giudizio globale. [G]
- I link devono essere pubblici e accessibili senza login. [G]

## 3. Criteri di giudizio (uguali per giudici locali, globali ed executive) [S]

Testo dalla slide "What does NASA say about judging criteria". Le parti tagliate a destra della foto sono indicate con […].

- **Impact:** "the project makes an impact by addressing either a minor or major problem, which influences the quality and quan[…] overall effect. The extent to which it inspires or helps others varies, ranging from a broad audience to a select few."
- **Creativity:** "the project demonstrates originality and innovation. It introduces a novel concept that has not been attempted b[…] presents an improvement upon existing ideas in a meaningful way. The project showcases a fresh perspective or inventive[…]"
- **Validity:** "the project presents a proposed solution that is grounded in scientific principles and demonstrates technical, funct[ional or] logical feasibility. It is designed to effectively achieve its intended purpose and has the potential to function in real-world ap[plications]." Al welcome hanno aggiunto: se non è fattibile, "they cannot accept". [W]
- **Relevance:** "the project fully and directly addresses the challenge for which it was submitted, demonstrating a strong alignm[ent with its] intended objectives. It meaningfully integrates NASA data, utilizing it as a core component of the proposed solution."
- **Presentation:** "the team effectively communicated their project, clearly conveying the challenge, their proposed solution, an[d its] significance. The storytelling was engaging and well-structured, ensuring the audience understood the project's purpose a[nd …]." Al welcome: "You may create the most innovative idea, but the presentation is the key point." [W]

Nota: secondo la slide, l'Impact vale anche per "a select few". Un pubblico di nicchia (B2B) non è penalizzato.

## 4. Cosa chiede la challenge [C]

Titolo: *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*.

**Obbligatorio (Objectives):**
- Usare dati aperti NASA sulla Terra, insieme a dati di Luna e Marte di altre agenzie o fonti aperte.
- Identificare e caratterizzare uno o più luoghi sulla Terra analoghi a **candidate permanent Moon-base locations** o a **future Mars landing and exploration sites**.
- Spiegare quali caratteristiche reggono l'analogia, **dove l'analogia si rompe** e come l'analogo aiuta a preparare l'esplorazione.
- Presentare i risultati come mappa, visualizzazione o altro tool: report, mappa interattiva, app, storia, ranking di similarità, ML.

**Consigliato (Potential considerations, "you may, but are not required to"):**
- Andare oltre la somiglianza visiva e spiegare l'analogia coi dati.
- Considerare più dimensioni: geologia e mineralogia; terreno, quota, pendenza, rugosità e crateri; temperatura, illuminazione ed estremi; acqua, ghiaccio, permafrost e risorse; polvere, vento ed erosione; biologia, estremofili e biofirme; grotte, tubi di lava e sottosuolo; condizioni per atterraggio, mobilità, navigazione, operazioni robotiche e umane, costruzione.
- Un analogo non deve combaciare in tutto: dire cosa è simile, quanto è simile e cosa è diverso.
- Pensare ai processi oltre che ai luoghi: sedimentazione, tempeste di polvere, vulcanismo, erosione, ghiaccio, alterazione da acqua.
- Evitare gli analoghi già noti (Antartide, Atacama, Islanda, Hawaii) e usare i dataset globali per trovarne di poco studiati.
- Esplorare tutta la Terra, anche il sottosuolo: miniere, saline, ghiacciai, grotte.
- Combinare più dataset.
- Considerare la scala: un cratere o una valle sono meglio di un deserto intero.
- Collegare l'analogo all'esplorazione: test di strumenti, preparazione delle operazioni, ricerca di risorse, riduzione del rischio.
- Dichiarare i limiti della Terra: gravità ridotta, vuoto lunare, atmosfera marziana sottile, radiazioni.
- "Surprise us": un luogo inatteso, una connessione inattesa o un modo nuovo di usare i dati della Terra.
- Facoltativo: documentare per scritto i risultati "to educate the public".

## 5. Come vogliono il pitch [S][W]

Workshop di Women in Aerospace Torino (relatrici di Thales Alenia Space e Argotec, che domani sono anche in giuria).

- **Le 3C:**
  - **Clarity:** linguaggio semplice, niente gergo. Se serve una sigla, scriverla per esteso.
  - **Conciseness:** "Use few words. Keep concepts clear. Schemes & images and demos are your best friends." Regola d'oro: "if a 5-year-old can't understand it, you've got a problem."
  - **Confidence:** fare pratica con punti chiave, non con un copione. Provarlo tra di noi prima.
- **Struttura ("Make it clear"):** The Problem · Your solution · Market Size · Business Model · Competition · Marketing and Team · Call to action.
- **"Make it your way":** "Express who you are. Keep it professional, but make it yours. You're selling your idea. Make it shine!" "Through this pitch, the jury will understand *why you*."
- **Slide:** niente muri di testo, niente codice. Va bene uno screenshot dell'app o della UI. Si parla sopra le slide, non si leggono. Prima la panoramica, poi il dettaglio.
- Chiudere con una frase che resti in testa.
- "A good presentation requires time and focus. Don't start too late!"

## 6. Giuria, premi, sponsor [W]

Nomi trascritti male in parte, da verificare.

- **Premi locali:** 1° 1.000 € (ORIS, startup di I3P), 2° "715 €" come trascritto (forse 750 €; sponsor non chiaro), 3° 500 € (ESA).
- **Premi speciali:** Thales Alenia Space, Argotec e Center for Near Space, spiegati domani.
- **In giuria o tra i mentor:** il program manager dell'ESA BIC di I3P, presentato come "il giurato più severo"; Women in Aerospace (Thales Alenia); Argotec; ORIS; startup del programma ESA BIC.

## 7. Logistica [W]

- Gate del Politecnico: chiude alle 22:00 di sabato, e a volte prima.
- Chi resta di notte deve chiamare il numero di supporto: dalle 21:00 alle 9:00 risponde la guardia.
- Domenica si entra solo dall'ingresso pedonale, aperto dalle 9:00.
- Al piano terra si rientra solo col badge: non uscire senza qualcuno che possa aprire.
- Domenica colazione alle 9:00 e pranzo alle 13:00.

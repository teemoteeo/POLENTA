# Requisiti dei test lunari — cosa cerca ogni test e come si sceglie il sito

Autore: Timo · 2026-11-14 19:00. Ricerca web su campagne passate e specifiche. Prodotto in `decisioni.md`, dimensioni in `requirements-tecnici.md`, dataset in `data/datasets_links.md` (vale quello). Variabili di Rocco: `human_docs/variabili_luna_marte_terra.csv`.

Legenda: **(V)** = numero verificato su una fonte in questa ricerca. **[NV]** = da verificare prima di usarlo nella demo. Senza segno = valore standard di letteratura (Lunar Sourcebook, Heiken et al. 1991).

## TL;DR

- **20° è il requisito di fatto** per la mobilità e l'EVA: NASA per LTV e tuta, TAS-I per il rover ETNA. Lo citano 7 campagne su 16.
- **I 9 siti Artemis III sono negli altopiani anortositici.** I simulanti di riferimento sono GRC-1 e LHS-1. Esiste già un precedente di "roccia sorgente naturale": ISRO ha macinato 50-70 t di **anortosite del Tamil Nadu** per Chandrayaan, perché importare il simulante dagli USA costava troppo. LUNA ha fatto lo stesso con basalto di cava locale.
- **Il template migliore di criteri espliciti è la relazione TAS-I al Parco dell'Etna**: pendenze ~20°, depositi eolici, rocce, crateri, niente vegetazione, area, sito di riserva, permessi, logistica. Il nostro profilo di mobilità parte da lì.
- **La lezione di Yutu:** il sito di test era più liscio del sito vero e il rover si è danneggiato sui sassi. Un sito più facile del target falsa la validazione: è il nostro argomento.
- **Cosa va per forza indoor:** gravità 1/6, vuoto, temperature delle PSR (< 110 K), polvere elettrostatica, ombre ferme con cielo nero. È la colonna "copertura" del prodotto.

## 1. Come si sceglie un sito oggi (criteri ricorrenti)

Il numero è quante campagne del catalogo (§6) dichiarano quel criterio.

| Tipo di test | Criteri più citati |
|---|---|
| **Mobilità** (~16 campagne) | pendenze ~20° o più (7) · suolo fine e sciolto con meccanica nota (7) · rocce, crateri, ostacoli (7) · area ampia o traversate lunghe (5) · niente vegetazione (2) · luce radente (2) · litologia (2) · logistica e permessi (2) |
| **Atterraggio / GNC** (4) | topografia che replica il sito target, con crateri e rocce per la hazard detection (3) · luce polare (1) · simulante per il touchdown (1) |
| **Trivella** (4) | profondità del simulante 1,7-3 m (2) · ghiaccio o proxy (2) · strati controllati (1) |
| **Scavo / ISRU** (6) | simulante in grandi quantità e a basso costo (4) · composizione e mineralogia (3) · densità controllata (1) |
| **EVA** (7) | luce radente (4) · diversità geologica entro 2 km (4) · logistica e alloggi (2) · copertura delle comunicazioni (2) · niente vegetazione (2) |
| **Navigazione / visione** (8) | luce radente o buio (6) · ground truth da drone, DEM o GPS (3) · texture sufficiente (2): le dune lisce rompono la visione |

**Trade-off indoor/outdoor:** indoor si controllano simulante, luce e pendenza. Outdoor si hanno scala, rocce vere e traversate lunghe, ma anche permessi e logistica.

## 2. Requisiti per tipo di test

### 2.1 Mobilità del rover (MVP)

| Parametro | Luna, Polo Sud | Range richiesto | Proxy terrestre | Riproducibile |
|---|---|---|---|---|
| Pendenza | massicci e bordi spesso > 15-20° | 0-15° nominale (VIPER, limite di progetto 15° (V)); prove fino a 25-30° (SLOPE (V)); **20° requisito TAS-I/NASA (V)** | pendenza da DEM **alla stessa baseline di LOLA** | sì |
| Rocce / gradini | rocce ≥ 0,2-0,3 m sono un pericolo | gradini da 20 cm (VIPER (V)); rocce 0,1-0,5 m | rugosità; backscatter Sentinel-1; inerzia termica; SoilGrids `cfvo` | parziale: i DEM globali non vedono rocce da 0,3 m |
| Crateri piccoli | saturazione di crateri metrici | densità e diametro 1-50 m | depressioni chiuse nel DEM, circolarità | parziale: sulla Terra sono rari ed erosi |
| Densità apparente | 1,30 g/cm³ in superficie, 1,92 sotto 1 m (V) | 1,5-1,9 | SoilGrids `bdod` | parziale |
| Coesione | 0,1-1 kPa in superficie (V) | 0,1-1 kPa | aridità e umidità (l'umidità dà coesione apparente) | parziale |
| Angolo d'attrito | 30-50° (V) | 30-50° | tessitura (l'angolarità non si vede da satellite) | parziale |
| Granulometria | D50 ~60-80 µm [NV] | come GRC-1 / LHS-1 | inerzia termica e albedo MODIS (scelta di Edo) | parziale: le sabbie terrestri hanno D50 200-500 µm e grani arrotondati; la tefra vulcanica è la più vicina |
| Vegetazione | 0 | NDVI < 0,1 | NDVI MODIS | sì (filtro) |
| Luce radente | sole ≤ 1,5-7° | vedi §2.3 | calcolo solare | parziale |
| Gravità 1/6 g | 1,62 m/s² | — | — | **no** → rover a massa ridotta, SLOPE, offload di LUNA |

**Validazione:** Piano delle Concazze e Cratere Cisternazza (Etna, siti ULS) devono uscire in alto.

### 2.2 ISRU / materiale (MVP)

| Parametro | Luna, Polo Sud | Range richiesto | Proxy terrestre | Riproducibile |
|---|---|---|---|---|
| Litologia | altopiani anortositici, plagioclasio dominante; FeO ~4-6 wt%, TiO₂ < 1 wt% [NV] | composizione per estrarre O₂ e sinterizzare | layer scritto a mano (`materials.csv`); ASTER/EMIT facoltativi | parziale: l'anortosite affiora poco (Rogaland, Stillwater, Lac-Saint-Jean, Adirondacks, Groenlandia, Tamil Nadu). I basalti come l'EAC-1 hanno troppo FeO |
| Quantità disponibile | — | da decine a centinaia di tonnellate | cave attive, affioramenti | sì |
| Granulometria e forma | angolare, agglutinati ~25-30% [NV] | simulante con figura di merito adeguata | macinazione della roccia sorgente | parziale/no: agglutinati e ferro in nanofase non si riproducono |
| Spessore scavabile | regolite degli altopiani ~10-15 m [NV] | ≥ 0,5-1 m senza roccia | profondità della roccia (SoilGrids/BDTICM [NV]) | parziale |
| Profilo di densità | 1,3 → 1,9 g/cm³; > 3 kPa sotto 50 cm (V) | vasca con gradiente | — | indoor |
| Umidità e sostanza organica | 0 | 0 | SoilGrids `soc`, umidità | sì (filtro) |
| Polvere e abrasività | grani di vetro angolari < 20 µm | — | — | **no** all'aperto |

**Riferimenti di produttività:** RASSOR 2.0 scava almeno 2,7 t/giorno (V). IPEx scava 42 kg/h, cioè 10 t in 11 giorni (V).

### 2.3 Luce radente (dimensione della mobilità, secondo `finaliste.md`)

| Parametro | Luna, Polo Sud | Sulla Terra | Riproducibile |
|---|---|---|---|
| Elevazione del sole | massimo ≈ (90° − \|lat\|) + 1,54°: ~1,5° al polo, ~3,5° a 88°S, ~7,5° a 84°S | calcolata per data e latitudine (pvlib/astropy), più l'orizzonte dal DEM | parziale: succede ad alte latitudini vicino agli equinozi |
| Lunghezza delle ombre | 38× l'altezza a 1,5°, 19× a 3°, 8× a 7° | uguale, è geometria | sì, nei momenti di sole basso |
| Velocità delle ombre | il sole si sposta ~0,5°/h in azimut | ~15°/h | **no**: sulla Terra le ombre si muovono 30 volte più veloci |
| Contrasto | ombre quasi nere, cielo nero | il cielo riempie le ombre; contano le nuvole (frequenza da MODIS) | parziale/no → notte con una sola lampada, o laboratorio (Ames POLAR) |
| Texture | regolite uniforme | servono texture sufficienti: le dune lisce in Marocco hanno rotto la visione | — |

### 2.4 Fuori dall'MVP ("coming soon" nella UI)

- **Atterraggio / HDA:**
  - tilt del lander ≤ 8° (V), pendenza di pianificazione < 10° (V);
  - rileva pericoli ≥ 0,3 m e pendenze ≥ 5° (V), atterraggio entro 100 m dal target (V);
  - nella pratica si costruisce un campo di pericoli artificiale (Morpheus, Astrobotic, Huailai).
- **Trivella / ghiaccio:**
  - LCROSS ha misurato 5,6 ± 2,9 wt% di acqua; soglia geotecnica al 5 ± 1% (V);
  - ghiaccio a 0-1 m di profondità;
  - temperature delle PSR 40-110 K: sulla Terra si arriva al massimo a ~175 K [NV], quindi serve una TVAC criogenica.
  - Miglior analogo all'aperto: il permafrost secco delle Dry Valleys [NV].
- **EVA:** pendenza < 20° (V), diversità geologica entro 2 km, logistica e copertura delle comunicazioni (criteri di JETT3).

## 3. Pesi per test (base per `tests.yaml`)

A = alto, M = medio, B = basso, – = non pertinente.

| Parametro (dimensione) | Mobilità | ISRU / materiale | Atterraggio | Visione con sole basso | Trivella | EVA |
|---|---|---|---|---|---|---|
| Pendenza (terreno) | A | M | A | M | B | A |
| Rocce / rugosità (terreno) | A | M | A | M | M | M |
| Crateri (terreno) | M | B | A | A | B | B |
| Densità, coesione, attrito (regolite) | A | A | B | – | A | B |
| Granulometria (regolite) | A | A | M | B | M | B |
| Elevazione solare e ombre (illuminazione) | M | B | A | A | – | M |
| Contrasto e albedo | B | – | A | A | – | B |
| Ghiaccio | – | M | – | – | A | – |
| Temperatura (termico) | B | M | B | B | A | M |
| Litologia e FeO (composizione) | B | A | B | B | M | M |
| Vegetazione e umidità (filtro) | A | A | A | A | M | M |
| Gravità, vuoto, polvere | A (indoor) | A (indoor) | A (indoor) | B | A (indoor) | A (indoor) |

Bozza dei pesi per l'MVP, tradotta nelle dimensioni di `requirements-tecnici.md`. La somma fa 1 e ogni peso è almeno 0,05. Rocco li corregge.

```yaml
mobility:
  weights: {terrain: 0.45, regolith: 0.25, illumination: 0.15, thermal: 0.05, composition: 0.05, ice: 0.05}
  filters: {ndvi_max: 0.1, slope_p90_min_deg: 15}
  indoor: [gravity_1_6, vacuum, electrostatic_dust]
  validate_high: [etna_piano_concazze, etna_cisternazza]
isru_material:
  weights: {composition: 0.55, regolith: 0.20, terrain: 0.10, thermal: 0.05, illumination: 0.05, ice: 0.05}
  filters: {ndvi_max: 0.2}
  indoor: [agglutinates, nanophase_fe, vacuum]
  validate_high: [sithampoondi_anorthosite, stillwater, rhein_sieg_basalt_quarry]
```

## 4. Cosa va indoor (la copertura)

| Condizione che la Terra non dà | Dove si fa |
|---|---|
| Gravità 1/6 g | SLOPE lab (NASA Glenn), ARGOS (JSC), offload di LUNA, rover a massa ridotta |
| Vuoto, interazione pennacchio-suolo | camere a vuoto (ESTEC, JSC) |
| PSR < 110 K, ghiaccio in regolite | TVAC criogenica; TVAC "sporca" di ALTEC (in arrivo) |
| Polvere elettrostatica, agglutinati | vasche di simulante (LUNA, KSC GMRO, Ames) |
| Ombre ferme con cielo nero | Ames Lunar Lab (dataset POLAR), luci di LUNA e di ALTEC (~8°) |
| Terreno replicato su un target preciso | Astrobotic LSPG (Mojave), Huailai, ISRO LTTF |

## 5. Siti noti: la "chiave delle risposte" e il flag `new`

Questi sono siti già usati per test lunari. Servono come validazione (devono uscire in alto per il loro test) e come layer di confronto per marcare `new` i candidati lontani da essi (condizione 1 di `finaliste.md`).

| Sito | Test | Campagna |
|---|---|---|
| Etna: Piano delle Concazze, Cisternazza | mobilità, EVA | ULS 2026, ARCHES 2022, Analog-1 |
| Lanzarote | EVA, grotte e tubi di lava | PANGAEA, CanMoon, CoRob-X |
| Teide, Minas de San José | visione notturna, traversate lunghe | LUCID 2017 |
| San Francisco Volcanic Field / Black Point (AZ) | EVA, rover pressurizzato, luce radente | JETT3, JETT5, D-RATS 2022 |
| Meteor Crater (AZ) | mobilità LTV | Intuitive Machines 2024 |
| Mauna Kea / Hilo (Hawaii) | ISRU, trivella | PISCES 2008, 2012 |
| Dumont Dunes (CA) | mobilità con equipaggio | Astrolab FLEX 2021 |
| Rye (CO) | mobilità LTV, 20° | Lunar Outpost 2025 |
| Kumtag / Lop Nur (Cina) | mobilità (sabbia a 70 µm) | Yutu |
| Tottori (Giappone) | ruote, SLAM | ispace, amulapo |
| Izu-Oshima (Giappone) | esplorazione autonoma | JAXA |
| Sithampoondi (Tamil Nadu) | **sorgente** di anortosite | ISRO LSS-ISAC-1 |
| Cava di basalto Rhein-Sieg (Germania) | **sorgente** di basalto | LUNA EAC-1A |
| Groenlandia (Lumina Sustainable Materials) | **sorgente** di anortosite | LUNA Dust Lab |

## 6. Catalogo delle campagne (sintesi)

| Campagna | Chi | Anno | Hardware | Sito | Perché quel sito |
|---|---|---|---|---|---|
| ULS / rover ETNA | TAS-I + ASI (Leonardo, IIT, ALTEC, AIKO, PoliTo) | 2026 | rover a 4 ruote, ISRU, drone | Etna | pendenze ~20°, eolico, rocce, crateri, niente vegetazione, area, sito di riserva ([Parco Etna](https://parcoetna.it/wp-content/uploads/2026/03/ULS-Relazione-tecnico-descrittiva-ULS-parco-Etna.pdf)) |
| ARCHES | DLR + KIT + ESA | 2022 | LRU1/2, Scout, lander RODIN | Etna | superficie granulare, colate, criteri geologici lunari ([DLR](https://www.dlr.de/en/research-and-transfer/projects-and-missions/arches)) |
| LUCID | ESA + GMV | 2017 | HDPR | Teide | le altre zone vulcaniche erano troppo rocciose; > 13 km percorribili; notte come luce polare ([ESA](https://www.esa.int/Enabling_Support/Space_Engineering_Technology/Rovers_drive_through_Tenerife_darkness)) |
| PANGAEA-X | ESA EAC | 2017-18 | attrezzi EVA, droni | Lanzarote | vulcanico, secco, poca vegetazione |
| Space Resources Challenge | ESA + ESRIC | 2021-22, 2025 | rover dei team | arena indoor, LUNA | luce polare, cratere da mappare; 2025: regolite ([DFKI](https://www-live.dfki.de/en/web/news/team-bremen-wins-the-international-space-resources-challenge)) |
| LUNA (struttura) | DLR + ESA | dal 2024 | rover, EVA, sinterizzazione | Colonia, indoor | EAC-1A da cava locale; 60 cm + vasca profonda 3 m ([DLRK 2023](https://elib.dlr.de/200873/1/DLRK_2023_LUNA%20analog%20facility%20Moon%20simulations%20in%20Cologne.pdf)) |
| ALTEC MTS | ALTEC per ESA | 2018-22 | rover gemello ExoMars, trivella | Torino, indoor | terreno riconfigurabile, pozzo di perforazione (è marziano) |
| D-RATS 2022 / JETT3 / JETT5 | NASA + USGS | 2022-24 | rover pressurizzato, EVA | Arizona (SFVF) | strada sterrata, alloggi a Flagstaff, copertura cellulare, varietà geologica entro 2 km, permesso del proprietario ([JETT3](https://ntrs.nasa.gov/api/citations/20230010686/downloads/EHP-20021_JETT3_Test_Report_Baseline_20230010686.pdf)) |
| VIPER SLOPE / Lunar Lab | NASA Glenn / Ames | 2019-23 | modello di VIPER | indoor (GRC-1, LHS-1) | GRC-1 approssima gli altopiani del Polo Sud ([SLOPE](https://ntrs.nasa.gov/api/citations/20220005514/downloads/ASCE%20E%26S%202022%20SLOPE%20Update%20Presentation%20Final.pdf)) |
| Swamp Works, Lunabotics | NASA KSC | in corso | RASSOR, IPEx | vasca da 120 t di BP-1 | BP-1 economico e disponibile in scala industriale |
| Lunar Surface Proving Ground | Astrobotic | dal 2024 | EDL, LiDAR | Mojave | topografia che replica il Polo Sud ([Astrobotic](https://www.astrobotic.com/astrobotic-unveils-terrestrial-moonscape-for-payload-testing/)) |
| Eagle LTV | Lunar Outpost | 2025 | LTV | Rye (CO) | pendenze fino a 20°, ostacoli |
| Moon RACER | Intuitive Machines | 2024 | LTV | Meteor Crater | cratere da impatto |
| PISCES ISRU | NASA + CSA | 2008, 2012 | RESOLVE, escavatori, trivelle | Mauna Kea | suolo vulcanico simile alla regolite, rocce come al polo |
| ISRO LTTF | ISRO | 2012-23 | rover e gambe del lander | Bengaluru / Challakere | anortosite naturale macinata, crateri come al sito di Vikram |
| Yutu | CAST / CNSA | 2011-13 | rover | Kumtag | sabbia a 70 µm, niente piogge né vento forte, survey > 20.000 km. Il sito vero era più roccioso: danni |
| Tottori Lunar Field | Prefettura di Tottori, amulapo | dal 2023 | rover, ruote | dune di Tottori | meccanica della sabbia vicina alla regolite |

**Chi organizza i test:**
- **Agenzie:** NASA (JSC, Glenn, Ames, KSC), ESA (EAC, ESTEC, ESOC), DLR, ASI, CSA, ISRO, CNSA/CAST, JAXA, Luxembourg Space Agency; USGS come partner scientifico e per i permessi.
- **Aziende:** TAS-I, Leonardo, ALTEC, AIKO, GMV, Space Applications, Venturi, ispace, Maana, Airbus, Astrobotic, Lunar Outpost, Intuitive Machines, Astrolab.
- **Università:** KIT, DFKI, PoliTo, IIT, TU Dresden, CMU, UCF, Tohoku e altre.

## 7. Avvertenze per la pipeline (Edo)

1. **La pendenza dipende dalla risoluzione del DEM.** Un DEM terrestre a 30 m dà pendenze più basse di LOLA a 5 m. Si ricampiona tutto alla stessa scala (anche Rocco nel CSV indica 20-30 m).
2. **Le rocce da 0,3 m non si vedono nei DEM globali.** Servono proxy (SAR, inerzia termica, `cfvo`), dichiarati come tali.
3. **SoilGrids e i proxy di granulometria** sono deboli su roccia nuda, deserti e poli: proprio dove stanno gli analoghi migliori.
4. **Per la luce conta l'elevazione del sole, non la latitudine**: si calcola per data, e la frequenza delle nuvole fa parte della dimensione.

## 8. Da verificare [NV]

- D50 della regolite.
- Parametri di Bekker.
- Agglutinati.
- FeO e TiO₂ degli altopiani.
- Spessore della regolite.
- Temperatura minima sulla Terra.
- Dry Valleys come analogo.
- Quale dei due siti Etna sia stato usato da ULS.
- Posizione esatta del Lunar Terrain Test Facility di ISRO.

# SoilGrids 2.0 (ISRIC)

Proposto da Rocco, 2026-11-14. Nota scritta da Timo.

## Cos'è

Mappe globali delle proprietà del suolo, a 250 m, prodotte da ISRIC con modelli di machine learning su profili di suolo misurati. Ogni proprietà ha 6 profondità (da 0-5 cm a 100-200 cm). Sito: https://www.isric.org/explore/soilgrids

## A cosa ci serve

È la dimensione **regolite e materiale sciolto**: granulometria e rocciosità del terreno, quelle che contano per la mobilità del rover e per lo scavo. Layer utili (profondità 0-5 cm):

| Layer | Cosa misura | Unità nel file → unità vera |
|---|---|---|
| `sand`, `silt`, `clay` | tessitura: sabbia, limo, argilla | g/kg → dividere per 10 per avere la % |
| `cfvo` | frammenti grossolani (sassi) | cm³/dm³ → dividere per 10 per avere la % in volume |
| `bdod` | densità apparente | cg/cm³ → dividere per 100 per avere g/cm³ |
| `soc` | carbonio organico (poco = più lunare) | dg/kg → dividere per 10 per avere g/kg |

Le unità vanno ricontrollate sulla pagina di ISRIC prima dell'uso.

## Come scaricarlo

**Non dal visualizzatore web.** Il file esportato il 14/11 (`SoilGrids 250m 2.0.tif`) era vuoto: tutti zero, riquadro lon 0–2°E e lat 0–2°N, in mare nel Golfo di Guinea.

Per la griglia H3 (celle di ~250 km²) bastano le versioni aggregate a 5 km, globali, circa 9 MB per file:

```
https://files.isric.org/soilgrids/latest/data_aggregated/5000m/sand/sand_0-5cm_mean_5000.tif
https://files.isric.org/soilgrids/latest/data_aggregated/5000m/silt/silt_0-5cm_mean_5000.tif
https://files.isric.org/soilgrids/latest/data_aggregated/5000m/clay/clay_0-5cm_mean_5000.tif
https://files.isric.org/soilgrids/latest/data_aggregated/5000m/cfvo/cfvo_0-5cm_mean_5000.tif
https://files.isric.org/soilgrids/latest/data_aggregated/5000m/bdod/bdod_0-5cm_mean_5000.tif
```

Esiste anche la versione a 1000 m (`data_aggregated/1000m/`), da usare solo per lo zoom sui siti candidati. Salvare in `data/raw/soilgrids/`, che è fuori da git.

## Attenzione

- **Proiezione:** controllarla con `gdalinfo`. SoilGrids usa l'Interrupted Goode Homolosine, non WGS84, e va riproiettato prima di passare ad H3.
- **Copertura degli analoghi:** è un modello di *suolo*. Roccia nuda, campi di lava recenti, ghiacciai e dune attive, cioè proprio i posti più "lunari", possono essere senza dato o stimati male: lì ci sono pochi profili misurati. Va controllato sui siti noti (Etna, Lanzarote, Islanda) prima di fidarsi.
- Granulometria terrestre contro regolite lunare: i grani terrestri sono arrotondati, quelli lunari taglienti. SoilGrids dà la dimensione dei grani, non la forma.

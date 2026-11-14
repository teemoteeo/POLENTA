# Unified Geologic Map of the Moon (USGS, 2020)

Aggiunto per Rocco, 2026-11-14.

## Cos'è

Mappa geologica globale e uniforme della Luna in scala 1:5.000.000. Autori: Fortezzo, Spudis e Harrel (USGS Astrogeology), versione 2 di marzo 2020. Contiene:
- le unità geologiche come poligoni (`GeoUnits`);
- i contatti tra unità (`GeoContacts`);
- le strutture lineari e le etichette.

Formati: shapefile, geodatabase ESRI e progetti ArcMap.

## A cosa ci serve

Dice **di che roccia è fatto** ciascuno dei 9 siti candidati di Artemis III. Al Polo Sud sono quasi tutte unità degli altopiani: anortosite e brecce da impatto. È il dato lunare della dimensione **composizione/litologia**: per ogni sito Artemis prendiamo l'unità geologica, poi la mappiamo su una classe di roccia terrestre per cercare gli analoghi e le sorgenti di materiale.

## Dove sta

- **Sul disco:** `data/raw/lunar_geology/`. Pesa 296 MB e **non è su git**: `data/raw/` è in `.gitignore`, e `GeoUnits.shp` da 120 MB supera il limite di GitHub.
- **Per averlo:** scaricarlo da https://astrogeology.usgs.gov/search/map/Moon/Geology/Unified_Geologic_Map_of_the_Moon e scompattarlo in `data/raw/lunar_geology/`.
- **File che servono a noi:**
  - `Lunar_GIS/Shapefiles/GeoUnits.shp` (con `.dbf`, `.shx`, `.prj`): le unità geologiche, con il codice di unità negli attributi;
  - `browse_Unified_Geologic_Map_of_the_Moon_v2_200dpi.jpg`: la mappa in immagine, per guardarla al volo.
- **Non incluso:** i raster di base (LOLA per i poli, Kaguya all'equatore). I link per scaricarli sono nei readme in `Lunar_Rasters/`.

## Come leggerlo (Python)

```python
import geopandas as gpd
units = gpd.read_file("data/raw/lunar_geology/Lunar_GIS/Shapefiles/GeoUnits.shp")
print(units.columns, units.crs)
```

Per i siti del Polo Sud la proiezione va controllata: il file è globale, e vicino al polo serve una proiezione polare stereografica per misurare aree e distanze.

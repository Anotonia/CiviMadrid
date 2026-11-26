# Verified candidates and acquisition boundary — M0

**Source identified; actual bytes NOT DOWNLOADED in this PR.** Independent web inspection (2026-11-26) identified the Madrid City Council's official district boundary resource:

- [Límites administrativos actuales — Distritos municipales, JSON resource](https://datos.madrid.es/dataset/900012-0-limites-administrativos-mapas/resource/900012-5-limites-administrativos-mapas)
- Download link is pinned in `scripts/data/fetch-madrid-boundaries.mjs`.
- Its dataset resource page marks **CC BY 4.0**. Attribution requirement: **Datos del Ayuntamiento de Madrid**.
- Native geographical grain: administrative district polygons, **not an observed measurement at hex-cell resolution**.
- Alternative official source [ArcGIS district FeatureServer](https://services-eu1.arcgis.com/UrtTdLP2PYSxwtI6/ArcGIS/rest/services/L%C3%ADmites_administrativos_oficiales_del_Ayuntamiento_de_Madrid/FeatureServer/2) supports GeoJSON query, but its service and asset terms remain to be checked before copying.

## Reproducible acquisition

```bash
node scripts/data/fetch-madrid-boundaries.mjs
node scripts/data/validate-manifest.mjs .data-staging/madrid-districts.manifest.json .data-staging/madrid-districts.raw.json
node --test scripts/data/*.test.mjs
```

The acquisition script performs a **single distribution download**, checks JSON structure and SHA256, and writes to local `.data-staging/`. **It does not prove** CRS, geometry correctness, city location, full metadata, field meanings, publication date, or satisfactory licensing for a published game. Manual/automated GIS review still required before M1.

### Legal boundary

Do not reuse USA Civ code/assets before inspecting **the actual archive** and its third-party notices. Do not bulk-fetch OSM tiles. Next: inspect district polygon CRS, valid rings, geometry bounds, timestamp and validate import into the canonical WorldSnapshot.

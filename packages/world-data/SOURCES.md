# Verified candidates and acquisition boundary — M0

**Official resource catalog verified 2026-11-26; raw bytes NOT DOWNLOADED in this PR.** The previous 900012-5 locator was incorrectly described as district boundaries; it is **secciones censales**. The official **distritos municipales** JSON is 900012-3, corrected here. Independent web inspection (2026-11-26) identified the Madrid City Council's official district boundary resource:

- [Límites administrativos actuales — Distritos municipales, JSON resource](https://datos.madrid.es/dataset/900012-0-limites-administrativos-mapas/resource/900012-3-limites-administrativos-mapas)
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


## 2026-11-27 independent official-source inspection (metadata, NOT acquired bytes)

The official Geoportal's [Límites administrativos actuales service](https://geoportal.madrid.es/IDEAM_WBGEOPORTAL/dataset.iam?id=e251898e-4a9c-11eb-9104-dc4a3e8ce33b) reports **EPSG:25830** as the service/dataset reference system. Its separately published **[district TopoJSON](https://geoportal.madrid.es/fsdescargas/IDEAM_WBGEOPORTAL/LIMITES_ADMINISTRATIVOS/Distritos/TopoJSON/Distritos.json)** is readable and contains a `Topology` with `objects.Distritos` and district `COD_DIS` / `NOMBRE` properties. The TopoJSON's quantization transform is **scale = [0.000010000269667, 0.000010000301928]** and **translate = [-3.888963415890898, 40.312064757565466]**, which indicates longitude/latitude-sized decoded coordinates, NOT raw UTM metre coordinates. These are different distributions/representations; do not blindly apply EPSG:25830 conversion to the TopoJSON.

Portal metadata alone does **not** establish geometric correctness, full source-file hash, exact number of returned features, or eligibility of individual hexes for construction. Raw-source fetch, checksum, conversion, geometry checks, feature-count and topology review, and explicit source attribution remain **release blockers**. Once acquired, verify the decoded coordinates through `topologyToGeoJSON` and `requireMadridWGS84`. Until then, synthetic tile types remain synthetic.

Related official source: [Barrios TopoJSON](https://geoportal.madrid.es/fsdescargas/IDEAM_WBGEOPORTAL/LIMITES_ADMINISTRATIVOS/Barrios/TopoJSON/Barrios.json) (portal describes 131 barrios). Official street vectors are a separate layer and not included in the administrative polygons.

M1 UI acceptance: a user must be able to recognize the actual Madrid municipal outline, district topology, district names and source/attribution. A generated hex grid alone fails this gate.

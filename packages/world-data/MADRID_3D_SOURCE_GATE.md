# Madrid real 3D building source — M1.5 ingestion gate

**Source identified 2026-11-28. Actual 3D building bytes have NOT been acquired or included in CiviMadrid.** This is a separate, higher-resolution GIS/asset pipeline from the 21 district boundaries. Do not claim that a district polygon's decorative extrusion represents a real structure.

## Verified official source and versions

- Ayuntamiento de Madrid Geoportal, [Modelo tridimensional de edificaciones y construcciones de la cartografía actualizada](https://geoportal.madrid.es/IDEAM_WBGEOPORTAL/dataset.iam?id=ece2d15a-d16f-46e8-aaec-9576771b9997), dataset date **2026-07-01**, model described as **LOD2** from 1:1000 municipal cartography.
- Dataset CRS: **EPSG:25830 (ETRS89 / UTM zone 30N)**, not automatically WGS84 and not interchangeable with district TopoJSON degrees.
- Listed downloadable formats: **I3S / SLPK**, **Multipatch** grouped by district / barrio / manzana, **IFC4x3** grouped by barrio, **OBJ grouped by manzana**. Scene contains constructed buildings and structures; polygon footprints include `ID_3D` to match their 3D counterpart.
- Explicit linked citywide distribution (likely large; do not blindly download/commit):
  `https://geoportal.madrid.es/fsdescargas/IDEAM_WBGEOPORTAL/CARTOGRAFIA/CARTOGRAFIA_ACTUALIZADA/3D_EDIFICACIONES_CONSTRUCCIONES/I3S_SLPK/MODELADO_3D_MADRID.zip`
- The official 2025 historical dataset is separate: `https://geoportal.madrid.es/IDEAM_WBGEOPORTAL/dataset.iam?id=CARTO_3D_EDIFICACIONES_2025`. **Do not accidentally mix versions or 2016 LOD1.**

## Reuse / legal gate

Official metadata links to [general reuse conditions](https://datos.madrid.es/pages/condiciones-generales-ayuntamiento-de-madrid). Conditions generally allow commercial and non-commercial reuse with attribution, preserved update metadata and no suggestion of municipal endorsement. **This does not independently verify every distribution or included asset**; confirm the selected archive's exact applicable license and any archive-level notices. Include “Origen de los datos: Ayuntamiento de Madrid”, last update date, source URL and derived-asset transformation method. Never package proprietary or unknown third-party textures without rights review.

## Engineerable first slice (ONE manzana, not all Madrid)

1. Select one **official manzana OBJ** around Centro with a known envelope and downloadable per-block archive. Record source link, file size, retrieval timestamp and SHA256. Reject missing or ambiguous license.
2. Inspect archive entry paths/sizes and nested ZIPs before extraction (zip slip, zip bomb, bad extensions, embedded executables). Keep raw file outside Git and avoid citywide high-volume downloads.
3. Validate OBJ geometry: finite vertices, triangle/face indexes in bounds, scale/units, axis orientation and right-handedness; record counts, watertightness limitations and source coordinates. Confirm the geometry's native **EPSG:25830** transformation via control points / explicit georeference: meshes may contain local offsets or world coordinates.
4. Transform UTM coordinates into WGS84/local ENU for Three.js using verified CRSs. No guessed origin or geometry snapping. Preserve original vertices and units in a raw record. Reference district layer by spatial relationship but do not assume polygons alone imply building legality.
5. Produce a small reviewable `glb` (mesh simplification/Draco only after geometric parity and texture rights review), plus `source-manifest.json` with hashes and `geometry-report.json`. Set clear max payload and draw-call budgets for mobile; use culling/LOD and progressive fetch.
6. QA: browser real building rendered, screenshot/turntable from multiple camera angles, compare original OBJ vs GLB vertex transform/footprint, verify manual municipal landmarks; test geometry provenance and license UI. Only then enable “REAL BUILDINGS LOD2” badge.

**Current visual layer:** `apps/web/src/RealMadrid3DScene.tsx` uses accurately sourced district plan polygons and a *constant artistic extrusion thickness*. It has **no imported official buildings, no measured height, no roads or terrain elevation**. The official district boundaries are native-grain `distrito`, not construction parcels.

**Gate status:** official model catalog and supported formats located; bytes, per-manzana selection, source hash, rights and actual render are **OPEN**. Keep architectural model pipeline isolated from SimCore game logic and from staged GIS release.

# Madrid source & rights register — v0.1

**Status:** Candidate sources checked for existence, not yet downloaded/field-audited. A row is **not** permission to ingest every dataset indiscriminately.

| Source | Intended use | Official entry point | Verification still required |
|---|---|---|---|
| Ayuntamiento de Madrid Open Data | city facilities, boundaries, transport and candidate municipal indicators | https://datos.madrid.es/ | dataset-specific license, field schema, dates, source URL; general reusable-conditions page: https://datos.madrid.es/pages/condiciones-de-uso |
| Comunidad de Madrid Geoportal | geographic boundaries, terrain, reference geographic services | https://www.comunidad.madrid/geoportal | per-layer license, usage limits, projection and update cadence |
| INE annual census / statistics | population baseline by published administrative grain | https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176992&idp=1254735572981&menu=resultados | exact table/geography and attribution conditions; official origin is not H3-hex-level |
| INE geographical sections OGC API | polygons for published statistical sections | https://www.ine.es/geoserver/ogc/features/v1/collections | select year-specific collection and verify that attributes actually contain desired measures (usually geometry alone does not) |
| AEMET OpenData | weather observations and historical scenario inspiration | https://www.aemet.es/es/datos_abiertos/AEMET_OpenData | API key, quotas, per-product reuse terms, date range; never claim scenario forecast |
| OpenStreetMap | street/road context and selected geography | https://www.openstreetmap.org/copyright | ODbL database obligations and attribution; tile server has separate policy: https://operations.osmfoundation.org/policies/tiles/ |

## Data policy

A dataset cannot be marked usable until its **specific distribution** has:
```yaml
source_id: ""
publisher: ""
dataset_title: ""
download_url: ""
license_url: ""
attribution_text: ""
date_of_observation: ""
date_retrieved: ""
source_geographic_grain: ""
crs: ""
fields_used: []
file_sha256: ""
transformation_version: ""
limitations: ""
```

- Store raw and transformed snapshots separately when redistribution is permitted.
- Public data at district, municipality or census-section grain **does not support factual claims about individual hex cells** without an explicit allocation model. All allocations must be labeled **derived** with method and uncertainty.
- **Never** present made-up water, solar, economic or population values as Madrid observations.
- Do not use personal-level data or exact household addresses.
- Use an appropriate tile provider or serve owned tiles; do not bulk scrape the OSM Foundation tile server.
- Reserve a visible in-app attribution/source panel.

## Reference implementation — USA Civ

- Public demo: https://karpathy.ai/usaciv/
- Advertised downloadable archive: https://karpathy.ai/usaciv/usaciv-source.zip
- **Reuse status: NOT AUDITED**. Verify archive hash, license files and third-party asset licenses before reuse. “MIT” in third-party commentary is not sufficient proof of every included asset's rights.

## Initial acquisition order

1. Geometric Madrid boundary and one terrain/elevation source with verified license.
2. One real observable layer (e.g. population) with documented native geographical grain.
3. Roads/facilities only when they materially improve the first playable map.
4. AEMET/historical weather after the scenario rules are operating; use synthetic drought shocks initially, clearly labeled.
5. Water utility operational data **not assumed available**: until a verified dataset is found, the water system is an explicitly synthetic gameplay model.

Every production data addition requires a manifest, source validation fixture and UI provenance card.

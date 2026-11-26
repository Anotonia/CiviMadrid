# GeoData / Data & GIS — M0 lane

**Workstream A**: own `packages/world-data/**`, `scripts/data/**`, source manifests, source/license review. See `docs/AGENT_PLAYBOOK.md`.

## Reality boundary
Do not assert that a hex cell has an officially observed municipal statistic. The transformation from official native grain to cell is **derived** and must include method and caveat.

## First deliverable
1. Inspect USA Civ downloadable source and all relevant third-party asset licenses before reuse (#1).
2. Select one **real official** Madrid geometrical source and one empirical layer at documented grain, with distribution-level license and attribution.
3. Save manifest with SHA256 of downloaded bytes, native CRS, field list, retrieval date, transform version.
4. Export a small snapshot in the shape of `WorldSnapshot` from `packages/world-schema/src/index.ts`.
5. Add validator tests proving missing license, source date and method caveat are rejected.

**Initial state:** no real Madrid dataset was downloaded or licensed as part of this scaffolding. Avoid committing scraped data, third-party imagery or unexplained numbers. The other lanes may use clearly synthetic geometry while the real-data audit proceeds.

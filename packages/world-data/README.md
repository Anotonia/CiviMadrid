# GeoData / GIS — M0 source engineering

**Current:** Candidate official Madrid district boundary distribution identified, attributed, and scripted for single-dataset acquisition. **Raw source NOT yet downloaded and geometry NOT verified.** See [SOURCES.md](SOURCES.md).

## Commands

From repository root, Node.js 22+:

```bash
node --test scripts/data/*.test.mjs
node scripts/data/fetch-madrid-boundaries.mjs
node scripts/data/validate-manifest.mjs .data-staging/madrid-districts.manifest.json .data-staging/madrid-districts.raw.json
```

Data download is separate from tests and should never run without a verified source license and attribution. Tests use synthetic in-memory fixtures, not a local copy of city datasets. Generated `.data-staging` is gitignored. The resource page marks CC BY 4.0, while download schema, CRS, geometry and suitability remain to be inspected before M1 release.

**Next integration:** output an immutable `WorldSnapshot` matching `packages/world-schema/src/index.ts`, with official geometry and provenance. Do not invent hex-level observed statistics. See issues #1 and #4.

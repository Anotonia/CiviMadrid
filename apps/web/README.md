# WorldUX M0 — interactive strategy-map render spike

**Current implementation:** browser app with procedural **synthetic** hex terrain, 3D instancing, camera orbit/pan/zoom, click/hover selection, responsive strategy-game shell, and explicit visible source-status warnings.

## Local run

```bash
cd apps/web
npm install
npm run dev
# open http://localhost:5173
npm run build
```

**Read the warning:** the map geometry/terrain is generated for an interaction/performance spike. It is not yet official Madrid geography, does not render real observations, and no actual game simulation is connected. Build/advance controls remain unavailable intentionally rather than faking state transitions.

## M0/M1 next steps

- Capture a real screenshot, measure FPS and accessibility at laptop/mobile viewports.
- Ingest the verified GeoData world snapshot from Agent A.
- Wire a strict `Command` bridge to SimCore Agent B after both packages pass tests.
- Show a physical building change and resource HUD event after a legal construction+advance.
- Run a genuine browser smoke test with QA Agent D.

These are pending until verified. Issues #2 and #5.

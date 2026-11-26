# Cross-lane browser acceptance plan — M0/M2

The current repository is under active parallel implementation. QA owns an **independent** end-to-end harness, not a second copy of the gameplay implementation.

## M0 checks

1. Checkout accepted contract and worker implementations.
2. Run `npm run build` in `apps/web` and headless simulation tests.
3. Launch web with actual browser renderer, ensure Canvas is present and nonblank (no screenshot-only assumption).
4. Select a hex and inspect correct synthetic provenance; camera must respond to drag and zoom.
5. Measure FPS at a representative viewport and record browser/runtime versions.

## Integration checks (M2, not yet implemented)

1. Select **buildable** cell, issue construction command, see nonzero cost reflected in authoritative state.
2. Advance turn and observe construction completion, changed resource values and visible building.
3. Reject invalid/occupied/unaffordable action with explicit reason and no state change.
4. Trigger water/power deficit and verify constraints on serviced housing.
5. Finish 12-turn game, explicit win/loss, export, reload and replay from seed and log.
6. Compare two strategies with common initial seed, labeled synthetic economic parameters.
7. For every observed source card, verify source link/license/grain/date; derived hex allocations show caveats.
8. Test keyboard and small viewport.

## CI test disclosure

`.github/workflows/m0-smoke.yml` runs tests only for components present on the checked-out branch. A **SKIP is not a PASS**, and a successfully built Vite bundle is not a successful playable browser test. The e2e browser suite must become executable on integration branch before M2 can be claimed.

## Evidence ledger template

| Gate | Actual command / environment | SHA / CI URL | Result | Remaining risk |
|---|---|---|---|---|
| Contract | TBD | TBD | NOT RUN | schema drift |
| GeoData | TBD | TBD | NOT RUN | licensing/geometry |
| SimCore | TBD | TBD | NOT RUN | economic invariants |
| 3D World | TBD | TBD | NOT RUN | real renderer/performance |
| Gameplay | TBD | TBD | NOT RUN | integration |

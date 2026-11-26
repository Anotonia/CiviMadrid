# Technical architecture — hypothesis v0.1

**Important:** this architecture is proposed, not implemented or benchmarked.

## 1. Principle

**Reality data never becomes the rule engine by magic.** Keep four distinct layers:

```text
Official / OSM / GIS data -> ETL + verification -> immutable SourceSnapshot
                                                    |
                                              Geometry + observed layers
                                                    |
Player actions -> validated Command -> deterministic Simulation Core -> EventLog
                                                     |                 |
                                               Render projection    Replay/hash
                                                     |
                                        3D Hex World + UI + comparison
Optional LLM -> candidate Command -> same validation gate (never state writes)
```

## 2. First implementation stack (subject to M0 spike)

- **Language/build:** TypeScript, Vite, strict mode, pnpm or npm (pick one in the first code PR).
- **UI:** React with accessible HTML overlays, lightweight state selectors.
- **World:** Three.js / React Three Fiber with GPU-instanced hex tiles, basic terrain elevation, water, camera orbit/pan/zoom, feature picking. Avoid copyrighted art and expensive 3D assets initially.
- **Geographic index:** H3 (candidate res=7) for a bounded ~25 km Madrid-area slice; verify geometry, performance and real data alignment in the M0 spike. Resolution is a hypothesis, not a geographical data claim.
- **ETL:** Python CLI or TypeScript script; save pinned input URL, retrieval timestamp, SHA256, projection, transform version and licensing notes.
- **Storage:** Versioned GeoJSON/columnar preprocessed snapshots, JSON scenario+event log in browser (IndexedDB or import/export); no backend required until justified.
- **Testing:** Vitest for pure engine and transformations; Playwright for browser loop; CI should block on failures.

## 3. Explicit data entities

```ts
type ValueKind = "observed" | "derived" | "synthetic" | "scenario";
type Provenance = {
  kind: ValueKind;
  sourceId?: string;
  sourceUrl?: string;
  observedAt?: string;
  retrievedAt?: string;
  license?: string;
  methodVersion?: string;
  caveat?: string;
};
type CellId = string; // H3 / axial id, selected in the M0 rendering spike
type World = {
  schemaVersion: string;
  engineVersion: string;
  sourceSnapshotHash: string;
  seed: number;
  turn: number; // each turn = one in-game quarter
  treasuryEurThousands: number; // modeled
  cells: Record<CellId, CellState>;
  eventLog: SimEvent[];
};
type Command =
  | { kind: "BUILD_WATER_REUSE"; cell: CellId }
  | { kind: "BUILD_SOLAR"; cell: CellId }
  | { kind: "BUILD_HOUSING"; cell: CellId }
  | { kind: "ADVANCE_TURN" };
```

Full schema will use runtime validators (e.g. Zod) and explicit units for all model variables. **Never conflate annual or municipal data with quarterly hex-cell values.**

## 4. Model boundary

- **Observed:** city/region geographies and exact official values at their *published* geographical grain.
- **Derived:** transformations such as areal interpolation / allocation to hex cells; show method, uncertainty and that a cell allocation is *not an official measurement*.
- **Synthetic:** default budgets, resource rates, cell capacities, action costs.
- **Scenario:** hypothetical drought/heat event timeline and parameter shocks.

The first slice uses transparent, integer or fixed-point arithmetic and simple balance equations; reference units: water m³/day (representative rate), energy MWh/day, housing dwellings, treasury €000, and one turn = 1 quarter. Distinguish rate from per-turn totals. No "GDP impact +5%" without a calibrated, validated model.

## 5. Determinism & safety rules

1. `reduceWorld(previous, command, context)` is pure: no network, clock, random Math.random, filesystem or LLM.
2. Scenario RNG seeded and versioned; NPC and events use a separately controlled stream.
3. Action validation includes bounds, permissions, affordable budget, free cell, build duration, required utilities.
4. Every successful command emits typed events; all resource deltas accounted for and reproducible.
5. Game state is versioned; migrations explicit; canonical hash uses sorted keys and normalized numeric representation.
6. Each action can be undone only via replay from a prior snapshot/branch, not by unsafely mutating history.
7. User-facing uncertainty labels cannot be overwritten by generated text.
8. Testing must detect simulation nonsensical behavior (e.g. housing expands when water/power are zero), not only code correctness.

## 6. Agent design after baseline works

An AI entity gets *limited observations* and a small allowed-action set. It proposes JSON commands via a constrained adapter. Validator rejects illegal actions, records why, and falls back to deterministic legal policy; the deterministic engine alone owns transition. Measure valid-action rate, advantage vs baseline, latency, cost and reproducibility of the *applied command log*. Store model metadata when used. M2 does not depend on paid inference.

## 7. M0 engineering spikes

- **Rendering:** 150–500 instanced hexes, visible terrain, orbit/pan/select, overlay and tooltips; measure FPS on a representative laptop and mobile viewport.
- **Geometry/data:** transform one verified Madrid source layer at its native grain to cell attribution; show uncertainty, no silent disaggregation.
- **Rules:** 10-cell headless demo, 3 commands, one stochastic-but-seeded stress event, 100-seed canonical replay equality and invariants.
- **Asset/license audit:** inspect Karpathy source archive and each dependency/license before any code reuse; do not copy it merely because a news article calls it MIT.

## 8. Suggested repository structure (future, not present)

```
apps/web/                 React UI, R3F world and game HUD
packages/sim-core/        pure reducer, commands, invariants, replay
packages/world-schema/    typed observed/derived/synthetic metadata
packages/data-snapshots/  checked-in small legal, licensed snapshots
scripts/data/             reproducible ETL and manifests
scenarios/madrid-2030/    seeds, parameters, test expectations
tests/e2e/               browser acceptance scripts
```

**Architecture discipline:** avoid microservices, generic workflow engines, distributed queues or arbitrary agent frameworks for this slice.

# World Contract v0.1 — shared interface across agents

**Owner:** Lead/Architect. **Status:** Frozen for first M0 parallel spikes unless reviewed change proposal. **Last updated:** 2026-11-26.

The aim is to let data, simulation, world-render and QA teams work independently without incompatible JSON shapes or mutable world state.

## 1. Truth classification

`ValueKind`:
- `observed` — sourced measurement at explicit place/time/grain.
- `derived` — disclosed transform of observed data (e.g. polygon→hex allocation).
- `synthetic` — designed gameplay values, no claim of empirical accuracy.
- `scenario` — hypothetical shock or parameter for an experiment.

No synthesized statistic is labeled observed. Native grain cannot be silently promoted to hex granularity.

## 2. Core identifiers and units

- `cellId`: opaque string; H3 res and spatial mapping are a *configurable dataset property*, not hardcoded across APIs.
- `turn`: integer index 0..12, one turn = one **game quarter**.
- `waterSupplyM3PerDay`, `waterDemandM3PerDay`.
- `powerSupplyMWhPerDay`, `powerDemandMWhPerDay`.
- `treasuryKeur`: €1000 game-currency units.
- `dwellings`: integer dwellings; `servicedDwellings` ≤ `dwellings`.
- All economic/water/energy game variables in initial M2 scenario are **synthetic**, even when terrain/population layers are observed.

## 3. Minimal TypeScript surface (normative signatures; code will implement them)

```ts
export type ValueKind = 'observed' | 'derived' | 'synthetic' | 'scenario';
export type CellId = string;

export interface Provenance {
  kind: ValueKind;
  sourceId?: string;
  sourceUrl?: string;
  observedAt?: string;       // date, if observed
  retrievedAt?: string;
  license?: string;
  nativeGrain?: string;      // municipal/district/section/hex
  methodVersion?: string;   // required for derived
  caveat?: string;
}

export interface GeoCell {
  id: CellId;
  centerLat: number;
  centerLon: number;
  buildable: boolean;
  terrain: 'urban' | 'water' | 'forest' | 'park' | 'other';
  elevationM?: number; // only if sourced OR labeled synthetic in provenance
  provenance: Record<string, Provenance>;
}

export interface CellState {
  cellId: CellId;
  improvement: 'none' | 'water_reuse' | 'solar' | 'housing';
  constructionTurnsRemaining: number;
  dwellings: number;
  servicedDwellings: number;
}

export interface WorldState {
  schemaVersion: '0.1';
  engineVersion: string;
  sourceSnapshotHash: string;
  scenarioId: string;
  seed: number;
  turn: number;
  treasuryKeur: number;
  waterSupplyM3PerDay: number;
  waterDemandM3PerDay: number;
  powerSupplyMWhPerDay: number;
  powerDemandMWhPerDay: number;
  cells: Record<CellId, CellState>;
  eventLog: SimEvent[];
}

export type Command =
 | { kind: 'BUILD_WATER_REUSE'; cellId: CellId }
 | { kind: 'BUILD_SOLAR'; cellId: CellId }
 | { kind: 'BUILD_HOUSING'; cellId: CellId }
 | { kind: 'ADVANCE_TURN' };

export interface SimEvent {
  id: string; // deterministic, not random UUID/time
  turn: number;
  kind: string;
  cellId?: CellId;
  delta?: Record<string, number>;
  ruleId: string;
  explanation: string; // factual about game rules, not generated forecast
}

export type CommandResult =
 | { accepted: true; state: WorldState; events: SimEvent[] }
 | { accepted: false; state: WorldState; reasonCode: string; message: string };

export function reduceWorld(
  state: WorldState,
  command: Command,
  params: ScenarioParams
): CommandResult;
```

The above signature is an interface contract, **not an implementation claim**.

## 4. Data handoff protocol (Agent A → C)

Input: `WorldSnapshot` v0.1 containing `geographyId`, `boundary`, `cellGrid`, `geoCells`, `observedLayers`, `manifestIds`. One manifest per source distribution. A renderer may show `CellState` improvement separately from immutable `GeoCell` coordinates. Never have UI infer raw official values via placeholder random numbers.

Interim synthetic map geometry must be labeled `synthetic` throughout and replaced at M1.

## 5. Simulation handoff (Agent B → C)

- UI dispatches a typed `Command`; only reducer outputs are authoritative.
- UI reads `state` and `events`; no independent economy calculations in components.
- Only a successful `CommandResult` may advance the stored state.
- A rejected command must display `message`, preserve identical state and log no success.
- Sim produces deterministic `ruleId` for player-readable explanations.
- Sim exports functions `createWorld`, `reduceWorld`, `replay`, `canonicalStateHash` with typed fixtures.

## 6. Replay protocol (Agent B → D)

Replay key = `sourceSnapshotHash + scenarioId + schemaVersion + engineVersion + seed + ordered command log`. Canonical serialization uses stable key ordering and integer/fixed-point model values. **Do not hash local timestamps**. Compare canonical **post-state** and event log. For simulated NPC or stochastic shocks, all randomness seeded and its stream versioned.

M0: 100 seeded command logs yield identical hashes. M2: 12-turn browser flow can export and import the same scenario log.

## 7. UI truth contract (Agent A + C + D)

Every number has a visible label: `Observed / Derived / Synthetic / Scenario`, including time and source/method where relevant. Tooltips show units. A real district's observed population is not automatically a measured population on each hex. Missing data should be explicit.

## 8. Change control

Before altering **any** of the above:
1. Open a versioned design issue with motivating failing fixture.
2. Propose a backward-compatible addition if possible.
3. Update contracts, fixtures, implementers, UI and tests together.
4. Get QA/Integrator review; merge only after downstream consumers work.
No agent independently forks a competing schema or rewrites teammates' directories.

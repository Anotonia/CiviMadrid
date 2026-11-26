/** CiviMadrid shared world contract v0.1. No gameplay or empirical facts are defined here. */
export type ValueKind = 'observed' | 'derived' | 'synthetic' | 'scenario';
export type CellId = string;
export type Resource = 'water' | 'power' | 'housing' | 'treasury';

export interface Provenance {
  kind: ValueKind;
  sourceId?: string;
  sourceUrl?: string;
  observedAt?: string;
  retrievedAt?: string;
  license?: string;
  nativeGrain?: string;
  methodVersion?: string;
  caveat?: string;
}

export type TerrainKind = 'urban' | 'water' | 'forest' | 'park' | 'other';
export type ImprovementKind = 'none' | 'water_reuse' | 'solar' | 'housing';
export type ConstructionKind = Exclude<ImprovementKind, 'none'>;

export interface GeoCell {
  id: CellId;
  centerLat: number;
  centerLon: number;
  buildable: boolean;
  terrain: TerrainKind;
  /** Only claim measured height when supported by a source + provenance. */
  elevationM?: number;
  provenance: Record<string, Provenance>;
}

export interface SourceManifest {
  sourceId: string;
  publisher: string;
  datasetTitle: string;
  downloadUrl: string;
  licenseUrl: string;
  attributionText: string;
  dateOfObservation?: string;
  dateRetrieved: string;
  sourceGeographicGrain: string;
  crs: string;
  fieldsUsed: string[];
  fileSha256: string;
  transformationVersion: string;
  limitations: string;
}

export interface WorldSnapshot {
  schemaVersion: '0.1';
  geographyId: string;
  /** Geometry reference or bounding metadata, not necessarily every polygon vertex. */
  boundary: { west: number; south: number; east: number; north: number };
  cellGrid: { indexSystem: string; resolution: number; cellsCount: number };
  geoCells: GeoCell[];
  observedLayers: Record<string, {
    title: string;
    units: string;
    nativeGrain: string;
    valueKind: 'observed' | 'derived';
    sourceIds: string[];
    values: Record<string, number | string | null>;
    caveat?: string;
  }>;
  manifestIds: string[];
}

export interface CellState {
  cellId: CellId;
  improvement: ImprovementKind;
  constructionTurnsRemaining: number;
  dwellings: number;
  servicedDwellings: number;
}

export interface SimEvent {
  id: string;
  turn: number;
  kind: string;
  cellId?: CellId;
  delta?: Record<string, number>;
  ruleId: string;
  explanation: string;
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

export type CommandResult =
 | { accepted: true; state: WorldState; events: SimEvent[] }
 | { accepted: false; state: WorldState; reasonCode: string; message: string };

export interface ScenarioParams {
  id: string;
  maxTurns: number;
  /** Game parameters are synthetic; never claim official units are forecasts. */
  actionCostKeur: Record<ConstructionKind, number>;
  buildTurns: Record<ConstructionKind, number>;
  waterSupplyDeltaM3PerDay: Record<ConstructionKind, number>;
  waterDemandDeltaM3PerDay: Record<ConstructionKind, number>;
  powerSupplyDeltaMWhPerDay: Record<ConstructionKind, number>;
  powerDemandDeltaMWhPerDay: Record<ConstructionKind, number>;
  dwellingsDelta: Record<ConstructionKind, number>;
  /** Mechanisms may extend in contract v0.2 after a reviewed migration. */
}

export interface ReplayRecord {
  schemaVersion: '0.1';
  scenarioId: string;
  sourceSnapshotHash: string;
  engineVersion: string;
  seed: number;
  commands: Command[];
}

/** Normative contract. SimCore owns the implementation; UI must not duplicate it. */
export type ReduceWorld = (
  state: WorldState,
  command: Command,
  params: ScenarioParams
) => CommandResult;

import type {
  CellId, Command, CommandResult, ConstructionKind, ImprovementKind,
  ReplayRecord, ScenarioParams, SimEvent, WorldState
} from '../../world-schema/src/index';

/** M0 implementation: small deterministic core. Rule coefficients are synthetic game mechanics. */
export const ENGINE_VERSION = '0.1.0-m0';

function reject(state: WorldState, reasonCode: string, message: string): CommandResult {
  return { accepted: false, state, reasonCode, message };
}
function asConstruction(kind: Command['kind']): ConstructionKind | undefined {
  switch (kind) {
    case 'BUILD_WATER_REUSE': return 'water_reuse';
    case 'BUILD_SOLAR': return 'solar';
    case 'BUILD_HOUSING': return 'housing';
    default: return undefined;
  }
}
function appendEvent(state: WorldState, event: Omit<SimEvent, 'id'>): SimEvent {
  return { ...event, id: `${state.turn}:${state.eventLog.length}` };
}
function updateService(state: WorldState, params: ScenarioParams): void {
  // Determine serviceable dwellings from actual simulated utility capacity.
  // Aggregate demand includes housing; subtract that load to recover non-housing baseline.
  const allIds = Object.keys(state.cells).sort();
  const housingCount = allIds.reduce((sum, id) => sum + state.cells[id].dwellings, 0);
  const addedHomes = Math.max(1, params.dwellingsDelta.housing);
  const waterPerHome = Math.max(0, params.waterDemandDeltaM3PerDay.housing / addedHomes);
  const powerPerHome = Math.max(0, params.powerDemandDeltaMWhPerDay.housing / addedHomes);
  const otherWater = state.waterDemandM3PerDay - housingCount * waterPerHome;
  const otherPower = state.powerDemandMWhPerDay - housingCount * powerPerHome;
  const waterCapacity = waterPerHome > 0
    ? Math.max(0, Math.floor((state.waterSupplyM3PerDay - otherWater) / waterPerHome))
    : housingCount;
  const powerCapacity = powerPerHome > 0
    ? Math.max(0, Math.floor((state.powerSupplyMWhPerDay - otherPower) / powerPerHome))
    : housingCount;
  let remaining = Math.min(housingCount, waterCapacity, powerCapacity);
  for (const id of allIds) {
    const cell = state.cells[id];
    const allocated = Math.min(cell.dwellings, remaining);
    cell.servicedDwellings = allocated;
    remaining -= allocated;
  }
}

export function reduceWorld(state: WorldState, command: Command, params: ScenarioParams): CommandResult {
  if (state.schemaVersion !== '0.1') return reject(state, 'BAD_SCHEMA', 'Unsupported world schema');
  if (state.scenarioId !== params.id) return reject(state, 'BAD_SCENARIO', 'Scenario mismatch');
  const improvement = asConstruction(command.kind);
  if (improvement && command.kind !== 'ADVANCE_TURN') {
    const cellId: CellId = command.cellId;
    const cell = state.cells[cellId];
    if (!cell) return reject(state, 'UNKNOWN_CELL', 'Select a valid cell');
    if (cell.improvement !== 'none') return reject(state, 'CELL_OCCUPIED', 'Cell is occupied or under construction');
    const cost = params.actionCostKeur[improvement];
    if (!Number.isInteger(cost) || cost < 0) return reject(state, 'INVALID_RULE', 'Invalid construction cost');
    if (state.treasuryKeur < cost) return reject(state, 'INSUFFICIENT_FUNDS', 'Not enough treasury');
    const next = structuredClone(state);
    next.treasuryKeur -= cost;
    next.cells[cellId].improvement = improvement as ImprovementKind;
    next.cells[cellId].constructionTurnsRemaining = Math.max(1, params.buildTurns[improvement]);
    const event = appendEvent(next, {
      turn: next.turn, kind: 'construction_queued', cellId,
      ruleId: `build.${improvement}`,
      delta: { treasuryKeur: -cost },
      explanation: `${improvement} queued: cost ${cost} kEUR.`
    });
    next.eventLog.push(event);
    return { accepted: true, state: next, events: [event] };
  }
  if (command.kind !== 'ADVANCE_TURN') return reject(state, 'UNKNOWN_COMMAND', 'Unknown command');
  if (state.turn >= params.maxTurns) return reject(state, 'GAME_COMPLETE', 'Game already complete');
  const next = structuredClone(state);
  next.turn += 1;
  const events: SimEvent[] = [];
  for (const id of Object.keys(next.cells).sort()) {
    const cell = next.cells[id];
    if (cell.improvement === 'none' || cell.constructionTurnsRemaining <= 0) continue;
    cell.constructionTurnsRemaining -= 1;
    if (cell.constructionTurnsRemaining !== 0) continue;
    const kind = cell.improvement;
    next.waterSupplyM3PerDay += params.waterSupplyDeltaM3PerDay[kind];
    next.waterDemandM3PerDay += params.waterDemandDeltaM3PerDay[kind];
    next.powerSupplyMWhPerDay += params.powerSupplyDeltaMWhPerDay[kind];
    next.powerDemandMWhPerDay += params.powerDemandDeltaMWhPerDay[kind];
    cell.dwellings += params.dwellingsDelta[kind];
    const event = appendEvent(next, {
      turn: next.turn, kind: 'construction_completed', cellId: id,
      ruleId: `complete.${kind}`,
      explanation: `${kind} completed after construction.`
    });
    next.eventLog.push(event); events.push(event);
  }
  updateService(next, params);
  const balanceEvent = appendEvent(next, {
    turn: next.turn, kind: 'turn_advanced',
    ruleId: 'balance.utilities',
    delta: { waterBalanceM3PerDay: next.waterSupplyM3PerDay - next.waterDemandM3PerDay,
      powerBalanceMWhPerDay: next.powerSupplyMWhPerDay - next.powerDemandMWhPerDay },
    explanation: 'Quarter advanced; finished constructions and services reconciled under synthetic game rules.'
  });
  next.eventLog.push(balanceEvent); events.push(balanceEvent);
  return { accepted: true, state: next, events };
}

/** Stable, deterministic non-cryptographic checksum for acceptance fixtures. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj).sort().map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}
export function canonicalStateHash(state: WorldState): string {
  const serialized = stableStringify(state);
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function replay(initial: WorldState, commands: Command[], params: ScenarioParams): WorldState {
  let state = structuredClone(initial);
  for (const command of commands) {
    const result = reduceWorld(state, command, params);
    if (!result.accepted) throw new Error(`${result.reasonCode}: ${result.message}`);
    state = result.state;
  }
  return state;
}
export function recordReplay(state: WorldState, commands: Command[]): ReplayRecord {
  return {
    schemaVersion: state.schemaVersion, scenarioId: state.scenarioId,
    sourceSnapshotHash: state.sourceSnapshotHash, engineVersion: state.engineVersion,
    seed: state.seed, commands: structuredClone(commands)
  };
}

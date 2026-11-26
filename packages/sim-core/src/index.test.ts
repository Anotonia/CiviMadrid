import { describe, expect, it } from 'vitest';
import type { Command, ScenarioParams, WorldState } from '../../world-schema/src/index';
import { canonicalStateHash, reduceWorld, replay } from './index';

const params: ScenarioParams = {
  id: 'madrid-2030-synthetic',
  maxTurns: 12,
  actionCostKeur: { water_reuse: 100, solar: 80, housing: 120 },
  buildTurns: { water_reuse: 2, solar: 1, housing: 1 },
  waterSupplyDeltaM3PerDay: { water_reuse: 55, solar: 0, housing: 0 },
  waterDemandDeltaM3PerDay: { water_reuse: 0, solar: 0, housing: 90 },
  powerSupplyDeltaMWhPerDay: { water_reuse: 0, solar: 70, housing: 0 },
  powerDemandDeltaMWhPerDay: { water_reuse: 8, solar: 0, housing: 90 },
  dwellingsDelta: { water_reuse: 0, solar: 0, housing: 60 },
};

function initial(seed: number): WorldState {
  return {
    schemaVersion: '0.1', engineVersion: '0.1.0-m0',
    scenarioId: params.id, sourceSnapshotHash: 'synthetic-only',
    seed, turn: 0, treasuryKeur: 1_000,
    waterSupplyM3PerDay: 100, waterDemandM3PerDay: 50,
    powerSupplyMWhPerDay: 200, powerDemandMWhPerDay: 20,
    cells: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [
      `cell-${i}`, { cellId: `cell-${i}`, improvement: 'none',
        constructionTurnsRemaining: 0, dwellings: 0, servicedDwellings: 0 }
    ])),
    eventLog: []
  };
}

describe('CiviMadrid deterministic simulation spike', () => {
  it('rejects invalid and unaffordable actions without mutating state', () => {
    const before = initial(1); const hash = canonicalStateHash(before);
    const bad = reduceWorld(before, { kind:'BUILD_SOLAR', cellId:'unknown' }, params);
    expect(bad.accepted).toBe(false);
    expect(canonicalStateHash(before)).toBe(hash);
    const poor = { ...before, treasuryKeur: 0 };
    expect(reduceWorld(poor, {kind:'BUILD_HOUSING', cellId:'cell-1'}, params).accepted).toBe(false);
  });

  it('charges on queue and applies impact only after construction delay', () => {
    let state = initial(2);
    const queued = reduceWorld(state, {kind:'BUILD_WATER_REUSE', cellId:'cell-0'}, params);
    expect(queued.accepted).toBe(true);
    if (!queued.accepted) return;
    state = queued.state;
    expect(state.treasuryKeur).toBe(900);
    expect(state.waterSupplyM3PerDay).toBe(100);
    const t1 = reduceWorld(state, {kind:'ADVANCE_TURN'}, params);
    expect(t1.accepted).toBe(true);
    if (!t1.accepted) return;
    expect(t1.state.waterSupplyM3PerDay).toBe(100);
    const t2 = reduceWorld(t1.state, {kind:'ADVANCE_TURN'}, params);
    expect(t2.accepted).toBe(true);
    if (!t2.accepted) return;
    expect(t2.state.waterSupplyM3PerDay).toBe(155);
  });

  it('models housing service as bounded by water/power capacity', () => {
    const world = replay(initial(3), [
      {kind:'BUILD_HOUSING', cellId:'cell-0'},
      {kind:'ADVANCE_TURN'}
    ], params);
    expect(world.cells['cell-0'].dwellings).toBe(60);
    expect(world.cells['cell-0'].servicedDwellings).toBeLessThan(60);
    expect(world.cells['cell-0'].servicedDwellings).toBeGreaterThan(0);
  });

  it('is replay-stable across 100 independent synthetic seeds', () => {
    for(let seed=0; seed<100; seed++){
      const commands: Command[]=[
        {kind:'BUILD_SOLAR',cellId:'cell-0'},
        {kind:'BUILD_HOUSING',cellId:'cell-1'},
        {kind:'ADVANCE_TURN'},
        {kind:'BUILD_WATER_REUSE',cellId:'cell-2'},
        ...Array.from({length:11},()=>({kind:'ADVANCE_TURN'} as Command))
      ];
      const first = replay(initial(seed),commands,params);
      const second = replay(initial(seed),commands,params);
      expect(first.turn).toBe(12);
      expect(canonicalStateHash(first)).toBe(canonicalStateHash(second));
      expect(first.treasuryKeur).toBeGreaterThanOrEqual(0);
    }
  });
});

import type { Command, ScenarioParams, WorldState } from '../../world-schema/src/index';
import { ENGINE_VERSION, replay } from './index';

export const SYNTHETIC_PARAMS: ScenarioParams = {
  id: 'madrid-2030-synthetic-demo',
  maxTurns: 12,
  actionCostKeur: { water_reuse: 100, solar: 80, housing: 120 },
  buildTurns: { water_reuse: 2, solar: 1, housing: 1 },
  waterSupplyDeltaM3PerDay: { water_reuse: 65, solar: 0, housing: 0 },
  waterDemandDeltaM3PerDay: { water_reuse: 0, solar: 0, housing: 90 },
  powerSupplyDeltaMWhPerDay: { water_reuse: 0, solar: 95, housing: 0 },
  powerDemandDeltaMWhPerDay: { water_reuse: 14, solar: 0, housing: 90 },
  dwellingsDelta: { water_reuse: 0, solar: 0, housing: 60 },
};

export function createSyntheticWorld(seed = 2026, n = 10): WorldState {
  return {
    schemaVersion: '0.1',
    engineVersion: ENGINE_VERSION,
    scenarioId: SYNTHETIC_PARAMS.id,
    sourceSnapshotHash: 'synthetic-m0-no-real-geodata',
    seed, turn: 0, treasuryKeur: 1_000,
    waterSupplyM3PerDay: 100, waterDemandM3PerDay: 60,
    powerSupplyMWhPerDay: 100, powerDemandMWhPerDay: 40,
    cells: Object.fromEntries(Array.from({ length: n }, (_, i) =>
      [`synthetic-${i}`, {
        cellId: `synthetic-${i}`, improvement: 'none' as const,
        constructionTurnsRemaining: 0, dwellings: 0, servicedDwellings: 0
      }]
    )),
    eventLog: []
  };
}

/** A real 12-turn command sequence for integration fixtures — no real-world predictions. */
export function runSyntheticScenario(seed = 2026): WorldState {
  const commands: Command[] = [
    {kind:'BUILD_WATER_REUSE',cellId:'synthetic-0'},
    {kind:'BUILD_SOLAR',cellId:'synthetic-1'},
    {kind:'BUILD_HOUSING',cellId:'synthetic-2'},
    ...Array.from({ length: 12 }, () => ({kind:'ADVANCE_TURN'} as Command))
  ];
  return replay(createSyntheticWorld(seed), commands, SYNTHETIC_PARAMS);
}

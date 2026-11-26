import { canonicalStateHash } from '../src/index';
import { runSyntheticScenario } from '../src/fixtures';

const final = runSyntheticScenario(2026);
const summary = {
  status: 'headless synthetic M0 demonstration; no browser, no official Madrid data',
  scenario: final.scenarioId,
  turn: final.turn,
  treasuryKeur: final.treasuryKeur,
  waterBalanceM3PerDay: final.waterSupplyM3PerDay-final.waterDemandM3PerDay,
  powerBalanceMWhPerDay: final.powerSupplyMWhPerDay-final.powerDemandMWhPerDay,
  servicedDwellings: Object.values(final.cells).reduce((a,c)=>a+c.servicedDwellings,0),
  events: final.eventLog.length,
  canonicalChecksum: canonicalStateHash(final)
};
console.log(JSON.stringify(summary,null,2));

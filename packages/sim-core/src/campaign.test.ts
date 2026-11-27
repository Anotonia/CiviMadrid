import { describe, expect, it } from 'vitest';
import { evaluateCampaign, MAX_SHORTAGE_TURNS } from './campaign';
import { reduceWorld, replay, canonicalStateHash } from './index';
import { createSyntheticWorld, SYNTHETIC_PARAMS, runSyntheticScenario } from './fixtures';
import type { Command, WorldState } from '../../world-schema/src/index';

const advance = (): Command => ({kind:'ADVANCE_TURN'});

describe('M0 finite campaign status and end-of-game invariants', () => {
  it('wins only after reaching serviced housing goal with nonnegative utility balances', () => {
    const final=runSyntheticScenario(200);
    const status=evaluateCampaign(final,SYNTHETIC_PARAMS);
    expect(final.turn).toBe(12);
    expect(status.phase).toBe('won');
    expect(status.reasonCode).toBe('OBJECTIVE_MET');
    expect(status.servicedHomes).toBeGreaterThanOrEqual(status.targetHomes);
    expect(status.waterBalanceM3PerDay).toBeGreaterThanOrEqual(0);
    expect(status.powerBalanceMWhPerDay).toBeGreaterThanOrEqual(0);
  });

  it('loses after three consecutive quarters of essential service shortage', () => {
    const start=createSyntheticWorld();
    const commands:Command[]=[
      {kind:'BUILD_HOUSING',cellId:'synthetic-0'},
      advance(),advance(),advance()
    ];
    const final=replay(start,commands,SYNTHETIC_PARAMS);
    const status=evaluateCampaign(final,SYNTHETIC_PARAMS);
    expect(status.phase).toBe('lost');
    expect(status.reasonCode).toBe('ESSENTIAL_SERVICES');
    expect(status.shortageStreak).toBe(MAX_SHORTAGE_TURNS);
    const hash=canonicalStateHash(final);
    const denied=reduceWorld(final,{kind:'BUILD_SOLAR',cellId:'synthetic-1'},SYNTHETIC_PARAMS);
    expect(denied.accepted).toBe(false);
    if (!denied.accepted) expect(denied.reasonCode).toBe('CAMPAIGN_ENDED');
    expect(canonicalStateHash(final)).toBe(hash);
  });

  it('does not count nonconsecutive shortages as a single streak', () => {
    const start=createSyntheticWorld();
    const sample:WorldState={
      ...start, turn:5, eventLog: [
        {id:'1:0',turn:1,kind:'turn_advanced',ruleId:'balance.utilities',explanation:'fixture',
          delta:{waterBalanceM3PerDay:-1,powerBalanceMWhPerDay:2}},
        {id:'2:0',turn:2,kind:'turn_advanced',ruleId:'balance.utilities',explanation:'fixture',
          delta:{waterBalanceM3PerDay:1,powerBalanceMWhPerDay:2}},
        {id:'3:0',turn:3,kind:'turn_advanced',ruleId:'balance.utilities',explanation:'fixture',
          delta:{waterBalanceM3PerDay:-2,powerBalanceMWhPerDay:2}},
        {id:'4:0',turn:4,kind:'turn_advanced',ruleId:'balance.utilities',explanation:'fixture',
          delta:{waterBalanceM3PerDay:-2,powerBalanceMWhPerDay:2}},
      ]
    };
    expect(evaluateCampaign(sample,SYNTHETIC_PARAMS).shortageStreak).toBe(2);
    expect(evaluateCampaign(sample,SYNTHETIC_PARAMS).phase).toBe('playing');
  });

  it('blocks new construction and turn advancement after final turn',()=>{
    const final=runSyntheticScenario(12);
    const hash=canonicalStateHash(final);
    for(const action of [{kind:'BUILD_WATER_REUSE',cellId:'synthetic-4'},advance()] as Command[]){
      const result=reduceWorld(final,action,SYNTHETIC_PARAMS);
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reasonCode).toBe('GAME_COMPLETE');
      expect(canonicalStateHash(final)).toBe(hash);
    }
  });

  it('finishes with a loss when the objective is missed at the turn limit',()=>{
    const final=replay(createSyntheticWorld(), Array.from({length:12},advance),SYNTHETIC_PARAMS);
    expect(evaluateCampaign(final,SYNTHETIC_PARAMS).reasonCode).toBe('OBJECTIVE_MISSED');
  });
});

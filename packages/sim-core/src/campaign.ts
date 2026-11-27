import type { ScenarioParams, WorldState } from '../../world-schema/src/index';

/** Provisional M0 game target; all resources are synthetic, not predictions. */
export const M0_GOAL_SERVED_HOMES = 40;
export const MAX_SHORTAGE_TURNS = 3;

export interface CampaignStatus {
  phase: 'playing' | 'won' | 'lost';
  reasonCode: 'IN_PROGRESS' | 'ESSENTIAL_SERVICES' | 'INSOLVENT' | 'OBJECTIVE_MET' | 'OBJECTIVE_MISSED';
  explanation: string;
  turn: number;
  maxTurns: number;
  servicedHomes: number;
  targetHomes: number;
  shortageStreak: number;
  waterBalanceM3PerDay: number;
  powerBalanceMWhPerDay: number;
}

/**
 * Pure independent assessment of a 12-turn fictional city-building campaign.
 * Reads actual engine state and deterministic turn events, not LLM narration.
 * It does not claim a factual Madrid economic/meteorological forecast.
 */
export function evaluateCampaign(state: WorldState, params: ScenarioParams): CampaignStatus {
  const servicedHomes = Object.values(state.cells)
    .reduce((n, cell) => n + cell.servicedDwellings, 0);
  const waterBalanceM3PerDay = state.waterSupplyM3PerDay - state.waterDemandM3PerDay;
  const powerBalanceMWhPerDay = state.powerSupplyMWhPerDay - state.powerDemandMWhPerDay;
  const turns = state.eventLog.filter(e => e.kind === 'turn_advanced')
    .sort((a,b) => a.turn - b.turn);
  let shortageStreak = 0;
  for (let i=turns.length-1;i>=0;i--) {
    const event=turns[i];
    const water=event.delta?.waterBalanceM3PerDay;
    const power=event.delta?.powerBalanceMWhPerDay;
    if (typeof water !== 'number' || typeof power !== 'number') break;
    if (water < 0 || power < 0) shortageStreak++;
    else break;
  }
  const base = {
    turn: state.turn, maxTurns: params.maxTurns,
    servicedHomes, targetHomes: M0_GOAL_SERVED_HOMES,
    shortageStreak, waterBalanceM3PerDay, powerBalanceMWhPerDay
  };
  if (state.treasuryKeur < 0) return {
    ...base, phase:'lost', reasonCode:'INSOLVENT',
    explanation:'Campaign ended: the modeled city treasury is below zero.'
  };
  if (shortageStreak >= MAX_SHORTAGE_TURNS) return {
    ...base, phase:'lost', reasonCode:'ESSENTIAL_SERVICES',
    explanation:'Campaign ended: water or power shortages persisted for three quarters.'
  };
  if (state.turn < params.maxTurns) return {
    ...base, phase:'playing', reasonCode:'IN_PROGRESS',
    explanation:'Balance essential services and reach the housing target before the final quarter.'
  };
  if (servicedHomes >= M0_GOAL_SERVED_HOMES &&
      waterBalanceM3PerDay >= 0 && powerBalanceMWhPerDay >= 0) {
    return { ...base, phase:'won', reasonCode:'OBJECTIVE_MET',
      explanation:'Campaign won: the housing goal is served and essential resources are balanced.' };
  }
  return { ...base, phase:'lost', reasonCode:'OBJECTIVE_MISSED',
    explanation:'Campaign lost: the housing goal or resource balance was not achieved by the last quarter.' };
}

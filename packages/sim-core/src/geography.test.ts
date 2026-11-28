import {describe,expect,it} from 'vitest';
import type {GeoCell,Command} from '../../world-schema/src/index';
import {canonicalStateHash} from './index';
import {reduceWorldWithGeography,replayWithGeography} from './geography';
import {createSyntheticWorld,SYNTHETIC_PARAMS} from './fixtures';

function cells():ReadonlyMap<string,GeoCell>{
 const make=(id:string,terrain:GeoCell['terrain'],buildable:boolean):GeoCell=>({
  id,centerLat:40.42,centerLon:-3.7,terrain,buildable,
  provenance:{terrain:{kind:'synthetic',caveat:'Synthetic test fixture'}}
 });
 return new Map([
  ['synthetic-0',make('synthetic-0','water',false)],
  ['synthetic-1',make('synthetic-1','urban',true)],
  ['synthetic-2',make('synthetic-2','park',false)],
  ['synthetic-3',make('synthetic-3','urban',true)]
 ]);
}
describe('source-geography bound building legality',()=>{
 it('does not allow construction on a water cell even if a caller bypasses UI controls',()=>{
  const state=createSyntheticWorld();
  const before=canonicalStateHash(state);
  const result=reduceWorldWithGeography(state,{kind:'BUILD_HOUSING',cellId:'synthetic-0'},SYNTHETIC_PARAMS,cells());
  expect(result.accepted).toBe(false);
  if(!result.accepted)expect(result.reasonCode).toBe('UNBUILDABLE_GEO_CELL');
  expect(canonicalStateHash(state)).toBe(before);
 });
 it('rejects unknown geometry and protected park cells, not just water',()=>{
  const state=createSyntheticWorld();
  for(const id of ['synthetic-9','synthetic-2']){
   const result=reduceWorldWithGeography(state,{kind:'BUILD_SOLAR',cellId:id},SYNTHETIC_PARAMS,cells());
   expect(result.accepted).toBe(false);
   if(!result.accepted)expect(result.reasonCode).toMatch(/GEO_CELL_UNAVAILABLE|UNBUILDABLE_GEO_CELL/);
  }
 });
 it('passes through legal constructions and subsequent turn changes',()=>{
  const start=createSyntheticWorld();
  const geometry=cells();
  const queued=reduceWorldWithGeography(start,{kind:'BUILD_SOLAR',cellId:'synthetic-1'},SYNTHETIC_PARAMS,geometry);
  expect(queued.accepted).toBe(true);
  if(!queued.accepted)return;
  expect(queued.state.treasuryKeur).toBe(920);
  const turn=reduceWorldWithGeography(queued.state,{kind:'ADVANCE_TURN'},SYNTHETIC_PARAMS,geometry);
  expect(turn.accepted).toBe(true);
  if(!turn.accepted)return;
  expect(turn.state.turn).toBe(1);
  expect(turn.state.powerSupplyMWhPerDay).toBe(195);
 });
 it('replays through geography validation and refuses illegal edited command logs',()=>{
  const start=createSyntheticWorld();
  const actions:Command[]=[{kind:'BUILD_SOLAR',cellId:'synthetic-1'},{kind:'ADVANCE_TURN'}];
  const one=replayWithGeography(start,actions,SYNTHETIC_PARAMS,cells());
  const two=replayWithGeography(start,actions,SYNTHETIC_PARAMS,cells());
  expect(canonicalStateHash(one)).toBe(canonicalStateHash(two));
  const tampered:Command[]=[{kind:'BUILD_SOLAR',cellId:'synthetic-0'}];
  expect(()=>replayWithGeography(start,tampered,SYNTHETIC_PARAMS,cells()))
   .toThrow(/UNBUILDABLE_GEO_CELL/);
 });
});

import type {CellId, Command, CommandResult, GeoCell, ScenarioParams, WorldState} from '../../world-schema/src/index';
import {reduceWorld} from './index';

/**
 * Authoritative geography-aware command gate. The source GeoCell buildability
 * comes from a version-pinned snapshot, not UI style or a text prompt.
 * Does not change the frozen v0.1 reduceWorld state/command contract.
 */
export function reduceWorldWithGeography(
 state:WorldState, command:Command, params:ScenarioParams,
 geography:ReadonlyMap<CellId,GeoCell>
):CommandResult {
 if(command.kind!=='ADVANCE_TURN'){
   const geo=geography.get(command.cellId);
   if(!geo){
     return {accepted:false,state,reasonCode:'GEO_CELL_UNAVAILABLE',message:'Cell is not in the active geography snapshot'};
   }
   if(!geo.buildable || geo.terrain==='water'){
     return {accepted:false,state,reasonCode:'UNBUILDABLE_GEO_CELL',message:'Selected terrain cannot be developed'};
   }
 }
 return reduceWorld(state,command,params);
}

/**
 * Replay must use the SAME geometry gate as interactive actions; otherwise a
 * crafted replay could create improvements on protected or water cells.
 */
export function replayWithGeography(
 initial:WorldState, commands:readonly Command[],params:ScenarioParams,
 geography:ReadonlyMap<CellId,GeoCell>
):WorldState {
 let state=structuredClone(initial);
 for(const command of commands){
  const result=reduceWorldWithGeography(state,command,params,geography);
  if(!result.accepted) throw new Error(`${result.reasonCode}: ${result.message}`);
  state=result.state;
 }
 return state;
}

import { useMemo, useState } from 'react';
import { WorldScene, syntheticCells } from './world';
import type { Command, ConstructionKind, WorldState } from '../../../packages/world-schema/src/index';
import { reduceWorld } from '../../../packages/sim-core/src/index';
import { SYNTHETIC_PARAMS } from '../../../packages/sim-core/src/fixtures';

type Choice = {kind:ConstructionKind;label:string;command: 'BUILD_WATER_REUSE'|'BUILD_SOLAR'|'BUILD_HOUSING';hint:string};
const CHOICES:Choice[]=[
  {kind:'water_reuse',label:'Water recovery',command:'BUILD_WATER_REUSE',hint:'More water, increased energy use'},
  {kind:'solar',label:'Solar field',command:'BUILD_SOLAR',hint:'More power after construction'},
  {kind:'housing',label:'New housing',command:'BUILD_HOUSING',hint:'More homes, higher utility demand'}
];
const stateFor = (ids:string[]):WorldState=>({
 schemaVersion:'0.1',engineVersion:'0.1.0-m0',sourceSnapshotHash:'synthetic-m0',scenarioId:SYNTHETIC_PARAMS.id,
 seed:2026,turn:0,treasuryKeur:1000,waterSupplyM3PerDay:100,waterDemandM3PerDay:60,
 powerSupplyMWhPerDay:100,powerDemandMWhPerDay:40,eventLog:[],
 cells:Object.fromEntries(ids.map(id=>[id,{cellId:id,improvement:'none',constructionTurnsRemaining:0,dwellings:0,servicedDwellings:0}]))
});
const pretty=(n:number)=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:0}).format(n);
function Stat({name,value,unit='',warning=false}:{name:string,value:number,unit?:string,warning?:boolean}){
 return <div className={`game-stat ${warning?'warning':''}`}><span>{name}</span><b>{pretty(value)}<small> {unit}</small></b></div>;
}

export default function Game(){
 const cells=useMemo(syntheticCells,[]);
 const [state,setState]=useState<WorldState>(()=>stateFor(cells.map(c=>c.id)));
 const [selection,setSelection]=useState<string|null>(null);
 const [message,setMessage]=useState('Choose a development site and build. Each change is an actual engine command.');
 const current=cells.find(c=>c.id===selection);
 const occupation=selection?state.cells[selection]:undefined;
 const water=state.waterSupplyM3PerDay-state.waterDemandM3PerDay;
 const power=state.powerSupplyMWhPerDay-state.powerDemandMWhPerDay;
 const homes=Object.values(state.cells).reduce((n,c)=>n+c.servicedDwellings,0);
 const buildings=Object.values(state.cells).filter(c=>c.improvement!=='none').length;

 function dispatch(action:Command){
  const result=reduceWorld(state,action,SYNTHETIC_PARAMS);
  if(!result.accepted){setMessage(`Action rejected: ${result.message}`);return;}
  setState(result.state);
  setMessage(result.events.at(-1)?.explanation ?? 'Action accepted.');
 }
 function build(choice:Choice){
  if(!current)return;
  if(current.terrain==='water'){setMessage('Water tiles are not buildable in this prototype.');return;}
  dispatch({kind:choice.command,cellId:current.id});
 }
 return <div className="shell">
  <header className="topbar"><div className="brand"><div className="brand-mark">C<span>·</span>M</div><div><h1>CiviMadrid</h1><p>THE CITY IS YOUR STRATEGY</p></div></div>
   <div className="headline-status"><span className="status-beacon"/><span>ENGINE INTEGRATION</span><strong>SYNTHETIC M0</strong></div>
   <button className="plain-button" onClick={()=>{setState(stateFor(cells.map(c=>c.id)));setSelection(null);setMessage('World restarted from initial synthetic state.');}}>Restart scenario</button>
  </header>
  <main className="game">
   <section className="world" aria-label="Interactive synthetic world">
    <WorldScene selectedId={selection} onSelect={id=>setSelection(id||null)} onHover={()=>{}} world={state}/>
    <div className="world-label top-left"><span className="eyebrow">MADRID-INSPIRED · SYNTHETIC WORLD</span><strong>Every action leaves a trace.</strong><p>Build and advance time. Resource consequences come from the deterministic engine.</p></div>
    <div className="map-warning" role="status">SYNTHETIC TERRAIN & GAME ECONOMY · NOT AN OFFICIAL MADRID FORECAST</div>
    <div className="compass" aria-hidden="true">N<br/><span>↑</span></div>
    <div className="game-hud">
     <div className="game-hud-title">CAMPAIGN — QUARTER {state.turn} OF 12</div>
     <div className="game-stats">
      <Stat name="TREASURY" value={state.treasuryKeur} unit="k€"/>
      <Stat name="WATER" value={water} unit="m³/day" warning={water<0}/>
      <Stat name="POWER" value={power} unit="MWh/day" warning={power<0}/>
      <Stat name="SERVED HOMES" value={homes}/>
     </div>
     <button className="advance-turn" onClick={()=>dispatch({kind:'ADVANCE_TURN'})} disabled={state.turn>=12}>
      {state.turn>=12?'12-QUARTER LIMIT REACHED':'ADVANCE QUARTER →'}
     </button>
    </div>
   </section>
   <aside className="inspector">
    <span className="eyebrow">DEVELOPMENT COUNCIL / M0</span><h2>Madrid, reconsidered.</h2>
    <p className="lead">Shape a hypothetical city with finite money, water, energy and land.</p>
    <div className="chapter"><span className="chapter-index">CHAPTER 01</span><strong>Build the district</strong><span className="chip">ACTIVE</span></div>
    <div className="selection">
     {current ? <>
      <span className="eyebrow">SELECTED TERRITORY</span><h3>Sector {current.q+1}–{current.r+1}</h3>
      <div className="property"><span>Terrain (synthetic)</span><strong>{current.terrain}</strong></div>
      <div className="property"><span>Improvement</span><strong>{occupation?.improvement.replace('_',' ') ?? 'none'}</strong></div>
      <div className="property"><span>Build turns left</span><strong>{occupation?.constructionTurnsRemaining ?? '—'}</strong></div>
     </> : <>
      <span className="eyebrow">TERRITORY INSPECTOR</span><h3>Choose a hex</h3>
      <p>Click a tile on the 3D terrain or choose an eligible synthetic site.</p>
      <button className="choose-site" onClick={()=>setSelection(cells.find(c=>c.terrain==='urban')?.id??null)}>Select buildable site</button>
     </>}
    </div>
    <div className="chapter"><span className="chapter-index">CHAPTER 02</span><strong>Development actions</strong></div>
    <div className="build-actions">
     {CHOICES.map(choice=><button key={choice.kind}
       aria-label={`Build ${choice.label}`}
       disabled={!current || current.terrain==='water' || occupation?.improvement!=='none' || state.turn>=12 || state.treasuryKeur<SYNTHETIC_PARAMS.actionCostKeur[choice.kind]}
       onClick={()=>build(choice)}>
       <span><b>{choice.label}</b><small>{choice.hint}</small></span><em>{SYNTHETIC_PARAMS.actionCostKeur[choice.kind]}k€</em>
      </button>)}
    </div>
    <div className="event-panel" role="status"><span>ENGINE EVENTS · {state.eventLog.length} LOGGED</span><p>{message}</p></div>
    <p className="small-note">Development sites: {buildings}. M0 integration only: no victory model, saved game or official geographic observations yet.</p>
    <footer className="inspector-footer">CIVIMADRID / SYNTHETIC ENGINE DEMO <span>v0.1 · M0</span></footer>
   </aside>
  </main>
 </div>;
}

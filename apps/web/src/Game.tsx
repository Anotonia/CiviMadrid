import { useMemo, useState } from 'react';
import { WorldScene, syntheticCells } from './world';
import { SiteNavigator } from './SiteNavigator';
import RealMadridExplorer from './RealMadridExplorer';
import { syntheticGeography } from './geoAdapter';
import type { Command, ConstructionKind, WorldState } from '../../../packages/world-schema/src/index';
import { evaluateCampaign, recordReplay, canonicalStateHash } from '../../../packages/sim-core/src/index';
import { reduceWorldWithGeography, replayWithGeography } from '../../../packages/sim-core/src/geography';
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
 const [view,setView]=useState<'real'|'synthetic'>('real');
 const [realDistrict,setRealDistrict]=useState('01');
 const cells=useMemo(syntheticCells,[]);
 const geography=useMemo(()=>syntheticGeography(cells),[cells]);
 const [state,setState]=useState<WorldState>(()=>stateFor(cells.map(c=>c.id)));
 const [selection,setSelection]=useState<string|null>(null);
 const [commands,setCommands]=useState<Command[]>([]);
 const [replayJson,setReplayJson]=useState('');
 const [replayVisible,setReplayVisible]=useState(false);
 const [message,setMessage]=useState('Choose a development site and build. Each change is an actual engine command.');
 const current=cells.find(c=>c.id===selection);
 const occupation=selection?state.cells[selection]:undefined;
 const water=state.waterSupplyM3PerDay-state.waterDemandM3PerDay;
 const power=state.powerSupplyMWhPerDay-state.powerDemandMWhPerDay;
 const homes=Object.values(state.cells).reduce((n,c)=>n+c.servicedDwellings,0);
 const buildings=Object.values(state.cells).filter(c=>c.improvement!=='none').length;
 const campaign=evaluateCampaign(state,SYNTHETIC_PARAMS);
 const over=campaign.phase!=='playing';
 const originalWorld=()=>stateFor(cells.map(c=>c.id));
 function restart(){
  setState(originalWorld());setCommands([]);setSelection(null);
  setReplayJson('');setReplayVisible(false);
  setMessage('World restarted from initial synthetic state.');
 }
 function exportReplay(){
  const initial=originalWorld();
  const encoded={...recordReplay(initial,commands),finalStateHash:canonicalStateHash(state)};
  setReplayJson(JSON.stringify(encoded,null,2));
  setReplayVisible(true);
  setMessage('Replay JSON prepared; copy or edit it, then use Load replay to verify.');
 }
 function importReplay(){
  try{
   const obj:unknown=JSON.parse(replayJson);
   if(!obj||typeof obj!=='object') throw new Error('Invalid replay object');
   const p=obj as Record<string,unknown>;
   const first=originalWorld();
   if(p.schemaVersion!==first.schemaVersion||p.scenarioId!==first.scenarioId||
      p.sourceSnapshotHash!==first.sourceSnapshotHash||p.engineVersion!==first.engineVersion||
      p.seed!==first.seed) throw new Error('Replay scenario or source snapshot does not match');
   if(!Array.isArray(p.commands)||p.commands.length>250) throw new Error('Invalid or overlong command list');
   for(const action of p.commands){
    if(!action||typeof action!=='object')throw new Error('Invalid replay action');
    if(!['BUILD_WATER_REUSE','BUILD_SOLAR','BUILD_HOUSING','ADVANCE_TURN'].includes(action.kind))
      throw new Error('Unknown command');
    if(action.kind!=='ADVANCE_TURN'&&typeof action.cellId!=='string')
      throw new Error('Invalid action cell');
   }
   const next=replayWithGeography(first,p.commands as Command[],SYNTHETIC_PARAMS,geography);
   if(p.finalStateHash!==canonicalStateHash(next))throw new Error('Replay checksum mismatch');
   setState(next);setCommands(p.commands as Command[]);
   setMessage('Replay restored and verified against the authoritative engine.');
  }catch(e){setMessage(`Replay rejected: ${e instanceof Error?e.message:'Unknown error'}`);}
 }


 function dispatch(action:Command){
  const result=reduceWorldWithGeography(state,action,SYNTHETIC_PARAMS,geography);
  if(!result.accepted){setMessage(`Action rejected: ${result.message}`);return;}
  setState(result.state);
  setCommands(previous=>[...previous,action]);
  const outcome=evaluateCampaign(result.state,SYNTHETIC_PARAMS);
  setMessage(outcome.phase!=='playing' ? outcome.explanation :
    result.events.at(-1)?.explanation ?? 'Action accepted.');
 }
 function build(choice:Choice){
  if(!current)return;
  if(current.terrain==='water'){setMessage('Water tiles are not buildable in this prototype.');return;}
  dispatch({kind:choice.command,cellId:current.id} as Command);
 }
 return <div className="shell">
  <header className="topbar"><div className="brand"><div className="brand-mark">C<span>·</span>M</div><div><h1>CiviMadrid</h1><p>THE CITY IS YOUR STRATEGY</p></div></div>
   <div className="headline-status"><span className="status-beacon"/><span>{view==='real'?'OFFICIAL DISTRICT EXPLORE':'ENGINE INTEGRATION'}</span><strong>{view==='real'?'SOURCE-DERIVED M1':'SYNTHETIC M0'}</strong></div>
   <div className="mode-toggle" role="group" aria-label="World mode">
    <button type="button" className={view==='real'?'active':''} onClick={()=>setView('real')} aria-pressed={view==='real'}>Real Madrid</button>
    <button type="button" className={view==='synthetic'?'active':''} onClick={()=>setView('synthetic')} aria-pressed={view==='synthetic'}>Play synthetic</button>
   </div>
   {view==='synthetic'&&<button className="plain-button" onClick={restart}>Restart scenario</button>}
  </header>
  {view==='real'?<RealMadridExplorer selectedCode={realDistrict} onSelectDistrict={setRealDistrict}/>:<main className="game">
   <section className="world" aria-label="Interactive synthetic world">
    <WorldScene selectedId={selection} onSelect={id=>setSelection(id||null)} onHover={()=>{}} world={state}/>
    <div className="world-label top-left"><span className="eyebrow">MADRID-INSPIRED · SYNTHETIC WORLD</span><strong>Every action leaves a trace.</strong><p>Build and advance time. Resource consequences come from the deterministic engine.</p></div>
    <div className="map-warning" role="status">SYNTHETIC TERRAIN & GAME ECONOMY · NOT AN OFFICIAL MADRID FORECAST</div>
    <div className="compass" aria-hidden="true">N<br/><span>↑</span></div>
    <div className="game-hud">
     <div className="game-hud-title">CAMPAIGN — QUARTER {state.turn} OF 12 · {campaign.phase.toUpperCase()}</div>
     <div className="game-stats">
      <Stat name="TREASURY" value={state.treasuryKeur} unit="k€"/>
      <Stat name="WATER" value={water} unit="m³/day" warning={water<0}/>
      <Stat name="POWER" value={power} unit="MWh/day" warning={power<0}/>
      <Stat name="SERVED HOMES" value={homes}/>
     </div>
     <button className="advance-turn" onClick={()=>dispatch({kind:'ADVANCE_TURN'})} disabled={over}>
      {over?'CAMPAIGN ENDED':'ADVANCE QUARTER →'}
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
      <button className="choose-site" onClick={()=>setSelection(cells.find(c=>c.id==='syn-8-7' && c.terrain==='urban')?.id??null)}>Select buildable site</button>
     </>}
    </div>
    <SiteNavigator cells={cells} selectedId={selection} onSelect={setSelection}
      isAvailable={cell=>geography.get(cell.id)?.buildable===true && state.cells[cell.id]?.improvement==='none'}/>
    <div className="chapter"><span className="chapter-index">CHAPTER 02</span><strong>Development actions</strong></div>
    <div className="build-actions">
     {CHOICES.map(choice=><button key={choice.kind}
       aria-label={`Build ${choice.label}`}
       disabled={!current || geography.get(current.id)?.buildable!==true || occupation?.improvement!=='none' || over || state.treasuryKeur<SYNTHETIC_PARAMS.actionCostKeur[choice.kind]}
       onClick={()=>build(choice)}>
       <span><b>{choice.label}</b><small>{choice.hint}</small></span><em>{SYNTHETIC_PARAMS.actionCostKeur[choice.kind]}k€</em>
      </button>)}
    </div>
    <div className="campaign-result" role="status">
     <strong>CAMPAIGN STATUS: {campaign.phase.toUpperCase()}</strong>
     <p>{campaign.explanation}</p>
     <small>Serviced homes {campaign.servicedHomes}/{campaign.targetHomes} · Critical shortage streak {campaign.shortageStreak}/3</small>
    </div>
    <div className="event-panel" role="status"><span>ENGINE EVENTS · {state.eventLog.length} LOGGED</span><p>{message}</p></div>
    <div className="replay-controls">
     <button onClick={exportReplay}>Export replay</button>
     <button onClick={()=>setReplayVisible(v=>!v)}>{replayVisible?'Hide replay':'Show replay input'}</button>
    </div>
    {replayVisible && <div className="replay-panel">
      <label htmlFor="civimadrid-replay">Replay JSON · synthetic test data only</label>
      <textarea id="civimadrid-replay" aria-label="Replay JSON" value={replayJson} onChange={event=>setReplayJson(event.target.value)} rows={5}/>
      <button onClick={importReplay}>Load replay</button>
    </div>}
    <p className="small-note">Development sites: {buildings}. M0 synthetic scenario only. This now has victory rules and replay import/export; no official Madrid observations or calibrated forecast.</p>
    <footer className="inspector-footer">CIVIMADRID / SYNTHETIC ENGINE DEMO <span>v0.1 · M0</span></footer>
   </aside>
  </main>}
 </div>;
}

import type { PrototypeCell } from './world';

interface Props {
  cells: PrototypeCell[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isAvailable?: (cell: PrototypeCell) => boolean;
}

/**
 * Accessible HTML alternative to clicking instanced 3D hexes.
 * Supports sequential construction, keyboard navigation and a compact mobile layout.
 * This component does not decide the legality of actions: SimCore is authoritative.
 */
export function SiteNavigator({cells,selectedId,onSelect,isAvailable=()=>true}:Props){
  const eligible=cells.filter(c=>c.terrain!=='water'&&isAvailable(c));
  const index=eligible.findIndex(c=>c.id===selectedId);
  const position=index>=0?index:-1;
  const jump=(direction:1|-1)=>{
    if(!eligible.length)return;
    const next=position < 0 ? (direction===1 ? 0 : eligible.length-1) : (position+direction+eligible.length)%eligible.length;
    onSelect(eligible[next].id);
  };
  return <div className="site-navigator" role="group" aria-label="Buildable territory navigation">
    <div className="site-navigator-heading">
      <strong>CHOOSE DEVELOPMENT SITE</strong>
      <span>{eligible.length} available</span>
    </div>
    <div className="site-navigator-controls">
      <button type="button" aria-label="Previous buildable site" disabled={!eligible.length} onClick={()=>jump(-1)}>‹ Previous</button>
      <button type="button" aria-label="Next buildable site" disabled={!eligible.length} onClick={()=>jump(1)}>Next ›</button>
    </div>
    <label htmlFor="site-picker">Select a sector by name</label>
    <select id="site-picker" aria-label="Buildable territory" value={index>=0?selectedId??'':''} onChange={e=>{if(eligible.some(c=>c.id===e.target.value))onSelect(e.target.value);}} disabled={!eligible.length}>
      <option value="" disabled>Choose a buildable sector</option>
      {eligible.map(c=><option key={c.id} value={c.id}>Sector {c.q+1}–{c.r+1} · {c.terrain} (synthetic)</option>)}
    </select>
    <small>3D terrain and sector classes are synthetic; official Madrid data is not connected.</small>
  </div>;
}

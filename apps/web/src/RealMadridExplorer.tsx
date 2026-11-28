import { useEffect, useMemo, useRef, useState } from 'react';
import './realMadrid.css';

/**
 * Read-only sourced Explore layer. Polyline coordinates are a DISPLAY-ONLY
 * simplified derivative of the independently audited Madrid 21 districts.
 * This is neither a surveyed building parcel nor a zoned construction grid.
 */
type Position=[number,number];
type SourceEntry=[string,string,string[][]];
type District={code:string;name:string;rings:Position[][];path:string;cx:number;cy:number};
const SOURCE='/data/madrid-districts-preview.polyline.json';
const SOURCE_PAGE='https://datos.madrid.es/dataset/900012-0-limites-administrativos-mapas/resource/900012-3-limites-administrativos-mapas';
const RAW_SHA='b2082936d7c8c051824d2c1a2aefeb1fdfda94f71b308f6b75c385f01707c616';
const DERIVED_SHA='6c0a4f2985c142e6add60bea5b72102e07a7b94f0c9acb2d147688fe425ca646';
const WIDTH=1000,HEIGHT=740,PAD=58;

function decodePolyline(encoded:string):Position[]{
  let i=0,lat=0,lon=0;
  const output:Position[]=[];
  while(i<encoded.length){
    const read=()=>{
      let result=0,shift=0,part=0;
      do{
        if(i>=encoded.length||shift>35)throw new Error('Malformed district polyline encoding');
        part=encoded.charCodeAt(i++)-63;
        if(part<0||part>63)throw new Error('Invalid polyline character');
        result|=(part&31)<<shift;
        shift+=5;
      }while(part>=32);
      return result&1?~(result>>1):(result>>1);
    };
    lat+=read();lon+=read();
    output.push([lon/100000,lat/100000]);
  }
  if(output.length<4)throw new Error('District polygon has fewer than four vertices');
  return output;
}
function validateSource(raw:unknown):{code:string;name:string;rings:Position[][]}[]{
  if(!Array.isArray(raw)||raw.length!==21)throw new Error('Expected exactly 21 official Madrid districts');
  const seen=new Set<string>();
  const entries: {code:string;name:string;rings:Position[][]}[]=[];
  for(const entry of raw){
    if(!Array.isArray(entry)||entry.length!==3)throw new Error('Invalid district asset entry');
    const [code,name,multi]=entry as SourceEntry;
    if(!/^(0[1-9]|1[0-9]|2[01])$/.test(code)||seen.has(code)||
       typeof name!=='string'||!name.trim()||!Array.isArray(multi)||!multi.length)
       throw new Error('Invalid or duplicate official district code');
    seen.add(code);
    const rings:Position[][]=[];
    for(const polygon of multi){
      if(!Array.isArray(polygon)||!polygon.length)throw new Error('Missing polygon ring');
      for(const encoded of polygon){
        if(typeof encoded!=='string')throw new Error('Invalid district ring');
        const ring=decodePolyline(encoded);
        for(const [lon,lat] of ring)
          if(!Number.isFinite(lon)||!Number.isFinite(lat)||
             lon < -3.95||lon > -3.3||lat < 40.15||lat > 40.75)
            throw new Error('District coordinates outside Madrid WGS84 guard');
        rings.push(ring);
      }
    }
    entries.push({code,name,rings});
  }
  if(!entries.some(x=>x.code==='01'&&x.name==='Centro')||
     !entries.some(x=>x.code==='21'&&x.name==='Barajas'))
    throw new Error('Expected Madrid district identities missing');
  return entries;
}
function project(entries:ReturnType<typeof validateSource>):District[]{
  const cos=Math.cos(40.43*Math.PI/180);
  const all=entries.flatMap(x=>x.rings.flat());
  const xs=all.map(([lon])=>lon*cos),ys=all.map(([,lat])=>lat);
  const west=Math.min(...xs),east=Math.max(...xs),south=Math.min(...ys),north=Math.max(...ys);
  const scale=Math.min((WIDTH-PAD*2)/(east-west),(HEIGHT-PAD*2)/(north-south));
  const xy=([lon,lat]:Position):Position=>
    [WIDTH/2+(lon*cos-(west+east)/2)*scale,HEIGHT/2-(lat-(south+north)/2)*scale];
  return entries.map(x=>{
    const polylines=x.rings.map(r=>r.map(xy));
    const path=polylines.map(points=>points.map(([px,py],i)=>
      (i===0?'M':'L')+px.toFixed(2)+' '+py.toFixed(2)).join(' ')+' Z').join(' ');
    const pts=polylines[0];
    const cx=pts.reduce((n,p)=>n+p[0],0)/pts.length,cy=pts.reduce((n,p)=>n+p[1],0)/pts.length;
    return {...x,path,cx,cy};
  });
}
export default function RealMadridExplorer(){
  const [districts,setDistricts]=useState<District[]>([]);
  const [error,setError]=useState<string|null>(null);
  const [selected,setSelected]=useState('01');
  const [filter,setFilter]=useState('');
  const [zoom,setZoom]=useState(1);
  const [offset,setOffset]=useState<Position>([0,0]);
  const start=useRef<{x:number;y:number;ox:number;oy:number}|null>(null);
  const moved=useRef(false);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(SOURCE,{signal:controller.signal})
      .then(response=>{if(!response.ok)throw new Error('Bundled official-derived geography is unavailable (HTTP '+response.status+')');return response.json();})
      .then(raw=>setDistricts(project(validateSource(raw))))
      .catch(err=>{if(!controller.signal.aborted)setError(String(err instanceof Error?err.message:err));});
    return ()=>controller.abort();
  },[]);
  const current=districts.find(d=>d.code===selected);
  const matches=useMemo(()=>districts.filter(d=>d.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())),[districts,filter]);
  const panZoom=()=>{
    const viewWidth=WIDTH/zoom, viewHeight=HEIGHT/zoom;
    return [WIDTH/2-viewWidth/2-offset[0],HEIGHT/2-viewHeight/2-offset[1],viewWidth,viewHeight].join(' ');
  };
  return <main className="real-layout" data-testid="real-madrid-explore">
    <section className="real-world" aria-label="Source-derived Madrid administrative districts">
      <div className="real-map-heading">
        <span className="real-overline">MADRID / 21 DISTRITOS / SOURCE-DERIVED GEOGRAPHY</span>
        <h2>Una ciudad. Veintiún mundos.</h2>
        <p>Explore Madrid's real administrative outline. Buildable parcels and city economy remain unverified.</p>
      </div>
      {error?<div className="real-map-error" role="alert">
        <strong>Official map layer could not be verified and loaded.</strong>
        <p>{error}</p><p>No synthetic boundary is substituted for the official source.</p>
      </div>:districts.length===0?
        <div className="real-map-loading" role="status">Loading 21 source-derived Madrid districts…</div>:
        <svg data-testid="real-madrid-map" className="real-svg" viewBox={panZoom()}
          onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(1,Math.min(4,z*(e.deltaY<0?1.12:.9))))}}
          onPointerDown={e=>{start.current={x:e.clientX,y:e.clientY,ox:offset[0],oy:offset[1]};moved.current=false;e.currentTarget.setPointerCapture(e.pointerId)}}
          onPointerMove={e=>{if(!start.current)return;const a=start.current;const deltaX=e.clientX-a.x,deltaY=e.clientY-a.y;
            if(Math.abs(deltaX)+Math.abs(deltaY)>4)moved.current=true;
            if(moved.current){const box=e.currentTarget.getBoundingClientRect();setOffset([a.ox+deltaX/box.width*WIDTH/zoom,a.oy+deltaY/box.height*HEIGHT/zoom]);}}}
          onPointerUp={()=>{start.current=null}}
          onPointerCancel={()=>{start.current=null}}>
          <defs><filter id="real-district-glow"><feGaussianBlur stdDeviation="3"/></filter></defs>
          {districts.map((d,i)=><path key={d.code} d={d.path} fillRule="evenodd"
            className={'real-district'+(selected===d.code?' selected':'')}
            style={{fill:selected===d.code?'#b18c60':i%4===0?'#426d73':i%4===1?'#345e69':i%4===2?'#517c75':'#436b68'}}
            role="button" tabIndex={0} aria-label={'Select '+d.name+' official district'}
            onClick={()=>{if(!moved.current)setSelected(d.code)}}
            onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(d.code)}}}/>)}
          {current&&<g className="real-selected-marker" aria-hidden="true">
            <circle cx={current.cx} cy={current.cy} r={5/Math.sqrt(zoom)} fill="#f1d59f"/>
            <text x={current.cx+9/zoom} y={current.cy-8/zoom} fontSize={15/zoom}>{current.name}</text>
          </g>}
        </svg>}
      <div className="real-zoom">
        <button onClick={()=>setZoom(z=>Math.min(4,z*1.25))} aria-label="Zoom in">+</button>
        <button onClick={()=>setZoom(z=>Math.max(1,z/1.25))} aria-label="Zoom out">−</button>
        <button onClick={()=>{setZoom(1);setOffset([0,0])}} aria-label="Reset camera">⌖</button>
      </div>
      <div className="real-legend"><span>21 district boundaries</span><strong>OBSERVED SOURCE → DERIVED DISPLAY</strong></div>
    </section>
    <aside className="real-inspector">
      <span className="eyebrow">MADRID / EXPLORE MODE</span>
      <h2>The real city.</h2>
      <p className="lead">Source-based district geography, with honest separation from synthetic gameplay.</p>
      <div className="chapter"><span className="chapter-index">CHAPTER 01</span><strong>Administrative geography</strong><span className="chip">SOURCED</span></div>
      <input className="real-search" aria-label="Search Madrid districts" value={filter} onChange={e=>setFilter(e.target.value)}
        placeholder="Search Centro, Retiro, Salamanca…" />
      <div className="real-districts" role="list" aria-label="Madrid district selector">
        {matches.map(d=><button type="button" role="listitem" key={d.code} className={selected===d.code?'active':''} onClick={()=>setSelected(d.code)}>
          <span>{d.code} · {d.name}</span><small>{selected===d.code?'SELECTED':'EXPLORE'}</small>
        </button>)}
      </div>
      <div className="real-selection" aria-live="polite">
        <span className="eyebrow">OFFICIAL ADMINISTRATIVE IDENTITY</span>
        <h3>{current?current.name:'Data unavailable'}</h3>
        <div className="property"><span>Distrito code</span><strong>{current?.code||'—'}</strong></div>
        <div className="property"><span>Native source grain</span><strong>Distrito</strong></div>
        <div className="property"><span>Polygon</span><strong>Derived from official data</strong></div>
        <div className="property"><span>Building eligibility</span><strong>UNVERIFIED · LOCKED</strong></div>
      </div>
      <div className="real-truth"><b>PROVENANCE / READ BEFORE USING</b>
        <p>Ayuntamiento de Madrid, district source 900012-3. Open-data catalog lists CC BY 4.0. This rendering uses a 0.0005° topology-preserving simplification and 1e-5° coordinate quantization of a SHA-pinned audited source; it is not legal parcel, terrain, or utility data.</p>
        <p>Raw SHA256: <code>{RAW_SHA}</code></p>
        <p>Converted GeoJSON SHA256: <code>{DERIVED_SHA}</code></p>
        <a href={SOURCE_PAGE} target="_blank" rel="noreferrer">Ayuntamiento official source ↗</a>
      </div>
      <div className="real-locked" role="status"><strong>CONSTRUCTION LOCKED IN REAL EXPLORE</strong><p>Administrative boundaries never authorize building. Switch to Synthetic Play for the 12-quarter game.</p></div>
      <footer className="inspector-footer">CIVIMADRID / SOURCED MAP PREVIEW <span>M1 REVIEW</span></footer>
    </aside>
  </main>;
}

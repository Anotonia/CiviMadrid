/**
 * Minimal TopoJSON polygon extraction for a Madrid source-import spike.
 * Converts delta-encoded arcs and transform into WGS84-style GeoJSON geometry;
 * the returned coordinates MUST still pass the independent Madrid CRS/range gate.
 *
 * No geographic source is silently assumed to be EPSG:4326.
 * This module does not repair topology, swap CRS, simplify borders, or invent data.
 */
const isNumber = x => typeof x === 'number' && Number.isFinite(x);

export function topologyToGeoJSON(topology, onBoundedBridge = null) {
  if (!topology || topology.type !== 'Topology' || !Array.isArray(topology.arcs) ||
      !topology.objects || typeof topology.objects !== 'object') {
    throw new Error('Expected TopoJSON Topology with arcs and objects');
  }
  const scale=topology.transform?.scale;
  const translate=topology.transform?.translate;
  const transformed=Boolean(scale||translate);
  if(transformed && (!Array.isArray(scale)||!Array.isArray(translate)||
      scale.length<2||translate.length<2||![...scale,...translate].every(isNumber))) {
    throw new Error('Invalid TopoJSON coordinate transform');
  }
  const decodePoint = p => {
    if(!Array.isArray(p)||p.length<2||!isNumber(p[0])||!isNumber(p[1])){
      throw new Error('Non-numeric TopoJSON point');
    }
    const result=transformed
      ? [p[0]*scale[0]+translate[0],p[1]*scale[1]+translate[1]]
      : [p[0],p[1]];
    if(!result.every(isNumber)) throw new Error('Invalid decoded coordinate');
    return result;
  };
  // Some official district exports contain 1–2 quantization-grid-cell seams.
  // Preserve both endpoints and add a short explicit connection, but NEVER
  // silently repair larger gaps or unquantized data. Report every bridge.
  const allowedSteps = 3;
  const bridgeSteps = (from,to) => {
    if (!transformed || scale[0]===0 || scale[1]===0) return Infinity;
    return Math.max(Math.abs((to[0]-from[0])/scale[0]),Math.abs((to[1]-from[1])/scale[1]));
  };
  const maybeBridge = (from,to,kind,index) => {
    const steps=bridgeSteps(from,to);
    if (!Number.isFinite(steps) || steps>allowedSteps+1e-6) return false;
    if (typeof onBoundedBridge==='function')
      onBoundedBridge({kind,index,gapInQuantizationSteps:steps});
    return true;
  };
  const arcCache = new Map();
  function getArc(index){
    if(!Number.isInteger(index))throw new Error('Invalid TopoJSON arc index');
    const actual=index<0?~index:index;
    if(actual<0||actual>=topology.arcs.length)throw new Error('Arc index out of bounds');
    if(!arcCache.has(actual)){
      let x=0,y=0;
      const decoded=[];
      for(const p of topology.arcs[actual]){
        if(!Array.isArray(p)||p.length<2||!isNumber(p[0])||!isNumber(p[1])) {
          throw new Error('Invalid TopoJSON arc coordinates');
        }
        if(transformed){x+=p[0];y+=p[1];decoded.push(decodePoint([x,y]));}
        else decoded.push(decodePoint(p));
      }
      if(decoded.length<2)throw new Error('Arc requires at least two points');
      arcCache.set(actual,decoded);
    }
    const copy=arcCache.get(actual).map(p=>p.slice());
    return index<0?copy.reverse():copy;
  }
  function ringFromArcs(indices){
    if(!Array.isArray(indices)||!indices.length)throw new Error('Missing polygon ring arcs');
    let points=[];
    for(const idx of indices){
      const arc=getArc(idx);
      if(points.length){
        const prev=points[points.length-1], start=arc[0];
        if(prev[0]!==start[0]||prev[1]!==start[1]){
          if(!maybeBridge(prev,start,'arc_join',idx))
            throw new Error('Disconnected TopoJSON arcs: index '+idx+'; previous='+JSON.stringify(prev)+' next='+JSON.stringify(start));
          // Retain original vertices and the implied short edge. Never move a source point.
          points.push(...arc);
        } else points.push(...arc.slice(1));
      }else points.push(...arc);
    }
    if(points.length<4)throw new Error('Open polygon ring');
    const first=points[0],last=points[points.length-1];
    if(first[0]!==last[0]||first[1]!==last[1]){
      if(!maybeBridge(last,first,'ring_closure',null))
        throw new Error('Open polygon ring');
      points.push(first.slice());
    }
    return points;
  }
  function extractShape(g) {
    if(!g||typeof g!=='object')throw new Error('Invalid TopoJSON geometry');
    if(g.type==='Polygon'){
      if(!Array.isArray(g.arcs))throw new Error('Polygon requires arc rings');
      return {type:'Polygon',coordinates:g.arcs.map(ringFromArcs)};
    }
    if(g.type==='MultiPolygon'){
      if(!Array.isArray(g.arcs))throw new Error('MultiPolygon requires polygons');
      return {type:'MultiPolygon',coordinates:g.arcs.map(p=>p.map(ringFromArcs))};
    }
    throw new Error(`Unsupported TopoJSON feature geometry: ${String(g.type)}`);
  }
  const features=[];
  for(const [objectName,object] of Object.entries(topology.objects)){
    const geometryList=object?.type==='GeometryCollection'?object.geometries:[object];
    if(!Array.isArray(geometryList))throw new Error('Invalid TopoJSON geometry collection');
    for(const geom of geometryList){
      if(geom?.type==='null'||geom?.type===null)continue;
      features.push({
        type:'Feature',
        ...(geom.id===undefined?{}:{id:geom.id}),
        properties:{...(geom.properties||{}),_sourceObject:objectName},
        geometry:extractShape(geom)
      });
    }
  }
  if(!features.length)throw new Error('Empty TopoJSON polygon collection');
  return {type:'FeatureCollection',features};
}

/** Refuse unknown / projected CRS rather than accidentally relabeling as Madrid WGS84. */
export function requireMadridWGS84(features, validateGeoJSON) {
  const issues=validateGeoJSON(features);
  if(issues.length)throw new Error('Decoded geometry needs CRS / polygon review: '+issues.slice(0,5).join('; '));
  return features;
}


/** Read-only seam audit in original TopoJSON quantization-grid coordinates.
 * No polygon vertices are moved, snapped or published by this function.
 * Report topology joins and ring closure, including all outlier gaps.
 */
export function auditTopoJSONSeams(topology) {
  if(topology?.type!=='Topology'||!Array.isArray(topology.arcs) || !topology.objects)
    throw new Error('Expected TopoJSON Topology');
  const endpoints=topology.arcs.map(arc=>{
    if(!Array.isArray(arc)||!arc.length)throw new Error('Empty TopoJSON arc');
    const first=arc[0];
    let x=0,y=0;
    for(const delta of arc){
      if(!Array.isArray(delta)||!isNumber(delta[0])||!isNumber(delta[1]))
        throw new Error('Invalid TopoJSON delta coordinate');
      if(topology.transform){x+=delta[0];y+=delta[1];}
      else {x=delta[0];y=delta[1];}
    }
    return {first:first.slice(0,2),last:[x,y]};
  });
  const pointPair=id=>{
    if(!Number.isInteger(id))throw new Error('Invalid TopoJSON arc index');
    const n=id<0?~id:id;
    if(!endpoints[n])throw new Error('Out of bounds TopoJSON arc');
    const e=endpoints[n];
    return id<0?{start:e.last,end:e.first}:{start:e.first,end:e.last};
  };
  let rings=0,nonzero=0,maxGapSteps=0;
  const buckets={'1-3':0,'4-10':0,'11-100':0,'over100':0};
  const examples=[];
  const measure=(a,b,where)=>{
    const distance=Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
    if(distance===0)return;
    nonzero++;maxGapSteps=Math.max(maxGapSteps,distance);
    if(distance<=3)buckets['1-3']++;
    else if(distance<=10)buckets['4-10']++;
    else if(distance<=100)buckets['11-100']++;
    else buckets.over100++;
    if(examples.length<8 || distance>Math.min(...examples.map(v=>v.gapSteps))) {
      examples.push({gapSteps:distance,at:where});
      examples.sort((a,b)=>b.gapSteps-a.gapSteps);
      if(examples.length>8)examples.pop();
    }
  };
  const measureRing=ring=>{
    if(!Array.isArray(ring)||!ring.length)throw new Error('Empty TopoJSON ring');
    rings++;
    const joins=ring.map(pointPair);
    for(let i=1;i<joins.length;i++)measure(joins[i-1].end,joins[i].start,'arc_join');
    measure(joins.at(-1).end,joins[0].start,'ring_closure');
  };
  for(const object of Object.values(topology.objects)){
    const geometries=object?.type==='GeometryCollection'?object.geometries:[object];
    for(const g of geometries||[]){
      if(g?.type==='Polygon')for(const ring of g.arcs)measureRing(ring);
      else if(g?.type==='MultiPolygon')for(const poly of g.arcs)for(const ring of poly)measureRing(ring);
    }
  }
  return {rings,nonzero,maxGapSteps,buckets,largestGaps:examples};
}

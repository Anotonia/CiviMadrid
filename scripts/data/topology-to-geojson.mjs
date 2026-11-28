/**
 * Minimal TopoJSON polygon extraction for a Madrid source-import spike.
 * Converts delta-encoded arcs and transform into WGS84-style GeoJSON geometry;
 * the returned coordinates MUST still pass the independent Madrid CRS/range gate.
 *
 * No geographic source is silently assumed to be EPSG:4326.
 * This module does not repair topology, swap CRS, simplify borders, or invent data.
 */
const isNumber = x => typeof x === 'number' && Number.isFinite(x);

export function topologyToGeoJSON(topology) {
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
        if(prev[0]!==start[0]||prev[1]!==start[1])throw new Error('Disconnected TopoJSON arcs: index '+idx+'; previous='+JSON.stringify(prev)+' next='+JSON.stringify(start)+' delta='+JSON.stringify([start[0]-prev[0],start[1]-prev[1]]));
        points.push(...arc.slice(1));
      }else points.push(...arc);
    }
    if(points.length<4||points[0][0]!==points[points.length-1][0]||
       points[0][1]!==points[points.length-1][1])throw new Error('Open polygon ring');
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

/**
 * Source audit gate. Only WGS84 GeoJSON may be called georeferenced Madrid geometry.
 * TopoJSON (quantized arcs) and projected-coordinate formats need explicit conversion.
 */
const bounds={minLon:-3.95,maxLon:-3.3,minLat:40.15,maxLat:40.75};
const finite=(n)=>typeof n==='number' && Number.isFinite(n);

export function validateMadridGeoJSON(data){
  const errors=[];
  if(!data||typeof data!=='object')return ['Not an object'];
  if(data.type!=='FeatureCollection')return ['Expected WGS84 FeatureCollection; decode/transform TopoJSON or projected coordinates first'];
  if(!Array.isArray(data.features)||!data.features.length)return ['FeatureCollection must contain polygons'];
  const ids=new Set();
  for(let i=0;i<data.features.length;i++){
    const f=data.features[i],g=f?.geometry;
    if(f?.type!=='Feature'||!['Polygon','MultiPolygon'].includes(g?.type)){
      errors.push(`Feature ${i} must contain Polygon or MultiPolygon`);continue;
    }
    const polygons=g.type==='Polygon'?[g.coordinates]:g.coordinates;
    if(!Array.isArray(polygons)||!polygons.length){errors.push(`Feature ${i} missing polygons`);continue;}
    const fid=f.id??f.properties?.COD_DIS??f.properties?.ID;
    if(fid!==undefined){if(ids.has(String(fid)))errors.push(`Duplicate feature ID ${fid}`);ids.add(String(fid));}
    for(const poly of polygons){
      if(!Array.isArray(poly)||!poly.length){errors.push(`Feature ${i} missing rings`);continue;}
      for(const ring of poly){
        if(!Array.isArray(ring)||ring.length<4){errors.push(`Feature ${i} ring has fewer than 4 vertices`);continue;}
        const first=ring[0],last=ring[ring.length-1];
        if(!Array.isArray(first)||!Array.isArray(last)||first[0]!==last[0]||first[1]!==last[1]){
          errors.push(`Feature ${i} has open polygon ring`);
        }
        for(const pt of ring){
          if(!Array.isArray(pt)||pt.length<2||!finite(pt[0])||!finite(pt[1])){
            errors.push(`Feature ${i} includes nonnumeric coordinates`);break;
          }
          if(pt[0]<bounds.minLon||pt[0]>bounds.maxLon||
             pt[1]<bounds.minLat||pt[1]>bounds.maxLat){
            errors.push(`Feature ${i} coordinates outside broad Madrid WGS84 bounds; check CRS and source`);break;
          }
        }
      }
    }
  }
  return errors;
}

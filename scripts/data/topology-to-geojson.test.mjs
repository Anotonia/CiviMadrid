import {test} from 'node:test';
import assert from 'node:assert/strict';
import {topologyToGeoJSON,requireMadridWGS84} from './topology-to-geojson.mjs';
import {validateMadridGeoJSON} from './validate-madrid-geometry.mjs';

const topology=()=>({
 type:'Topology',
 transform:{scale:[.001,.001],translate:[-3.70,40.42]},
 arcs:[
  [[0,0],[10,0],[0,10]], // bottom -> right side
  [[0,0],[0,10],[10,0]], // left -> top side (reversed when used)
 ],
 objects:{Distritos:{type:'GeometryCollection',geometries:[
   {type:'Polygon',id:'001',properties:{NOM_DIS:'Synthetic district fixture'},arcs:[[0,-2]]}
 ]}}
});
test('decodes quantized delta arcs including reversed arc and retains district properties',()=>{
 const f=topologyToGeoJSON(topology());
 assert.equal(f.type,'FeatureCollection');
 assert.equal(f.features.length,1);
 assert.equal(f.features[0].id,'001');
 assert.equal(f.features[0].properties.NOM_DIS,'Synthetic district fixture');
 assert.deepEqual(f.features[0].geometry.coordinates[0][0],[-3.70,40.42]);
 assert.deepEqual(f.features[0].geometry.coordinates[0].at(-1),[-3.70,40.42]);
 assert.deepEqual(requireMadridWGS84(f,validateMadridGeoJSON),f);
});
test('decodes MultiPolygon with same ring logic and does not fabricate CRS',()=>{
 const t=topology();
 t.objects={d:{type:'MultiPolygon',id:'002',properties:{},arcs:[[[0,-2]],[[0,-2]]]}};
 const f=topologyToGeoJSON(t);
 assert.equal(f.features[0].geometry.type,'MultiPolygon');
 assert.equal(f.features[0].geometry.coordinates.length,2);
});
test('rejects projected coordinates instead of silently assuming WGS84',()=>{
 const t=topology();
 t.transform={scale:[100,100],translate:[440000,4470000]};
 const f=topologyToGeoJSON(t);
 assert.throws(()=>requireMadridWGS84(f,validateMadridGeoJSON),/CRS \/ polygon review/);
});
test('rejects disconnected, malformed and unsupported geometry',()=>{
 const missing=topology();missing.arcs[1]=[[100,100],[0,10],[10,0]];
 assert.throws(()=>topologyToGeoJSON(missing),/Disconnected/);
 const malformed=topology();malformed.arcs[0][1]=[NaN,0];
 assert.throws(()=>topologyToGeoJSON(malformed),/Invalid TopoJSON arc/);
 const bad=topology();bad.objects.Distritos.geometries[0].type='Point';
 assert.throws(()=>topologyToGeoJSON(bad),/Unsupported/);
});
test('rejects out-of-range negative arc IDs and invalid transforms',()=>{
 const t=topology();t.objects.Distritos.geometries[0].arcs=[[0,-9]];
 assert.throws(()=>topologyToGeoJSON(t),/out of bounds/);
 const u=topology();u.transform.scale=[Number.POSITIVE_INFINITY,1];
 assert.throws(()=>topologyToGeoJSON(u),/Invalid TopoJSON coordinate transform/);
});

test('bridges only very small quantized official source seams without moving vertices',()=>{
 const t=topology();
 // Reversed second arc now starts one quantization unit east and two north
 // of the preceding arc, and closes with the same bounded offset.
 t.arcs[1][0]=[1,2];
 const bridges=[];
 const collection=topologyToGeoJSON(t,entry=>bridges.push(entry));
 assert.equal(bridges.length,2);
 assert.ok(bridges.every(b=>b.gapInQuantizationSteps<=3));
 const ring=collection.features[0].geometry.coordinates[0];
 assert.deepEqual(ring[0],ring.at(-1));
 assert.ok(ring.some(p=>Math.abs(p[0]-(-3.699))<1e-10&&Math.abs(p[1]-40.422)<1e-10));
 assert.deepEqual(validateMadridGeoJSON(collection),[]);
});
test('refuses gaps larger than three quantization cells in a referenced arc',()=>{
 const t=topology();t.arcs[1][0]=[4,4];
 assert.throws(()=>topologyToGeoJSON(t),/Disconnected TopoJSON arcs/);
});

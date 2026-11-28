import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateMadridGeoJSON} from './validate-madrid-geometry.mjs';
const square=(x=-3.70,y=40.42)=>[[x,y],[x+0.01,y],[x+0.01,y+0.01],[x,y+0.01],[x,y]];
const fixture={type:'FeatureCollection',features:[
  {type:'Feature',id:'001',properties:{name:'Synthetic geometry fixture'},
   geometry:{type:'Polygon',coordinates:[square()]}}
]};
test('accepts clearly declared WGS84 polygon fixture inside broad Madrid bounds',()=>{
 assert.deepEqual(validateMadridGeoJSON(fixture),[]);
});
test('rejects source that is census section TopoJSON without conversion',()=>{
 assert.match(validateMadridGeoJSON({type:'Topology',objects:{}})[0],/decode\/transform/);
});
test('rejects non-closed polygon and out-of-range / projected coordinates',()=>{
 const bad=structuredClone(fixture);
 bad.features[0].geometry.coordinates[0][4]=[-3.701,40.421];
 assert.ok(validateMadridGeoJSON(bad).some(x=>x.includes('open polygon')));
 const projected=structuredClone(fixture);
 projected.features[0].geometry.coordinates[0][0]=[440000,4470000];
 assert.ok(validateMadridGeoJSON(projected).some(x=>x.includes('outside broad Madrid')));
});
test('rejects missing polygons, duplicate ids and invalid numeric coordinates',()=>{
 assert.ok(validateMadridGeoJSON({type:'FeatureCollection',features:[]}).length);
 const cloned=structuredClone(fixture);
 cloned.features.push(structuredClone(cloned.features[0]));
 assert.ok(validateMadridGeoJSON(cloned).some(x=>x.includes('Duplicate')));
 const malformed=structuredClone(fixture);
 malformed.features[0].geometry.coordinates[0][1]=[NaN,40.42];
 assert.ok(validateMadridGeoJSON(malformed).some(x=>x.includes('nonnumeric')));
});

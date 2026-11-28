import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {convertStagedDistricts} from './convert-staged-districts.mjs';

const validTopology=()=>({
 type:'Topology',
 transform:{scale:[.001,.001],translate:[-3.70,40.42]},
 arcs:[[[0,0],[10,0],[0,10],[-10,0],[0,-10]]],
 objects:{Distritos:{type:'GeometryCollection',geometries:[
  {type:'Polygon',id:'001',properties:{NOM_DIS:'TEST SYNTHETIC'},arcs:[[0]]}
 ]}}
});
const manifestFor=raw=>({
 sourceId:'madrid-district-boundaries-900012-3',
 publisher:'Synthetic test publisher (NOT OFFICIAL)',datasetTitle:'Synthetic boundary test',
 downloadUrl:'https://example.test/fixture',licenseUrl:'https://example.test/license',
 attributionText:'Synthetic test only',dateRetrieved:'2026-11-27',
 sourceGeographicGrain:'district administrative polygons',
 crs:'UNKNOWN',fieldsUsed:['geometry'],
 fileSha256:createHash('sha256').update(raw).digest('hex'),
 transformationVersion:'raw-v0',limitations:'Synthetic only'
});
async function staging(fn){
 const dir=await mkdtemp(path.join(tmpdir(),'civimadrid-geo-'));
 try {await fn(dir);} finally {await rm(dir,{recursive:true,force:true});}
}
async function stage(dir,obj,sourceId='madrid-district-boundaries-900012-3'){
 const raw=Buffer.from(JSON.stringify(obj));
 const manifest={...manifestFor(raw),sourceId};
 await writeFile(path.join(dir,'madrid-districts.raw.json'),raw);
 await writeFile(path.join(dir,'madrid-districts.manifest.json'),JSON.stringify(manifest));
}
test('converts source-controlled TopoJSON into validated GeoJSON and geometry report',async()=>{
 await staging(async dir=>{
  await stage(dir,validTopology());
  const report=await convertStagedDistricts(dir);
  const output=JSON.parse(await readFile(path.join(dir,report.output),'utf8'));
  assert.equal(report.districtFeatureCount,1);
  assert.equal(report.bounds.west,-3.70);
  assert.equal(output.features[0].geometry.coordinates[0].length,5);
  assert.equal(output.features[0].properties.NOM_DIS,'TEST SYNTHETIC');
  assert.match(report.geojsonSha256,/^[a-f0-9]{64}$/);
 });
});
test('refuses incorrect source id and never emits validated geometry',async()=>{
 await staging(async dir=>{
  await stage(dir,validTopology(),'madrid-census-900012-5');
  await assert.rejects(convertStagedDistricts(dir),/Wrong source identifier/);
  await assert.rejects(access(path.join(dir,'madrid-districts.wgs84.geojson')));
 });
});
test('refuses projected coordinate topology rather than mislabeling the CRS',async()=>{
 await staging(async dir=>{
  const topo=validTopology();topo.transform={scale:[100,100],translate:[440000,4470000]};
  await stage(dir,topo);
  await assert.rejects(convertStagedDistricts(dir),/CRS \/ polygon review/);
  await assert.rejects(access(path.join(dir,'madrid-districts.wgs84.geojson')));
 });
});
test('fails closed on tampered original bytes',async()=>{
 await staging(async dir=>{
  await stage(dir,validTopology());
  const raw=await readFile(path.join(dir,'madrid-districts.raw.json'));
  await writeFile(path.join(dir,'madrid-districts.raw.json'),Buffer.concat([raw,Buffer.from(' ')]));
  await assert.rejects(convertStagedDistricts(dir),/SHA256/);
 });
});

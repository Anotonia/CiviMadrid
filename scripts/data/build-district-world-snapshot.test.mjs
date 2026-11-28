import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {RESOURCE} from './fetch-madrid-boundaries.mjs';
import {convertStagedDistricts} from './convert-staged-districts.mjs';
import {buildDistrictWorldSnapshot,buildAndWriteDistrictSnapshot} from './build-district-world-snapshot.mjs';

const polygon=(i)=>({
 type:'Feature',properties:{COD_DIS_TX:String(i).padStart(2,'0'),NOMBRE:i===1?'Centro':i===21?'Barajas':'Synthetic '+i},
 geometry:{type:'Polygon',coordinates:[[[-3.75+i*.002,40.42],[-3.748+i*.002,40.42],
  [-3.748+i*.002,40.422],[-3.75+i*.002,40.422],[-3.75+i*.002,40.42]]]}
});
const collection=(n=1)=>({type:'FeatureCollection',features:Array.from({length:n},(_,i)=>polygon(i+1))});
const mockManifest=raw=>({
 sourceId:RESOURCE.sourceId,publisher:'Synthetic fixture ONLY',
 datasetTitle:'Synthetic district geometries',downloadUrl:RESOURCE.geoportalTopoJSONUrl,
 licenseUrl:RESOURCE.licenseUrl,attributionText:'Synthetic test only',
 dateRetrieved:'2026-11-28',sourceGeographicGrain:'district',
 crs:'UNKNOWN',fieldsUsed:['geometry'],fileSha256:createHash('sha256').update(raw).digest('hex'),
 transformationVersion:'raw-v0',limitations:'Synthetic only'
});
test('district WorldSnapshot follows frozen contract and does not invent building eligibility',()=>{
 const source=collection();
 const result=buildDistrictWorldSnapshot(source,mockManifest(Buffer.from(JSON.stringify(source))),{expectedCount:1});
 assert.equal(result.schemaVersion,'0.1');
 assert.equal(result.cellGrid.indexSystem,'municipal-district-polygons');
 assert.equal(result.cellGrid.cellsCount,1);
 assert.equal(result.geoCells[0].id,'district-01');
 assert.ok(Math.abs(result.geoCells[0].centerLon+3.749)<.00001);
 assert.ok(Math.abs(result.geoCells[0].centerLat-40.421)<.00001);
 assert.equal(result.geoCells[0].buildable,false);
 assert.equal(result.geoCells[0].terrain,'other');
 assert.equal(result.geoCells[0].provenance.centerLon.kind,'derived');
 assert.equal(result.geoCells[0].provenance.terrain.kind,'synthetic');
 assert.equal(result.geoCells[0].provenance.buildable.kind,'scenario');
 assert.equal(result.observedLayers.districtNames.values['district-01'],'Centro');
});
test('wrong count, duplicate IDs and missing official labels fail closed',()=>{
 const source=collection(2),m=mockManifest(Buffer.from('fixture'));
 assert.throws(()=>buildDistrictWorldSnapshot(source,m),/feature-count gate/);
 source.features[1].properties.COD_DIS_TX='01';
 assert.throws(()=>buildDistrictWorldSnapshot(source,m,{expectedCount:2}),/Duplicate official district codes/);
 source.features[1].properties.COD_DIS_TX='02';
 delete source.features[1].properties.NOMBRE;
 assert.throws(()=>buildDistrictWorldSnapshot(source,m,{expectedCount:2}),/Missing official district name/);
});
test('wrong distribution or license cannot pose as trusted district manifest',()=>{
 const source=collection(),m=mockManifest(Buffer.from('fixture'));
 assert.throws(()=>buildDistrictWorldSnapshot(source,{...m,downloadUrl:'https://example.test/not-madrid'},{expectedCount:1}),/pinned official distribution/);
 assert.throws(()=>buildDistrictWorldSnapshot(source,{...m,licenseUrl:'https://example.test/licence'},{expectedCount:1}),/pinned official distribution/);
});
test('staged 21-feature synthetic fixture creates byte-hashed, non-buildable snapshot',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'civimadrid-snapshot-'));
 try{
  const geojson=collection(21),raw=Buffer.from(JSON.stringify(geojson));
  const manifest=mockManifest(raw);
  await writeFile(path.join(dir,'madrid-districts.raw.json'),raw);
  await writeFile(path.join(dir,'madrid-districts.manifest.json'),JSON.stringify(manifest));
  await convertStagedDistricts(dir);
  const report=await buildAndWriteDistrictSnapshot(dir);
  assert.equal(report.districts,21);
  assert.equal(report.buildableDistrictCells,0);
  assert.match(report.worldSnapshotSha256,/^[a-f0-9]{64}$/);
  const saved=JSON.parse(await readFile(path.join(dir,'madrid-districts.world-snapshot.json'),'utf8'));
  assert.equal(saved.geoCells.length,21);
  assert.equal(saved.observedLayers.districtNames.values['district-21'],'Barajas');
  assert.equal(saved.geoCells.every(c=>c.buildable===false),true);
  await writeFile(path.join(dir,'madrid-districts.wgs84.geojson'),'{}');
  await assert.rejects(buildAndWriteDistrictSnapshot(dir),/checksum mismatch/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

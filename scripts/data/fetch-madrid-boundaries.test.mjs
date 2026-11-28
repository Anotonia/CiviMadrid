import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { acquire, RESOURCE } from './fetch-madrid-boundaries.mjs';
import { validateManifest } from './validate-manifest.mjs';
const mock = bytes => async () => ({ok:true,arrayBuffer:async()=>bytes});
test('source fixture is downloaded and checksummed with attribution',async()=>{
  const data = Buffer.from(JSON.stringify({type:'FeatureCollection',features:[{
    type:'Feature',id:'synthetic-fixture',properties:{},
    geometry:{type:'Polygon',coordinates:[[[-3.70,40.42],[-3.69,40.42],[-3.69,40.43],[-3.70,40.42]]]}
  }]}));
  const dir=await mkdtemp(path.join(tmpdir(),'civimadrid-'));
  try {
    const outcome=await acquire(dir,mock(data));
    const raw=await readFile(path.join(dir,'madrid-districts.raw.json'));
    assert.equal(raw.compare(data),0);
    assert.deepEqual(validateManifest(outcome.manifest,raw),[]);
    assert.equal(outcome.manifest.downloadUrl,RESOURCE.downloadUrl);
    assert.ok(outcome.manifest.attributionText.includes('Ayuntamiento'));
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('rejects invalid/non-geographic responses',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'civimadrid-'));
  try {
    await assert.rejects(acquire(dir,mock(Buffer.from('<html>oops</html>'))),/not JSON/);
    await assert.rejects(acquire(dir,mock(Buffer.from('{"type":"NotGeometry"}'))),/Unexpected geometry/);
  } finally {await rm(dir,{recursive:true,force:true});}
});

test('regression: official district layer is resource 900012-3, not census sections 900012-5',()=>{
  assert.match(RESOURCE.downloadUrl,/900012-3-limites-administrativos-mapas/);
  assert.match(RESOURCE.resourcePage,/900012-3-limites-administrativos-mapas/);
  assert.doesNotMatch(RESOURCE.downloadUrl,/900012-5/);
});

test('Geoportal direct TopoJSON is an explicit official source, recorded in manifest', async()=>{
  const topology=Buffer.from(JSON.stringify({type:'Topology',arcs:[],objects:{Distritos:{type:'GeometryCollection',geometries:[]}}}));
  const dir=await mkdtemp(path.join(tmpdir(),'civimadrid-geoportal-'));
  let fetchedUrl='';
  try {
    const result=await acquire(dir,async url=>{fetchedUrl=url;return {ok:true,arrayBuffer:async()=>topology};},RESOURCE.geoportalTopoJSONUrl);
    assert.equal(fetchedUrl,RESOURCE.geoportalTopoJSONUrl);
    assert.equal(result.manifest.downloadUrl,RESOURCE.geoportalTopoJSONUrl);
    assert.deepEqual(validateManifest(result.manifest,topology),[]);
    assert.equal((await readFile(path.join(dir,'madrid-districts.raw.json'))).compare(topology),0);
  } finally {await rm(dir,{recursive:true,force:true});}
});
test('refuses substituted download endpoints before contacting network', async()=>{
  let called=false;
  await assert.rejects(
    acquire('.data-staging',async()=>{called=true;return {ok:true};},'https://example.test/false-districts.json'),
    /Unapproved Madrid district distribution URL/
  );
  assert.equal(called,false);
});

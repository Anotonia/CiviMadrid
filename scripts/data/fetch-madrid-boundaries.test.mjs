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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { acquire, RESOURCE } from './fetch-madrid-boundaries.mjs';
import { validateManifest } from './validate-manifest.mjs';
const mock = bytes => async () => ({ok:true,arrayBuffer:async()=>bytes});
test('source fixture is downloaded and checksummed with attribution',async()=>{
  const data = Buffer.from(JSON.stringify({type:'FeatureCollection',features:[]}));
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

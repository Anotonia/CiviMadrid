import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateManifest } from './validate-manifest.mjs';
const bytes = Buffer.from('synthetic test source bytes');
const record = {
  sourceId:'fixture-only', publisher:'TEST ONLY', datasetTitle:'Not real Madrid data',
  downloadUrl:'https://example.test/fixture', licenseUrl:'https://example.test/license',
  attributionText:'Fixture only', dateRetrieved:'2026-11-26',
  sourceGeographicGrain:'synthetic fixtures', crs:'EPSG:4326',
  fieldsUsed:['cellId'], fileSha256:createHash('sha256').update(bytes).digest('hex'),
  transformationVersion:'test-1', limitations:'No real-world data'
};
test('valid source-manifest shape and checksum',()=>{
  assert.deepEqual(validateManifest(record,bytes),[]);
});
test('rejects missing license and attribution',()=>{
  const broken={...record,licenseUrl:'',attributionText:''};
  assert.ok(validateManifest(broken,bytes).some(x=>x.includes('licenseUrl')));
  assert.ok(validateManifest(broken,bytes).some(x=>x.includes('attributionText')));
});
test('rejects unexpected downloaded bytes',()=>{
  assert.ok(validateManifest(record,Buffer.from('different')).some(x=>x.includes('SHA256')));
});

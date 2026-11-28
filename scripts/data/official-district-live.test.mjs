import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,appendFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {acquire,RESOURCE} from './fetch-madrid-boundaries.mjs';
import {convertStagedDistricts} from './convert-staged-districts.mjs';
import {buildAndWriteDistrictSnapshot} from './build-district-world-snapshot.mjs';

// Live source auditing only on the GeoData draft PR's hosted CI runner.
// This never runs in normal/local unit test suites or in the integrated game.
// A failure means source ingestion is BLOCKED, never silently replaced by mock data.
const live=process.env.GITHUB_ACTIONS==='true' &&
  process.env.GITHUB_HEAD_REF==='agent/geodata-m0';

test('live official Madrid distrito distribution: 21 polygons, SHA256, WorldSnapshot', {
  skip:live?false:'Requires GeoData PR GitHub Actions network runner',
  timeout:80000
}, async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'civimadrid-official-'));
  try{
    const fetched=await acquire(dir,fetch,RESOURCE.geoportalTopoJSONUrl);
    console.log('Official district source fetched: '+fetched.bytes+' bytes; raw SHA256 '+fetched.sha256);
    const geo=await convertStagedDistricts(dir);
    const snapshot=await buildAndWriteDistrictSnapshot(dir);
    assert.equal(geo.districtFeatureCount,21);
    assert.equal(snapshot.districts,21);
    assert.equal(snapshot.buildableDistrictCells,0);
    const summary=[
      '## Madrid official GIS live acquisition (non-release)',
      'Source: '+RESOURCE.geoportalTopoJSONUrl,
      'Raw bytes: '+fetched.bytes,
      'Raw SHA256: '+fetched.sha256,
      'GeoJSON SHA256: '+geo.geojsonSha256,
      'WorldSnapshot SHA256: '+snapshot.worldSnapshotSha256,
      'District features: '+snapshot.districts,
      'Source license declared: '+RESOURCE.licenseUrl,
      'Buildability: all locked; no zoning or economic observations inferred.',
      'Manual source/CRS and game-map QA still required.'
    ].join('\n');
    console.log(summary);
    if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
  } finally {await rm(dir,{recursive:true,force:true});}
});

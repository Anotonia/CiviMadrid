#!/usr/bin/env node
/**
 * Construct a contract-v0.1 WorldSnapshot from checksum-verified official
 * Madrid distrito polygons. Districts are NOT playable hexes or zoned parcels:
 * all construction is locked until a separate land-use/buildability source
 * is reviewed. Preserve the matching GeoJSON for actual polygon rendering.
 *
 * Usage: node scripts/data/build-district-world-snapshot.mjs [.data-staging]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validateManifest } from './validate-manifest.mjs';
import { validateMadridGeoJSON } from './validate-madrid-geometry.mjs';
import { geometryBounds } from './convert-staged-districts.mjs';
import { RESOURCE } from './fetch-madrid-boundaries.mjs';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const METHOD = 'district-outer-ring-area-centroid-v0.1';

function areaCentroid(ring) {
  // Shift to a local origin to avoid catastrophic cancellation when
  // subtracting nearly equal longitude*latitude products at district scale.
  const [originLon,originLat]=ring[0];
  let crossSum = 0, xSum = 0, ySum = 0;
  for (let i=0; i<ring.length-1; i++) {
    const x0=ring[i][0]-originLon, y0=ring[i][1]-originLat;
    const x1=ring[i+1][0]-originLon, y1=ring[i+1][1]-originLat;
    const cross=x0*y1-x1*y0;
    crossSum+=cross;
    xSum+=(x0+x1)*cross;
    ySum+=(y0+y1)*cross;
  }
  if (Math.abs(crossSum)<1e-12) throw new Error('Degenerate district outer ring');
  return {x:originLon+xSum/(3*crossSum),y:originLat+ySum/(3*crossSum),weight:Math.abs(crossSum)};
}
function districtCenter(geometry) {
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  let weight=0, x=0, y=0;
  for (const polygon of polygons) {
    const center=areaCentroid(polygon[0]);
    weight+=center.weight;
    x+=center.x*center.weight;
    y+=center.y*center.weight;
  }
  if (weight<=0) throw new Error('District polygon lacks non-degenerate area');
  return [x/weight,y/weight];
}
function districtIdentity(feature) {
  const props=feature.properties||{};
  const raw=props.COD_DIS_TX??props.COD_DIS??feature.id;
  const n=Number(raw);
  if (!Number.isInteger(n)||n<1||n>21) throw new Error('Missing/invalid official district code');
  const name=props.NOMBRE??props.NOM_DIS;
  if (typeof name!=='string'||!name.trim()) throw new Error('Missing official district name');
  return {code:String(n).padStart(2,'0'),name:name.trim()};
}
export function buildDistrictWorldSnapshot(geojson, manifest, options={}) {
  const expectedCount=options.expectedCount??21;
  const issues=validateMadridGeoJSON(geojson);
  if (issues.length) throw new Error('Unusable district GeoJSON: '+issues.join('; '));
  if (manifest?.sourceId!==RESOURCE.sourceId ||
      ![RESOURCE.downloadUrl,RESOURCE.geoportalTopoJSONUrl].includes(manifest?.downloadUrl) ||
      manifest?.licenseUrl!==RESOURCE.licenseUrl) {
    throw new Error('District provenance must reference a pinned official distribution and license');
  }
  if (geojson.features.length!==expectedCount) {
    throw new Error('District feature-count gate: expected '+expectedCount+', found '+geojson.features.length);
  }
  const districtRecords=geojson.features.map(feature=>({
    ...districtIdentity(feature), center:districtCenter(feature.geometry)
  })).sort((a,b)=>a.code.localeCompare(b.code));
  if (new Set(districtRecords.map(d=>d.code)).size!==districtRecords.length) {
    throw new Error('Duplicate official district codes');
  }
  const source={
    sourceId:manifest.sourceId,sourceUrl:manifest.downloadUrl,
    license:manifest.licenseUrl,retrievedAt:manifest.dateRetrieved,
    nativeGrain:'district'
  };
  const geoCells=districtRecords.map(d=>({
    id:'district-'+d.code,
    centerLon:d.center[0],
    centerLat:d.center[1],
    terrain:'other',
    buildable:false,
    provenance:{
      centerLon:{...source,kind:'derived',methodVersion:METHOD,caveat:'Area-weighted source polygon center, not a surveyed build site.'},
      centerLat:{...source,kind:'derived',methodVersion:METHOD,caveat:'Area-weighted source polygon center, not a surveyed build site.'},
      terrain:{kind:'synthetic',caveat:'Unknown land-use classification; placeholder other, NOT observed terrain.'},
      buildable:{kind:'scenario',caveat:'Safety-locked by default. District boundary does NOT grant building eligibility.'}
    }
  }));
  return {
    schemaVersion:'0.1',
    geographyId:'madrid-districts-'+manifest.fileSha256.slice(0,16),
    boundary:geometryBounds(geojson),
    cellGrid:{indexSystem:'municipal-district-polygons',resolution:0,cellsCount:geoCells.length},
    geoCells,
    observedLayers:{
      districtNames:{
        title:'Madrid official district names',units:'name',nativeGrain:'district',
        valueKind:'observed',sourceIds:[manifest.sourceId],
        values:Object.fromEntries(districtRecords.map(d=>['district-'+d.code,d.name])),
        caveat:'Official administrative labels only; not observed building, utility, zoning or hex statistics.'
      }
    },
    manifestIds:[manifest.sourceId]
  };
}
export async function buildAndWriteDistrictSnapshot(dir) {
  const raw=await readFile(path.join(dir,'madrid-districts.raw.json'));
  const manifest=JSON.parse(await readFile(path.join(dir,'madrid-districts.manifest.json'),'utf8'));
  const errors=validateManifest(manifest,raw);
  if (errors.length) throw new Error('Raw source manifest rejected: '+errors.join('; '));
  const geojsonBytes=await readFile(path.join(dir,'madrid-districts.wgs84.geojson'));
  const report=JSON.parse(await readFile(path.join(dir,'madrid-districts.geometry-report.json'),'utf8'));
  if (report.rawSha256!==manifest.fileSha256 || report.geojsonSha256!==sha256(geojsonBytes)) {
    throw new Error('Derived geometry/report checksum mismatch');
  }
  const geojson=JSON.parse(geojsonBytes.toString('utf8'));
  const snapshot=buildDistrictWorldSnapshot(geojson,manifest);
  const bytes=Buffer.from(JSON.stringify(snapshot,null,2)+'\n');
  await writeFile(path.join(dir,'madrid-districts.world-snapshot.json'),bytes);
  const result={
    sourceId:manifest.sourceId,sourceUrl:manifest.downloadUrl,
    rawSha256:manifest.fileSha256,geojsonSha256:report.geojsonSha256,
    worldSnapshotSha256:sha256(bytes),districts:snapshot.geoCells.length,
    buildableDistrictCells:snapshot.geoCells.filter(c=>c.buildable).length,
    caveat:'Sourced district geometry, NOT buildable sites; human licensing and GIS review required before release.'
  };
  await writeFile(path.join(dir,'madrid-districts.snapshot-report.json'),JSON.stringify(result,null,2)+'\n');
  return result;
}
if (process.argv[1] && import.meta.url === new URL('file://'+process.argv[1]).href) {
  buildAndWriteDistrictSnapshot(process.argv[2]??'.data-staging')
    .then(report=>console.log(JSON.stringify(report,null,2)))
    .catch(error=>{console.error(error.message);process.exitCode=1;});
}

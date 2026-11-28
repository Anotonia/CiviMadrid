#!/usr/bin/env node
/**
 * Independent post-download gate for official Madrid administrative districts.
 * This only publishes validated WGS84 geometry. A TopoJSON with projected
 * coordinates remains staged, never silently relabeled EPSG:4326.
 *
 * Usage: node scripts/data/convert-staged-districts.mjs [staging-directory]
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {topologyToGeoJSON,requireMadridWGS84} from './topology-to-geojson.mjs';
import {validateMadridGeoJSON} from './validate-madrid-geometry.mjs';
import {validateManifest} from './validate-manifest.mjs';

export function normalizeDistricts(source, onBoundedBridge = null) {
 const features=source?.type==='Topology'
   ?topologyToGeoJSON(source,onBoundedBridge)
   :source;
 return requireMadridWGS84(features,validateMadridGeoJSON);
}
export function geometryBounds(features){
 let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
 function visit(p){if(typeof p[0]==='number'){west=Math.min(west,p[0]);east=Math.max(east,p[0]);south=Math.min(south,p[1]);north=Math.max(north,p[1]);}
 else for(const v of p)visit(v);}
 for(const f of features.features) visit(f.geometry.coordinates);
 return {west,south,east,north};
}

export async function convertStagedDistricts(dir) {
 const raw=await readFile(path.join(dir,'madrid-districts.raw.json'));
 const manifest=JSON.parse(await readFile(path.join(dir,'madrid-districts.manifest.json'),'utf8'));
 const issues=validateManifest(manifest,raw);
 if(issues.length)throw new Error('Rejected source manifest: '+issues.join('; '));
 if(manifest.sourceId!=='madrid-district-boundaries-900012-3'){
   throw new Error('Wrong source identifier: expected official district distribution 900012-3');
 }
 const source=JSON.parse(raw.toString('utf8'));
 const boundedBridges=[];
 const collection=normalizeDistricts(source,bridge=>boundedBridges.push(bridge));
 const bounds=geometryBounds(collection);
 const output=Buffer.from(JSON.stringify(collection));
 const derived={
   sourceId:manifest.sourceId,
   rawSha256:manifest.fileSha256,
   geojsonSha256:createHash('sha256').update(output).digest('hex'),
   output:'madrid-districts.wgs84.geojson',
   crs:'EPSG:4326 (validated broad Madrid bounds only)',
   geometryKind:'district administrative boundaries',
   nativeGrain:'district',
   districtFeatureCount:collection.features.length,
   boundedArcBridgeCount:boundedBridges.length,
   maxArcBridgeQuantizationSteps:boundedBridges.length?Math.max(...boundedBridges.map(b=>b.gapInQuantizationSteps)):0,
   bounds,
   caveat:'Source may contain recorded short arc/ring seams bridged by straight segments (<=3 quantization steps) without moving source vertices. Full topology, native CRS, source-date and licensing review still required before release.',
   transformVersion:'topojson-to-wgs84-bounded-seams-v0.2',
   sourcePage:'https://datos.madrid.es/dataset/900012-0-limites-administrativos-mapas/resource/900012-3-limites-administrativos-mapas'
 };
 await writeFile(path.join(dir,'madrid-districts.wgs84.geojson'),output);
 await writeFile(path.join(dir,'madrid-districts.geometry-report.json'),JSON.stringify(derived,null,2)+'\n');
 return derived;
}
if(process.argv[1] && import.meta.url===new URL(`file://${process.argv[1]}`).href){
 convertStagedDistricts(process.argv[2]??'.data-staging')
 .then(report=>console.log(JSON.stringify(report,null,2)))
 .catch(e=>{console.error(e.message);process.exitCode=1;});
}

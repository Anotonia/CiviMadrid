#!/usr/bin/env node
/**
 * One-dataset manual acquisition of official Madrid district boundary JSON.
 * Source resource is labeled CC BY 4.0 on Madrid's open-data portal.
 * Do NOT use output as a verified release dataset until geometry and license are reviewed.
 * Usage: node scripts/data/fetch-madrid-boundaries.mjs [output-dir]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const RESOURCE = {
  sourceId: 'madrid-district-boundaries-900012-3',
  publisher: 'Ayuntamiento de Madrid',
  datasetTitle: 'Límites administrativos actuales — Distritos municipales',
  resourcePage: 'https://datos.madrid.es/dataset/900012-0-limites-administrativos-mapas/resource/900012-3-limites-administrativos-mapas',
  downloadUrl: 'https://datos.madrid.es/dataset/900012-0-limites-administrativos-mapas/resource/900012-3-limites-administrativos-mapas/download/900012-3-limites-administrativos-mapas.json',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  attributionText: 'Datos del Ayuntamiento de Madrid, licencia CC BY 4.0',
};

export async function acquire(outDir, fetchFn = fetch) {
  const response = await fetchFn(RESOURCE.downloadUrl, {
    headers: {'User-Agent':'CiviMadrid-M0-Research/0.1 (source provenance audit)'},
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Madrid source responded ${response.status}`);
  const raw = Buffer.from(await response.arrayBuffer());
  if (raw.byteLength > 20 * 1024 * 1024) throw new Error('Exceeded M0 single-dataset size guard');
  let payload;
  try { payload = JSON.parse(raw.toString('utf8')); }
  catch { throw new Error('Source was not JSON. Do not mark the dataset ingested.'); }
  if (!['Topology','FeatureCollection','Feature'].includes(payload.type)) {
    throw new Error(`Unexpected geometry shape: ${String(payload.type)}`);
  }
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const now = new Date().toISOString();
  const manifest = {
    sourceId: RESOURCE.sourceId,
    publisher: RESOURCE.publisher,
    datasetTitle: RESOURCE.datasetTitle,
    downloadUrl: RESOURCE.downloadUrl,
    licenseUrl: RESOURCE.licenseUrl,
    attributionText: RESOURCE.attributionText,
    dateRetrieved: now.slice(0,10),
    sourceGeographicGrain: 'district administrative polygons',
    crs: 'UNKNOWN — needs GIS file/metadata inspection',
    fieldsUsed: ['geometry'],
    fileSha256: sha256,
    transformationVersion: 'raw-v0',
    limitations: 'Untransformed raw polygons; CRS, district IDs, actual observation date and dataset reuse conditions require verification.',
  };
  await mkdir(outDir,{recursive:true});
  await writeFile(path.join(outDir,'madrid-districts.raw.json'),raw);
  await writeFile(path.join(outDir,'madrid-districts.manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return {bytes:raw.byteLength,sha256,manifest};
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  acquire(process.argv[2] ?? '.data-staging')
    .then(({bytes,sha256}) => console.log(`Downloaded ${bytes} bytes; SHA256 ${sha256}; source geometry pending manual audit.`))
    .catch(e=>{console.error(e.message);process.exitCode=1;});
}

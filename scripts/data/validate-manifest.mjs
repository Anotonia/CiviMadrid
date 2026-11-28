#!/usr/bin/env node
/** Validate a sourced geographic-data distribution record; don't infer permission from a site domain. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export function validateManifest(m, rawBytes) {
  const required = ['sourceId','publisher','datasetTitle','downloadUrl',
    'licenseUrl','attributionText','dateRetrieved','sourceGeographicGrain',
    'crs','fieldsUsed','fileSha256','transformationVersion','limitations'];
  const errors = [];
  if (!m || typeof m !== 'object') return ['Expected object'];
  for (const key of required) {
    if (m[key] === null || m[key] === undefined || m[key] === '') errors.push(`Missing ${key}`);
  }
  if (!Array.isArray(m.fieldsUsed) || m.fieldsUsed.length === 0) errors.push('fieldsUsed must be nonempty array');
  for (const field of ['downloadUrl','licenseUrl']) {
    try { if (!/^https?:$/.test(new URL(m[field]).protocol)) errors.push(`${field}: only HTTP(S)`); }
    catch { errors.push(`${field}: invalid URL`); }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.dateRetrieved ?? '')) errors.push('dateRetrieved ISO date required');
  if (typeof m.fileSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(m.fileSha256)) errors.push('SHA256 must be 64 hex characters');
  if (rawBytes && errors.length === 0) {
    const actual = createHash('sha256').update(rawBytes).digest('hex');
    if (actual !== m.fileSha256.toLowerCase()) errors.push('SHA256 does not match downloaded bytes');
  }
  return errors;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [manifestPath, rawPath] = process.argv.slice(2);
  if (!manifestPath) {
    console.error('Usage: node scripts/data/validate-manifest.mjs manifest.json [raw-file]');
    process.exit(2);
  }
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const issues = validateManifest(manifest, rawPath ? readFileSync(rawPath) : undefined);
    if (issues.length) { console.error(issues.join('\n')); process.exitCode = 1; }
    else console.log('Manifest validated; verify source licensing conditions separately.');
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}

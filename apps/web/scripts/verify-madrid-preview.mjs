#!/usr/bin/env node
/** Fail-closed guard for source-derived Madrid district preview package.
 * The file below was independently simplified from the pinned official
 * 900012-3 TopoJSON via audited WGS84 GeoJSON; it is DISPLAY-ONLY, not zoning.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.dirname(fileURLToPath(import.meta.url));
const file=path.resolve(root,'../public/data/madrid-districts-preview.polyline.json');
const bytes=readFileSync(file);
const hash=createHash('sha256').update(bytes).digest('hex');
const EXPECTED='1718ba9eb67f7b3aece3db3c1acc6ab9895c6a1530999a893aede290f1626efb';
assert.equal(hash,EXPECTED,'Official-derived Madrid preview source changed without independent geodata review');
const data=JSON.parse(bytes.toString('utf8'));
assert.equal(data.length,21,'21 source districts required');
assert.equal(new Set(data.map(x=>x[0])).size,21);
assert.ok(data.some(x=>x[0]==='01'&&x[1]==='Centro'));
assert.ok(data.some(x=>x[0]==='21'&&x[1]==='Barajas'));
assert.ok(data.every(x=>typeof x[1]==='string'&&Array.isArray(x[2])&&x[2].length>0));
console.log('Madrid source-derived preview verified: 21 districts, file SHA256 '+hash);
console.log('Provenance: Ayuntamiento distritos 900012-3; raw SHA256 b2082936d7c8c051824d2c1a2aefeb1fdfda94f71b308f6b75c385f01707c616.');
console.log('Display simplification 0.0005 deg / encoded polyline E5; no legal buildability implied.');

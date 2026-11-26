# SimCore M0 — deterministic headless engine

This package implements CiviMadrid's **synthetic game rules**; it does not claim to model or predict the real city.

## Quickstart (Node.js 22+)

```bash
cd packages/sim-core
npm install
npm run typecheck
npm test
npm run demo
```

The demo runs a 12-turn water/solar/housing scenario with explicit cost, construction queue, energy/water service limits, deterministic events and a stable state checksum. No LLM is required.

## Public API

`src/index.ts` exports `reduceWorld`, `replay`, `recordReplay`, `canonicalStateHash`.
`src/fixtures.ts` exports `createSyntheticWorld`, `SYNTHETIC_PARAMS` and `runSyntheticScenario`.
All interfaces import from canonical `packages/world-schema/src/index.ts`.

## What is not done

Building on real GIS buildability is not validated yet, drought stress is not yet a full quarterly event system, win/loss conditions and scenario branching are not implemented, browser gameplay integration is pending, and the 32-bit FNV checksum is deterministic but **not cryptographic**. CI and integration must verify all claimed behavior before milestone acceptance.

Owned by SimCore workstream. Issues #3 and #6.

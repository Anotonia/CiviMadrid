# Build roadmap and validation protocol — v0.1

**Baseline:** Repository initialized 2026-11-26. No implemented game. Plan revision only becomes accepted after review.

## Milestones and dependency graph

```text
M0: source/license audit ───┐
M0: renderer+cell spike ────┼──> M1: sourced navigable Madrid world ──┐
M0: deterministic rules ────┘                                          │
                                                                        ├──> M2: playable 12-turn scenario
M0: scenario specification ─────────────────────────────────────────────┘        │
                                                                                 ├──> M3: bounded strategic agents
                                                                                 └──> M4: backtests & compare
```

## Proposed sprint plan (not a delivery promise)

| Milestone | Work package | Exit evidence |
|---|---|---|
| M0 / Foundation | repo conventions, source register, world/render spike, sim reducer spike | code running locally, licensed test snapshots, automated replay fixture |
| M1 / Explore | recognizable Madrid hex world, zoom/selection, sourced data layer, clear Observed/Derived tags | in-browser walkthrough, data manifest, performance observation |
| M2 / Play | construction, resources, turn advance, scenario stakes, compare/replay | 12-turn complete game, 100-seed equality tests, no invalid-action leaks |
| M3 / Strategy | bounded agent policy + evaluation against deterministic baseline | legal action traces, costs and win-rate comparison |
| M4 / Simulation quality | historical calibration where defensible, scenarios and provenance improvements | error bars, sensitivity tests and explicit limitations |

## P0 work queue

1. **Foundation & licensing:** audit USA Civ source and Madrid data licensing; deliver manifest.
2. **Rendering spike:** physically navigable clickable hex Madrid slice with accessible HUD.
3. **Simulation spike:** pure TS reducer, commands, build queue, invariants and replay hashes.
4. **Canonical schema:** observed/derived/synthetic/scenario tagging and unit-safe properties.
5. **M1 integration:** source-backed overlays / provenance UI / terrain render.
6. **M2 integration:** 12-turn dry-summer scenario with three build actions and visible outcomes.
7. **QA & replay:** randomized command tests, browser e2e, comparison and documented evidence.

## Quality gates

**Gate A — Source integrity:** no real-world claim without a manifest, source link and native-grain caveat.

**Gate B — Engine correctness:** deterministic seed, explicit units, seeded scenario, invalid-action rejection, no arbitrary LLM writes; 100 replay fixtures same canonical result.

**Gate C — Playability:** in a browser, start scenario → inspect map → build three different types → advance turns → witness shortages/tradeoffs → win/lose → reload/replay → compare two policies.

**Gate D — Presentation:** visibly game-like 3D terrain / city improvements, not a spreadsheet dashboard; minimum useful FPS and responsive interactions measured before freeze.

**Gate E — Evidence:** demo URL or reproducible local steps; CI logs, source manifests, screenshots/videos and traceable acceptance record.

## Out-of-scope change control

Do not widen to national/European scope, geopolitics, full economic digital twin, external action-taking agents, real-time live feeds or multiplayer before Gate C passes.

## Change log

- **v0.1 (2026-11-26):** initial planning baseline. Acceptance evidence: not yet available.

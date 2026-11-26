# CiviMadrid — Product & Engineering Master Plan v0.2
**Date:** 2026-11-26 · **Status:** planning baseline, not a released game.  
**Repository:** Anotonia/CiviMadrid · **Planning PR:** #8

## 0. Executive decision

Build **the first genuinely playable strategy world grounded in recognizable Madrid geography**. Reality provides the starting canvas; a transparent, deterministic game engine powers player consequences. We should surpass static USA Civ-style data-map browsing through **turn-based construction, competing resource constraints, agent opponents, replayable counterfactuals, and delightful visuals**. Avoid an all-purpose digital-twin enterprise platform or civilization clone.

**North Star:** Within 90 seconds of loading, an unfamiliar player can see Madrid, choose a cell, build something, advance a turn and **visually understand what changed, why, and what it cost**.

The first version is a complete **vertical slice**, not a half-finished nationwide simulation. Scope: Madrid metropolitan area, roughly 25×25 km pending GIS validation. One coherent game loop before breadth.

## 1. Product pillars

1. **Believable world** — recognizable mountains/river/urban fabric/roads where sourced; inspect real-data provenance. No undisclosed generated geography.
2. **Consequential decisions** — building and policy change an inspectable state; cost, duration, opportunity cost, trade-offs.
3. **Strategy, not dashboard** — meaningful win/loss, scarcity, turns, rival behavior, replayable alternatives, readable feedback.
4. **Truthful simulation** — observed, derived, synthetic, scenario always visually distinguishable. This game is *not* a forecast.
5. **Expressive interaction** — 3D/isometric atmosphere, hover details, construction animation, resource flow and HUD without visual clutter.
6. **Measured engineering** — deterministic reducer + auditable events + tests + browser demo; artifact evidence before “done.”

## 2. World and player fantasy

**Title:** CiviMadrid  
**Subtitle:** Build the Madrid that might be. / Construye el Madrid posible.

**Player:** You shape a hypothetical metropolitan region under water, energy, housing, land and budget constraints. This is *fictional game authority*; no real government powers or predictions are implied.

**Core verb loop:** Inspect → Decide → Build/Choose policy → Advance quarter → Watch changes → Adapt → Compare.

**First game:** “Madrid 2030: Dry Summer” is a fictional test scenario, one optional mode in a broader sandbox, *not the entire product identity*. Twelve quarterly turns, clear starting treasury, constrained build sites, 3 construction types:
- water reuse / supply efficiency
- local solar + balancing
- housing development
Optional first competitor: deterministic neighboring policy, rather than a free-form LLM.

**Trade-off demonstration:** new housing raises capacity but increases water/electricity demand; solar unlocks electricity but occupies land and takes time; reuse alleviates water demand at power/budget cost. Development outcomes depend on viable utility service.

## 3. Modes and future expansion

| Mode | First vertical slice | Later stage |
|---|---|---|
| **Explore** | Madrid base geography + 1 verified public data overlay | multi-year comparisons, Spain, Europe |
| **Play** | three constructions, turn loop, shortage rules, win/loss | production chains, transport, commerce, service classes |
| **Simulate** | seeded scenario, actions, replay and branch comparison | calibrated selected mechanisms, scenario ensembles |
| **Compete** | transparent deterministic NPC policy | bounded LLM city/enterprise agents with evaluation |

**Expansion rule:** Only expand geographic coverage after a complete game is playable. Multiscale data architecture should make Madrid→Comunidad→Iberia feasible without prematurely ingesting all datasets.

## 4. Experience map (minimum complete session)

1. **Landing**: Start scenario and a large, visually convincing Madrid; concise fiction/model disclaimer.
2. **Scout**: Pan/zoom, click a cell, inspect location + sources + build feasibility.
3. **Plan**: Preview action costs, duration and *modeled* impacts; alternatives are visible.
4. **Act**: Spend from finite budget and queue construction; visual work-in-progress state.
5. **Advance**: Increment quarter; construction finishes, water/power balance and housing service update; in-world markers + resource HUD + causal event narrative.
6. **React**: New constraints and other policy decisions. Player makes second-order choices.
7. **Finish**: Show win/loss, resource history, score components and action journal.
8. **Compare**: Re-run same seed with alternate policy; chart and side-by-side states; export/import reproducible replay.

**Reject:** a screenshot-only “demo”, dynamic text pretending to be simulation, uncited hex-level statistics, or UI with inert build/advance controls.

## 5. Gameplay specification

- **Turn:** one fictional quarter; 12-turn campaign.
- **State:** territory, build slots, treasury, construction queue, water supply/demand, energy supply/demand, dwellings and serviced population proxy, player goals, deterministic event log.
- **Actions:** build water facility, solar, housing, advance turn. Commands must be validated and costed before state update.
- **Win:** meet explicit housing target and essential service stability without insolvency after turn 12.
- **Lose:** policy bankruptcy or 3 consecutive critical service-deficit turns; exact tunable thresholds in a **versioned scenario JSON**, never hidden in prompt.
- **Economic discipline:** unit-safe flow rates; don't conflate €/turn, €/year, m³/day, MWh/day; avoid invented GDP multipliers.
- **Reference balance:** 2 strategies from same start should generate visibly different traces, while some decisions cause real negative side-effects.
- **Opponent:** deterministic rational baseline obeying same rules. LLM may select legal commands in M3, engine stays authoritative.

## 6. Technical approach

**Modules (initial):**
- `packages/world-schema`: versioned shared types, value provenance, canonical commands/events.
- `packages/sim-core`: pure deterministic simulation, invariants, seeded PRNG, event logs, replay.
- `packages/world-data`: curated data snapshots and geospatial transformations + manifests.
- `apps/web`: Vite/React + Three.js/React Three Fiber hex world and game HUD.
- `scenarios/madrid-2030`: JSON initial state, parameters, goals, seed, action fixtures.
- `tests`: unit/integration/browser smoke/acceptance.

**Shared protocol:** `docs/WORLD_CONTRACT.md`. **Ownership + merge rules:** `docs/AGENT_PLAYBOOK.md`.

**Prefer small bounded modules.** No microservices, no event broker, no generic “agent framework”, no paid model dependency for first playable.

## 7. Roadmap, value and acceptance

| Milestone | Outcome | Hard gate | Primary agent |
|---|---|---|---|
| **M0** Foundation | contract + legal sources + visual spike + deterministic engine spike | verifiable licenses, tested pure reducer, interactable map spike | Architect + Data + Sim + World |
| **M1** Explore | sourced, beautiful clickable Madrid | link each observed value to provenance; camera/input works | Data + World |
| **M2** Playable alpha | start, build, advance, consequences, finish, replay | 12 turns / three actions / 100-seed repeatability / browser smoke / visual evidence | Sim + World + QA |
| **M3** Strategic agents | bounded NPC strategy and optional LLM decision adapter | legal-action-rate, cost, advantage vs deterministic policy, rollback | Sim + QA |
| **M4** Better simulation | historical checks, uncertainty, richer mechanics, city growth | calibration disclosures, error/sensitivity tests and game balance | Sim + Data + QA |
| **M5** Expansion | regional Spain/Iberia, new scenarios, sharing | migration + performance + licensing + session metrics | all |

**Stop/Go:** If M0 does not yield a working playable-map spike and headless simulation demo, do not add more sources, features, regions, or agent framework. Repair the failing gate.

## 8. Multi-agent orchestration design

Independent first-phase workstreams, all reading this file and AGENTS.md:
- **A — Data/GIS & rights:** verified datasets, geospatial transforms, immutable snapshots. Owns `packages/world-data`, `scripts/data`, `docs/DATA_AND_LICENSES.md`.
- **B — Simulation & gameplay rules:** pure reducer, scenarios, replay/invariants. Owns `packages/sim-core`, `scenarios`, tests under `tests/sim`.
- **C — World/visual/interaction:** 3D map/camera/HUD/action UI. Owns `apps/web`, asset rights, visual tests.
- **D — QA/Integration:** build tooling, automated acceptance, integration risk logs, smoke tests. Owns `tests/e2e`, `.github/workflows`, `docs/ACCEPTANCE.md`.
- **Lead/Architect:** freezes versioned contracts, resolves changes, reviews/merges work, does not overwrite worker branches.

Run workers in **separate topic branches and draft PRs**, rebased against accepted planning baseline, with explicit dependency checkpoints. Never let multiple agents push to same shared file concurrently; contract edits require RFC/PR. QA is independent of the implementer.

## 9. Dependencies and coordination

- **Before parallel code:** merge/accept this planning baseline + `docs/WORLD_CONTRACT.md`; no incompatible duplicate schemas.
- **In parallel:** Data prepares one licensed snapshot + conversion fixture; Sim builds headless engine with synthetic fixtures; World builds visually credible synthetic-marked rendering spike; QA builds CI/test harness and checks integration readiness.
- **Integration point 1:** render `CellView` from SourceSnapshot / hex mapping.
- **Integration point 2:** UI dispatches typed `Command` to `reduceWorld`, renders immutable state + events. No direct state mutation.
- **Integration point 3:** Save/replay + source provenance; close M2 gate only after live browser verification.

## 10. Decision log and failure prevention

- **ADR-001:** prioritize an actually playable Madrid, not full Iberia.
- **ADR-002:** use realistic geography but model gameplay effects; no “official cell-level water supply” invention.
- **ADR-003:** pure deterministic engine, optionally agent-chosen actions.
- **ADR-004:** optional drought scenario; do not make a climate-report product.
- **ADR-005:** independent agent ownership, evidence-gated integration and PR review.
- **ADR-006:** no claims of integration/parallel execution without confirmed branch commits, PRs and successful checks.

## 11. Risks

1. **Wrong data grain:** official population at municipal/district level misrepresented as measured per hex. Mitigation: per-value provenance, allocation warnings.
2. **Gameplay too shallow:** a slider dashboard in game clothing. Mitigation: measurable action consequences + costs + map animation + win/loss.
3. **Simulation nonsense:** unsupported causal claims. Mitigation: simple bounded mechanics, scenario disclaimer, invariants, sensitivity checks.
4. **Performance:** too many hexes/labels. Mitigation: instancing, LOD, measured spike, restrict scene.
5. **Agent collision:** incompatible types/branches. Mitigation: sealed shared contract + file ownership + integration PR.
6. **Copyright:** reuse of USA Civ source/third-party assets before license inspection. Mitigation: do not copy until audited.
7. **Scope creep:** architecture/R&D substitutes for playable game. Mitigation: M2 gate is release-critical.

## 12. Concrete completion evidence

Every milestone report includes a repo commit SHA, CI run link, reproduction commands, failure log, screenshots or video where visual, source manifests where data, and a known-gaps list. A plan or PR alone is **never** a verified implementation.

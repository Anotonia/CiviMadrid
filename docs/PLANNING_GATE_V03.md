# CiviMadrid — Overall product plan & pre-build decision gate v0.3

**Date:** 2026-11-26  
**Status:** PLANNING BASELINE ACCEPTED 2026-11-26 — M0 IMPLEMENTATION AUTHORIZED; M1/M2 RELEASE GATES REMAIN OPEN.  
**Primary repo:** https://github.com/Anotonia/CiviMadrid  
**Reference plans:** MASTER_PLAN.md, PRODUCT.md, ARCHITECTURE.md, WORLD_CONTRACT.md, AGENT_PLAYBOOK.md.  
**Operating rule:** User authorized proceeding with parallel implementation after planning review. Activate the four isolated M0 workstreams; keep feature PRs draft until code/test evidence is reviewed. Do not equate branch or PR creation with executed tests, and do not deploy without acceptance.

## 1. Product decision

**What it is:** a visually compelling, data-grounded, *playable* strategy world based on Madrid, with player construction choices, time progression, scarcity, autonomous nonplayer strategy, and reproducible scenario comparisons.

**What it is not:** a map dashboard; a validated scientific forecast; generic Agent framework; automatic municipal control; a direct clone of Civilization or its copyrighted aesthetic.

**Promise:** Within ~90 seconds of starting a first game, the player can orient on a recognizable city, choose a legal action, spend a scarce resource, advance time and *see and understand a consequential change to the simulated world*.

**Creative north star:** cinematic isometric living-world quality, clear civic/geographic identity, tactile interactions, visible construction, readable resource constraints, and meaningful strategy. The product should be **fun and comprehensible** before it becomes broad or sophisticated.

## 2. Audience, modes and product ladder

**Primary first audience:** strategy/simulation players who enjoy realistic settings. **Secondary:** city-curious learners and urban systems enthusiasts. Enterprise planning is *not* MVP.

- **Explore:** a truthful Madrid basemap + sourced overlays. Inspect native observation dates and geographic granularity.
- **Play:** construct, allocate resources, advance turns, face choices and win/lose.
- **Simulate:** branch from the same world seed and compare alternative action sequences using a documented fictional model.
- **Agent Rivals:** deterministic legal-action baseline first; later bounded LLM policy with the same rules.

**Geographic ladder:** playable central Madrid metro slice → Madrid region → Iberia → more regions, only after complete playability and performance/license gates. The 25×25 km proposal is a *candidate* world extent, not a finalized GIS boundary.

## 3. World model — three separate truths

1. **Reality layer:** verified geography and published observational data (source URL, license, snapshot hash, observation period and *native reporting grain*).
2. **Game model:** explicit rules, resources, building capacities, causal hypotheses and fictional economics. These are **not calibrated forecasts** until separately validated.
3. **Presentation layer:** immersive hex/isometric/3D projection of real context and simulated state; never allow beautiful visuals to imply invented numbers are measurements.

Cross-layer type labels: **observed / derived / synthetic / scenario**. At no point should municipality-level data silently become “official observations” for a 200 m hex.

## 4. Core simulation domain and gameplay design

**Foundational state:** territory, build slots, treasury, construction pipeline, dwellings/housing capacity, serviced housing, water supply/demand, energy supply/demand, turn count, source snapshot, deterministic event log. Population and transport are next-order extensions unless a satisfying playable interaction requires one earlier.

**Player verbs:** inspect; select buildable location; preview legal costs/constraints; build water-reuse, solar, or housing; advance quarter; inspect event consequences; compare alternatives; restart or replay.

**Core tension:** housing adds capacity but raises water/power loads; reuse alleviates water stress but costs energy, time and budget; solar alleviates power stress but costs land/time/budget. A failed strategy causes explicit shortage or insolvency. Build times and causal flows, not arbitrary score increases, create strategy.

**Reference first scenario:** “Madrid 2030 — Dry Summer” as a **fictional stress test**, not the whole product identity. Starting scenario should show visible resource trade-offs and may use a modeled drought shock; never imply an official weather forecast.

**Completion:** 12 quarterly turns, win/loss with inspectable criteria. Clear score card, event chronology and branch comparison; actionable consequences should appear *on the map*, not only in a text summary.

**Agent strategy inside the game:** AI entities propose legal actions from bounded observations and resource budgets; deterministic rules own state transitions. Later assess their performance versus a fixed baseline. Development agents are a separate orchestration concern.

## 5. Player experience & visual specification

Screen hierarchy:
1. Main world occupies most of the viewport, legible at several zoom levels.
2. Compact persistent HUD: treasury, water balance, energy balance, serviced housing, quarter, current stress.
3. Selection panel: geographic identity, provenance, buildable actions, costs, durations and rule-based predicted effects.
4. Contextual construction effects and progression animations tied to actual events.
5. Turn journal, scenario objectives, compare/replay screen, sources/credits panel.

Visual quality criteria: recognizable Madrid topology as data becomes available; warm stylized 3D/isometric atmosphere (without copying protected art); intuitive camera, visible selection, fluid interaction, accessible controls. No fake buttons or static screenshots passed off as a game.

## 6. Technical architecture — binding boundaries

```text
Verified sources -> pinned Data Manifests + ETL -> immutable GeoSnapshot
                                                        |
Shared World Contract: geometry / truth labels / Commands / Events / Replay
                                                        |
Player UI -> Action Validator -> Pure Simulation Reducer -> authoritative WorldState
                                                 |               |
                              deterministic NPC proposals       EventLog / Replay Hash
                                                        |
                                 3D World Renderer + HUD + Scenario UI
```

- **Rendering:** Three.js/R3F and instanced hex geometry are *candidates to test*, not yet a selected production stack.
- **Simulation:** pure deterministic commands and seeded randomness; fixed-point/int units where practical; scenario parameters versioned.
- **Storage:** replay seed + source snapshot ID + engine version + ordered command log; simple local import/export initially.
- **Data:** verifiable Madrid sources, specific distribution licenses/attributions; no bulk reuse of third-party resources without audit.
- **Testing:** unit/property tests for rules and invariants, integration tests for complete turns, browser smoke and performance/a11y verification.
- **No premature architecture:** avoid generic Agent framework, distributed queue/microservices, accounts/multiplayer, live municipal systems.

## 7. Master roadmap with gates

| Phase | Deliverable | Gate |
|---|---|---|
| P / **Planning now** | Product blueprint, playable scenario rules, shared type contract, lane ownership, data/licensing audit plan, acceptance baseline | Architectural contradictions resolved; first-session UX and scope approved. **M0 authorization granted; M1/M2 acceptance still evidence-gated.** |
| M0 / feasibility | tiny source-verified geometry/data fixture; instanced map spike; 10-cell headless reducer with replay | actual run evidence + legal provenance, measurable render response and 100 seed test fixtures |
| M1 / world | navigable visually credible Madrid map with at least one sourced layer | inspected native-grain data and attribution, real browser interaction evidence |
| M2 / playable alpha | 12-turn water/energy/housing campaign, build/advance, explicit consequences, win/loss, save/replay | real human test + browser E2E + invariant/replay tests + recorded build artifacts |
| M3 / strategic NPCs | bounded autonomous opponents and compare against deterministic reference | legal-action and cost metrics, no unauthorized state writes |
| M4 / richer world | transport/commerce/industry, calibrated mechanisms where evidence supports | sensitivity tests and simulation limitation disclosure |
| M5 / expansion | Madrid region → Iberia, optimized maps, scenario expansion | performance/rights/migration and game session success |

**Definition of done:** a GitHub issue or PR is only coordination. Gate closure requires running build/test/logs plus screen/video or data artifact evidence. Code lines and number of agents are *not* outcomes.

## 8. Multi-agent orchestration (AFTER planning gate)

**Lead Architect:** owns shared contract, sequencing, integration priorities, reviews and decisions.  
**GeoData A:** GIS/data/license/source snapshots only.  
**SimCore B:** scenario rules, deterministic state machine, legal commands and replay.  
**WorldUX C:** terrain/interaction/player experience, adapter to shared engine state.  
**QA D:** independent CI, browser acceptance, edge cases and evidence.

- Separate branches/PRs; clear file ownership. No two agents editing shared contracts without review.
- Parallel first sprint is possible **only after** the world contract and product's first playable scenario rules are accepted.
- Start with GeoData provenance verification, SimCore headless engine, WorldUX visual spike, QA evidence harness **in parallel**. Join at tested contract checkpoints, not via optimistic prose.
- Evidence ledger per lane: branch, commit, test run, screenshot/fixture, blocker, next action. Integrator must prove I0 contract, I1 simulation, I2 sourced map, I3 game loop, I4 completed session.
- Do not silently run paid models, publish to a live production site, or merge without approval.

## 9. Key design decisions requiring acceptance

1. **Primary identity:** playful immersive strategy game (recommended) vs educational explorer vs policy planning tool. Recommended: game-first.
2. **Scope:** small real Madrid slice first, with geographically honest zoom and extensible data model.
3. **Mechanics:** first complete economic loop water / energy / housing / treasury; transport and production after M2.
4. **Scenario:** dry-summer stress as first **optional** challenge, not entire game premise.
5. **Architecture:** deterministic authoritative engine; LLM policy only as an input candidate, never outcome writer.
6. **Visual direction:** quality-conscious stylized 3D hex world with measured prototype, no guaranteed engine choice before spike.
7. **Implementation gate:** do not activate development agents until world contract, acceptance and first-session screen narrative are approved.

## 10. Review checklist for ending Planning

- [ ] Product definition, core player fantasy and first audience are coherent.
- [ ] First 90-second flow and 12-turn campaign described with real verbs and visible effects.
- [ ] Win/lose, resource rules and constraints are testable; no undefined causal magic.
- [ ] Boundary, spatial grain and source policy are coherent.
- [ ] Shared typed contract has no contradictions with planned game mechanics.
- [ ] Agent ownership and PR integration path do not collide.
- [ ] Test evidence required for M0/M1/M2 is specific.
- [ ] Major known risks have mitigation and stopping conditions.
- [ ] No planned paid/license-prohibited dependencies are silently accepted.

## 11. Actual status / what not to misreport

Existing draft PR #8 includes planning documents and an initial world-schema declaration. Some worker branches contain early experimental commits from kickoff, but these have **not** been approved, compiled, tested, integrated or accepted as a runnable product. **M0 parallel implementation is now authorized by the user.** The previous experimental commits must be reconciled, compiled and verified; no claim of product readiness is implied.


## 12. Authorization log

- **2026-11-26:** User said to proceed to the next step and then start collaborative multi-agent development. M0 engineering lanes are therefore authorized. This is not authorization for unreviewed deployment, paid external actions, or falsely marking feature gates complete.

# Product spec v0.1 — CiviMadrid

**Status:** Proposal / unimplemented. **Updated:** 2026-11-26.

## 1. Product thesis / 产品定位

A beautiful, immediately understandable **Civilization-like strategy sandbox** whose geography and selected facts come from real Madrid, but whose forward-playing economy is an explicitly labeled model. **Not** another KPI dashboard, **not** a scientifically validated city forecast, **not** a clone of Civilization.

The fun is the trade-off: **you cannot expand housing, industry and infrastructure without water, electricity, land, time and money.** Each click makes a visible world-state difference.

## 2. First vertical slice: Madrid 2030 — Dry Summer

- **Location:** approximately 25×25 km around central Madrid, final polygon/bounds subject to GIS review. A bounded playable area, not all Iberia.
- **Scenario:** alternative-history **2030 dry-summer stress test**; entirely hypothetical, never described as a real AEMET forecast.
- **Player role:** metropolitan development planner; no claim that player powers correspond to real government jurisdiction.
- **Cadence:** 12 quarterly turns, 3 years of in-game time.
- **Goal:** meet housing-development target without persistent water/power deficits or insolvency.
- **Failure conditions:** budget becomes negative beyond permitted borrowing threshold, or essential-service deficit persists for 3 turns (tunable and clearly marked game rules).
- **Accessibility:** keyboard and pointer, easy controls, legible data/source labels, color not sole status carrier.

## 3. Player experience

### Explore
Camera pan/zoom/rotate an evocative hex terrain layer. Select a hex/municipality to view **observed** source data: name, data year, attribution, methodology and confidence. Real layers must be backed by downloaded, version-pinned data. No procedural/AI statistics masquerading as facts.

### Play
From each eligible cell, choose an action and see cost, prerequisites and predicted **modeled** effect before committing:
- **Build water reuse:** costs money/land/turns; raises modeled water capacity and electricity demand after construction.
- **Build local solar:** costs money/land/turns; raises modeled electricity capacity with a weather-dependent capacity factor.
- **Build housing:** costs money/land/turns; raises capacity and future water/power demand. Growth depends on service availability.
- **Inspect/cancel queued construction** where feasible; cancellation obeys deterministic refund rules.

A visible progress bar, hex improvement, construction queue, water/electricity balance, treasury and turn journal must all update after actual actions.

### Simulate / Compare
Advance turn; display before/after changes and an explanation rooted in **named rules**, not LLM narration. Save a seed and action log, branch from a prior turn, compare baseline vs alternative in a clear chart with matching units.

### Agents
In M2: one **deterministic baseline policy NPC** for an adjacent district or competing priority, bounded by the same budget and action rules. **LLM agent is optional in M3**; it may select an allowed action but never write world state.

## 4. Measurable acceptance: M2 playability gate

1. Browser starts from documented setup; three supported browser viewport sizes including mobile.
2. Madrid map recognizable; playable cells hover/select; real observation has source/license/date, derived data displays warning.
3. Three actions actually change queue/resources and visible structures on turn advancement; invalid actions rejected with reason.
4. A 12-turn game can be completed in under 20 minutes; player wins or loses by explicit, inspectable rules.
5. Save/reload/replay: same initial snapshot + engine version + seed + commands yields identical canonical final-state hash on at least 100 seeded fixtures.
6. Economy invariants: non-negative resource stocks unless debt explicitly allowed; construction consumes budget; resource accounting balances; no magic creation.
7. Deterministic reference opponent acts legally, and behavior is testable.
8. Data truthfulness: a clearly visible **Observed / Derived / Synthetic / Scenario** tag for every exposed value.
9. Automated checks: typecheck, unit tests (rules, action guards, invariants), 12-turn integration tests, at least one browser smoke test with recorded evidence.
10. Artifacts: working local URL/steps, test logs, scenario video/screenshots, and versioned data manifest. **No gate is closed on PR text alone.**

## 5. Exclusions (M0–M2)

No full Iberian scale, no country-wide trade systems, no politics/war/diplomacy, no ML-based forecasting claims, no live city management, no real-world action, no user accounts/multiplayer, and no broad agent platform. Do not copy proprietary Civilization artwork or marks.

## 6. Product success vs vanity metrics

Measure: completed 12-turn sessions, meaningful strategy divergence, percentage of player actions with an explainable consequence, scenario replay equality, observed-data attribution coverage, median FPS and crash-free completion. Lines of code, number of agents and dataset count are **not** success metrics.

## 7. Decision checkpoints

- **M0 exit:** select map/rendering approach based on a functioning spike and verify all proposed source licenses/fields.
- **M1 exit:** visually compelling, navigable sourced Madrid with evidence/provenance; no simulation claim.
- **M2 exit:** first genuinely playable strategy loop, replay equality, scenario completion and demonstrated consequences.

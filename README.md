# CiviMadrid

**A playable strategy-world built from real Madrid geography and open public data.**

CiviMadrid is a research-and-game prototype: explore a recognizable Madrid, make consequential decisions about infrastructure and resources, and advance a deterministic, auditable simulation.

> **Status (2026-11-26): Planning.** This repository has just been initialized. No playable build or verified simulation is claimed.

## Core product promise

1. **Explore** — See Madrid's real geography and inspect sourced facts.
2. **Play** — Build infrastructure and choose policies under a finite budget.
3. **Simulate** — Advance turns and observe bounded, explainable changes in water, energy, housing, and population.
4. **Compare** — Replay seeded scenarios and compare alternative strategies from the same initial world state.

The first playable vertical slice targets a **small Madrid metropolitan area**, not the whole country. The first proposed scenario is **Madrid 2030: heat and water stress** (a fictional stress-test scenario, **not a forecast**).

## Non-negotiable quality gates

- **Real-world inputs are sourced**: data provider, timestamp, geography, transformation, license and uncertainty.
- **Simulation values are explicitly labeled** as modeled or synthetic, never represented as observations.
- **Deterministic world transitions**: identical initial state, seed and command log produce identical results.
- **No LLM mutation of core state**: agents may propose legal actions; the rules engine decides the result.
- **Playable means playable**: a build action, advance-turn action, and visible consequence must work in the browser.
- **Tests and evidence over screenshots**: build/test logs, replay fixtures, provenance checks, and recorded acceptance results.

## First milestones

- **M0 / Foundation:** source/license audit, playable-slice specification, technology spike.
- **M1 / Explore:** geographic world and inspectable, sourced map overlays.
- **M2 / Play:** 12-turn reproducible strategy scenario with real constraints.
- **M3 / Agent competitors:** bounded AI city/company behavior, tested against reference policies.
- **M4 / Historical/scenario comparison:** historical observation versus hypothetical simulation clearly separated.

Full planning material and implementation tasks will be tracked in the repository via documents, Issues and PRs.

## Reference and rights

Inspired by the interaction idiom of [USA Civ](https://karpathy.ai/usaciv/), not a claim of affiliation. Do not copy Civilization brand assets or artwork; do not assume third-party data or source code can be reused without auditing the corresponding license.

## Project integrity

Keep plans, prototypes, and deployed builds clearly distinguished. Never mark a milestone complete without executable evidence.

# CiviMadrid — Instructions for autonomous engineering agents

## Source of truth (read in this order)
1. `docs/MASTER_PLAN.md` — overall product, scope, gates and priorities.
2. `docs/WORLD_CONTRACT.md` — canonical cross-team data/actions/replay protocol.
3. `docs/AGENT_PLAYBOOK.md` — code ownership, branches, PRs and evidence.
4. `docs/PRODUCT.md`, `docs/ART_DIRECTION.md`, `docs/ARCHITECTURE.md`, `docs/DATA_AND_LICENSES.md`, `docs/ROADMAP.md`.

**Objective:** deliver a beautiful, actually playable Madrid-based city strategy game. No invented measured statistics, mock buttons, fake gameplay or untested acceptance claims.

## Current status
As of 2026-11-26 this repo is in **planning / foundation**. All agent implementations are incremental and require verification. Do not equate notes/issues with game delivery.

## Work isolation
- `agent/geodata-m0`: data, GIS, licensing.
- `agent/simcore-m0`: deterministic simulation, scenarios, replay.
- `agent/worldux-m0`: interactive 3D terrain, game HUD and player actions.
- `agent/qa-integration-m0`: acceptance/CI/browser/contract conformance.
- Planning branch: `plan/m0-m2-playable-madrid`; its draft PR is #8.
- Each worker must open its own **draft PR** to planning branch until architecture is accepted; never modify another worker's owned files or `WORLD_CONTRACT.md` without coordination.
- If a branch/PR exists, continue it. No duplicates.
- No direct merges or deployments without review.

## Engineering discipline
- The simulation core is pure and deterministic; model outputs separated from empirical observations.
- Actions are validated commands and return explicit success/rejection; no language model can directly mutate world state.
- Historical/open datasets require exact distribution license, date, checksum, attribution and native-grain warning.
- Label every exposed value `observed`, `derived`, `synthetic` or `scenario`.
- Include running instructions, code/tests, reproduction evidence and failed checks in each PR.
- Never claim test success when no test runner executed.
- Prefer small end-to-end user-visible improvements to broad platform architecture.
- Do not use proprietary game assets. Inspect third-party source archives and licenses before copying.
- Never push secrets or live personal data.

## Definition of the first playable gate
A player loads Madrid, selects a cell, constructs water/solar/housing, advances a turn, sees modeled resource changes and physical feedback, completes 12 turns, wins or loses with explicit rules, saves and replays a seed/command log. Replays produce identical hashes in 100 tested fixtures. Visual interaction and sources require independent QA.

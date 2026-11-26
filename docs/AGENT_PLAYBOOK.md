# Multi-agent delivery playbook v0.1

**Repository:** Anotonia/CiviMadrid  
**Authority:** `docs/MASTER_PLAN.md` → `docs/WORLD_CONTRACT.md` → `docs/PRODUCT.md` / `docs/ARCHITECTURE.md` / `docs/ROADMAP.md`.

## 1. Roles and nonoverlapping ownership

| Agent | Mission | Owned code & docs | First issues | Branch |
|---|---|---|---|---|
| A / GeoData | Verifiable Madrid geometry, data and license | `packages/world-data/**`, `scripts/data/**`, `data/manifests/**`, `docs/DATA_AND_LICENSES.md` | #1, #4 (data side) | `agent/geodata-m0` |
| B / SimCore | Deterministic game world, economics, replay and tests | `packages/sim-core/**`, `scenarios/**`, `tests/sim/**` | #3, #6 (engine side) | `agent/simcore-m0` |
| C / WorldUX | Game-like 3D world, camera, HUD and action visuals | `apps/web/**`, `assets/**`, `docs/ART_DIRECTION.md` | #2, #5 (visual side) | `agent/worldux-m0` |
| D / QA & Integration | CI, acceptance, contracts compliance and bug reports | `tests/e2e/**`, `.github/workflows/**`, `docs/ACCEPTANCE.md` | #7, cross-lane reviews | `agent/qa-integration-m0` |
| Lead / Architect | Boundary ownership, governance, cross-lane integration, milestones | `docs/MASTER_PLAN.md`, `docs/WORLD_CONTRACT.md`, `docs/AGENT_PLAYBOOK.md`, `AGENTS.md` | all | `plan/m0-m2-playable-madrid` |

Workers **must not** modify `docs/WORLD_CONTRACT.md` or `AGENTS.md` without an approved contract proposal. Integration should pull changes only via reviewable PRs. Each lane uses own branch; no direct `main` pushes.

## 2. Execution protocol per agent

1. Read master plan, shared contract, existing PRs/issues, own lane's most recent commit, and integration status.
2. Select the **smallest currently unblocked deliverable with executable verification** (not another generic report).
3. Make an incremental implementation change only in owned paths.
4. Run or add relevant tests. If tests cannot execute in current environment, **state that explicitly** rather than marking them passed.
5. Push a small commit in own branch, update one draft PR with implementation status, evidence/known-gaps and blockers.
6. Comment on GitHub issue with SHA, changed files, reproduction commands and acceptance results.
7. Flag cross-lane requirements as a contract-change proposal, not as unilateral implementation.
8. Never auto-merge, deploy, publish paid service, or use licensed third-party assets without review.

## 3. First parallel sprint (S0)

**A:** Audit actual source distributions and USA Civ package rights; produce one small geography fixture with manifest and checksums. **Not finished until rights reviewed.**

**B:** Build headless 10-cell pure reducer with typed commands, 3 build actions, advance, seeded 12-turn dry-summer params, 100-seed hash equality tests. Use synthetic cells under shared contract, never wait on official GIS.

**C:** Show visually appealing, selectable, hoverable 3D hex Madrid-inspired synthetic/placeholder world in browser, animated build preview and responsive HUD. Expose one adapter accepting `GeoCell[]`, `WorldState`, `CommandResult` shape; map facts wait for A.

**D:** Create baseline CI/typecheck/test script and independent acceptance scripts; design contract lint, browser smoke and provenance checker. Do not mark visual quality pass from static screenshots alone.

## 4. Shared integration checkpoints

- **Checkpoint I0: Contract:** all lanes accept `docs/WORLD_CONTRACT.md` v0.1 and record compatibility issues.
- **Checkpoint I1: Headless truth:** B + D prove 100-seed replay parity and resource invariants.
- **Checkpoint I2: Geographic truth:** A + C render one sourced layer, inspect source metadata.
- **Checkpoint I3: Game loop:** C + B complete build → advance → visible consequence.
- **Checkpoint I4: Playable:** D browser smoke, 12-turn win/loss, compare/export/import + documented evidence.

## 5. PR & change etiquette

- One persistent draft PR per lane, base `plan/m0-m2-playable-madrid` initially while PR #8 remains open. **After #8 is merged**, retarget worker PR bases to `main` once appropriate. Do not merge worker PRs ahead of validated dependencies.
- Prefix commits and PRs `feat(geodata)`, `feat(sim)`, `feat(world)`, `test(qa)`; issues link to PR and evidence.
- Agent-owned path changes are permitted; cross-owner path changes require explicit review.
- CI reports are evidence; plausible prose is not.
- When a lane is blocked: implement a legal synthetic fixture, document blocker and leave unverified claims unclaimed.
- Lead records decision with ADR entries and issues rather than constantly rebuilding architecture.

## 6. Definition of parallel progress

“Multi-agent active” = at least **two separate lanes have actual incremental commits or test artifacts**, each on its own branch/PR, plus an integration ledger that records dependency and blocker status. Merely creating agent names, Issues or scheduled checks **does not count** as executed engineering.

## 7. Handoff template

```text
Agent:
Branch / PR / commit:
Issue:
Changed paths:
What actually runs:
Tests executed / actual outcome:
Visual or data evidence:
Contract version:
Blocked by:
Next smallest executable task:
```

## 8. Safety and licensing

Only use sources with applicable rights; avoid copyrighted game assets, unsafe actions and unapproved purchases. LLM/NPC outputs are **action proposals** requiring validation, never direct edits to the canonical sim state.

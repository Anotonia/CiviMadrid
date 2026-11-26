# Independent acceptance matrix — CiviMadrid

**Workstream D:** QA/Integration. Initial state: no test has been executed.

| Gate | Scenario | Evidence | Current status |
|---|---|---|---|
| A Source rights | official dataset exact license and granularity check | manifests + citations/checksums | NOT VERIFIED |
| B Geometry | click, pan/zoom, read map; performance | browser run + screenshot/FPS | NOT IMPLEMENTED |
| C Gameplay | water/solar/housing queue → time advancement → resource changes | reducer tests + browser video | NOT IMPLEMENTED |
| D Replay | same initial state+seed+commands yields identical canonical hash (100 seeds) | automated fixture logs | NOT VERIFIED |
| E Constraints | reject illegal commands, no free resources, water/power shortages block effective housing | unit/property tests | NOT VERIFIED |
| F Truth labels | observed/derived/synthetic/scenario flags and source drawer | UI/browser inspection | NOT IMPLEMENTED |
| G Completion | 12-turn win/loss, save/reload, two-policy compare | browser E2E and journal | NOT IMPLEMENTED |
| H Visual | feels like strategy game, not dashboard | independent UX review of actual play, FPS & accessibility | NOT VERIFIED |

## Requirements for a passing M2 build

- Clean checkout and setup commands succeed.
- All acceptance checks run, with CI artifacts or evidence links.
- Replay invariants cover at least 100 seeded action sequences.
- A tester can complete the scenario from the game UI; not only through a CLI.
- A plausible screenshot does **not** substitute for a playable demo.
- Real-world observation cards trace to actual source; synthetic gameplay rules clearly disclosed.
- QA must log actual environment/commands/versions; don't self-award passing scores.

## Incremental plan

1. Establish CI/bootstrap checks that run on worker PRs.
2. Add headless reducer unit and property tests.
3. Add UI smoke and game journey tests after runnable app lands.
4. Publish one evidence ledger per integration checkpoint, with blockers and failed checks.

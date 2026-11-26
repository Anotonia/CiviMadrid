# WorldUX / 3D gameplay shell — M0 lane

**Workstream C** owns `apps/web/**` and 3D world visual interaction. Read the shared contract in `docs/WORLD_CONTRACT.md`.

## First acceptance
Deliver an actual Vite/React/Three.js (or equally viable) browser scene with:
- Instanced hex terrain, hover selection and pan/zoom camera.
- Readable game HUD; chosen cell inspector; landscape lighting and distinctive Madrid-inspired visual identity.
- A clearly marked **SYNTHETIC PROTOTYPE** until Agent A provides licensed geometry.
- An adapter mapping immutable `GeoCell[]` and `WorldState` to visual state, plus a typed `Command` dispatch hook after Agent B reducer becomes available.
- Screenshot/screencast and measured FPS; mobile and keyboard interaction.
- No fake “build” or “next turn” controls that claim actions succeeded without sim-core integration.

**Current status:** this file is the branch kickoff; UI implementation and browser tests are pending.

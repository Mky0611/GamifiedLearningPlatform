# Kế hoạch thực hiện thực tế — trong source gốc

## P0 (triển khai trước)
- [ ] Git clean baseline + source audit and screenshots.
- [ ] Asset alpha bbox/foot anchor normalization for 3 heroes, bosses.
- [ ] Phaser event state machine fix (`applyState` vs tweens).
- [ ] Unified Phaser/canvas fallback logical resolution.
- [ ] Responsive HTML workspace and docking; all controls within mobile viewport.
- [ ] Fix board inline minmax and touch.
- [ ] Smoke/e2e tests on desktop laptop mobile; no duplicate IDs.

## P1
- [ ] Pixel tokens, UI components (buttons/panels/icons/tabs), pixel font legibility.
- [ ] Pixel home/map/quiz/volcard/account layout.
- [ ] Full keyboard/accessibility/contrast tests.

## P2
- [ ] Backup SQL; audit CEFR 2023 null rows, language partition, duplicates.
- [ ] Content review workflow, IT domain tagging, A1-C2 curriculum.
- [ ] Learning word cards and spaced reviews persisted.

## P3
- [ ] JWT/session server-side identity and reward idempotency.
- [ ] Unit/integration tests and progression transactions.

## P4
- [ ] Dockerfile compose with volumes, env, CI E2E.
- [ ] Deployment POC: Vercel container runtime OR Vercel frontend + separate API, external SQL Server.

## P5
- [ ] Microservices only if justified by deployment/team/traffic requirements and written migration plan.

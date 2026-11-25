# P4-B.2 Execution Plan — Kingdom of Words

## 1. Branch & Scope
- **Base commit**: `7e725ed` (`feature/p4b-fantasy-pixel-redesign`)
- **Working branch**: `feature/p4b2-kingdom-of-words`
- **Goal**: Upgrade Lex Raid into an asset-driven Medieval Fantasy Pixel RPG ("Kingdom of Words") while preserving Java 21, Spring Boot 4.2.0, SQL Server schema, REST API contracts, P2 CEFR/IT vocabulary engine, P3 XP/Coins progression, and Vercel routing.

## 2. Milestones & Verification Gates
| Milestone | Focus | Key Outputs | Verification Gate |
|---|---|---|---|
| **A (B.2A)** | Asset Audit, License Classification & Manifest | `audit_ui_extra.py`, `curate_p4b2_assets.py`, `P4B2_ASSET_MANIFEST.json`, `P4B2_COMPONENT_ASSET_MAP.csv`, `P4B2_THIRD_PARTY_ASSETS.md`, `P4B2_EXECUTION_PLAN.md`, `P4B2_DECISIONS.md`, fixed cursor swap | Inspect contact sheets, confirm zero unverified `Tiny Swords (Free Pack)` new files redistributed |
| **B (B.2B)** | Asset-Driven Fantasy Design System | Seamless 9-slice UI panels (`ui/slices/`), Kibyra navbar icons, legible VN + fantasy typography (`Lora` + `Be Vietnam Pro` + `Pixelify Sans` + `JetBrains Mono`), Adventure Guild navbar & crisp logo | `/app/typography` check, contrast & 9-slice seam check |
| **C (B.2C)** | Shared Animated World Environments | `world-environment.js`, biome backdrops (Tall Forest, Mountain Dusk, GothicVania Town, Waterfall with attribution, Mira Forge torches), visibility pause, `prefers-reduced-motion` | Multi-route render & tab visibility pause check |
| **D (B.2D)** | Knight Animation Engine & Combat VFX | Explicit state machine (`IDLE/APPROACH/ATTACK/IMPACT/RECOVERY/RETURN/GUARD/HURT/DEATH/VICTORY`), `Warrior_Attack2`, pooled CC0/Mira Forge VFX, Phaser & Canvas parity | Rapid attack/reset/swap stress check + ground-anchor stability |
| **E (B.2E)** | Knight Skill Bar & Monster Expansion (Preview) | 6 tactical skills (Preview Mode), Slime & Skeleton preview entries with front portraits, Backend Reviewer API compatibility report | Skill trigger states + 0 backend DB/API mutations |
| **F (B.2F)** | Full 9-Page Kingdom Redesign | Unified fantasy UI across `home`, `minigame`, `volcard`, `account`, `quiz`, `auth`, `memory`, `speed-math`, `code-puzzle` | 9-viewport fit (`320x568`..`1920x1080`) + Volcard word fit |
| **G (B.2G)** | Performance & Runtime Optimization | Route-scoped asset loading, curated exports only (`UI Extra/` never committed/deployed), font/image weight audit | Network bytes & 0 unwanted `404` checks |
| **H (B.2H)** | Real Chromium Browser QA, Docs & Vercel Preview | Extended `chromium_p4b_acceptance.js`, visual screenshot inspection, `P4B2_QA_REPORT.md`, push branch, Vercel Preview deploy (**NO `--prod`**) | Fresh Chromium PASS across all 9 viewports & 9 pages + live Preview URL probe |

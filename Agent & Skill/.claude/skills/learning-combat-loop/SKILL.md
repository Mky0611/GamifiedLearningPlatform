---
name: learning-combat-loop
description: Use when implementing gameplay where valid English vocabulary affects boss combat, score, XP, mastery and spaced review.
---
# Learning Combat Loop

Read `AGENTS.md`, `docs/SOURCE_AUDIT.md`, and related source files. Provide Vietnamese progress and exact file-level changes.

## Workflow
1. Trace frontend request -> backend word validation -> damage/HP -> result events -> XP/coins -> user mastery.
2. Keep authoritative data validation on backend, deduplicate requests and rewards via session+action idempotency.
3. After valid attack: reveal word meaning/part of speech/usage and add review item. After battle: a concise learned words screen and due reviews.
4. Provide meaningful actionable feedback for invalid words; avoid exposing surprising undefined code acronyms in general A1 game.
5. Unit tests for win/lose, retry, network double-submit, XP once, mastery persistence.
## Acceptance
Learning is visible in combat and persists, rewards transactionally correct.

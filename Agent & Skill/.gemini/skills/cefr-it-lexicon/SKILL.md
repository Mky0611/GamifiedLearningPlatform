---
name: cefr-it-lexicon
description: Use when importing, classifying or validating English CEFR A1-C2 and professional IT vocabulary with bilingual meanings.
---
# Cefr It Lexicon

Read `AGENTS.md`, `docs/SOURCE_AUDIT.md`, and related source files. Provide Vietnamese progress and exact file-level changes.

## Workflow
1. Inspect actual UTF-16 SQL; identify language, vocabulary_sets/topic mappings, current CEFR NULLs, duplicates and Japanese entries.
2. Use sense-level schema and source/license fields. CEFR label stays NULL unless externally grounded and reviewed. Separate professional IT skill tier from CEFR.
3. Build vocabulary pack by domain; include POS, lemma, normalized key, definition EN, translation VI, authentic usage example, pronunciation/IPA if licensed, human review state.
4. Connect to game rules: single-letter tile words vs multi-word phrases and acronyms; map invalid items to flashcards not attack board.
5. Map word mastery and review, report CEFR coverage / unknowns / import reject reasons.
## Acceptance
No hallucinated A1-C2 assignments, no copyrighted bulk copy, and no mixed Japanese in English-only battle.

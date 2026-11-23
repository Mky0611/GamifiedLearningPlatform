#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Lex Raid — Vocabulary Engine Import & Validation Pipeline (Phase P2)
Strict DRY RUN Mode by default: Validates CEFR, IT Domains, POS, Board-Eligibility, and Duplicates.
"""

import os
import sys
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple, Set

# Canonical IT Domains (35 Domains + General + Academic)
CANONICAL_IT_DOMAINS = {
    "IT_COMP_FUND", "IT_OS", "IT_NETWORKS", "IT_PROG_FUND", "IT_OOP",
    "IT_FP", "IT_DSA", "IT_RUNTIMES", "IT_FE_CORE", "IT_FE_FRAMEWORKS",
    "IT_A11Y_PERF", "IT_BACKEND_API", "IT_AUTH_SEC", "IT_DB_RELATIONAL",
    "IT_DB_NOSQL", "IT_SW_DESIGN", "IT_DISTRIBUTED", "IT_DEVOPS",
    "IT_CONTAINERS", "IT_CLOUD", "IT_OBSERVABILITY", "IT_TESTING_QA",
    "IT_BUILD_TOOLS", "IT_VCS", "IT_MOBILE", "IT_GAME_DEV", "IT_AI_ML",
    "IT_DATA_ENG", "IT_CYBERSECURITY", "IT_PERFORMANCE", "IT_UX_PRODUCT",
    "IT_COLLAB_MGMT", "IT_IAC", "IT_EMBEDDED_IOT", "IT_DOMAIN_FINTECH",
    "GENERAL", "ACADEMIC"
}

CANONICAL_IT_TIERS = {"Foundation", "Practitioner", "Advanced", "Specialist"}

CANONICAL_CEFR_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}

CANONICAL_REVIEW_STATUSES = {"DRAFT_NOT_VALIDATED", "REVIEWED", "APPROVED"}

POS_MAP = {
    "n.": "noun", "n": "noun", "noun": "noun",
    "v.": "verb", "v": "verb", "verb": "verb",
    "adj.": "adjective", "adj": "adjective", "adjective": "adjective",
    "adv.": "adverb", "adv": "adverb", "adverb": "adverb",
    "prep.": "preposition", "prep": "preposition", "preposition": "preposition",
    "conj.": "conjunction", "conj": "conjunction", "conjunction": "conjunction",
    "phr.": "phrase", "phrase": "phrase", "idiom": "phrase"
}


def normalize_pos(raw_pos: Optional[str]) -> str:
    if not raw_pos:
        return "noun"
    cleaned = raw_pos.strip().lower()
    return POS_MAP.get(cleaned, cleaned)


def check_board_eligibility(lemma: str) -> Tuple[bool, Optional[str]]:
    """
    Checks if a lemma is suitable for a 1-tile letter grid combat board (5x5).
    Rules:
    - Pure ASCII letters only [A-Za-z]
    - No spaces, hyphens, or special characters
    - Length between 3 and 10 characters
    """
    if not lemma:
        return False, "Empty lemma"
    if " " in lemma:
        return False, "Multi-word phrase containing spaces (suitable for flashcard/quiz only)"
    if "-" in lemma:
        return False, "Hyphenated term (suitable for flashcard/quiz only)"
    if not re.fullmatch(r"[A-Za-z]+", lemma):
        return False, "Contains non-alphabetic characters"
    if len(lemma) < 3:
        return False, f"Length {len(lemma)} is too short (minimum 3 required)"
    if len(lemma) > 10:
        return False, f"Length {len(lemma)} is too long for 5x5 board (maximum 10 allowed)"
    return True, None


def load_existing_db_words(sql_path: Path) -> Set[str]:
    """Extract existing normalized words from script_GPL_v2.sql for duplicate checking."""
    existing_words = set()
    if not sql_path.exists():
        return existing_words

    try:
        content = sql_path.read_text(encoding="utf-16", errors="replace")
    except Exception:
        try:
            content = sql_path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            return existing_words

    for line in content.splitlines():
        line_clean = line.strip()
        if "INSERT" in line_clean and "vocabulary_words" in line_clean and "VALUES" in line_clean:
            v_match = re.search(r"VALUES\s*\((.*)\)", line_clean, re.IGNORECASE)
            if v_match:
                vals = v_match.group(1).split(",")
                # word_text is index 2, normalized_text is index 3
                if len(vals) >= 4:
                    norm = vals[3].strip().strip("'").strip("N'").strip().lower()
                    if norm:
                        existing_words.add(norm)
    return existing_words


class VocabularyImporter:
    def __init__(self, dry_run: bool = True, existing_words: Optional[Set[str]] = None):
        self.dry_run = dry_run
        self.existing_words = existing_words or set()
        self.processed = 0
        self.valid_items = []
        self.errors = []
        self.warnings = []
        self.seen_lemmas_in_batch = set()

    def validate_item(self, item: Dict[str, Any], index: int) -> Tuple[bool, Dict[str, Any]]:
        item_id = item.get("id", f"ITEM-{index+1:04d}")
        lemma = str(item.get("lemma", "")).strip()

        if not lemma:
            self.errors.append({
                "id": item_id,
                "lemma": "",
                "error": "Field 'lemma' is required and cannot be empty."
            })
            return False, item

        # 1. Language code check
        lang = str(item.get("languageCode", "en")).strip().lower()
        if lang != "en":
            self.errors.append({
                "id": item_id,
                "lemma": lemma,
                "error": f"Language '{lang}' rejected. Lex Raid English lexicon only accepts 'en'."
            })
            return False, item

        # 2. Normalized text
        normalized = str(item.get("normalizedText", "")).strip().lower()
        computed_norm = re.sub(r"[^a-z0-9]", "", lemma.lower())
        if not normalized:
            normalized = computed_norm
            self.warnings.append({
                "id": item_id,
                "lemma": lemma,
                "warning": f"Missing 'normalizedText'. Auto-computed as '{normalized}'."
            })

        # 3. Meaning Vi required
        meaning_vi = str(item.get("meaningVi", "")).strip()
        if not meaning_vi:
            self.errors.append({
                "id": item_id,
                "lemma": lemma,
                "error": "Field 'meaningVi' is mandatory for bilingual educational platform."
            })
            return False, item

        # 4. Part of Speech normalization
        raw_pos = item.get("partOfSpeech")
        pos = normalize_pos(raw_pos)

        # 5. CEFR Level Grounding & Validation
        raw_cefr = item.get("cefrLevel")
        cefr_level = None
        if raw_cefr:
            cleaned_cefr = str(raw_cefr).strip().upper()
            if cleaned_cefr in CANONICAL_CEFR_LEVELS:
                cefr_level = cleaned_cefr
                # Check for source citation
                source_uri = item.get("cefrSourceUri")
                if not source_uri:
                    self.warnings.append({
                        "id": item_id,
                        "lemma": lemma,
                        "warning": f"CEFR level '{cefr_level}' provided without 'cefrSourceUri'. Unverified grounding."
                    })
            else:
                self.warnings.append({
                    "id": item_id,
                    "lemma": lemma,
                    "warning": f"Invalid CEFR level '{raw_cefr}' reset to NULL per anti-hallucination policy."
                })

        # 6. IT Domain & Tier
        raw_domain = item.get("itDomain")
        it_domain = "GENERAL"
        if raw_domain:
            cleaned_domain = str(raw_domain).strip().upper()
            if cleaned_domain in CANONICAL_IT_DOMAINS:
                it_domain = cleaned_domain
            else:
                self.warnings.append({
                    "id": item_id,
                    "lemma": lemma,
                    "warning": f"Unknown IT domain '{raw_domain}'. Defaulted to 'GENERAL'."
                })

        raw_tier = item.get("itTier")
        it_tier = "Foundation"
        if raw_tier:
            cleaned_tier = str(raw_tier).strip().capitalize()
            if cleaned_tier in CANONICAL_IT_TIERS:
                it_tier = cleaned_tier
            else:
                self.warnings.append({
                    "id": item_id,
                    "lemma": lemma,
                    "warning": f"Unknown IT tier '{raw_tier}'. Defaulted to 'Foundation'."
                })

        # 7. Board eligibility check
        is_eligible, reason = check_board_eligibility(lemma)
        explicit_eligible = item.get("boardEligible")
        if explicit_eligible is not None and bool(explicit_eligible) != is_eligible:
            self.warnings.append({
                "id": item_id,
                "lemma": lemma,
                "warning": f"boardEligible mismatch: Specified {explicit_eligible}, but rules computed {is_eligible} ({reason}). Overriding."
            })

        # 8. Review status
        raw_review = item.get("reviewStatus", "DRAFT_NOT_VALIDATED")
        review_status = raw_review if raw_review in CANONICAL_REVIEW_STATUSES else "DRAFT_NOT_VALIDATED"

        # 9. Duplicate detection
        norm_key = (normalized, pos)
        if norm_key in self.seen_lemmas_in_batch:
            self.warnings.append({
                "id": item_id,
                "lemma": lemma,
                "warning": f"Duplicate lemma '{lemma}' with POS '{pos}' in current import batch."
            })
        self.seen_lemmas_in_batch.add(norm_key)

        if normalized in self.existing_words:
            self.warnings.append({
                "id": item_id,
                "lemma": lemma,
                "warning": f"Lemma '{lemma}' already exists in seed database (2098 words)."
            })

        validated_record = {
            "id": item_id,
            "languageCode": "en",
            "lemma": lemma,
            "normalizedText": normalized,
            "partOfSpeech": pos,
            "senseKey": item.get("senseKey", "sense-1"),
            "meaningVi": meaning_vi,
            "definitionEn": item.get("definitionEn"),
            "exampleEn": item.get("exampleEn"),
            "ipa": item.get("ipa"),
            "cefrLevel": cefr_level,
            "cefrSourceUri": item.get("cefrSourceUri"),
            "itDomain": it_domain,
            "itTier": it_tier,
            "boardEligible": is_eligible,
            "sourceUri": item.get("sourceUri"),
            "license": item.get("license"),
            "reviewStatus": review_status
        }

        return True, validated_record

    def run_dry_run(self, input_file: Path) -> Dict[str, Any]:
        if not input_file.exists():
            raise FileNotFoundError(f"Input file not found: {input_file}")

        content = input_file.read_text(encoding="utf-8")
        data = json.loads(content)

        if not isinstance(data, list):
            raise ValueError("Input JSON must contain an array of vocabulary items.")

        self.processed = len(data)
        cefr_counts = {"A1": 0, "A2": 0, "B1": 0, "B2": 0, "C1": 0, "C2": 0, "UNVERIFIED": 0}
        domain_counts = {}
        tier_counts = {"Foundation": 0, "Practitioner": 0, "Advanced": 0, "Specialist": 0}
        board_eligible_count = 0
        flashcard_only_count = 0

        for idx, raw_item in enumerate(data):
            is_valid, record = self.validate_item(raw_item, idx)
            if is_valid:
                self.valid_items.append(record)
                c_level = record["cefrLevel"]
                if c_level in cefr_counts:
                    cefr_counts[c_level] += 1
                else:
                    cefr_counts["UNVERIFIED"] += 1

                dom = record["itDomain"]
                domain_counts[dom] = domain_counts.get(dom, 0) + 1

                tier = record["itTier"]
                if tier in tier_counts:
                    tier_counts[tier] += 1

                if record["boardEligible"]:
                    board_eligible_count += 1
                else:
                    flashcard_only_count += 1

        report = {
            "dryRun": True,
            "inputFile": str(input_file),
            "totalProcessed": self.processed,
            "validCount": len(self.valid_items),
            "rejectedCount": len(self.errors),
            "warningCount": len(self.warnings),
            "boardEligibleCount": board_eligible_count,
            "flashcardOnlyCount": flashcard_only_count,
            "cefrBreakdown": cefr_counts,
            "tierBreakdown": tier_counts,
            "domainBreakdown": domain_counts,
            "errors": self.errors,
            "warnings": self.warnings
        }

        return report


def main():
    parser = argparse.ArgumentParser(description="Lex Raid Vocabulary Import Pipeline (Phase P2)")
    parser.add_argument("--input", type=str, default="Agent & Skill/data/vocabulary_import_template.json",
                        help="Path to input JSON file")
    parser.add_argument("--output", type=str, default="docs/P2_IMPORT_DRY_RUN_REPORT.json",
                        help="Path to output dry-run report JSON")
    parser.add_argument("--sql-seed", type=str, default="script_GPL_v2.sql",
                        help="Path to SQL seed file to check existing words")
    parser.add_argument("--dry-run", action="store_true", default=True,
                        help="Execute in strict dry-run mode without DB modification (default: True)")

    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    sql_path = Path(args.sql_seed)

    print(f"[Lex Raid Importer] Starting vocabulary validation pipeline...")
    print(f"[Lex Raid Importer] Input: {input_path}")
    print(f"[Lex Raid Importer] Dry Run Mode: {args.dry_run}")

    existing_words = set()
    if sql_path.exists():
        print(f"[Lex Raid Importer] Loading existing seed words from {sql_path}...")
        existing_words = load_existing_db_words(sql_path)
        print(f"[Lex Raid Importer] Found {len(existing_words)} existing words in seed.")

    importer = VocabularyImporter(dry_run=args.dry_run, existing_words=existing_words)
    report = importer.run_dry_run(input_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n[Lex Raid Importer] --- DRY RUN SUMMARY ---")
    print(f"Total Processed: {report['totalProcessed']}")
    print(f"Valid: {report['validCount']}")
    print(f"Rejected: {report['rejectedCount']}")
    print(f"Warnings: {report['warningCount']}")
    print(f"Board Eligible (1-tile combat): {report['boardEligibleCount']}")
    print(f"Flashcard/Quiz Only: {report['flashcardOnlyCount']}")
    print(f"CEFR Distribution: {report['cefrBreakdown']}")
    print(f"IT Tier Distribution: {report['tierBreakdown']}")
    print(f"Report written to: {output_path}")


if __name__ == "__main__":
    main()

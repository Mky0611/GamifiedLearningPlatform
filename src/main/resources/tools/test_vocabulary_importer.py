#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unit tests for Lex Raid vocabulary importer tool.
"""

import unittest
import json
import sys
import tempfile
from pathlib import Path

# Ensure directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from vocabulary_importer import (
    VocabularyImporter,
    normalize_pos,
    check_board_eligibility,
    CANONICAL_IT_DOMAINS,
    CANONICAL_IT_TIERS
)

class TestVocabularyImporter(unittest.TestCase):

    def test_pos_normalization(self):
        self.assertEqual(normalize_pos("n."), "noun")
        self.assertEqual(normalize_pos("v."), "verb")
        self.assertEqual(normalize_pos("adj."), "adjective")
        self.assertEqual(normalize_pos("adv."), "adverb")
        self.assertEqual(normalize_pos("prep."), "preposition")
        self.assertEqual(normalize_pos("noun"), "noun")
        self.assertEqual(normalize_pos(None), "noun")

    def test_board_eligibility(self):
        # Valid single-word 3-10 chars
        eligible, reason = check_board_eligibility("compile")
        self.assertTrue(eligible)
        self.assertIsNone(reason)

        eligible, reason = check_board_eligibility("api")
        self.assertTrue(eligible)

        eligible, reason = check_board_eligibility("algorithm")
        self.assertTrue(eligible)

        # Multi-word phrase -> ineligible
        eligible, reason = check_board_eligibility("continuous integration")
        self.assertFalse(eligible)
        self.assertIn("Multi-word", reason)

        # Hyphenated -> ineligible
        eligible, reason = check_board_eligibility("real-time")
        self.assertFalse(eligible)
        self.assertIn("Hyphenated", reason)

        # Too short (< 3)
        eligible, reason = check_board_eligibility("go")
        self.assertFalse(eligible)
        self.assertIn("too short", reason)

        # Too long (> 10)
        eligible, reason = check_board_eligibility("congratulations")
        self.assertFalse(eligible)
        self.assertIn("too long", reason)

        # Non-alphabetic
        eligible, reason = check_board_eligibility("c#")
        self.assertFalse(eligible)
        self.assertIn("non-alphabetic", reason)

    def test_validation_pipeline_dry_run(self):
        sample_payload = [
            {
                "id": "TEST-001",
                "languageCode": "en",
                "lemma": "variable",
                "normalizedText": "variable",
                "partOfSpeech": "n.",
                "meaningVi": "biến số",
                "definitionEn": "a named storage location in memory",
                "cefrLevel": "B1",
                "cefrSourceUri": "https://dictionary.cambridge.org",
                "itDomain": "IT_PROG_FUND",
                "itTier": "Foundation",
                "boardEligible": True,
                "reviewStatus": "REVIEWED"
            },
            {
                "id": "TEST-002",
                "languageCode": "en",
                "lemma": "dependency injection",
                "normalizedText": "dependencyinjection",
                "partOfSpeech": "phrase",
                "meaningVi": "tiêm phụ thuộc",
                "definitionEn": "a design pattern for loose coupling",
                "cefrLevel": "B2",
                "itDomain": "IT_SW_DESIGN",
                "itTier": "Advanced",
                "boardEligible": False,
                "reviewStatus": "DRAFT_NOT_VALIDATED"
            },
            {
                "id": "TEST-003",
                "languageCode": "ja",
                "lemma": "arigatou",
                "meaningVi": "cảm ơn"
            }
        ]

        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".json", delete=False) as tmp:
            json.dump(sample_payload, tmp)
            tmp_path = Path(tmp.name)

        try:
            importer = VocabularyImporter(dry_run=True, existing_words={"variable"})
            report = importer.run_dry_run(tmp_path)

            self.assertEqual(report["totalProcessed"], 3)
            self.assertEqual(report["validCount"], 2)
            self.assertEqual(report["rejectedCount"], 1) # Japanese rejected
            self.assertEqual(report["boardEligibleCount"], 1) # variable
            self.assertEqual(report["flashcardOnlyCount"], 1) # dependency injection
            self.assertEqual(report["cefrBreakdown"]["B1"], 1)
            self.assertEqual(report["cefrBreakdown"]["B2"], 1)

            # Check that existing word warning was emitted
            has_db_warning = any("already exists in seed database" in w["warning"] for w in report["warnings"])
            self.assertTrue(has_db_warning)

        finally:
            if tmp_path.exists():
                tmp_path.unlink()

if __name__ == "__main__":
    unittest.main()

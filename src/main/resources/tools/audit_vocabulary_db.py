#!/usr/bin/env python3
"""
Lex Raid - Phase P2 Vocabulary & Database Audit
Parses SQL Server seed script_GPL_v2.sql (UTF-16 LE) and extracts exact metrics:
1. Total vocabulary words, sets, topics
2. Words by languageCode
3. Words by CEFR level (A1-C2, NULL, UNKNOWN)
4. Duplicate normalizedText within same set
5. Missing meaningVi or meaningEn
6. Missing partOfSpeech
7. Words with non-alpha characters / spaces (unsuitable for 1-tile Word Board)
8. Multi-sense lemmas
9. Linkage between stages, stage_core_words, and vocabulary_sets
"""

import re
import sys
from pathlib import Path
from collections import defaultdict, Counter

SQL_PATH = Path(__file__).resolve().parents[4] / "script_GPL_v2.sql"
if not SQL_PATH.exists():
    SQL_PATH = Path("script_GPL_v2.sql").resolve()

def parse_sql_values(vals_str):
    vals = []
    cur = []
    in_str = False
    in_cast = 0
    i = 0
    while i < len(vals_str):
        ch = vals_str[i]
        if ch == "'":
            if in_str and i + 1 < len(vals_str) and vals_str[i+1] == "'":
                cur.append("'")
                i += 1
            else:
                in_str = not in_str
                cur.append(ch)
        elif not in_str and ch == "(":
            in_cast += 1
            cur.append(ch)
        elif not in_str and ch == ")":
            if in_cast > 0:
                in_cast -= 1
                cur.append(ch)
            else:
                # End of VALUES (...)
                break
        elif ch == "," and not in_str and in_cast == 0:
            raw_val = "".join(cur).strip()
            vals.append(clean_sql_val(raw_val))
            cur = []
        else:
            cur.append(ch)
        i += 1
    if cur:
        raw_val = "".join(cur).strip()
        vals.append(clean_sql_val(raw_val))
    return vals

def clean_sql_val(val):
    if not val or val.upper() == "NULL":
        return None
    if val.startswith("N'") and val.endswith("'"):
        return val[2:-1]
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1]
    if val.startswith("CAST(") and " AS " in val:
        # e.g. CAST(N'2026-04-03T09:35:22.0000000' AS DateTime2)
        m = re.search(r"CAST\((?:N)?'([^']+)'", val)
        if m:
            return m.group(1)
    return val

def extract_inserts_from_file():
    tables_to_extract = {
        "vocabulary_topics": [],
        "vocabulary_sets": [],
        "vocabulary_words": [],
        "stages": [],
        "stage_core_words": []
    }
    
    print(f"Reading {SQL_PATH} (UTF-16 LE)...")
    with open(SQL_PATH, "r", encoding="utf-16", errors="replace") as f:
        for line in f:
            line_str = line.strip()
            if not line_str.startswith("INSERT "):
                continue
            for tbl in tables_to_extract.keys():
                prefix = f"INSERT [dbo].[{tbl}] ("
                alt_prefix = f"INSERT [{tbl}] ("
                if line_str.startswith(prefix) or line_str.startswith(alt_prefix):
                    val_idx = line_str.find(") VALUES (")
                    if val_idx == -1:
                        val_idx = line_str.find(") values (")
                    if val_idx != -1:
                        cols_part = line_str[line_str.find("(")+1:val_idx]
                        vals_part = line_str[val_idx + len(") VALUES ("):]
                        if vals_part.endswith(");"):
                            vals_part = vals_part[:-2]
                        elif vals_part.endswith(")"):
                            vals_part = vals_part[:-1]
                            
                        cols = [c.strip().strip("[]").lower() for c in cols_part.split(",")]
                        vals = parse_sql_values(vals_part)
                        
                        row = dict(zip(cols, vals[:len(cols)]))
                        tables_to_extract[tbl].append(row)
                    break
                    
    return tables_to_extract

def audit():
    tables = extract_inserts_from_file()

    topics = tables["vocabulary_topics"]
    sets = tables["vocabulary_sets"]
    words = tables["vocabulary_words"]
    stages = tables["stages"]
    core_words = tables["stage_core_words"]

    print(f"\n--- RAW TABLE COUNTS ---")
    print(f"vocabulary_topics rows: {len(topics)}")
    print(f"vocabulary_sets rows:   {len(sets)}")
    print(f"vocabulary_words rows:  {len(words)}")
    print(f"stages rows:            {len(stages)}")
    print(f"stage_core_words rows:  {len(core_words)}")

    # Map sets to language and topic
    set_map = {}
    for s in sets:
        sid = s.get("vocabulary_set_id")
        set_map[sid] = s

    # 1. Language breakdown
    words_by_lang = Counter()
    for w in words:
        sid = w.get("vocabulary_set_id")
        s = set_map.get(sid, {})
        lang = s.get("language_code", "UNKNOWN")
        words_by_lang[lang] += 1

    print(f"\n--- 1. WORDS BY LANGUAGE (via vocabulary_sets.language_code) ---")
    for lang, count in words_by_lang.most_common():
        print(f"  {lang}: {count} words")

    # 2. CEFR level breakdown
    cefr_counter = Counter()
    for w in words:
        cefr = w.get("level_cefr")
        if cefr is None:
            cefr_counter["NULL"] += 1
        else:
            clean_cefr = cefr.strip().upper()
            cefr_counter[clean_cefr] += 1

    print(f"\n--- 2. WORDS BY CEFR LEVEL ---")
    for lvl in ["A1", "A2", "B1", "B2", "C1", "C2", "NULL", "OTHER"]:
        if lvl in cefr_counter:
            print(f"  {lvl}: {cefr_counter[lvl]}")
    for k, v in cefr_counter.items():
        if k not in ["A1", "A2", "B1", "B2", "C1", "C2", "NULL"]:
            print(f"  UNEXPECTED CEFR '{k}': {v}")

    # 3. Part of Speech breakdown
    pos_counter = Counter()
    missing_pos = 0
    for w in words:
        pos = w.get("part_of_speech")
        if not pos or pos.strip() == "":
            missing_pos += 1
        else:
            pos_counter[pos.strip().lower()] += 1

    print(f"\n--- 3. PART OF SPEECH BREAKDOWN ---")
    print(f"  Missing / Empty POS: {missing_pos}")
    for pos, count in pos_counter.most_common(10):
        print(f"  {pos}: {count}")

    # 4. Missing meanings
    missing_vi = 0
    missing_en = 0
    missing_both = 0
    for w in words:
        vi = w.get("meaning_vi")
        en = w.get("meaning_en")
        no_vi = not vi or vi.strip() == ""
        no_en = not en or en.strip() == ""
        if no_vi and no_en:
            missing_both += 1
        elif no_vi:
            missing_vi += 1
        elif no_en:
            missing_en += 1

    print(f"\n--- 4. MISSING MEANINGS ---")
    print(f"  Missing meaning_vi only: {missing_vi}")
    print(f"  Missing meaning_en only: {missing_en}")
    print(f"  Missing both meanings:   {missing_both}")

    # 5. Duplicates within same vocabulary_set
    set_word_counts = defaultdict(Counter)
    for w in words:
        sid = w.get("vocabulary_set_id")
        norm = (w.get("normalized_text") or "").strip().lower()
        set_word_counts[sid][norm] += 1

    total_duplicates = 0
    duplicate_samples = []
    for sid, counter in set_word_counts.items():
        for norm, count in counter.items():
            if count > 1:
                total_duplicates += (count - 1)
                duplicate_samples.append((sid, norm, count))

    print(f"\n--- 5. DUPLICATES WITHIN SAME SET ---")
    print(f"  Total duplicate entries within set: {total_duplicates}")
    if duplicate_samples:
        print(f"  Sample duplicates (first 10):")
        for sid, norm, count in duplicate_samples[:10]:
            print(f"    Set ID {sid}: '{norm}' appears {count} times")

    # 6. Word Board Suitability (spaces, special chars, length < 3 or > 10)
    unsuitable_words = []
    english_words_only = []
    japanese_words = []
    for w in words:
        sid = w.get("vocabulary_set_id")
        lang = set_map.get(sid, {}).get("language_code", "")
        txt = (w.get("word_text") or "").strip()
        norm = (w.get("normalized_text") or "").strip()
        
        if lang == "ja" or any(ord(c) > 127 for c in txt):
            japanese_words.append(w)
            continue
            
        english_words_only.append(w)
        
        reasons = []
        if " " in txt:
            reasons.append("CONTAINS_SPACE (multi-word phrase)")
        if not norm.isalpha():
            reasons.append("NON_ALPHA_CHARS (hyphen/punct/digits)")
        if len(norm) < 3:
            reasons.append(f"TOO_SHORT ({len(norm)} < 3)")
        if len(norm) > 10:
            reasons.append(f"TOO_LONG ({len(norm)} > 10)")
            
        if reasons:
            unsuitable_words.append((w.get("word_id"), txt, reasons))

    print(f"\n--- 6. WORD BOARD SUITABILITY (ENGLISH WORDS ONLY) ---")
    print(f"  Total English words evaluated: {len(english_words_only)}")
    print(f"  Unsuitable for 1-tile Word Board: {len(unsuitable_words)}")
    reason_counts = Counter(r for _, _, r_list in unsuitable_words for r in r_list)
    for r, c in reason_counts.most_common():
        print(f"    - {r}: {c}")
    print(f"  Sample unsuitable words (first 10):")
    for wid, txt, r_list in unsuitable_words[:10]:
        print(f"    [ID {wid}] '{txt}': {', '.join(r_list)}")

    # 7. Stages & Core Words Linkage
    print(f"\n--- 7. STAGE & CORE WORD LINKAGE ---")
    words_map = {w.get('word_id'): w for w in words}
    stage_set_ids = {s.get("vocabulary_set_id") for s in stages if s.get("vocabulary_set_id")}
    print(f"  Stages count: {len(stages)}")
    for st in stages:
        st_id = st.get("stage_id")
        name = st.get("name")
        set_id = st.get("vocabulary_set_id")
        st_set = set_map.get(set_id, {})
        st_cores = [c for c in core_words if c.get("stage_id") == st_id]
        core_info = []
        for c in st_cores:
            w = words_map.get(c.get("word_id"), {})
            core_info.append(f"'{w.get('word_text')}' (clue: {c.get('clue_text_override')})")
        print(f"  Stage {st_id} ({name}): Set {set_id} ('{st_set.get('title')}', lang={st_set.get('language_code')}), Cores: {', '.join(core_info) if core_info else 'None'}")

    # 8. All Topics and Sets
    print(f"\n--- 8. ALL TOPICS ({len(topics)}) ---")
    for t in topics:
        print(f"  ID {t.get('topic_id')}: [{t.get('code')}] {t.get('name')}")

    print(f"\n--- 9. ALL SETS ({len(sets)}) ---")
    for s in sets:
        print(f"  ID {s.get('vocabulary_set_id')}: Topic {s.get('topic_id')} | '{s.get('title')}' (lang={s.get('language_code')}, words={s.get('total_words')})")

if __name__ == "__main__":
    audit()

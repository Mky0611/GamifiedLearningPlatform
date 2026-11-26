#!/usr/bin/env python3
"""Build verified offline English Lexicon from official en-wl/wordlist (ESDB / SCOWLv2) v2 data.

Only uses entries at size <= 60 (pure Kevin Atkinson permissive ESDB/SCOWL notice + 12Dicts/ENABLE2K PD),
plus en-wl/v2/data/basic and en-wl/v2/data/hacker IT words and existing repository vocabulary words.
Outputs sorted normalized UPPERCASE words (length 3..12, A-Z only) for both Java backend and JS Preview.
"""
from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BACKEND_DIR = ROOT / "src/main/resources/lexicon"
FRONTEND_DATA = ROOT / "src/main/resources/FrontEnd/assets/data"
SQL_SEED = ROOT / "script_GPL_v2.sql"

URLS = {
    "copyright": "https://raw.githubusercontent.com/en-wl/wordlist/v2/Copyright",
    "basic": "https://raw.githubusercontent.com/en-wl/wordlist/v2/data/basic",
    "hacker": "https://raw.githubusercontent.com/en-wl/wordlist/v2/data/hacker",
    "scowl": "https://raw.githubusercontent.com/en-wl/wordlist/v2/data/scowl-pre.txt",
}

SIZE_RE = re.compile(r"^(\d+)")
ALPHA_RE = re.compile(r"^[a-z]{3,12}$")

# Strictly curated everyday 2-letter English words (no obscure Scrabble 2-letter codes like AA/XU/ZA)
COMMON_2_LETTER_WORDS = {
    "AM", "AN", "AS", "AT", "BE", "BY", "DO", "GO", "HE", "IF", "IN", "IS",
    "IT", "ME", "MY", "NO", "OF", "ON", "OR", "SO", "TO", "UP", "US", "WE"
}

# Everyday basic tech / learning anchor words guaranteed in common pool if present in verified lexicon
BASIC_TECH_COMMON = {
    "APP", "BUG", "BYTE", "CACHE", "CHAT", "CLICK", "CLOUD", "CODE", "DATA",
    "DISK", "EMAIL", "FILE", "FONT", "GAME", "GRID", "HELP", "HOST", "HTML",
    "ICON", "INFO", "INPUT", "JAVA", "KEY", "LINK", "LIST", "LOAD", "LOCK",
    "LOG", "LOGIN", "MAIL", "MENU", "MODE", "MOUSE", "NET", "NODE", "NOTE",
    "PAGE", "PATH", "PING", "PORT", "POST", "PRINT", "QUERY", "QUEUE", "QUIZ",
    "RAID", "READ", "RESET", "SAVE", "SCAN", "SCORE", "SCREEN", "SEARCH",
    "SEED", "SEND", "SERVER", "SHARE", "SHIFT", "SIGN", "SITE", "SKILL",
    "SORT", "STACK", "START", "STOP", "SYNC", "TAB", "TAG", "TASK", "TEAM",
    "TECH", "TEST", "TEXT", "TILE", "TIME", "TIMER", "TOKEN", "TOOL", "TRACK",
    "TYPE", "UNIT", "USER", "VIEW", "WEB", "WIFI", "WINDOW", "WORD", "WRITE"
}


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "LexRaid-LexiconBuilder/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_basic_or_hacker(text: str, max_size: int = 60) -> set[str]:
    words: set[str] = set()
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        m = SIZE_RE.match(line)
        if not m or int(m.group(1)) > max_size:
            continue
        if "<abbr>" in line or "</upper>" in line or "<n/upper>" in line:
            continue
        body = line.split(":", 1)[1].strip() if ":" in line else ""
        # Strip inline tag & gloss
        head_part = re.sub(r"<[^>]+>", "", body)
        head_part = re.sub(r"\{[^}]+\}", "", head_part)
        # Split headword and inflections after ':'
        for chunk in head_part.split(":"):
            for tok in re.split(r"[,|()\s/]+", chunk):
                tok = tok.strip()
                if not tok or "@" in tok or "'" in tok or "-" in tok or tok.endswith("-"):
                    continue
                if tok.islower() and ALPHA_RE.match(tok):
                    words.add(tok.upper())
    return words


def parse_scowl_pre(text: str, max_size: int = 60) -> set[str]:
    words: set[str] = set()
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            continue
        meta, rest = line.split(":", 1)
        sizes = [int(s) for s in re.findall(r"\b(\d+)\b", meta)]
        if not sizes or min(sizes) > max_size:
            continue
        if "<abbr>" in rest or "</upper" in rest or "<n/upper" in rest:
            continue
        cleaned = re.sub(r"<[^>]+>", "", rest)
        cleaned = re.sub(r"\{[^}]+\}", "", cleaned)
        for chunk in cleaned.split(":"):
            for tok in re.split(r"[,|()\s/]+", chunk):
                tok = tok.strip()
                if not tok or "@" in tok or "'" in tok or "-" in tok or "!" in tok:
                    continue
                if tok.islower() and ALPHA_RE.match(tok):
                    words.add(tok.upper())
    return words


def extract_sql_english_words() -> set[str]:
    if not SQL_SEED.exists():
        return set()
    txt = SQL_SEED.read_text(encoding="utf-8", errors="ignore")
    # Extract normalized_text column values from vocabulary_words seed rows
    found = set()
    for m in re.findall(r"N?'([a-z]{3,12})'", txt):
        if ALPHA_RE.match(m):
            found.add(m.upper())
    return found


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def build_common_pool(basic_txt: str, scowl_txt: str, full_words: set[str]) -> set[str]:
    # SCOWL / ESDB size <= 20 covers core ~1,600-2,400 ultra-common everyday English words
    tier20 = parse_basic_or_hacker(basic_txt, max_size=20) | parse_scowl_pre(scowl_txt, max_size=20)
    common = {w for w in tier20 if 3 <= len(w) <= 8}
    if len(common) < 1200:
        tier35 = parse_basic_or_hacker(basic_txt, max_size=35) | parse_scowl_pre(scowl_txt, max_size=35)
        for w in sorted(tier35):
            if 3 <= len(w) <= 7:
                common.add(w)
            if len(common) >= 2400:
                break
    common |= {w for w in BASIC_TECH_COMMON if w in full_words}
    common |= COMMON_2_LETTER_WORDS
    return common & full_words


def main() -> None:
    print("Fetching official en-wl/wordlist v2 files...")
    copyright_txt = fetch_text(URLS["copyright"]).split("===", 1)[0].strip()
    basic_txt = fetch_text(URLS["basic"])
    hacker_txt = fetch_text(URLS["hacker"])
    scowl_txt = fetch_text(URLS["scowl"])

    words = set()
    words |= parse_basic_or_hacker(basic_txt, max_size=60)
    words |= parse_basic_or_hacker(hacker_txt, max_size=70)
    words |= parse_scowl_pre(scowl_txt, max_size=60)
    words |= extract_sql_english_words()
    words |= COMMON_2_LETTER_WORDS

    common_words = build_common_pool(basic_txt, scowl_txt, words)

    sorted_words = sorted(words)
    sorted_common = sorted(common_words)
    payload = "\n".join(sorted_words) + "\n"
    common_payload = "\n".join(sorted_common) + "\n"

    full_sha = sha256_bytes(payload.encode("utf-8"))
    common_sha = sha256_bytes(common_payload.encode("utf-8"))

    manifest = {
        "source": "en-wl/wordlist v2 (ESDB / SCOWLv2 size<=60, data/hacker<=70, core common<=20/35) + curated 2-letter everyday words",
        "license": "LICENSE_EN_WL.txt",
        "fullCount": len(sorted_words),
        "fullSha256": full_sha,
        "commonCount": len(sorted_common),
        "commonSha256": common_sha,
        "twoLetterWhitelist": sorted(COMMON_2_LETTER_WORDS),
    }
    manifest_json = json.dumps(manifest, indent=2) + "\n"

    BACKEND_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_DATA.mkdir(parents=True, exist_ok=True)

    (BACKEND_DIR / "LICENSE_EN_WL.txt").write_text(
        "Source: https://github.com/en-wl/wordlist (v2, size <= 60 + data/hacker <= 70)\n\n" + copyright_txt + "\n",
        encoding="utf-8",
    )
    (BACKEND_DIR / "english-words.txt").write_text(payload, encoding="utf-8")
    (FRONTEND_DATA / "english-words.txt").write_text(payload, encoding="utf-8")
    (BACKEND_DIR / "common-words.txt").write_text(common_payload, encoding="utf-8")
    (FRONTEND_DATA / "common-words.txt").write_text(common_payload, encoding="utf-8")
    (BACKEND_DIR / "lexicon-manifest.json").write_text(manifest_json, encoding="utf-8")
    (FRONTEND_DATA / "lexicon-manifest.json").write_text(manifest_json, encoding="utf-8")
    print(f"Built verified lexicon: {len(sorted_words)} full ({full_sha[:12]}), {len(sorted_common)} common ({common_sha[:12]})")


if __name__ == "__main__":
    main()

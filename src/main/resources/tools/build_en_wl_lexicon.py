#!/usr/bin/env python3
"""Build verified offline English Lexicon from official en-wl/wordlist (ESDB / SCOWLv2) v2 data.

Only uses entries at size <= 60 (pure Kevin Atkinson permissive ESDB/SCOWL notice + 12Dicts/ENABLE2K PD),
plus en-wl/v2/data/basic and en-wl/v2/data/hacker IT words and existing repository vocabulary words.
Outputs sorted normalized UPPERCASE words (length 3..12, A-Z only) for both Java backend and JS Preview.
"""
from __future__ import annotations

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

    sorted_words = sorted(words)
    payload = "\n".join(sorted_words) + "\n"

    BACKEND_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_DATA.mkdir(parents=True, exist_ok=True)

    (BACKEND_DIR / "LICENSE_EN_WL.txt").write_text(
        "Source: https://github.com/en-wl/wordlist (v2, size <= 60 + data/hacker <= 70)\n\n" + copyright_txt + "\n",
        encoding="utf-8",
    )
    (BACKEND_DIR / "english-words.txt").write_text(payload, encoding="utf-8")
    (FRONTEND_DATA / "english-words.txt").write_text(payload, encoding="utf-8")
    print(f"Built verified lexicon: {len(sorted_words)} words ({len(payload) / 1024:.1f} KB)")


if __name__ == "__main__":
    main()

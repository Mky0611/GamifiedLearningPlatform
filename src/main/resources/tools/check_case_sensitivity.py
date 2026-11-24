#!/usr/bin/env python3
import os
import re
import subprocess
from pathlib import Path

ROOT = (Path(__file__).resolve().parents[1] / 'FrontEnd').resolve()
all_files = {}
for root, dirs, files in os.walk(ROOT):
    for f in files:
        full = Path(root) / f
        rel = full.relative_to(ROOT).as_posix()
        all_files[rel.lower()] = rel

print(f"Total files indexed on disk: {len(all_files)}")

# 1. Regex check for static strings
asset_pattern = re.compile(r"['\"](/ui/[^'\"?#]+)['\"]")
case_mismatches = []
missing = []

for root, dirs, files in os.walk(ROOT):
    for f in files:
        p = Path(root) / f
        if p.suffix in ('.html', '.css', '.js'):
            try:
                content = p.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                continue
            for m in asset_pattern.findall(content):
                target_rel = m.replace('/ui/', '', 1)
                target_lower = target_rel.lower()
                if target_lower not in all_files:
                    missing.append((p.relative_to(ROOT).as_posix(), m))
                else:
                    actual = all_files[target_lower]
                    if actual != target_rel:
                        case_mismatches.append((p.relative_to(ROOT).as_posix(), m, actual))

# 2. Node check to evaluate raid-config.js and extract all boss/hero frames
node_script = """
const fs = require('fs');
const window = {};
eval(fs.readFileSync('src/main/resources/FrontEnd/assets/js/phaser/raid-config.js', 'utf8'));
const urls = [];
if (window.RaidPhaserConfig) {
  const cfg = window.RaidPhaserConfig;
  if (cfg.backgroundUrl) urls.push(cfg.backgroundUrl);
  for (const h of Object.values(cfg.heroes || {})) {
    for (const k of ['idle', 'run', 'attack', 'guard']) {
      if (h[k] && h[k].url) urls.push(h[k].url);
    }
  }
  for (const b of Object.values(cfg.bosses || {})) {
    for (const k of ['idle', 'attack', 'hit']) {
      if (b[k] && Array.isArray(b[k].frames)) urls.push(...b[k].frames);
    }
  }
}
console.log(JSON.stringify(urls));
"""
res = subprocess.run(['node', '-e', node_script], capture_output=True, text=True)
if res.returncode == 0:
    import json
    phaser_urls = json.loads(res.stdout.strip())
    print(f"Phaser URLs extracted from raid-config.js: {len(phaser_urls)}")
    for url in phaser_urls:
        if url.startswith('/ui/'):
            target_rel = url.replace('/ui/', '', 1)
            target_lower = target_rel.lower()
            if target_lower not in all_files:
                missing.append(('raid-config.js', url))
            else:
                actual = all_files[target_lower]
                if actual != target_rel:
                    case_mismatches.append(('raid-config.js', url, actual))
else:
    print(f"Warning: Node eval failed: {res.stderr}")

print(f"Missing assets total: {len(missing)}")
for r, m in missing:
    print(f"  MISSING: {r} -> {m}")
print(f"Case mismatches total: {len(case_mismatches)}")
for r, m, actual in case_mismatches:
    print(f"  MISMATCH: {r} -> referenced '{m}' but on disk: '/ui/{actual}'")

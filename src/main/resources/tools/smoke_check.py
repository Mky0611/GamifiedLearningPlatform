#!/usr/bin/env python3
from __future__ import annotations
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'FrontEnd'
JS_PAGE_MAP = {
    'assets/js/home.js': 'src/pages/home.html',
    'assets/js/auth.js': 'src/pages/auth.html',
    'assets/js/minigame.js': 'src/pages/minigame.html',
    'assets/js/volcard.js': 'src/pages/volcard.html',
}

asset_pattern = re.compile(r"['\"](/ui/[^'\"]+)['\"]")
id_pattern = re.compile(r"getElementById\(['\"]([^'\"]+)['\"]\)")

missing_assets = []
missing_ids = []
js_syntax_errors = []

for path in ROOT.rglob('*'):
    if not path.is_file():
        continue
    rel = path.relative_to(ROOT).as_posix()
    if path.suffix in {'.html', '.css', '.js'}:
        text = path.read_text(encoding='utf-8', errors='ignore')
        for match in asset_pattern.findall(text):
            target = ROOT / match.replace('/ui/', '', 1)
            if not target.exists():
                missing_assets.append((rel, match))

for js_rel, html_rel in JS_PAGE_MAP.items():
    js_text = (ROOT / js_rel).read_text(encoding='utf-8', errors='ignore')
    html_text = (ROOT / html_rel).read_text(encoding='utf-8', errors='ignore')
    html_ids = set(re.findall(r'id=["\']([^"\']+)["\']', html_text))
    for element_id in sorted(set(id_pattern.findall(js_text))):
        if element_id not in html_ids:
            missing_ids.append((js_rel, element_id, html_rel))

for js_path in ROOT.glob('assets/js/*.js'):
    result = subprocess.run(['node', '--check', str(js_path)], capture_output=True, text=True)
    if result.returncode != 0:
        js_syntax_errors.append((js_path.name, result.stderr.strip()))

print('Smoke check results')
print('===================')
print(f'Root: {ROOT}')
print(f'JS syntax errors: {len(js_syntax_errors)}')
for name, err in js_syntax_errors:
    print(f' - {name}: {err}')
print(f'Missing DOM ids: {len(missing_ids)}')
for js_rel, element_id, html_rel in missing_ids:
    print(f' - {js_rel} -> #{element_id} missing in {html_rel}')
print(f'Missing asset paths: {len(missing_assets)}')
for rel, asset in missing_assets[:50]:
    print(f' - {rel} -> {asset}')

if js_syntax_errors or missing_ids or missing_assets:
    raise SystemExit(1)

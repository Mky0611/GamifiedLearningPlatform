#!/usr/bin/env python3
"""Static heuristic: JS getElementById('...') refs missing from minigame.html.
No files changed. Dynamic IDs and shared components may produce false positives.
"""
from pathlib import Path
import re,sys
if len(sys.argv)!=2:
    print('Usage: python check_dom_refs.py <GamifiedLearningPlatform-root>')
    raise SystemExit(2)
root=Path(sys.argv[1]); res=root/'src/main/resources/FrontEnd'
html=(res/'src/pages/minigame.html').read_text(encoding='utf-8')
js=(res/'assets/js/minigame.js').read_text(encoding='utf-8')
ids=set(re.findall(r'\bid=["\']([^"\']+)',html))
refs=set(re.findall(r'getElementById\(["\']([^"\']+)["\']\)',js))
print('JS static element refs:',len(refs),'HTML static IDs:',len(ids))
missing=sorted(refs-ids)
print('Missing static HTML IDs (review whether optional):',missing)

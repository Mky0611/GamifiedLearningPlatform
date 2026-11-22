"""Static, read-only validation of bundled Antigravity files; needs only Python 3."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / '.agents'
ALLOWED_RULE_TRIGGERS = {'always_on','model_decision','glob','manual'}
ALLOWED_TOOLS = {'view_file','grep_search','run_command','replace_file_content'}
errors=[]

def fm(path):
    body=path.read_text(encoding='utf-8')
    if not body.startswith('---\n') or '\n---\n' not in body[4:]:
        errors.append(f'{path}: missing YAML frontmatter')
        return ''
    return body.split('---\n',2)[1]

for path in sorted((BASE/'rules').glob('*.md')):
    head=fm(path)
    match=re.search(r'^trigger:\s*(\S+)\s*$',head,re.M)
    if not match or match.group(1) not in ALLOWED_RULE_TRIGGERS:
        errors.append(f'{path}: invalid or missing trigger')
    if 'description:' not in head:
        errors.append(f'{path}: description missing')
for path in sorted((BASE/'agents').glob('*.md')):
    head=fm(path)
    for key in ('name:', 'description:', 'tools:', 'skills:'):
        if key not in head: errors.append(f'{path}: missing {key}')
    for tool in re.findall(r'^  - ([_a-z]+)\s*$',head,re.M):
        if tool not in ALLOWED_TOOLS and not tool.startswith('skills'):
            errors.append(f'{path}: unrecognized tool/list item {tool}')
    for name in re.findall(r'^  - skills/([a-z0-9-]+)\s*$',head,re.M):
        if not (BASE/'skills'/name/'SKILL.md').is_file():
            errors.append(f'{path}: missing referenced skill {name}')
for path in sorted((BASE/'skills').glob('*/SKILL.md')):
    head=fm(path)
    for key in ('name:', 'description:'):
        if key not in head: errors.append(f'{path}: missing {key}')
print(f'Validated {len(list((BASE/"rules").glob("*.md")))} rules, '
      f'{len(list((BASE/"agents").glob("*.md")))} agents, '
      f'{len(list((BASE/"skills").glob("*/SKILL.md")))} skills')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print('STATIC CHECK PASS (not a runtime compatibility test)')

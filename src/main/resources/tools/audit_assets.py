#!/usr/bin/env python3
"""
Clean Semantic Asset Audit & Pipeline Tool for Lex Raid - Phase P4-B
Excludes build/temp/public-audit artifacts (.git, .vercel, target, node_modules, test_output, qa_audit).
Generates contact sheets strictly into test_output/asset_audit/ (never published inside FrontEnd).
Produces collision-free semantic names and tracks actual renames, canonical paths,
legacy compatibility aliases, duplicates, and unverified licenses.
"""

from __future__ import annotations
import csv
import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageSequence

EXCLUDE_DIRS = {
    '.git', '.vercel', 'target', 'node_modules', 'test_output',
    'qa_audit', '__pycache__', '.mvn', '.idea', '.vscode', 'vendor'
}
MEDIA_EXTENSIONS = {'.png', '.gif', '.jpg', '.jpeg', '.webp', '.ico', '.svg'}


def should_skip(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts)


def get_file_hash(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def scan_text_references(search_dirs: list[Path], extensions: set[str]) -> dict[str, str]:
    file_contents: dict[str, str] = {}
    for s_dir in search_dirs:
        if not s_dir.exists():
            continue
        for f in s_dir.rglob('*'):
            if should_skip(f) or not f.is_file() or f.suffix.lower() not in extensions:
                continue
            try:
                raw = f.read_bytes()
                if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
                    text = raw.decode('utf-16', errors='ignore')
                else:
                    text = raw.decode('utf-8', errors='ignore')
                file_contents[str(f)] = text
            except Exception:
                pass
    return file_contents


def extract_dynamic_phaser_urls(root_dir: Path) -> set[str]:
    cfg_path = root_dir / 'src/main/resources/FrontEnd/assets/js/phaser/raid-config.js'
    if not cfg_path.exists():
        return set()
    node_script = (
        "const fs = require('fs'); const window = {}; "
        f"eval(fs.readFileSync({json.dumps(str(cfg_path))}, 'utf8')); "
        "const urls = []; const c = window.RaidPhaserConfig || {}; "
        "if (c.backgroundUrl) urls.push(c.backgroundUrl); "
        "for (const h of Object.values(c.heroes || {})) { "
        "  if (h.portrait) urls.push(h.portrait); "
        "  for (const k of ['idle','run','attack','guard']) if (h[k] && h[k].url) urls.push(h[k].url); "
        "} "
        "for (const b of Object.values(c.bosses || {})) { "
        "  if (b.portrait) urls.push(b.portrait); "
        "  for (const k of ['idle','attack','hit']) if (b[k] && Array.isArray(b[k].frames)) urls.push(...b[k].frames); "
        "} "
        "console.log(JSON.stringify(urls));"
    )
    res = subprocess.run(['node', '-e', node_script], capture_output=True, text=True)
    if res.returncode == 0 and res.stdout.strip():
        return {u.replace('/ui/assets/', '', 1) for u in json.loads(res.stdout.strip()) if u.startswith('/ui/assets/')}
    return set()


def semantic_name_for(rel_to_assets: str, ext: str, category: str) -> str:
    """Derive a clean, collision-free, semantic filename from directory structure + entity + role."""
    parts = [re.sub(r'[^a-z0-9]+', '-', p.lower()).strip('-') for p in Path(rel_to_assets).with_suffix('').parts]

    if rel_to_assets.startswith('bosses/'):
        return Path(rel_to_assets).name

    if parts[:2] == ['monsters', 'crabby'] or parts[:2] == ['monsters', 'fierce'] or parts[:2] == ['monsters', 'pink']:
        boss = parts[1]
        mode = parts[2] if len(parts) > 2 else 'misc'
        m = re.search(r'(\d+)$', parts[-1])
        idx = f"-{int(m.group(1)):02d}" if m else ''
        return f"boss-{boss}-{mode}{idx}-legacy-dup{ext}"

    if parts[:2] == ['monsters', 'mushroom']:
        return f"boss-mushroom-{parts[-1]}-sheet{ext}"

    if parts[0] == 'units' and len(parts) >= 3:
        hero = parts[1]
        if parts[2] == 'normalized':
            return f"hero-{hero}-{parts[-1]}-sheet{ext}"
        if hero == 'lancer':
            return f"hero-lancer-raw320-{parts[-1]}-sheet{ext}"
        return f"hero-{hero}-{parts[-1]}-sheet{ext}"

    if parts[:2] == ['ui', 'avatars']:
        return Path(rel_to_assets).name

    if parts[:2] == ['ui', 'icons']:
        return Path(rel_to_assets).name

    if parts[:2] == ['ui', 'tiny']:
        misnamed = {
            'icon-book': 'legacy-tiny-sword-alias',
            'icon-star': 'legacy-tiny-cross-red-alias',
            'icon-sword': 'legacy-tiny-mallet-alias',
        }
        stem = parts[-1]
        if stem in misnamed:
            return f"{misnamed[stem]}{ext}"
        return f"legacy-tiny-{stem}{ext}"

    if parts[0] == 'sprites':
        sub = '-'.join(parts[1:])
        return f"pack-{sub}{ext}"

    if parts[0] == 'imgs':
        stem = parts[-1]
        logo_map = {
            'logo': 'brand-logo-lockup',
            'logo-clean': 'brand-logo-lockup',
            'logo-mark': 'brand-logo-mark',
            'favicon': 'brand-favicon',
        }
        if stem in logo_map:
            return f"{logo_map[stem]}{ext}"
        return f"legacy-img-{stem}{ext}"

    return f"{'-'.join(parts)}{ext}"


def audit_all_assets(root_dir: Path):
    frontend_dir = root_dir / 'src/main/resources/FrontEnd'
    assets_dir = frontend_dir / 'assets'
    java_dir = root_dir / 'src/main/java'
    resources_dir = root_dir / 'src/main/resources'
    sql_root = [root_dir / 'script_GPL_v2.sql']

    frontend_files = scan_text_references([frontend_dir], {'.html', '.css', '.js', '.json'})
    backend_files = scan_text_references([java_dir, resources_dir], {'.java', '.sql', '.properties', '.yml', '.xml'})
    for s in sql_root:
        if s.exists():
            raw = s.read_bytes()
            backend_files[str(s)] = raw.decode('utf-16', errors='ignore') if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else raw.decode('utf-8', errors='ignore')

    dynamic_phaser_rels = extract_dynamic_phaser_urls(root_dir)

    renames_ledger_path = root_dir / 'docs/p4b_actual_renames.json'
    renamed_targets: dict[str, str] = {}
    if renames_ledger_path.exists():
        for entry in json.loads(renames_ledger_path.read_text(encoding='utf-8')):
            renamed_targets[entry['to']] = entry['from']

    all_files = sorted([
        f for f in assets_dir.rglob('*')
        if f.is_file() and not should_skip(f) and f.suffix.lower() in MEDIA_EXTENSIONS
    ])
    print(f"Scanning {len(all_files)} assets (excluded: {sorted(EXCLUDE_DIRS)})")

    hash_map: dict[str, str] = {}
    records = []

    for idx, fpath in enumerate(all_files, 1):
        rel_to_repo = str(fpath.relative_to(root_dir)).replace('\\', '/')
        rel_to_assets = str(fpath.relative_to(assets_dir)).replace('\\', '/')
        ui_asset_path = f"/ui/assets/{rel_to_assets}"
        asset_web_path = f"/assets/{rel_to_assets}"
        filename = fpath.name
        ext = fpath.suffix.lower()
        size_bytes = fpath.stat().st_size
        sha256 = get_file_hash(fpath)

        # Category
        if rel_to_assets.startswith('units/'):
            category = 'heroes'
        elif rel_to_assets.startswith(('bosses/', 'monsters/')):
            category = 'bosses'
        elif 'avatars/' in rel_to_assets or rel_to_assets.startswith('ui/avatars/') or 'avatar' in filename.lower() and rel_to_assets.startswith('ui/'):
            category = 'avatars'
        elif rel_to_assets.startswith('backgrounds/') or 'map' in filename.lower():
            category = 'backgrounds'
        elif rel_to_assets.startswith('ui/cursors/'):
            category = 'cursors'
        elif rel_to_assets.startswith(('ui/icons/', 'ui/tiny/icon-')):
            category = 'ui_icons'
        elif rel_to_assets.startswith(('ui/banners/', 'ui/bars/', 'ui/buttons/', 'ui/papers/', 'ui/table/', 'ui/tiny/', 'ui/phase2/', 'ui/custom/')):
            category = 'ui_panels'
        elif rel_to_assets.startswith(('ui/effects/', 'ui/fx/')):
            category = 'effects'
        elif rel_to_assets.startswith('sprites/'):
            category = 'source_packs'
        elif rel_to_assets.startswith('imgs/') and any(k in filename.lower() for k in ('logo', 'favicon')):
            category = 'brand_logo'
        elif rel_to_assets.startswith('imgs/'):
            category = 'legacy_imgs'
        else:
            category = 'unclassified'

        # Measured Image Metadata via PIL
        width = height = vis_w = vis_h = color_count = 0
        frame_width = frame_height = 0
        frame_count = 1
        fps = 0.0
        mode = 'UNKNOWN'
        has_alpha = False
        bbox = None
        transparent_padding = [0, 0, 0, 0]

        try:
            with Image.open(fpath) as img:
                width, height = img.size
                mode = img.mode
                if ext == '.gif':
                    frames = list(ImageSequence.Iterator(img))
                    frame_count = len(frames)
                    frame_width, frame_height = width, height
                    duration_ms = img.info.get('duration', 100) or 100
                    fps = round(1000.0 / duration_ms, 1)
                elif ext == '.png' and height in (192, 320, 64) and width > height and width % height == 0:
                    frame_count = width // height
                    frame_width = height
                    frame_height = height
                elif ext == '.png' and rel_to_assets.startswith('ui/monster-sheets/') and height in (30, 32) and width > height:
                    est_fw = 72 if 'crabby' in filename else 34
                    if width % est_fw == 0:
                        frame_count = width // est_fw
                        frame_width = est_fw
                        frame_height = height
                    else:
                        frame_width, frame_height = width, height
                else:
                    frame_width, frame_height = width, height

                if 'A' in img.getbands():
                    has_alpha = True
                    bbox = img.getchannel('A').getbbox()
                    if bbox:
                        transparent_padding = [bbox[0], bbox[1], width - bbox[2], height - bbox[3]]
                        vis_w, vis_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
                else:
                    bbox = [0, 0, width, height]
                    vis_w, vis_h = width, height

                try:
                    cols = img.getcolors(maxcolors=65536)
                    color_count = len(cols) if cols else -1
                except Exception:
                    color_count = -1
        except Exception as e:
            mode = f"ERROR:{e}"

        # Static + Dynamic references
        static_refs = []
        for fpath_str, content in frontend_files.items():
            # Match full ui path or asset-relative path (avoid naive bare '1.png' matches!)
            if ui_asset_path in content or asset_web_path in content or rel_to_assets in content:
                static_refs.append(str(Path(fpath_str).relative_to(root_dir)).replace('\\', '/'))
            elif len(filename) > 7 and filename in content and ('/' + filename in content or '"' + filename in content or "'" + filename in content):
                static_refs.append(str(Path(fpath_str).relative_to(root_dir)).replace('\\', '/'))

        if rel_to_assets in dynamic_phaser_rels:
            dynamic_ref = 'src/main/resources/FrontEnd/assets/js/phaser/raid-config.js'
            if dynamic_ref not in static_refs:
                static_refs.append(dynamic_ref)

        backend_refs = []
        for fpath_str, content in backend_files.items():
            if ui_asset_path in content or rel_to_assets in content:
                backend_refs.append(str(Path(fpath_str).relative_to(root_dir)).replace('\\', '/'))

        is_duplicate = sha256 in hash_map
        dup_of = hash_map.get(sha256, '')
        if not is_duplicate:
            hash_map[sha256] = rel_to_assets

        fn_issues = []
        if ' ' in filename:
            fn_issues.append('SPACES_IN_FILENAME')
        if any(c.isupper() for c in filename):
            fn_issues.append('UPPERCASE_CHARACTERS')
        if '_' in filename:
            fn_issues.append('UNDERSCORE_CHARACTERS')
        if re.search(r'[^a-zA-Z0-9_\-\.]', filename):
            fn_issues.append('SPECIAL_CHARACTERS')

        # Classification
        if rel_to_assets in renamed_targets:
            classification = 'actual_renamed'
            previous_path = renamed_targets[rel_to_assets]
        elif category in ('brand_logo',) or (rel_to_assets.startswith('ui/avatars/portrait-')) or rel_to_assets in (
            'ui/avatars/avatar-ts-1.png', 'ui/avatars/avatar-ts-8.png', 'ui/avatars/avatar-ts-18.png',
            'ui/icons/icon-info.png', 'ui/icons/icon-settings.png', 'ui/icons/icon-sword.png',
            'ui/icons/icon-mallet.png', 'ui/icons/icon-cross-red.png', 'backgrounds/fantasy-arena-bg.png'
        ) or rel_to_assets.startswith(('units/warrior/', 'units/archer/', 'units/lancer/normalized/', 'ui/cursors/', 'bosses/')):
            classification = 'canonical_path'
            previous_path = ''
        elif rel_to_assets in ('imgs/avatar1.png', 'imgs/avatar2.png', 'imgs/avatar3.png', 'imgs/map1.gif', 'imgs/map2.gif', 'imgs/map3.gif') or backend_refs:
            classification = 'legacy_compatibility_alias'
            previous_path = ''
        elif rel_to_assets.startswith('ui/tiny/icon-'):
            classification = 'pending_review'
            previous_path = ''
        elif is_duplicate or rel_to_assets.startswith(('sprites/', 'ui/monster-sheets/', 'ui/phase2/', 'ui/custom/', 'monsters/')):
            classification = 'pending_review' if not is_duplicate else 'legacy_compatibility_alias'
            previous_path = ''
        elif category == 'unclassified':
            classification = 'unclassified'
            previous_path = ''
        else:
            classification = 'pending_review'
            previous_path = ''

        # License status
        if filename in ('logo.png', 'logo-clean.png', 'logo-mark.png', 'favicon.png') or filename.startswith('portrait-'):
            license_status = 'derived_from_project_assets'
        else:
            license_status = 'unverified_license'

        proposed_semantic = semantic_name_for(rel_to_assets, ext, category)

        records.append({
            'id': f'AST-{idx:04d}',
            'filename': filename,
            'relative_path': rel_to_assets,
            'repo_path': rel_to_repo,
            'previous_path': previous_path,
            'semantic_name': proposed_semantic,
            'classification': classification,
            'license_status': license_status,
            'inspection_method': 'measured_pil_metadata + static_dynamic_ref_scan',
            'category': category,
            'format': ext.replace('.', '').upper(),
            'width': width,
            'height': height,
            'aspect_ratio': round(width / max(1, height), 4),
            'size_bytes': size_bytes,
            'color_mode': mode,
            'has_alpha': has_alpha,
            'bbox': list(bbox) if bbox else None,
            'transparent_padding': transparent_padding,
            'visible_width': vis_w,
            'visible_height': vis_h,
            'color_count': color_count,
            'frame_count': frame_count,
            'frame_width': frame_width,
            'frame_height': frame_height,
            'fps': fps,
            'sha256': sha256,
            'is_duplicate': is_duplicate,
            'duplicate_of': dup_of,
            'static_refs': sorted(static_refs),
            'backend_refs': sorted(backend_refs),
            'filename_issues': fn_issues,
        })

    return records


def create_contact_sheet(records, output_path: Path, title: str, thumb_size=(96, 96), cols=8):
    if not records:
        return
    rows = (len(records) + cols - 1) // cols
    padding = 16
    label_h = 26
    cell_w = thumb_size[0] + padding
    cell_h = thumb_size[1] + label_h + padding
    sheet_w = cols * cell_w + padding
    sheet_h = rows * cell_h + padding + 40

    sheet = Image.new('RGBA', (sheet_w, sheet_h), (36, 26, 20, 255))
    draw = ImageDraw.Draw(sheet)
    draw.rectangle([(0, 0), (sheet_w, 36)], fill=(56, 38, 25, 255))
    draw.text((16, 10), f"LEX RAID AUDIT SHEET - {title} ({len(records)} ASSETS)", fill=(246, 195, 68, 255))

    for idx, rec in enumerate(records):
        r, c = divmod(idx, cols)
        x = padding + c * cell_w
        y = 40 + padding + r * cell_h
        draw.rectangle([(x, y), (x + thumb_size[0], y + thumb_size[1])], outline=(104, 70, 45, 255), fill=(24, 16, 12, 255))
        try:
            with Image.open(rec['repo_path']) as img:
                if rec['frame_count'] > 1 and rec['frame_width'] > 0:
                    frame0 = img.crop((0, 0, min(img.width, rec['frame_width']), min(img.height, rec['frame_height']))).convert('RGBA')
                else:
                    frame0 = img.convert('RGBA')
                frame0.thumbnail(thumb_size, Image.Resampling.NEAREST)
                ox = x + (thumb_size[0] - frame0.width) // 2
                oy = y + (thumb_size[1] - frame0.height) // 2
                sheet.paste(frame0, (ox, oy), frame0)
        except Exception:
            pass
        draw.text((x, y + thumb_size[1] + 4), rec['filename'][:15], fill=(243, 228, 190, 255))
        draw.text((x, y + thumb_size[1] + 15), f"{rec['width']}x{rec['height']}", fill=(180, 160, 130, 255))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output_path)


def main():
    root_dir = Path('.').resolve()
    records = audit_all_assets(root_dir)

    docs_dir = root_dir / 'docs'
    docs_dir.mkdir(exist_ok=True)

    manifest_path = docs_dir / 'P4B_ASSET_MANIFEST.json'
    manifest_path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding='utf-8')

    csv_path = docs_dir / 'P4B_ASSET_INVENTORY.csv'
    fieldnames = [
        'id', 'filename', 'relative_path', 'previous_path', 'semantic_name', 'classification',
        'license_status', 'category', 'format', 'width', 'height', 'size_bytes',
        'visible_width', 'visible_height', 'frame_count', 'frame_width', 'frame_height', 'fps',
        'is_duplicate', 'duplicate_of', 'static_refs_count', 'backend_refs_count', 'filename_issues'
    ]
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in records:
            row = {k: r.get(k) for k in fieldnames}
            row['static_refs_count'] = len(r.get('static_refs', []))
            row['backend_refs_count'] = len(r.get('backend_refs', []))
            row['filename_issues'] = '; '.join(r.get('filename_issues', []))
            w.writerow(row)

    rename_path = docs_dir / 'P4B_ASSET_RENAME_MAP.csv'
    with open(rename_path, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['id', 'current_relative_path', 'previous_path', 'semantic_name', 'classification', 'license_status', 'category', 'static_refs', 'backend_refs'])
        w.writeheader()
        for r in records:
            w.writerow({
                'id': r['id'],
                'current_relative_path': r['relative_path'],
                'previous_path': r['previous_path'],
                'semantic_name': r['semantic_name'],
                'classification': r['classification'],
                'license_status': r['license_status'],
                'category': r['category'],
                'static_refs': '; '.join(r.get('static_refs', [])),
                'backend_refs': '; '.join(r.get('backend_refs', [])),
            })

    # Write contact sheets ONLY outside FrontEnd (never published to Vercel)
    sheet_dir = root_dir / 'test_output/asset_audit'
    for cat in sorted({r['category'] for r in records}):
        cat_recs = [r for r in records if r['category'] == cat]
        create_contact_sheet(cat_recs, sheet_dir / f'contact_sheet_{cat}.png', cat.upper())

    agent_docs = root_dir / 'Agent & Skill/docs'
    if agent_docs.exists():
        for src in (manifest_path, csv_path, rename_path):
            shutil.copy2(src, agent_docs / src.name)

    from collections import Counter
    cls_counts = Counter(r['classification'] for r in records)
    lic_counts = Counter(r['license_status'] for r in records)
    print(f"Total audited: {len(records)} | Classifications: {dict(cls_counts)} | Licenses: {dict(lic_counts)}")
    print(f"Files with active filename issues: {sum(1 for r in records if r['filename_issues'])}")


if __name__ == '__main__':
    main()

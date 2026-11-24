#!/usr/bin/env python3
"""
Full Asset Audit & Pipeline Tool for Lex Raid - Phase P4-B
Extracts deep visual metadata, bounding boxes, palettes, frame counts,
references in code (HTML/CSS/JS/Java/SQL), hashes, duplicates,
generates CSV inventory, JSON manifest, rename map, and visual contact sheets.
"""

import os
import sys
import json
import csv
import hashlib
import re
from pathlib import Path
from PIL import Image, ImageSequence, ImageDraw, ImageFont

def get_file_hash(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def scan_text_references(search_dirs, extensions):
    """Scan all text files in search_dirs for asset paths / filenames."""
    file_contents = {}
    for s_dir in search_dirs:
        p = Path(s_dir)
        if not p.exists():
            continue
        for ext in extensions:
            for f in p.rglob(f'*{ext}'):
                try:
                    text = f.read_text(encoding='utf-8', errors='ignore')
                    file_contents[str(f)] = text
                except Exception:
                    pass
    return file_contents

def audit_all_assets(root_dir):
    frontend_dir = Path(root_dir) / 'src' / 'main' / 'resources' / 'FrontEnd'
    assets_dir = frontend_dir / 'assets'
    java_dir = Path(root_dir) / 'src' / 'main' / 'java'
    resources_dir = Path(root_dir) / 'src' / 'main' / 'resources'

    print(f"Scanning assets in: {assets_dir}")
    frontend_files = scan_text_references([frontend_dir], ['.html', '.css', '.js', '.json'])
    backend_files = scan_text_references([java_dir, resources_dir], ['.java', '.sql', '.properties', '.xml'])

    asset_records = []
    hash_map = {}

    media_extensions = {'.png', '.gif', '.jpg', '.jpeg', '.webp', '.ico', '.svg'}

    all_files = sorted([f for f in assets_dir.rglob('*') if f.is_file() and f.suffix.lower() in media_extensions])
    print(f"Found {len(all_files)} media asset files.")

    for idx, fpath in enumerate(all_files, 1):
        rel_to_repo = str(fpath.relative_to(root_dir)).replace('\\', '/')
        rel_to_assets = str(fpath.relative_to(assets_dir)).replace('\\', '/')
        ui_asset_path = f"/ui/assets/{rel_to_assets}"
        asset_web_path = f"/assets/{rel_to_assets}"

        filename = fpath.name
        ext = fpath.suffix.lower()
        size_bytes = fpath.stat().st_size
        sha256 = get_file_hash(fpath)

        # Categorization based on path
        category = "unclassified"
        if "units" in rel_to_assets:
            category = "heroes"
        elif "monsters" in rel_to_assets:
            category = "bosses"
        elif "avatars" in rel_to_assets or "tiny/avatar" in rel_to_assets:
            category = "avatars"
        elif "backgrounds" in rel_to_assets or "map" in filename.lower() or "bg" in filename.lower():
            category = "backgrounds"
        elif "buttons" in rel_to_assets or "btn" in filename.lower():
            category = "buttons"
        elif "icons" in rel_to_assets or "tiny" in rel_to_assets:
            category = "ui_icons"
        elif "bars" in rel_to_assets or "banners" in rel_to_assets or "papers" in rel_to_assets or "table" in rel_to_assets:
            category = "panels"
        elif "effects" in rel_to_assets or "fx" in rel_to_assets:
            category = "effects"
        elif "sprites" in rel_to_assets:
            category = "sprites"
        elif "imgs" in rel_to_assets:
            if "logo" in filename.lower():
                category = "logo"
            else:
                category = "illustrations"
        elif "qa_audit" in rel_to_assets:
            category = "qa_audit"

        # Image analysis
        width, height = 0, 0
        aspect_ratio = 0.0
        mode = "UNKNOWN"
        has_alpha = False
        bbox = None
        transparent_padding = [0, 0, 0, 0]
        vis_w, vis_h = 0, 0
        color_count = 0
        frame_count = 1
        frame_width = 0
        frame_height = 0
        fps = 0

        visual_desc = ""
        try:
            with Image.open(fpath) as img:
                width, height = img.size
                mode = img.mode
                aspect_ratio = round(width / max(1, height), 4)

                # Check GIF frames
                if ext == '.gif':
                    frames = [frame.copy() for frame in ImageSequence.Iterator(img)]
                    frame_count = len(frames)
                    frame_width = width
                    frame_height = height
                    duration_ms = img.info.get('duration', 100)
                    fps = round(1000 / max(1, duration_ms), 1) if duration_ms else 10
                elif ext == '.png' and height == 192 and width % 192 == 0 and width > 192:
                    frame_count = width // 192
                    frame_width = 192
                    frame_height = 192
                elif ext == '.png' and "sheet" in filename.lower():
                    frame_width = width
                    frame_height = height
                else:
                    frame_width = width
                    frame_height = height

                # Alpha bounding box
                if 'A' in img.getbands():
                    has_alpha = True
                    alpha = img.getchannel('A')
                    bbox = alpha.getbbox()
                    if bbox:
                        transparent_padding = [bbox[0], bbox[1], width - bbox[2], height - bbox[3]]
                        vis_w = bbox[2] - bbox[0]
                        vis_h = bbox[3] - bbox[1]
                    else:
                        vis_w, vis_h = 0, 0
                else:
                    has_alpha = False
                    bbox = [0, 0, width, height]
                    vis_w, vis_h = width, height

                # Colors
                try:
                    colors = img.getcolors(maxcolors=100000)
                    color_count = len(colors) if colors else -1
                except Exception:
                    color_count = -1
        except Exception as e:
            visual_desc = f"Error reading image: {e}"

        # Static references search
        static_refs = []
        for fpath_str, content in frontend_files.items():
            if filename in content or ui_asset_path in content or asset_web_path in content or rel_to_assets in content:
                static_refs.append(str(Path(fpath_str).relative_to(root_dir)).replace('\\', '/'))

        # Backend references search
        backend_refs = []
        for fpath_str, content in backend_files.items():
            if filename in content or rel_to_assets in content:
                backend_refs.append(str(Path(fpath_str).relative_to(root_dir)).replace('\\', '/'))

        # Determine usage status
        if len(static_refs) > 0 and len(backend_refs) > 0:
            usage_status = "USED_FULL_STACK"
        elif len(static_refs) > 0:
            usage_status = "USED_FRONTEND"
        elif len(backend_refs) > 0:
            usage_status = "USED_BACKEND"
        else:
            # Check if used dynamically in raid-config or minigame
            usage_status = "UNUSED_STATIC"

        # Check duplicate
        is_duplicate = sha256 in hash_map
        dup_of = hash_map.get(sha256, "")
        if not is_duplicate:
            hash_map[sha256] = rel_to_assets

        # Filename issues
        fn_issues = []
        if ' ' in filename:
            fn_issues.append("SPACES_IN_FILENAME")
        if any(c.isupper() for c in filename):
            fn_issues.append("UPPERCASE_CHARACTERS")
        if re.search(r'[^a-zA-Z0-9_\-\./]', filename):
            fn_issues.append("SPECIAL_CHARACTERS")
        if re.match(r'^(avatar\d|icon\d|image\d)', filename.lower()):
            fn_issues.append("GENERIC_NAME")

        # Visual description heuristic
        if not visual_desc:
            visual_desc = f"{category.capitalize()} asset ({width}x{height}, {mode})"
            if frame_count > 1:
                visual_desc += f", {frame_count} frames"
            if bbox and has_alpha:
                visual_desc += f", visible {vis_w}x{vis_h}"

        # Proposed clean name
        clean_stem = re.sub(r'[^a-z0-9\-]+', '-', filename.lower())
        clean_stem = re.sub(r'-+', '-', clean_stem).strip('-')
        proposed_name = f"{category}-{clean_stem}"
        if not proposed_name.endswith(ext):
            proposed_name = f"{Path(proposed_name).stem}{ext}"

        record = {
            "id": f"AST-{idx:04d}",
            "filename": filename,
            "relative_path": rel_to_assets,
            "repo_path": rel_to_repo,
            "proposed_name": proposed_name,
            "category": category,
            "format": ext.replace('.', '').upper(),
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "size_bytes": size_bytes,
            "color_mode": mode,
            "has_alpha": has_alpha,
            "bbox": bbox,
            "transparent_padding": transparent_padding,
            "visible_width": vis_w,
            "visible_height": vis_h,
            "color_count": color_count,
            "frame_count": frame_count,
            "frame_width": frame_width,
            "frame_height": frame_height,
            "fps": fps,
            "sha256": sha256,
            "is_duplicate": is_duplicate,
            "duplicate_of": dup_of,
            "static_refs": static_refs,
            "backend_refs": backend_refs,
            "usage_status": usage_status,
            "filename_issues": fn_issues,
            "visual_desc": visual_desc,
            "action_proposed": "KEEP_COMPATIBLE_ALIAS" if is_duplicate else ("TRIM_BACKGROUND" if "logo" in filename.lower() else "STANDARDIZE_NAME")
        }
        asset_records.append(record)

    return asset_records

def create_contact_sheet(records, output_path, title, thumb_size=(96, 96), cols=8):
    if not records:
        return
    rows = (len(records) + cols - 1) // cols
    padding = 16
    label_h = 24
    cell_w = thumb_size[0] + padding
    cell_h = thumb_size[1] + label_h + padding

    sheet_w = cols * cell_w + padding
    sheet_h = rows * cell_h + padding + 40  # 40 for title header

    sheet = Image.new('RGBA', (sheet_w, sheet_h), (36, 26, 20, 255)) # Dark wood background
    draw = ImageDraw.Draw(sheet)

    # Header
    draw.rectangle([(0, 0), (sheet_w, 36)], fill=(56, 38, 25, 255))
    draw.text((16, 10), f"LEX RAID CONTACT SHEET — {title} ({len(records)} ASSETS)", fill=(214, 166, 76, 255))

    for idx, rec in enumerate(records):
        r = idx // cols
        c = idx % cols
        x = padding + c * cell_w
        y = 40 + padding + r * cell_h

        # Cell border
        draw.rectangle([(x, y), (x + thumb_size[0], y + thumb_size[1])], outline=(104, 70, 45, 255), fill=(24, 16, 12, 255))

        # Paste thumbnail
        try:
            with Image.open(rec["repo_path"]) as img:
                # If animated or spritesheet, take first frame
                if rec["frame_count"] > 1 and rec["frame_width"] > 0:
                    crop_box = (0, 0, min(img.width, rec["frame_width"]), min(img.height, rec["frame_height"]))
                    frame0 = img.crop(crop_box).convert('RGBA')
                else:
                    frame0 = img.convert('RGBA')
                frame0.thumbnail(thumb_size, Image.Resampling.NEAREST)
                ox = x + (thumb_size[0] - frame0.width) // 2
                oy = y + (thumb_size[1] - frame0.height) // 2
                sheet.paste(frame0, (ox, oy), frame0)
        except Exception:
            pass

        # Label
        lbl = f"{rec['id']} {rec['filename'][:12]}"
        draw.text((x, y + thumb_size[1] + 4), lbl, fill=(243, 228, 190, 255))
        dim_lbl = f"{rec['width']}x{rec['height']}"
        draw.text((x, y + thumb_size[1] + 14), dim_lbl, fill=(180, 160, 130, 255))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    sheet.save(output_path)
    print(f"Generated contact sheet: {output_path} ({sheet_w}x{sheet_h})")

def main():
    root_dir = Path(".").resolve()
    records = audit_all_assets(root_dir)

    docs_dir = root_dir / 'docs'
    os.makedirs(docs_dir, exist_ok=True)

    # 1. Output JSON manifest
    manifest_path = docs_dir / 'P4B_ASSET_MANIFEST.json'
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"Written manifest: {manifest_path}")

    # 2. Output CSV inventory
    csv_path = docs_dir / 'P4B_ASSET_INVENTORY.csv'
    fieldnames = [
        "id", "filename", "relative_path", "proposed_name", "category", "format",
        "width", "height", "aspect_ratio", "size_bytes", "color_mode", "has_alpha",
        "visible_width", "visible_height", "frame_count", "frame_width", "frame_height",
        "is_duplicate", "duplicate_of", "static_refs_count", "backend_refs_count",
        "usage_status", "filename_issues", "action_proposed"
    ]
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            row = {k: r.get(k) for k in fieldnames}
            row["static_refs_count"] = len(r.get("static_refs", []))
            row["backend_refs_count"] = len(r.get("backend_refs", []))
            row["filename_issues"] = "; ".join(r.get("filename_issues", []))
            writer.writerow(row)
    print(f"Written CSV inventory: {csv_path}")

    # 3. Output Rename Map CSV
    rename_path = docs_dir / 'P4B_ASSET_RENAME_MAP.csv'
    with open(rename_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["id", "current_relative_path", "proposed_name", "category", "static_refs", "action"])
        writer.writeheader()
        for r in records:
            writer.writerow({
                "id": r["id"],
                "current_relative_path": r["relative_path"],
                "proposed_name": r["proposed_name"],
                "category": r["category"],
                "static_refs": "; ".join(r.get("static_refs", [])),
                "action": r["action_proposed"]
            })
    print(f"Written Rename Map CSV: {rename_path}")

    # 4. Generate contact sheets
    qa_audit_dir = root_dir / 'src' / 'main' / 'resources' / 'FrontEnd' / 'assets' / 'qa_audit'
    os.makedirs(qa_audit_dir, exist_ok=True)

    categories = set(r["category"] for r in records)
    for cat in sorted(categories):
        cat_records = [r for r in records if r["category"] == cat]
        sheet_out = qa_audit_dir / f"contact_sheet_{cat}.png"
        create_contact_sheet(cat_records, sheet_out, cat.upper(), thumb_size=(96, 96), cols=8)

    # Also sync CSV, JSON, rename map to Agent & Skill/docs
    agent_docs = root_dir / 'Agent & Skill' / 'docs'
    if agent_docs.exists():
        import shutil
        shutil.copy(manifest_path, agent_docs / 'P4B_ASSET_MANIFEST.json')
        shutil.copy(csv_path, agent_docs / 'P4B_ASSET_INVENTORY.csv')
        shutil.copy(rename_path, agent_docs / 'P4B_ASSET_RENAME_MAP.csv')
        print(f"Synced files to: {agent_docs}")

    # Summary
    total_size = sum(r["size_bytes"] for r in records)
    duplicates = [r for r in records if r["is_duplicate"]]
    fn_issues = [r for r in records if len(r["filename_issues"]) > 0]
    print("\n--- AUDIT SUMMARY ---")
    print(f"Total assets audited: {len(records)}")
    print(f"Total size: {total_size:,} bytes ({total_size / (1024*1024):.2f} MB)")
    print(f"Duplicates found: {len(duplicates)}")
    print(f"Files with naming issues (spaces/uppercase): {len(fn_issues)}")

if __name__ == '__main__':
    main()

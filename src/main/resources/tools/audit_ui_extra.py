#!/usr/bin/env python3
"""
Phase P4-B.2A Inventory & License Provenance Auditor for `UI Extra` + existing runtime UI assets.
Outputs:
- `docs/P4B2_ASSET_MANIFEST.json`: Single canonical manifest with SHA-256, dimensions, alpha bbox, source pack, license.
- `test_output/p4b2_audit/ui_extra_summary.txt`: Human summary counts (raw vs non-OS vs images vs duplicates).
- `test_output/p4b2_audit/contact_*.png`: Compact contact sheets for selected packs/categories (never inside FrontEnd/).
"""
from __future__ import annotations

import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parents[4]
UI_EXTRA = REPO_ROOT / "UI Extra"
FRONTEND_ASSETS = REPO_ROOT / "src/main/resources/FrontEnd/assets"
DOCS_DIR = REPO_ROOT / "docs"
AUDIT_OUT = REPO_ROOT / "test_output/p4b2_audit"

IMAGE_EXTS = {".png", ".gif", ".jpg", ".jpeg", ".webp"}
OS_JUNK_PARTS = {"__MACOSX"}
OS_JUNK_NAMES = {".DS_Store", "Thumbs.db", "desktop.ini"}

PACK_LICENSE_RULES = [
    ("Free_Medieval_Fantasy_UI_Pack", "Kibyra", "Free Medieval Fantasy UI Pack", "PERMITTED_INTEGRATION_NO_RAW_REDISTRIB", "Readme.txt verified: free personal & commercial use; no raw pack redistribution"),
    ("Free_Pixel_Fire_and_Elemental_Effects", "Mira Forge", "Free Pixel Fire & Elemental Effects v1.0.1", "PERMITTED_INTEGRATION_NO_RAW_REDISTRIB", "LICENSE.txt v1.0 verified: free personal/commercial projects; no raw pack redistribution"),
    ("Pixel_Art_Waterfall", "Burcu Sak", "Pixel Art Waterfall v1.0", "PERMITTED_WITH_ATTRIBUTION", "LICENSE.txt verified: free use with mandatory credit 'Waterfall pixel art by Burcu Sak'; no raw redistribution"),
    ("sword-slash-pixel-fx-v1", "Skulitom Rivskiy (Pixelbolt)", "Sword Slash Pixel FX v1", "CC0", "LICENSE.txt verified: CC0 1.0 Universal (art & sound)"),
    ("tiny-pixel-fx-vol1", "Tiny Pixel FX Vol.1", "Tiny Pixel FX Vol.1", "CC0", "LICENSE.txt verified: CC0 1.0 Universal"),
    ("GothicVania-town-files", "Ansimuz", "GothicVania Town", "CC0", "public-license.pdf verified: Creative Commons Zero / free commercial (https://creativecommons.org/public-domain/cc0/)"),
    ("Super Mountain Dusk Files", "Ansimuz", "Super Mountain Dusk", "CC0", "public-license.pdf verified: Creative Commons Zero / free commercial"),
    ("Tall Forest Files", "Ansimuz", "Tall Forest", "CC0", "public-license.pdf verified: Creative Commons Zero / free commercial"),
    ("Tiny Swords (Free Pack)", "Pixel Frog (Unverified copy in UI Extra)", "Tiny Swords (Free Pack)", "LICENSE_PENDING", "No LICENSE/README file bundled inside UI Extra/Tiny Swords (Free Pack); mark LICENSE_PENDING for non-duplicate new files"),
]

# Top-level Kenney Pixel UI & Tiny Tileset files mixed at root level of UI Extra
KENNEY_SUBDIRS = {"9-Slice", "PNG", "Spritesheet", "Tiles", "Tilesheets", "Vector"}
TINY_TILESET_DIRS = {"aseprite", "gifs", "previews", "spritesheets"}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def is_os_junk(rel: Path) -> bool:
    return any(p in OS_JUNK_PARTS for p in rel.parts) or rel.name in OS_JUNK_NAMES or rel.name.startswith("._")


def classify_pack_and_license(rel: Path) -> tuple[str, str, str, str]:
    top = rel.parts[0] if len(rel.parts) > 1 else "_root"
    for folder, author, pack, lic_status, note in PACK_LICENSE_RULES:
        if top == folder:
            return pack, author, lic_status, note
    if top in KENNEY_SUBDIRS or rel.name in {"License.txt", "Preview.png", "Sample.png", "Visit Kenney.url"}:
        return "Kenney Pixel UI Pack", "Kenney & Lynn Evers", "CC0", "Root License.txt verified: CC0 1.0 Universal"
    if top in TINY_TILESET_DIRS:
        # README_TopDown_Monsters? Wait: UI Extra/README.md says Top-Down Monsters LITE (FREE) v1 by Tiny Tileset
        return "Top-Down Monsters LITE (FREE) v1", "Tiny Tileset", "PERMITTED_INTEGRATION_NO_RAW_REDISTRIB", "Root README.md verified: free for personal & commercial games; no raw asset pack resale/redistribution"
    if rel.name in {"Donate.url", "Facebook.url", "Visit Patreon.url", "README.md"}:
        return "Mixed Root Metadata", "Tiny Tileset / Root", "METADATA_ONLY", "Root readme or shortcut link"
    return "Unclassified", "Unknown", "LICENSE_PENDING", "Origin/license requires manual check"


def inspect_image(path: Path) -> dict:
    try:
        with Image.open(path) as im:
            w, h = im.size
            rgba = im.convert("RGBA")
            bbox = rgba.getbbox()
            return {"width": w, "height": h, "alpha_bbox": list(bbox) if bbox else None, "mode": im.mode}
    except Exception as exc:
        return {"width": None, "height": None, "alpha_bbox": None, "error": str(exc)}


def make_contact_sheet(title: str, paths: list[tuple[str, Path]], out_path: Path, cell_w: int = 128, cell_h: int = 110, cols: int = 6, max_items: int = 60) -> None:
    if not paths:
        return
    subset = paths[:max_items]
    rows = (len(subset) + cols - 1) // cols
    pad = 8
    header_h = 28
    sheet = Image.new("RGBA", (cols * (cell_w + pad) + pad, header_h + rows * (cell_h + pad) + pad), (32, 24, 18, 255))
    draw = ImageDraw.Draw(sheet)
    draw.text((10, 8), f"{title} ({len(subset)}/{len(paths)})", fill=(246, 195, 68, 255))
    for idx, (label, p) in enumerate(subset):
        r, c = divmod(idx, cols)
        x0 = pad + c * (cell_w + pad)
        y0 = header_h + pad + r * (cell_h + pad)
        draw.rectangle([x0, y0, x0 + cell_w, y0 + cell_h], fill=(54, 42, 34, 255), outline=(110, 86, 62, 255))
        try:
            with Image.open(p) as im:
                im_rgba = im.convert("RGBA")
                im_rgba.thumbnail((cell_w - 8, cell_h - 28), Image.Resampling.NEAREST)
                ix = x0 + (cell_w - im_rgba.width) // 2
                iy = y0 + 4 + ((cell_h - 28) - im_rgba.height) // 2
                sheet.paste(im_rgba, (ix, iy), im_rgba)
                short = f"{label[:18]} ({im.width}x{im.height})"
        except Exception:
            short = label[:20]
        draw.text((x0 + 4, y0 + cell_h - 16), short, fill=(243, 228, 190, 255))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def main() -> None:
    AUDIT_OUT.mkdir(parents=True, exist_ok=True)

    # Index existing runtime assets by SHA-256
    existing_by_hash: dict[str, list[str]] = defaultdict(list)
    existing_count = 0
    for p in sorted(FRONTEND_ASSETS.rglob("*")):
        if not p.is_file():
            continue
        existing_count += 1
        existing_by_hash[sha256_file(p)].append(p.relative_to(FRONTEND_ASSETS).as_posix())

    raw_total = 0
    os_junk_count = 0
    non_os_files: list[dict] = []
    image_hashes: dict[str, list[str]] = defaultdict(list)

    for p in sorted(UI_EXTRA.rglob("*")):
        if not p.is_file():
            continue
        raw_total += 1
        rel = p.relative_to(UI_EXTRA)
        if is_os_junk(rel):
            os_junk_count += 1
            continue
        rel_str = rel.as_posix()
        ext = p.suffix.lower()
        sha = sha256_file(p)
        pack, author, lic_status, lic_note = classify_pack_and_license(rel)
        is_img = ext in IMAGE_EXTS
        matches_existing = existing_by_hash.get(sha, [])
        if is_img:
            image_hashes[sha].append(rel_str)
        img_meta = inspect_image(p) if is_img else {}

        # Role determination: source artwork / preview / duplicate / runtime candidate / unclassified
        parts_low = [pt.lower() for pt in rel.parts]
        if ext in {".aseprite", ".ai", ".eps", ".svg", ".psd"} or "aseprite" in parts_low or "vector" in parts_low:
            role = "source_artwork"
        elif "previews" in parts_low or "gifs" in parts_low or rel.name.lower() in {"preview.png", "sample.png", "contact_sheet.png"} or rel.name.endswith("_preview_x4.gif") or rel.name.endswith("_preview_x8.gif"):
            role = "preview_media"
        elif matches_existing:
            role = "exact_duplicate_of_existing_runtime"
        elif not is_img:
            role = "metadata_or_pack_file"
        elif lic_status == "LICENSE_PENDING":
            role = "license_pending_candidate"
        else:
            role = "runtime_candidate"

        non_os_files.append({
            "path": f"UI Extra/{rel_str}",
            "relPath": rel_str,
            "pack": pack,
            "author": author,
            "licenseStatus": lic_status,
            "licenseNote": lic_note,
            "role": role,
            "ext": ext,
            "sizeBytes": p.stat().st_size,
            "sha256": sha,
            "matchesExistingRuntime": matches_existing,
            **img_meta,
        })

    dup_groups = {h: paths for h, paths in image_hashes.items() if len(paths) > 1}
    extra_dup_images = sum(len(v) - 1 for v in dup_groups.values())
    total_images = sum(1 for item in non_os_files if item["ext"] in IMAGE_EXTS)

    # Mark secondary duplicates inside UI Extra
    seen_img_hash: set[str] = set()
    for item in non_os_files:
        if item["ext"] in IMAGE_EXTS:
            if item["sha256"] in seen_img_hash and not item["matchesExistingRuntime"]:
                item["isInternalDuplicate"] = True
            else:
                item["isInternalDuplicate"] = False
                seen_img_hash.add(item["sha256"])

    by_pack = Counter(item["pack"] for item in non_os_files)
    by_license = Counter(item["licenseStatus"] for item in non_os_files)
    by_role = Counter(item["role"] for item in non_os_files)

    manifest = {
        "generatedAt": "2026-11-25",
        "uiExtraCounts": {
            "rawFilesTotal": raw_total,
            "osJunkExcluded": os_junk_count,
            "nonOsFilesTotal": len(non_os_files),
            "imagesTotal": total_images,
            "internalDuplicateImageGroups": len(dup_groups),
            "internalExtraDuplicateImages": extra_dup_images,
            "exactHashMatchesWithExistingRuntime": sum(1 for i in non_os_files if i["matchesExistingRuntime"]),
        },
        "existingRuntimeFilesTotal": existing_count,
        "byPack": dict(by_pack),
        "byLicenseStatus": dict(by_license),
        "byRole": dict(by_role),
        "duplicateImageGroups": list(dup_groups.values()),
        "files": non_os_files,
    }

    (DOCS_DIR / "P4B2_ASSET_MANIFEST.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    # Summary text
    lines = [
        "=== UI EXTRA ASSET INVENTORY SUMMARY ===",
        f"Raw files in UI Extra: {raw_total}",
        f"OS junk excluded (__MACOSX/.DS_Store/._*): {os_junk_count}",
        f"Non-OS files total: {len(non_os_files)}",
        f"Images total: {total_images}",
        f"Internal duplicate groups (SHA-256): {len(dup_groups)} (extra copies: {extra_dup_images})",
        f"Matches with existing FrontEnd/assets/: {manifest['uiExtraCounts']['exactHashMatchesWithExistingRuntime']}",
        "",
        "--- By Pack ---",
        *[f"  {k}: {v}" for k, v in sorted(by_pack.items())],
        "",
        "--- By License Status ---",
        *[f"  {k}: {v}" for k, v in sorted(by_license.items())],
        "",
        "--- By Role ---",
        *[f"  {k}: {v}" for k, v in sorted(by_role.items())],
        "",
        "--- Tiny Swords UI Elements exact paths ---",
        *[f"  {i['relPath']} ({i.get('width')}x{i.get('height')}) match={i['matchesExistingRuntime']}" for i in non_os_files if i["pack"].startswith("Tiny Swords") and ("UI Elements" in i["relPath"] or "Units/Blue Units/Warrior" in i["relPath"])],
    ]
    (AUDIT_OUT / "ui_extra_summary.txt").write_text("\n".join(lines), encoding="utf-8")
    print("\n".join(lines[:35]))

    # Contact sheets (compact visual verification per group)
    groups = {
        "contact_tiny_swords_ui.png": [(Path(i["relPath"]).name, UI_EXTRA / i["relPath"]) for i in non_os_files if i["pack"].startswith("Tiny Swords") and "UI Elements" in i["relPath"] and i["ext"] == ".png"],
        "contact_tiny_swords_blue_units.png": [(Path(i["relPath"]).name, UI_EXTRA / i["relPath"]) for i in non_os_files if i["pack"].startswith("Tiny Swords") and "Blue Units" in i["relPath"] and i["ext"] == ".png"],
        "contact_fantasy_ui_icons.png": [(Path(i["relPath"]).name, UI_EXTRA / i["relPath"]) for i in non_os_files if i["pack"] == "Free Medieval Fantasy UI Pack" and i["ext"] == ".png"],
        "contact_vfx_slash_and_elemental.png": [(Path(i["relPath"]).name, UI_EXTRA / i["relPath"]) for i in non_os_files if i["pack"] in {"Sword Slash Pixel FX v1", "Free Pixel Fire & Elemental Effects"} and i["ext"] == ".png" and ("sheets" in i["relPath"] or "_sheet.png" in i["relPath"])],
        "contact_environments_waterfall.png": [(Path(i["relPath"]).name, UI_EXTRA / i["relPath"]) for i in non_os_files if i["pack"] in {"GothicVania Town", "Super Mountain Dusk", "Tall Forest", "Pixel Art Waterfall v1.0"} and i["ext"] == ".png"],
        "contact_monsters_tileset.png": [(Path(i["relPath"]).name, UI_EXTRA / i["relPath"]) for i in non_os_files if i["pack"] == "Top-Down Monsters LITE (FREE) v1" and "spritesheets" in i["relPath"] and i["ext"] == ".png"],
    }
    for fname, items in groups.items():
        make_contact_sheet(fname.replace(".png", ""), items, AUDIT_OUT / fname)
    print("Contact sheets generated in:", AUDIT_OUT)


if __name__ == "__main__":
    main()

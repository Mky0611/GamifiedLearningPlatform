#!/usr/bin/env python3
"""
Extract clean transparent Emblem (logo-mark.png, pure square without text)
and Full Lockup (logo-clean.png / logo.png) from the original 2816x1536 logo artwork.
"""
import os
import subprocess
from pathlib import Path
from PIL import Image


def strip_lavender_bg(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    datas = im.getdata()
    new_data = []
    for r, g, b, a in datas:
        # Remove bottom-right sparkle & uniform pale lavender backdrop (~225-240, 225-240, 245-255)
        is_lavender = (r > 212 and g > 212 and b > 232 and abs(r - g) < 18 and b >= r)
        is_bright_white = (r > 242 and g > 242 and b > 242)
        if is_lavender or is_bright_white:
            new_data.append((r, g, b, 0))
        elif r > 195 and g > 195 and b > 218 and abs(r - g) < 20:
            dist = max(r - 195, g - 195, b - 218)
            alpha = max(0, min(255, int(255 - dist * 11)))
            new_data.append((r, g, b, alpha))
        else:
            new_data.append((r, g, b, a))
    im.putdata(new_data)
    return im


def find_emblem_text_split_y(im: Image.Image) -> int:
    """Find the vertical gap separating the upper crest emblem from 'LEX RAID' below."""
    alpha = im.getchannel("A")
    w, h = im.size
    px = alpha.load()
    # Scan from 55% height down to 92% height to find an empty (or near-empty) horizontal band
    row_counts = []
    for y in range(int(h * 0.55), int(h * 0.92)):
        non_empty = sum(1 for x in range(w) if px[x, y] > 20)
        row_counts.append((y, non_empty))
    # Find largest empty band
    empty_rows = [y for y, cnt in row_counts if cnt <= 4]
    if empty_rows:
        return (empty_rows[0] + empty_rows[-1]) // 2
    # Fallback: row with minimum non-empty pixels
    return min(row_counts, key=lambda t: t[1])[0]


def process_logo():
    root = Path(__file__).resolve().parents[1] / "FrontEnd" / "assets" / "imgs"
    orig_cache = Path("test_output/orig_logo_7350529.png")

    if not orig_cache.exists():
        orig_cache.parent.mkdir(parents=True, exist_ok=True)
        res = subprocess.run(
            ["git", "show", "7350529:src/main/resources/FrontEnd/assets/imgs/logo.png"],
            capture_output=True,
            check=True,
        )
        orig_cache.write_bytes(res.stdout)

    out_clean_path = root / "logo-clean.png"
    out_logo_path = root / "logo.png"
    out_mark_path = root / "logo-mark.png"
    out_favicon_path = root / "favicon.png"

    with Image.open(orig_cache) as raw:
        raw = raw.convert("RGBA")
        # Exclude right corner watermark margin (x: 680..2140, y: 120..1460)
        cropped = raw.crop((680, 120, 2140, 1460))
        clean = strip_lavender_bg(cropped)
        full_bbox = clean.getbbox()
        if full_bbox:
            clean = clean.crop(full_bbox)

        # 1. Save full lockup (emblem + LEX RAID) at crisp 240px height (~40KB)
        target_h = 240
        target_w = int(round(target_h * (clean.width / clean.height)))
        lockup = clean.resize((target_w, target_h), Image.Resampling.LANCZOS)
        lockup.save(out_clean_path, "PNG", optimize=True)
        lockup.save(out_logo_path, "PNG", optimize=True)
        print(f"Saved full lockup: {out_clean_path} ({lockup.size}, {out_clean_path.stat().st_size:,} bytes)")

        # 2. Extract pure Emblem WITHOUT text
        split_y = find_emblem_text_split_y(clean)
        emblem_only = clean.crop((0, 0, clean.width, split_y))
        ebbox = emblem_only.getbbox()
        if ebbox:
            emblem_only = emblem_only.crop(ebbox)

        # Fit cleanly inside 192x192 square with 6px margin (zero clipping, zero text)
        canvas_size = 192
        inner_max = canvas_size - 12
        scale = min(inner_max / emblem_only.width, inner_max / emblem_only.height)
        ew = int(round(emblem_only.width * scale))
        eh = int(round(emblem_only.height * scale))
        emblem_resized = emblem_only.resize((ew, eh), Image.Resampling.LANCZOS)

        mark_square = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
        mark_square.paste(emblem_resized, ((canvas_size - ew) // 2, (canvas_size - eh) // 2), emblem_resized)
        mark_square.save(out_mark_path, "PNG", optimize=True)
        print(f"Saved square mark: {out_mark_path} ({mark_square.size}, {out_mark_path.stat().st_size:,} bytes)")

        # 3. Crisp 64x64 favicon
        fav = mark_square.resize((64, 64), Image.Resampling.LANCZOS)
        fav.save(out_favicon_path, "PNG", optimize=True)
        print(f"Saved favicon: {out_favicon_path} ({fav.size}, {out_favicon_path.stat().st_size:,} bytes)")


if __name__ == "__main__":
    process_logo()

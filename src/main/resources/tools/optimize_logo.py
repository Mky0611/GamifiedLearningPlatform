#!/usr/bin/env python3
"""
Optimize Lex Raid logo for transparent background, retina sharpness,
and tiny footprint (<50KB instead of 5.88MB).
"""
import os
from PIL import Image

def process_logo():
    in_path = "src/main/resources/FrontEnd/assets/imgs/logo.png"
    out_clean_path = "src/main/resources/FrontEnd/assets/imgs/logo-clean.png"
    out_mark_path = "src/main/resources/FrontEnd/assets/imgs/logo-mark.png"

    with Image.open(in_path) as im:
        im = im.convert("RGBA")
        # Content box found earlier: (768, 228, 2748, 1470)
        content = im.crop((768, 228, 2748, 1470))

        # Background color is light lavender ~ (225, 225, 250)
        datas = content.getdata()
        new_data = []
        for item in datas:
            # Check if color is close to the lavender/white background
            r, g, b, a = item
            if r > 215 and g > 215 and b > 235:
                # Calculate alpha based on distance
                new_data.append((r, g, b, 0))
            elif r > 200 and g > 200 and b > 220:
                dist = max(r - 200, g - 200, b - 220)
                alpha = max(0, min(255, int(255 - dist * 10)))
                new_data.append((r, g, b, alpha))
            else:
                new_data.append(item)

        content.putdata(new_data)
        bbox = content.getbbox()
        if bbox:
            content = content.crop(bbox)

        # Create high-res clean version for navbar: height 96px (retina for 48px display)
        ratio = content.width / content.height
        target_h = 96
        target_w = int(target_h * ratio)
        clean_retina = content.resize((target_w, target_h), Image.Resampling.LANCZOS)
        clean_retina.save(out_clean_path, "PNG", optimize=True)
        print(f"Saved: {out_clean_path} ({clean_retina.size}, {os.path.getsize(out_clean_path):,} bytes)")

        # Create square emblem mark (height 96x96)
        mark_w = min(content.height, content.width)
        mark = content.crop((0, 0, mark_w, content.height))
        mark_square = mark.resize((96, 96), Image.Resampling.LANCZOS)
        mark_square.save(out_mark_path, "PNG", optimize=True)
        print(f"Saved: {out_mark_path} ({mark_square.size}, {os.path.getsize(out_mark_path):,} bytes)")

if __name__ == '__main__':
    process_logo()

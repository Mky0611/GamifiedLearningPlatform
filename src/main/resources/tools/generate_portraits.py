#!/usr/bin/env python3
"""
Generate crisp pixel portraits for 9 bosses and 3 heroes.
Ensures exact visual identity between HUD portraits and arena sprites.
"""
from pathlib import Path
from PIL import Image

def generate_portraits():
    base = Path("src/main/resources/FrontEnd/assets")
    out_dir = base / "ui" / "avatars"
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Boss Portraits Mapping
    boss_sources = {
        "crabby": base / "monsters/treasure/crabby/idle/Idle 01.png",
        "captain": base / "monsters/treasure/captain/idle/Idle Sword 01.png",
        "fierce": base / "monsters/treasure/fierce/idle/Idle 01.png",
        "pink": base / "monsters/treasure/pink/idle/Idle 01.png",
        "totem1": base / "monsters/treasure/totem1/idle/1.png",
        "totem2": base / "monsters/treasure/totem2/idle/1.png",
        "totem3": base / "monsters/treasure/totem3/idle/1.png",
        "seashell": base / "monsters/treasure/seashell/idle/1.png",
        "cannon": base / "monsters/treasure/cannon/idle/1.png"
    }

    target_size = (64, 64)

    for theme, src_path in boss_sources.items():
        out_path = out_dir / f"portrait-boss-{theme}.png"
        if not src_path.exists():
            print(f"Warning: {src_path} not found!")
            continue
        with Image.open(src_path) as img:
            img = img.convert("RGBA")
            # Crop to alpha bbox to focus on the character
            bbox = img.getchannel("A").getbbox()
            if bbox:
                # Add slight margin if possible
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
                size = max(w, h)
                cx = (bbox[0] + bbox[2]) // 2
                cy = (bbox[1] + bbox[3]) // 2
                x0 = max(0, cx - size // 2)
                y0 = max(0, cy - size // 2)
                x1 = min(img.width, x0 + size)
                y1 = min(img.height, y0 + size)
                cropped = img.crop((x0, y0, x1, y1))
            else:
                cropped = img
            # Resize with nearest-neighbor to preserve pixel art sharpness
            portrait = cropped.resize(target_size, Image.Resampling.NEAREST)
            portrait.save(out_path, "PNG")
            print(f"Saved boss portrait: {out_path} ({portrait.size})")

    # 2. Hero Portraits Mapping
    hero_sources = {
        "warrior": base / "ui/avatars/avatar-ts-1.png",
        "lancer": base / "ui/avatars/avatar-ts-18.png",
        "archer": base / "ui/avatars/avatar-ts-8.png"
    }
    for hero, src_path in hero_sources.items():
        out_path = out_dir / f"portrait-hero-{hero}.png"
        if not src_path.exists():
            print(f"Warning: {src_path} not found!")
            continue
        with Image.open(src_path) as img:
            img = img.convert("RGBA")
            portrait = img.resize(target_size, Image.Resampling.NEAREST)
            portrait.save(out_path, "PNG")
            print(f"Saved hero portrait: {out_path} ({portrait.size})")

if __name__ == '__main__':
    generate_portraits()

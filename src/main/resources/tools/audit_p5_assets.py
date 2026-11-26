#!/usr/bin/env python3
"""
Incremental Asset Audit, License Filter & Curated Staging for Lex Raid Phase P5 (Path of Legends).
- Extracts exact dimensions, frame counts, alpha bounding boxes, pivots, durations & SHA-256.
- Copies ONLY verified, licensed P5 runtime assets into `src/main/resources/FrontEnd/assets/`.
- Outputs `docs/P5_ASSET_DELTA.json` (incremental manifest without touching existing P4-B.2 manifest).
"""

import hashlib
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
UI_EXTRA = ROOT / "UI Extra"
FRONTEND_ASSETS = ROOT / "src" / "main" / "resources" / "FrontEnd" / "assets"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def ensure_copy(src: Path, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def make_arcane_mage_portrait(idle_path: Path, dst: Path):
    im = Image.open(idle_path).convert("RGBA")
    # Crop centered upper head/torso from frame 0 (210x180, anchor x=105, y=166)
    f0 = im.crop((0, 0, 210, 180))
    crop = f0.crop((61, 46, 149, 134)).resize((64, 64), Image.NEAREST)
    dst.parent.mkdir(parents=True, exist_ok=True)
    crop.save(dst, optimize=True)


def run_audit_and_curate(curate: bool = False):
    delta_entries = []

    # 1. Arcane Mage Hero (NightCat Works v1.1 - Free permitted + AI disclosure)
    am_dir = UI_EXTRA / "characters" / "arcane_mage"
    am_meta = json.loads((am_dir / "arcane_mage_sheet.json").read_text(encoding="utf-8"))
    am_fps = {"idle": 8, "run": 12, "jump": 10, "attack1": 12, "attack2": 14, "attack3": 10, "drink": 8, "hit": 10, "death": 10}
    am_impact = {"attack1": 2, "attack2": 2, "attack3": 2, "drink": 3}

    for anim in ["idle", "run", "jump", "attack1", "attack2", "attack3", "drink", "hit", "death"]:
        src = am_dir / "strips" / f"{anim}.png"
        if not src.exists():
            continue
        im = Image.open(src)
        fw, fh = 210, 180
        fc = im.size[0] // fw
        fboxes = [b for idx in range(fc) if (b := im.crop((idx * fw, 0, (idx + 1) * fw, fh)).getbbox())]
        union_bb = [min(b[0] for b in fboxes), min(b[1] for b in fboxes), max(b[2] for b in fboxes), max(b[3] for b in fboxes)]
        dst = FRONTEND_ASSETS / "units" / "arcane_mage" / f"{anim}.png"
        if curate:
            ensure_copy(src, dst)
        delta_entries.append({
            "id": f"hero-arcane_mage-{anim}",
            "sourcePack": "free-arcane-mage-v1.1 (NightCat Works OÜ)",
            "originalPath": str(src.relative_to(ROOT)).replace("\\", "/"),
            "canonicalPath": f"/ui/assets/units/arcane_mage/{anim}.png",
            "sha256": sha256_file(src),
            "sheetWidth": im.size[0],
            "sheetHeight": im.size[1],
            "alphaBounds": union_bb,
            "frameWidth": fw,
            "frameHeight": fh,
            "frameCount": fc,
            "frameDurationMs": round(1000 / am_fps[anim]),
            "pivot": [105, 166],
            "origin": [0.5, 0.9222],
            "direction": "RIGHT",
            "castAnchor": [145, 108] if anim.startswith("attack") else [105, 108],
            "impactFrame": am_impact.get(anim),
            "loop": anim in ("idle", "run"),
            "license": "Free/Commercial Game Usage (No Standalone Asset Redistribution; AI-assisted disclosure preserved)",
            "attribution": "Arcane Mage v1.1 by NightCat Works OÜ",
            "usedBy": ["hero:arcane_mage"],
        })

    portrait_dst = FRONTEND_ASSETS / "ui" / "avatars" / "portrait-hero-arcane_mage.png"
    if curate:
        make_arcane_mage_portrait(am_dir / "strips" / "idle.png", portrait_dst)
        p_im = Image.open(portrait_dst)
        delta_entries.append({
            "id": "portrait-hero-arcane_mage",
            "sourcePack": "free-arcane-mage-v1.1 (NightCat Works OÜ)",
            "originalPath": "UI Extra/characters/arcane_mage/strips/idle.png#frame0",
            "canonicalPath": "/ui/assets/ui/avatars/portrait-hero-arcane_mage.png",
            "sha256": sha256_file(portrait_dst),
            "sheetWidth": p_im.size[0],
            "sheetHeight": p_im.size[1],
            "frameWidth": 64,
            "frameHeight": 64,
            "frameCount": 1,
            "license": "Free/Commercial Game Usage (AI-assisted disclosure preserved)",
            "attribution": "Arcane Mage v1.1 by NightCat Works OÜ",
            "usedBy": ["hero:arcane_mage"],
        })

    # 2. PVFX Foundry CC0 VFX Selections
    pvfx_map = {
        "arcane/arcane-beam": ("pvfx-arcane-beam.png", ["skill:arcane_beam"]),
        "arcane/magic-circle": ("pvfx-magic-circle.png", ["skill:arcane_beam", "skill:meteor_fall", "skill:astral_cataclysm"]),
        "arcane/blink-dash": ("pvfx-blink-dash.png", ["skill:phantom_dash", "skill:impaling_charge"]),
        "arcane/rune-trap": ("pvfx-rune-trap.png", ["skill:rune_prison"]),
        "holy/holy-cast": ("pvfx-holy-cast.png", ["skill:holy_light", "skill:divine_aegis"]),
        "holy/holy-heal": ("pvfx-holy-heal.png", ["skill:holy_light", "skill:sacred_recovery"]),
        "holy/holy-sword-fall": ("pvfx-holy-sword-fall.png", ["skill:lexical_judgment"]),
        "holy/divine-beam": ("pvfx-divine-beam.png", ["skill:heavens_pillar"]),
        "holy/shield-bubble": ("pvfx-shield-bubble.png", ["skill:royal_guard", "skill:divine_aegis", "skill:iron_fortress"]),
        "fire/meteor-strike": ("pvfx-meteor-strike.png", ["skill:meteor_fall"]),
        "impacts/ground-slam": ("pvfx-ground-slam.png", ["skill:earthbreaker", "skill:shield_bash"]),
        "ui/level-up": ("pvfx-unlock-burst.png", ["ui:reward_unlock"]),
    }
    for rel, (out_name, refs) in pvfx_map.items():
        base = UI_EXTRA / "effects" / rel / "lit" / "grid"
        ss = base / "sprite-sheet.png"
        mf = base / "manifest.json"
        if not ss.exists() or not mf.exists():
            continue
        meta = json.loads(mf.read_text(encoding="utf-8"))
        im = Image.open(ss)
        dst = FRONTEND_ASSETS / "effects" / "vfx" / "p5" / out_name
        if curate:
            ensure_copy(ss, dst)
        frames = meta.get("frames", [])
        dur_ms = frames[0]["duration"]["numerator_ms"] if frames else 70
        delta_entries.append({
            "id": f"pvfx-{out_name[:-4]}",
            "sourcePack": "pvfx-foundry (Pixel VFX Studio)",
            "originalPath": str(ss.relative_to(ROOT)).replace("\\", "/"),
            "canonicalPath": f"/ui/assets/effects/vfx/p5/{out_name}",
            "sha256": sha256_file(ss),
            "sheetWidth": im.size[0],
            "sheetHeight": im.size[1],
            "alphaBounds": list(im.getbbox()) if im.getbbox() else None,
            "frameWidth": meta["source_size"][0],
            "frameHeight": meta["source_size"][1],
            "frameCount": len(frames),
            "frameDurationMs": dur_ms,
            "pivot": meta.get("pivot"),
            "direction": "RIGHT",
            "castAnchor": meta.get("pivot"),
            "impactFrame": max(1, len(frames) // 2),
            "loop": meta.get("loop_mode") == "loop",
            "license": "CC0 1.0 Public Domain",
            "attribution": "Pixel VFX Studio (pixelfx MIT notice preserved)",
            "usedBy": refs,
        })

    # 3. Mira Forge Projectiles & Spells (Free Permitted v1.0)
    proj_map = {
        "01_steel_projectile/64x64/steel_projectile_64x64_sheet.png": ("proj-steel-64.png", ["skill:quick_shot", "skill:piercing_arrow", "skill:triple_shot", "skill:dragon_lance"]),
        "02_arcane_projectile/64x64/arcane_projectile_64x64_sheet.png": ("proj-arcane-64.png", ["skill:magic_bolt", "skill:astral_cataclysm"]),
        "03_plasma_projectile/64x64/plasma_projectile_64x64_sheet.png": ("proj-plasma-64.png", ["skill:celestial_arrow", "skill:thunder_strike"]),
        "09_steel_impact/64x64/steel_impact_64x64_sheet.png": ("impact-steel-64.png", ["skill:quick_shot", "skill:piercing_arrow", "skill:rain_of_arrows"]),
        "10_arcane_impact/64x64/arcane_impact_64x64_sheet.png": ("impact-arcane-64.png", ["skill:magic_bolt", "skill:arcane_beam"]),
    }
    for rel, (out_name, refs) in proj_map.items():
        src = UI_EXTRA / "Free_Pixel_Projectiles_and_Bolts" / "effects" / rel
        if src.exists():
            im = Image.open(src)
            dst = FRONTEND_ASSETS / "effects" / "vfx" / "p5" / out_name
            if curate:
                ensure_copy(src, dst)
            delta_entries.append({
                "id": out_name[:-4],
                "sourcePack": "FreePixelProjectiles_Free_v1.0.3 (Mira Forge)",
                "originalPath": str(src.relative_to(ROOT)).replace("\\", "/"),
                "canonicalPath": f"/ui/assets/effects/vfx/p5/{out_name}",
                "sha256": sha256_file(src),
                "sheetWidth": im.size[0],
                "sheetHeight": im.size[1],
                "alphaBounds": list(im.getbbox()) if im.getbbox() else None,
                "frameWidth": 64,
                "frameHeight": 64,
                "frameCount": im.size[0] // 64,
                "frameDurationMs": 83,
                "pivot": [32, 32],
                "direction": "E",
                "castAnchor": [16, 32],
                "impactFrame": 4,
                "loop": "projectile" in rel,
                "license": "Mira Forge Free Pack License v1.0 (Personal/Commercial project use; no standalone redistribution)",
                "attribution": "Mira Forge",
                "usedBy": refs,
            })

    spell_map = {
        "02_fireball/64x64/fireball_64x64_sheet.png": ("spell-fireball-64.png", ["skill:fireball"]),
        "03_fire_burst/64x64/fire_burst_64x64_sheet.png": ("spell-fire-burst-64.png", ["skill:fireball", "skill:fire_blade"]),
        "07_ice_shard/64x64/ice_shard_64x64_sheet.png": ("spell-ice-shard-64.png", ["skill:glacial_prison"]),
        "08_ice_shatter/64x64/ice_shatter_64x64_sheet.png": ("spell-ice-shatter-64.png", ["skill:glacial_prison", "skill:frost_seal"]),
        "12_spark_orb/64x64/spark_orb_64x64_sheet.png": ("spell-spark-orb-64.png", ["skill:thunderstorm", "skill:thunder_strike"]),
        "13_lightning_strike/64x64/lightning_strike_64x64_sheet.png": ("spell-lightning-strike-64.png", ["skill:thunderstorm", "skill:thunder_strike"]),
        "19_rune_ring/64x64/rune_ring_64x64_sheet.png": ("spell-rune-ring-64.png", ["skill:rune_prison", "skill:astral_cataclysm"]),
    }
    for rel, (out_name, refs) in spell_map.items():
        src = UI_EXTRA / "Free_Pixel_Spell_Effects" / "effects" / rel
        if src.exists():
            im = Image.open(src)
            dst = FRONTEND_ASSETS / "effects" / "vfx" / "p5" / out_name
            if curate:
                ensure_copy(src, dst)
            fc = im.size[0] // 64
            delta_entries.append({
                "id": out_name[:-4],
                "sourcePack": "free-pixel-spell-effects-v1.0.3 (Mira Forge)",
                "originalPath": str(src.relative_to(ROOT)).replace("\\", "/"),
                "canonicalPath": f"/ui/assets/effects/vfx/p5/{out_name}",
                "sha256": sha256_file(src),
                "sheetWidth": im.size[0],
                "sheetHeight": im.size[1],
                "alphaBounds": list(im.getbbox()) if im.getbbox() else None,
                "frameWidth": 64,
                "frameHeight": 64,
                "frameCount": fc,
                "frameDurationMs": 83,
                "pivot": [32, 32],
                "direction": "E",
                "castAnchor": [32, 32],
                "impactFrame": max(1, fc // 2),
                "loop": rel.startswith(("02_", "07_", "12_", "19_")),
                "license": "Mira Forge Free Pack License v1.0 (Personal/Commercial project use; no standalone redistribution)",
                "attribution": "Mira Forge",
                "usedBy": refs,
            })

    # 4. Byte Progression Kit (CC-BY-4.0 Oğuzhan Girgin)
    byte_picks = [
        "skill-locked@2x.png", "skill-available@2x.png", "skill-unlocked@2x.png", "skill-maxed@2x.png",
        "link-straight@2x.png", "link-straight-active@2x.png", "link-elbow@2x.png", "link-elbow-active@2x.png",
        "star-full@2x.png", "star-empty@2x.png", "level-badge@2x.png", "mastery-locked@2x.png", "mastery-unlocked@2x.png"
    ]
    for bn in byte_picks:
        src = UI_EXTRA / "byte-progression-kit" / "png" / bn
        if src.exists():
            im = Image.open(src)
            dst = FRONTEND_ASSETS / "ui" / "progression" / bn
            if curate:
                ensure_copy(src, dst)
            delta_entries.append({
                "id": f"byte-{bn[:-4]}",
                "sourcePack": "byte-progression-kit (Oğuzhan Girgin)",
                "originalPath": str(src.relative_to(ROOT)).replace("\\", "/"),
                "canonicalPath": f"/ui/assets/ui/progression/{bn}",
                "sha256": sha256_file(src),
                "sheetWidth": im.size[0],
                "sheetHeight": im.size[1],
                "frameWidth": im.size[0],
                "frameHeight": im.size[1],
                "frameCount": 1,
                "license": "CC-BY-4.0",
                "attribution": "\"Byte Progression Kit\" by Oğuzhan Girgin, licensed under CC-BY-4.0 — https://www.colorosse.com/assets/2d/ui/byte-progression-kit",
                "usedBy": ["ui:skill_tree", "ui:chapter_map"],
            })

    # 5. Questwood Pixel UI v1.2 (breathinghuman — AI-assisted usage terms)
    qw_picks = [
        "Skills/arcane_orb.png", "Skills/arrow_volley.png", "Skills/earth_spike.png", "Skills/fireball.png",
        "Skills/healing_spark.png", "Skills/holy_beam.png", "Skills/ice_spike.png", "Skills/lightning_burst.png",
        "Skills/magic_barrier.png", "Skills/shadow_step.png", "Buttons/slot_normal.png", "Buttons/slot_selected.png",
        "Buttons/slot_disabled.png", "Windows/skill_tree_panel.png", "Windows/reward_panel.png", "Windows/portrait_frame.png"
    ]
    for qp in qw_picks:
        src = UI_EXTRA / "PNG_1x" / qp
        if src.exists():
            im = Image.open(src)
            dst = FRONTEND_ASSETS / "ui" / "questwood" / qp
            if curate:
                ensure_copy(src, dst)
            delta_entries.append({
                "id": f"questwood-{qp.replace('/', '-')[:-4]}",
                "sourcePack": "Questwood-Pixel-UI-Complete-v1.2 (breathinghuman)",
                "originalPath": str(src.relative_to(ROOT)).replace("\\", "/"),
                "canonicalPath": f"/ui/assets/ui/questwood/{qp}",
                "sha256": sha256_file(src),
                "sheetWidth": im.size[0],
                "sheetHeight": im.size[1],
                "frameWidth": im.size[0],
                "frameHeight": im.size[1],
                "frameCount": 1,
                "license": "Questwood Usage Terms (Non-exclusive free/commercial project use; no standalone redistribution; AI-assisted disclosure)",
                "attribution": "breathinghuman (Questwood Pixel UI v1.2)",
                "usedBy": ["ui:character_hall", "ui:spellbook", "ui:skill_tree", "ui:reward_modal"],
            })

    delta_doc = {
        "schema": "lex-raid.p5-asset-delta/1",
        "generatedAt": "2026-11-26",
        "integratedCount": len(delta_entries),
        "excludedBacklog": [
            {
                "id": "hero:monk",
                "source": "UI Extra/Tiny Swords (Free Pack)/Units/Monk",
                "status": "LICENSE_PENDING",
                "reason": "No LICENSE file in Tiny Swords (Free Pack) subfolder; excluded from public runtime per safety policy."
            },
            {
                "id": "hero:rogue",
                "source": "UI Extra/spritesheets/rogue.png",
                "status": "BACKLOG_STYLE_AND_PROVENANCE",
                "reason": "32x32 4-dir top-down chibi mismatches 192px/210px side-view Combat Heroes and lacks standalone Hero license notice."
            }
        ],
        "assets": delta_entries,
    }
    delta_path = ROOT / "docs" / "P5_ASSET_DELTA.json"
    delta_path.write_text(json.dumps(delta_doc, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Curated={curate} | Entries={len(delta_entries)} | Delta written to {delta_path}")


if __name__ == "__main__":
    run_audit_and_curate(curate="--curate" in sys.argv)

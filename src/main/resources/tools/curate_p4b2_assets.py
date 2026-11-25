#!/usr/bin/env python3
"""
Phase P4-B.2 Asset Curator & 9-Slice Assembler.
- Fixes swapped cursor-action.png vs cursor-forbidden.png cleanly and idempotently.
- Repackages existing repo Tiny Swords spaced 3x3 atlases into contiguous CSS border-image 9-slices under FrontEnd/assets/ui/slices/.
- Extracts curated CC0 / Permitted / Attributed assets from raw 'UI Extra/' inbox into organized FrontEnd/assets/ folders.
- Emits docs/P4B2_COMPONENT_ASSET_MAP.csv documenting provenance, license, target asset, and usage.
"""
import csv
import hashlib
import pathlib
import shutil
from PIL import Image

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
FE_ASSETS = REPO_ROOT / "src" / "main" / "resources" / "FrontEnd" / "assets"
UI_EXTRA = REPO_ROOT / "UI Extra"
DOCS_DIR = REPO_ROOT / "docs"

CSV_ROWS = []


def record(component, asset_rel, source_pack, source_rel, license_status, dimensions, notes):
    CSV_ROWS.append({
        "component": component,
        "runtime_asset": f"assets/{asset_rel}",
        "source_pack": source_pack,
        "source_file": source_rel,
        "license_status": license_status,
        "dimensions": dimensions,
        "notes": notes,
    })


def fix_swapped_cursors():
    cdir = FE_ASSETS / "ui" / "cursors"
    act_p = cdir / "cursor-action.png"
    forb_p = cdir / "cursor-forbidden.png"
    with Image.open(act_p) as im_a, Image.open(forb_p) as im_b:
        a = im_a.convert("RGBA")
        b = im_b.convert("RGBA")
        # Check center alpha: circle-slash has opaque diagonal line at center; 4-corner brackets are hollow at center
        ca = a.getpixel((a.width // 2, a.height // 2))[3]
        cb = b.getpixel((b.width // 2, b.height // 2))[3]
        if ca > 100 and cb == 0:
            # Swap them! Also trim transparent outer padding of 128x128 target bracket to clean 64x64
            bbox = b.getbbox()
            if bbox:
                cropped = b.crop(bbox)
                side = max(cropped.width, cropped.height)
                pad_target = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
                scale = min(56 / side, 1.0)
                nw, nh = max(1, int(round(cropped.width * scale))), max(1, int(round(cropped.height * scale)))
                resized = cropped.resize((nw, nh), Image.NEAREST)
                pad_target.paste(resized, ((64 - nw) // 2, (64 - nh) // 2), resized)
                pad_target.save(act_p)
            else:
                b.save(act_p)
            a.save(forb_p)
            print("Fixed swapped cursor-action.png <-> cursor-forbidden.png")
        else:
            print("Cursors already in correct orientation (ca=", ca, "cb=", cb, ")")
    record("Cursor:Action", "ui/cursors/cursor-action.png", "Existing Repo (Tiny Swords Cursor_04)", "ui/cursors/cursor-action.png", "EXISTING_REPO", "64x64", "Fixed P4-B swap: 4-corner target bracket")
    record("Cursor:Forbidden", "ui/cursors/cursor-forbidden.png", "Existing Repo (Tiny Swords Cursor_03)", "ui/cursors/cursor-forbidden.png", "EXISTING_REPO", "64x64", "Fixed P4-B swap: prohibition circle")


def stitch_grid(src_path: pathlib.Path, x_spans, y_spans, dest_path: pathlib.Path):
    with Image.open(src_path) as im:
        im = im.convert("RGBA")
        w_out = sum(x2 - x1 + 1 for x1, x2 in x_spans)
        h_out = sum(y2 - y1 + 1 for y1, y2 in y_spans)
        canvas = Image.new("RGBA", (w_out, h_out), (0, 0, 0, 0))
        y_off = 0
        for y1, y2 in y_spans:
            row_h = y2 - y1 + 1
            x_off = 0
            for x1, x2 in x_spans:
                col_w = x2 - x1 + 1
                tile = im.crop((x1, y1, x2 + 1, y2 + 1))
                canvas.paste(tile, (x_off, y_off), tile)
                x_off += col_w
            y_off += row_h
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(dest_path)
        return f"{w_out}x{h_out}"


def assemble_existing_nine_slices():
    slices_dir = FE_ASSETS / "ui" / "slices"
    slices_dir.mkdir(parents=True, exist_ok=True)

    specs = [
        ("Panel:BannerScroll", FE_ASSETS / "ui/banners/banner.png", [(28, 127), (192, 255), (320, 403)], [(60, 127), (192, 255), (320, 430)], "ui/slices/banner-scroll.png", "border-image-slice: 68 84 111 100 fill"),
        ("Panel:WoodBoard", FE_ASSETS / "ui/table/woodtable.png", [(44, 127), (192, 255), (320, 403)], [(43, 127), (192, 255), (320, 422)], "ui/slices/wood-board.png", "border-image-slice: 85 84 103 84 fill"),
        ("Panel:PaperRegular", FE_ASSETS / "ui/papers/regular-paper.png", [(12, 63), (128, 191), (256, 307)], [(20, 63), (128, 191), (256, 300)], "ui/slices/paper-regular.png", "border-image-slice: 44 52 45 52 fill"),
        ("Panel:PaperSpecial", FE_ASSETS / "ui/papers/special-paper.png", [(9, 63), (128, 191), (256, 310)], [(20, 63), (128, 191), (256, 298)], "ui/slices/paper-special.png", "border-image-slice: 44 55 43 55 fill"),
        ("Bar:BigTrack", FE_ASSETS / "ui/bars/bigbar-base.png", [(40, 63), (128, 191), (256, 279)], [(9, 59)], "ui/slices/bigbar-track.png", "3-slice HP/boss track slice 0 24 0 24 fill"),
        ("Bar:SmallTrack", FE_ASSETS / "ui/bars/smallbar-base.png", [(49, 63), (128, 191), (256, 270)], [(22, 40)], "ui/slices/smallbar-track.png", "3-slice mana/XP track slice 0 15 0 15 fill"),
        ("Button:BluePressed", FE_ASSETS / "ui/tiny/button-blue-pressed.png", [(14, 63), (128, 191), (256, 305)], [(28, 63), (128, 191), (256, 304)], "ui/slices/btn-blue-pressed.png", "border-image-slice: 36 50 49 50 fill"),
        ("Button:RedPressed", FE_ASSETS / "ui/tiny/button-red-pressed.png", [(14, 63), (128, 191), (256, 305)], [(28, 63), (128, 191), (256, 304)], "ui/slices/btn-red-pressed.png", "border-image-slice: 36 50 49 50 fill"),
    ]
    for comp, src, xs, ys, rel_out, note in specs:
        dims = stitch_grid(src, xs, ys, FE_ASSETS / rel_out)
        record(comp, rel_out, "Existing Repo (Tiny Swords)", src.relative_to(FE_ASSETS).as_posix(), "EXISTING_REPO", dims, note)

    # Ribbons from ui/banners/big-ribbons.png (5 rows)
    ribbon_rows = [
        ("Ribbon:Blue", (20, 122), "ui/slices/ribbon-blue.png"),
        ("Ribbon:Red", (148, 250), "ui/slices/ribbon-red.png"),
        ("Ribbon:Yellow", (276, 378), "ui/slices/ribbon-yellow.png"),
        ("Ribbon:Purple", (404, 506), "ui/slices/ribbon-purple.png"),
        ("Ribbon:Steel", (532, 634), "ui/slices/ribbon-steel.png"),
    ]
    for comp, yr, rel_out in ribbon_rows:
        dims = stitch_grid(FE_ASSETS / "ui/banners/big-ribbons.png", [(30, 127), (192, 255), (320, 416)], [yr], FE_ASSETS / rel_out)
        record(comp, rel_out, "Existing Repo (Tiny Swords big-ribbons)", "ui/banners/big-ribbons.png", "EXISTING_REPO", dims, "3-slice title ribbon slice 0 97 0 98 fill")

    # Reference existing big-blue.png / big-red.png / bar fills
    for comp, rel in [("Button:Blue", "ui/buttons/big-blue.png"), ("Button:Red", "ui/buttons/big-red.png"), ("Bar:BigFill", "ui/bars/bigbar-fill.png"), ("Bar:SmallFill", "ui/bars/smallbar-fill.png")]:
        with Image.open(FE_ASSETS / rel) as im:
            record(comp, rel, "Existing Repo (Tiny Swords)", rel, "EXISTING_REPO", f"{im.width}x{im.height}", "Direct existing repo asset")


def copy_curated(src: pathlib.Path, rel_dest: str, component: str, pack: str, license_status: str, notes: str):
    dest = FE_ASSETS / rel_dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    dims = "-"
    if src.suffix.lower() == ".png":
        with Image.open(src) as im:
            dims = f"{im.width}x{im.height}"
    record(component, rel_dest, pack, src.relative_to(UI_EXTRA).as_posix(), license_status, dims, notes)


def curate_kenney_and_kibyra():
    # Kenney Ancient 9-Slice (CC0)
    kenney_dir = UI_EXTRA / "9-Slice" / "Ancient"
    for name in ("brown.png", "brown_inlay.png", "brown_pressed.png", "tan.png", "tan_inlay.png", "tan_pressed.png", "grey.png", "grey_pressed.png"):
        copy_curated(kenney_dir / name, f"ui/slices/kenney/{name}", f"Kenney9Slice:{name}", "Kenney Pixel UI Pack", "CC0", "16px 9-slice slot/card/tile border")

    # Kibyra Free Medieval Fantasy UI Icons (PERMITTED_INTEGRATION_NO_RAW_REDISTRIB)
    kibyra_picks = {
        "icon1.png": "Play arrow icon",
        "icon2.png": "Cancel red cross icon",
        "icon3.png": "Settings gear icon",
        "icon4.png": "Knight helm / Hero badge",
        "icon5.png": "Info / Lexicon hint badge",
        "icon10.png": "Mana / Blue elixir flask",
        "icon11.png": "Stamina / Emerald flask",
        "icon12.png": "Gold coins pouch",
        "icon14.png": "Sacred recovery potion",
        "icon17.png": "Knight slash broadsword",
        "icon18.png": "Heavy cleavage battleaxe",
        "icon19.png": "Royal heraldic shield",
        "icon20.png": "Iron buckler shield",
        "icon23.png": "Paladin war helm",
        "icon25.png": "Crown / Mastery seal",
        "icon26.png": "Crossed swords / Arena battle",
        "icon27.png": "Arcane / Lexical staff",
        "icon28.png": "Rogue blade",
        "icon30.png": "Star mastery badge",
        "icon32.png": "Ancient lexicon tome / Volcard",
        "icon33.png": "Adventure compass",
        "icon35.png": "Kingdom quest map",
        "icon36.png": "Guild banner flag",
        "icon37.png": "Quill & quiz scroll",
        "icon40.png": "Kingdom citadel / Home",
        "icon42.png": "Forge anvil / Skills",
        "icon53.png": "Royal Academy trophy",
        "icon57.png": "Ember / Fire sigil",
        "icon58.png": "Frost ward / Ice shield",
        "icon59.png": "Storm judgment / Lightning crest",
    }
    for fname, desc in kibyra_picks.items():
        src = UI_EXTRA / "Free_Medieval_Fantasy_UI_Pack" / "UI Icons" / fname
        copy_curated(src, f"ui/kibyra/{fname}", f"Icon:{fname}", "Free Medieval Fantasy UI Pack (Kibyra)", "PERMITTED_INTEGRATION_NO_RAW_REDISTRIB", desc)


def curate_vfx_and_audio():
    # Sword Slash Pixel FX v1 (CC0)
    ss_dir = UI_EXTRA / "sword-slash-pixel-fx-v1"
    copy_curated(ss_dir / "sheets-no-halo" / "fx-slash-clean.png", "effects/vfx/fx-slash-clean.png", "VFX:SwordSlashClean", "Sword Slash Pixel FX v1 (Pixelbolt)", "CC0", "80x64 frames (no-halo): slash 8f, slash-down 8f, slash-spin 10f, hit 6f")
    copy_curated(ss_dir / "sheets-no-halo" / "fx-slash-clean.atlas.json", "effects/vfx/fx-slash-clean.atlas.json", "VFX:SwordSlashAtlas", "Sword Slash Pixel FX v1 (Pixelbolt)", "CC0", "Frame atlas metadata for fx-slash-clean.png")
    copy_curated(ss_dir / "sheets" / "fx-slash.png", "effects/vfx/fx-slash.png", "VFX:SwordSlashHalo", "Sword Slash Pixel FX v1 (Pixelbolt)", "CC0", "80x64 frames (dark-bg halo): slash 8f, slash-down 8f, slash-spin 10f, hit 6f")
    copy_curated(ss_dir / "sounds" / "fx-slash-swing.wav", "audio/fx-slash-swing.wav", "Audio:SwordSwing", "Sword Slash Pixel FX v1 (Pixelbolt)", "CC0", "Muted by default, user-toggleable SFX")

    # Tiny Pixel FX Vol.1 (CC0) - 32px sheets (256x32 = 8 frames)
    tpf_dir = UI_EXTRA / "tiny-pixel-fx-vol1" / "sheets_32px"
    tpf_picks = [
        "hit_spark_ember.png", "hit_spark_frost.png", "hit_spark_arcane.png",
        "impact_ring_ember.png", "impact_ring_frost.png", "impact_ring_arcane.png",
        "slash_arc_ember.png", "slash_arc_frost.png", "slash_arc_arcane.png",
        "heal_plus_frost.png", "heal_plus_arcane.png",
        "parry_flash_frost.png", "parry_flash_ember.png",
        "dash_dust_mono.png", "explosion_ember.png",
    ]
    for fname in tpf_picks:
        copy_curated(tpf_dir / fname, f"effects/vfx/{fname}", f"VFX:{fname}", "Tiny Pixel FX Vol.1", "CC0", "32x32 8-frame pixel VFX sheet (14fps)")

    # Mira Forge Fire & Elemental Effects (PERMITTED_INTEGRATION_NO_RAW_REDISTRIB)
    mf_dir = UI_EXTRA / "Free_Pixel_Fire_and_Elemental_Effects" / "effects"
    mf_picks = [
        ("01_campfire/64x64/campfire_64x64_sheet.png", "effects/vfx/campfire_64x64.png", "World campfire ambient loop (12f, 12fps)"),
        ("02_torch_flame/32x32/torch_flame_32x32_sheet.png", "effects/vfx/torch_flame_32x32.png", "Wall torch flame loop (8f, 12fps)"),
        ("03_fire_explosion/64x64/fire_explosion_64x64_sheet.png", "effects/vfx/fire_explosion_64x64.png", "Heavy Slash / Crit fire burst (12f, 12fps)"),
        ("05_ice_spikes/64x64/ice_spikes_64x64_sheet.png", "effects/vfx/ice_spikes_64x64.png", "Frost ward / Ice spike burst (10f, 12fps)"),
        ("11_thunder_burst/64x64/thunder_burst_64x64_sheet.png", "effects/vfx/thunder_burst_64x64.png", "Lexical Judgment lightning burst (10f, 12fps)"),
        ("14_acid_splash/64x64/acid_splash_64x64_sheet.png", "effects/vfx/acid_splash_64x64.png", "Slime acid impact burst (10f, 12fps)"),
    ]
    for src_rel, dest_rel, note in mf_picks:
        copy_curated(mf_dir / src_rel, dest_rel, f"VFX:{pathlib.Path(dest_rel).name}", "Free Pixel Fire & Elemental Effects v1.0.1 (Mira Forge)", "PERMITTED_INTEGRATION_NO_RAW_REDISTRIB", note)


def curate_worlds():
    # Tall Forest (CC0)
    tf = UI_EXTRA / "Tall Forest Files" / "Assets"
    for src_sub, name in [("Previews/forest.png", "forest-preview.png"), ("Layers/back.png", "back.png"), ("Layers/far.png", "far.png"), ("Layers/middle.png", "middle.png")]:
        copy_curated(tf / src_sub, f"backgrounds/worlds/tall-forest/{name}", f"World:TallForest:{name}", "Tall Forest (Ansimuz)", "CC0", "Forest parallax biome layer")

    # Super Mountain Dusk (CC0)
    smd = UI_EXTRA / "Super Mountain Dusk Files" / "Assets"
    for src_sub, name in [
        ("version A/Previews/Mountain-Dusk.png", "mountain-dusk-a.png"),
        ("version A/Layers/sky.png", "sky.png"),
        ("version A/Layers/far-mountains.png", "far-mountains.png"),
        ("version A/Layers/mountains.png", "mountains.png"),
        ("version A/Layers/far-clouds.png", "far-clouds.png"),
        ("version A/Layers/near-clouds.png", "near-clouds.png"),
        ("version A/Layers/trees.png", "trees.png"),
        ("version B/preview.png", "mountain-dusk-b.png"),
    ]:
        copy_curated(smd / src_sub, f"backgrounds/worlds/mountain-dusk/{name}", f"World:MountainDusk:{name}", "Super Mountain Dusk (Ansimuz)", "CC0", "Mountain dusk biome layer")

    # GothicVania Town (CC0)
    gv = UI_EXTRA / "GothicVania-town-files" / "PNG" / "environment"
    for src_sub, name in [
        ("layers/background.png", "background.png"),
        ("layers/middleground.png", "middleground.png"),
        ("environment-preview.png", "environment-preview.png"),
        ("props-sliced/street-lamp.png", "street-lamp.png"),
        ("props-sliced/sign.png", "sign.png"),
    ]:
        copy_curated(gv / src_sub, f"backgrounds/worlds/gothicvania-town/{name}", f"World:Town:{name}", "GothicVania Town (Ansimuz)", "CC0", "Fantasy kingdom town backdrop")

    # Pixel Art Waterfall v1.0 (PERMITTED_WITH_ATTRIBUTION - Burcu Sak)
    wf = UI_EXTRA / "Pixel_Art_Waterfall"
    copy_curated(wf / "waterfall_spritesheet.png", "backgrounds/worlds/waterfall/waterfall_spritesheet.png", "World:Waterfall:Sheet", "Pixel Art Waterfall v1.0", "PERMITTED_WITH_ATTRIBUTION", "Mandatory attribution: Waterfall pixel art by Burcu Sak (5f 404x640, 210ms/frame)")
    copy_curated(wf / "animation.json", "backgrounds/worlds/waterfall/animation.json", "World:Waterfall:Meta", "Pixel Art Waterfall v1.0", "PERMITTED_WITH_ATTRIBUTION", "Frame timing metadata (210ms/f)")


def curate_monster_expansion():
    """
    Converts Tiny Tileset Top-Down Monsters LITE (FREE) v1 (slime.png & skeleton.png 256x768 32x32 grid)
    into Phaser/Canvas horizontal action strips matching repo contract:
    - idle.png (idle_left 4f -> 128x32)
    - run.png (move_left 6f -> 192x32)
    - attack.png (attack1_left 6f -> 192x32)
    - hit.png (hurt_left 3f -> 96x32)
    - death.png (death_left 8f -> 256x32)
    And extracts crisp 48x48 front-facing HUD portraits from idle_down frame 0.
    """
    specs = {
        "slime": ("Slime", "Pixel-RPG green crystal slime (Tiny Tileset Top-Down Monsters LITE)"),
        "skeleton": ("Skeleton", "Undead skeletal warrior (Tiny Tileset Top-Down Monsters LITE)"),
    }
    row_map = [
        ("idle.png", 96, 4),      # idle_left
        ("run.png", 224, 6),      # move_left
        ("attack.png", 352, 6),   # attack1_left
        ("hit.png", 608, 3),      # hurt_left
        ("death.png", 736, 8),    # death_left
    ]
    for code, (title, note) in specs.items():
        src_sheet = UI_EXTRA / "spritesheets" / f"{code}.png"
        dest_dir = FE_ASSETS / "monsters" / code
        dest_dir.mkdir(parents=True, exist_ok=True)
        with Image.open(src_sheet) as im:
            im = im.convert("RGBA")
            for fname, y_off, frames in row_map:
                strip = im.crop((0, y_off, frames * 32, y_off + 32))
                strip.save(dest_dir / fname)
                record(f"Monster:{title}:{fname}", f"monsters/{code}/{fname}", "Top-Down Monsters LITE (FREE) v1", f"spritesheets/{code}.png", "PERMITTED_INTEGRATION_NO_RAW_REDISTRIB", f"{frames*32}x32", f"Extracted from left-facing 32x32 row y={y_off} ({frames}f)")

            # Front portrait from idle_down frame 0
            front = im.crop((0, 0, 32, 32))
            bbox = front.getbbox()
            portrait = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
            if bbox:
                crop = front.crop(bbox)
                scale = min(40 / max(1, crop.width), 40 / max(1, crop.height))
                # integer-friendly upscaling if small
                if crop.width <= 20 and crop.height <= 20:
                    scale = 2.0
                else:
                    scale = 1.5 if max(crop.width, crop.height) <= 26 else 1.25
                nw, nh = max(1, int(round(crop.width * scale))), max(1, int(round(crop.height * scale)))
                res = crop.resize((nw, nh), Image.NEAREST)
                portrait.paste(res, ((48 - nw) // 2, (48 - nh) // 2), res)
            p_dest = FE_ASSETS / "ui" / "avatars" / f"portrait-boss-{code}.png"
            portrait.save(p_dest)
            record(f"Portrait:{title}", f"ui/avatars/portrait-boss-{code}.png", "Top-Down Monsters LITE (FREE) v1", f"spritesheets/{code}.png", "PERMITTED_INTEGRATION_NO_RAW_REDISTRIB", "48x48", f"Front-facing HUD portrait derived from idle_down frame 0")


def write_csv():
    out_csv = DOCS_DIR / "P4B2_COMPONENT_ASSET_MAP.csv"
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["component", "runtime_asset", "source_pack", "source_file", "license_status", "dimensions", "notes"])
        writer.writeheader()
        writer.writerows(CSV_ROWS)
    print(f"Wrote {len(CSV_ROWS)} rows to {out_csv.relative_to(REPO_ROOT).as_posix()}")


if __name__ == "__main__":
    fix_swapped_cursors()
    assemble_existing_nine_slices()
    curate_kenney_and_kibyra()
    curate_vfx_and_audio()
    curate_worlds()
    curate_monster_expansion()
    write_csv()

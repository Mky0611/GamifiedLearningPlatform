# P4-B.2 Third-Party Assets & Attribution Registry

Every asset integrated from `UI Extra/` into `src/main/resources/FrontEnd/assets/` during Phase P4-B.2 has a verified license classification. Raw archive `UI Extra/` and `UI Extra.zip` are gitignored and never deployed.

## 1. Attributed Assets (Credit Required)
- **Pixel Art Waterfall v1.0**
  - **Credit**: `Waterfall pixel art by Burcu Sak`
  - **Source**: `UI Extra/Pixel_Art_Waterfall/`
  - **License**: Permitted with attribution (`LICENSE.txt`)
  - **Integrated Files**: `assets/backgrounds/worlds/waterfall/waterfall_spritesheet.png`, `animation.json`

## 2. CC0 1.0 Public Domain Assets
- **Kenney Pixel UI Pack (`9-Slice/Ancient`)**
  - **Source**: `UI Extra/9-Slice/Ancient/` (`License.txt` — CC0 1.0)
  - **Integrated Files**: `assets/ui/slices/kenney/{brown,brown_inlay,brown_pressed,tan,tan_inlay,tan_pressed,grey,grey_pressed}.png`
- **Sword Slash Pixel FX v1 (Skulitom Rivskiy / Pixelbolt)**
  - **Source**: `UI Extra/sword-slash-pixel-fx-v1/` (`LICENSE.txt` — CC0 1.0)
  - **Integrated Files**: `assets/effects/vfx/fx-slash-clean.png`, `fx-slash.atlas.json`, `assets/audio/fx-slash-swing.wav`
- **Tiny Pixel FX Vol.1**
  - **Source**: `UI Extra/tiny-pixel-fx-vol1/` (`LICENSE.txt` — CC0 1.0)
  - **Integrated Files**: 15 curated 32x32 8-frame sheets under `assets/effects/vfx/` (`hit_spark_*`, `impact_ring_*`, `slash_arc_*`, `heal_plus_*`, `parry_flash_*`, `dash_dust_mono.png`, `explosion_ember.png`)
- **Tall Forest / Super Mountain Dusk / GothicVania Town (Ansimuz)**
  - **Source**: `UI Extra/Tall Forest Files/`, `UI Extra/Super Mountain Dusk Files/`, `UI Extra/GothicVania-town-files/` (`public-license.pdf` — CC0 / Public Domain)
  - **Integrated Files**: `assets/backgrounds/worlds/{tall-forest,mountain-dusk,gothicvania-town}/*`

## 3. Free Permitted Integration (No Raw Pack Redistribution)
- **Free Medieval Fantasy UI Pack (Kibyra)**
  - **License**: Free for personal & commercial projects; raw pack redistribution prohibited (`Readme.txt`)
  - **Integrated Files**: 30 selected 32x32 UI icons under `assets/ui/kibyra/icon*.png`
- **Free Pixel Fire & Elemental Effects v1.0.1 (Mira Forge)**
  - **License**: Free for personal & commercial projects; raw pack redistribution prohibited (`LICENSE.txt`)
  - **Integrated Files**: `campfire_64x64.png`, `torch_flame_32x32.png`, `fire_explosion_64x64.png`, `ice_spikes_64x64.png`, `thunder_burst_64x64.png`, `acid_splash_64x64.png` under `assets/effects/vfx/`
- **Top-Down Monsters LITE (FREE) v1 (Tiny Tileset)**
  - **License**: Free for personal & commercial game projects; raw pack resale/NFT prohibited (`README.md`)
  - **Integrated Files**: `assets/monsters/{slime,skeleton}/{idle,run,attack,hit,death}.png`, `assets/ui/avatars/portrait-boss-{slime,skeleton}.png`

## 4. Existing Repository Assets (`Tiny Swords` & `Pixel Frog`)
- Reused in-place (`warrior`, `archer`, `lancer`, `Warrior_Attack2.png`, existing `bosses/*`, and gapped `ui/{banners,bars,papers,table,tiny}/*` stitched into contiguous `assets/ui/slices/*.png`).
- **Pending Policy**: Remaining `428` files inside `UI Extra/Tiny Swords (Free Pack)` without an explicit bundled LICENSE remain excluded (`LICENSE_PENDING`) and will NOT be committed or deployed.

## 5. Phase P5 Additions (Path of Legends — 63 Curated Assets, `docs/P5_ASSET_DELTA.json`)
- **Byte Progression Kit (Credit Required — CC-BY-4.0)**
  - **Credit**: `"Byte Progression Kit" by Oğuzhan Girgin, licensed under CC-BY-4.0 — https://www.colorosse.com/assets/2d/ui/byte-progression-kit`
  - **Integrated Files**: 13 Skill Tree node/connector/star/mastery assets under `assets/ui/progression/*.png`.
- **Free Arcane Mage v1.1 (NightCat Works OÜ)**
  - **License**: Free/Commercial Game Usage; raw asset redistribution prohibited; AI-assisted disclosure preserved (`UI Extra/characters/arcane_mage/README.txt`, `AI_DISCLOSURE.txt`).
  - **Integrated Files**: 9 sprite strips (`210x180`, anchor `105,166`) under `assets/units/arcane_mage/*.png` + `assets/ui/avatars/portrait-hero-arcane_mage.png`.
- **PVFX Foundry (`CC0 1.0`)**
  - **Source**: `UI Extra/effects/*/lit/grid/` (`PROVENANCE.json`, `THIRD_PARTY_NOTICES.txt` — CC0 1.0).
  - **Integrated Files**: 12 curated spell/beam/circle/heal/shield/meteor sheets under `assets/effects/vfx/p5/pvfx-*.png`.
- **Mira Forge Free Pixel Projectiles & Bolts v1.0.3 & Free Pixel Spell Effects v1.0.3**
  - **License**: Free for personal & commercial games; raw pack redistribution prohibited; non-AI procedural pixel art.
  - **Integrated Files**: 12 64x64 projectile/impact/spell sheets under `assets/effects/vfx/p5/{proj,impact,spell}-*-64.png`.
- **Questwood Pixel UI v1.2 (`breathinghuman`)**
  - **License**: Permitted game UI integration (`UI Extra/License.txt`; AI-assisted disclosure preserved).
  - **Integrated Files**: 16 curated icon/slot/panel textures under `assets/ui/questwood/{Skills,Buttons,Windows}/*.png`.
- **Phase P5 Backlog Exclusions**: `hero:monk` (`UI Extra/Tiny Swords (Free Pack)/Units/Monk` — `LICENSE_PENDING`) and `hero:rogue` (`UI Extra/spritesheets/rogue.png` — `32x32` top-down style mismatch & no standalone hero license) remain strictly excluded from public runtime.

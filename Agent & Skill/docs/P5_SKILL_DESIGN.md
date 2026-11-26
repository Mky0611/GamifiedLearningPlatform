# LEX RAID — P5 HERO, SKILL TREE, EVOLUTION & ANIMATION DESIGN

## 1. Playable Hero Roster (`4` Verified Classes)
| `heroId` | Class | Role | Animation Set | Status & Unlock |
| :--- | :--- | :--- | :--- | :--- |
| `warrior` | Knight (Sword Master / Guardian / Holy Knight) | Cận chiến cân bằng & Kháng đòn | Tiny Swords Warrior (`idle`, `run`, `attack`, `attack2`, `guard`) | Starter (Always Unlocked) |
| `archer` | Ranger | Xạ thủ tầm xa & Multi-Projectile | Tiny Swords Archer (`idle`, `run`, `attack`, `attack2`, `guard`) | Preserved Starter / Chapter 1 Milestone |
| `lancer` | Vanguard | Đâm thương phá giáp & Phản đòn | Tiny Swords Lancer (`idle`, `run`, `attack`, `guard`) | Preserved Starter / Chapter 2 Milestone |
| `arcane_mage` | Elementalist | Phép thuật từ xa (`Projectile`, `Ground Cast`, `Beam`, `Sky Strike`) | NightCat `Arcane Mage v1.1` (`210x180`, 9 anims, anchor `105,166`) | Unlocks on Chapter/Boss Victory + Vocabulary Milestone (previewable in Training Hall) |

> **Backlog (Not Public):** `monk` (`UI Extra/Tiny Swords/Units/Monk`, `LICENSE_PENDING`), `rogue` (`UI Extra/spritesheets/rogue.png`, `32x32` top-down mismatch & no standalone hero license).

## 2. 10 Distinct Animation Profiles (`P5-C`)
1. `MELEE_SLASH`: Approach → Slash strike → Impact sparks → Recovery → Return
2. `DASH_STRIKE`: Anticipation → Blink dash (`pvfx-blink-dash`) + afterimage → Multi-slash impact → Reposition
3. `PROJECTILE`: Hold stance cast → Spawn flying projectile sprite → Travel lerp → Burst impact + cleanup (Archer & Mage never walk into melee!)
4. `CHANNEL_BEAM`: Magic circle summon → Beam stretch (`pvfx-arcane-beam` / `pvfx-divine-beam`) → Periodic hit ticks → End
5. `GROUND_CAST`: Stance cast → Ground rune ring/trap beneath Boss (`pvfx-rune-trap` / `spell-rune-ring`) → Eruption (`ice_spikes` / `ground-slam`) → Impact
6. `SKY_STRIKE`: Cast aura → Sky telegraph on Boss → Falling strike (`lightning_strike`, `meteor-strike`, `holy-sword-fall`) → Heavy impact
7. `SHIELD_CAST`: Guard stance → Self shield bubble/aura (`pvfx-shield-bubble`) → Persistent ring glow
8. `SELF_HEAL`: Guard/Drink stance → Healing aura (`pvfx-holy-heal` / `heal-frost`) → Green `+HP` popup
9. `MULTI_HIT`: Sequential impact ticks (`x2`/`x3` arrow volley or blade flurry) with per-hit floating numbers from combat result
10. `ULTIMATE`: Summon rune/circle (`pvfx-magic-circle`) → Signature burst (`holy-sword-fall`, `meteor-strike`, `celestial-arrow`, `dragon-lance`) → Recovery

## 3. Curated Working Skills (`22` Active Skills across `4` Heroes)
- **Knight (`warrior` — 3 branches + Earthbreaker + Legendary = 10 skills):**
  - *Sword Master:* `knight_slash` (Tier I Basic `MELEE_SLASH`) → `heavy_slash` (Tier II `MELEE_SLASH` + Burn ember; Lv 1→2→3 evolves DMG & fire burst) → `phantom_dash` (Tier II `DASH_STRIKE` + Blink afterimage) → `blade_storm` (Tier III `MULTI_HIT` 3x hit flurry) + `earthbreaker` (Secondary `GROUND_CAST` shield shatter).
  - *Guardian:* `royal_guard` (Tier I `SHIELD_CAST` 75% block + reflect) → `shield_counter` (Tier II `SHIELD_CAST` 85% block + stun/reflect counter) → `divine_aegis` (Tier III `SHIELD_CAST` team barrier + debuff cleanse).
  - *Holy Knight:* `holy_light` (Tier I `SELF_HEAL` +18..28 HP) → `rune_prison` (Tier II `GROUND_CAST` DMG + Frost/Slow) → `heavens_pillar` (Tier III `CHANNEL_BEAM` divine beam) → **Legendary:** `lexical_judgment` (Tier IV `ULTIMATE` Core-unlocked holy sword fall).
- **Archer (`archer` — 4 unique ranged skills):**
  - `quick_shot` (Tier I `PROJECTILE` 0 MP Steel Arrow) → `piercing_arrow` (Tier II `PROJECTILE` 2 MP armor pierce) → `triple_shot` (Tier III `MULTI_HIT` + `PROJECTILE` 3 fanned arrows) → `celestial_arrow` (Tier IV `ULTIMATE` `PROJECTILE` plasma lance + stun). Also compatible with shared Elemental Spells (`fire_blade` / `frost_seal` / `thunder_strike`).
- **Lancer (`lancer` — 4 unique vanguard skills):**
  - `spear_thrust` (Tier I `MELEE_SLASH` 0 MP shield break) → `impaling_charge` (Tier II `DASH_STRIKE` 2 MP fast spear rush) → `iron_fortress` (Tier III `SHIELD_CAST` 80% guard + armor counter) → `dragon_lance` (Tier IV `ULTIMATE` `CHANNEL_BEAM`/`DASH_STRIKE` piercing energy lance).
- **Arcane Mage (`arcane_mage` — 4 elemental mage skills):**
  - `magic_bolt` (Tier I `PROJECTILE` 0 MP Arcane Orb) → `fireball` (Tier II `PROJECTILE` 2 MP, Lv1 orb → Lv2 Burn → Lv3 layered burst) → `arcane_beam` (Tier III `CHANNEL_BEAM` 3 MP mana-charged laser) → `meteor_fall` (Tier IV `ULTIMATE` `SKY_STRIKE` Meteor Fall).

## 4. Evolution & Loadout Rules
- Every upgradable skill scales Level `1 → 3` with substantive mechanics (+damage/heal, +status turns, or extra hit/burn), higher Mana/Cooldown balance so Tier I `0 MP` basic attacks remain vital between word combos, and active **Loadout = 4 Active Skill Slots + max 1 Ultimate Slot** cleanly rendered on both Desktop & Mobile Battle Hotbars!

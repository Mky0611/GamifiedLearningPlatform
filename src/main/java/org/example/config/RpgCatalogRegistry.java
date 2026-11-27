package org.example.config;

import lombok.Builder;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Authoritative P6 server-side RPG catalog matching raid-registry.js (P5.1 policy).
 * Single source of truth for 4 Heroes, 27 Skills (Lv 1-3), Unlock Rules & Loadout constraints.
 */
@Component
public class RpgCatalogRegistry {

    public static final int MAX_ACTIVE_LOADOUT = 4;
    public static final int MAX_ULTIMATE_LOADOUT = 1;
    public static final Set<String> SHARED_ELEMENTAL_SPELL_IDS = Set.of("fire_blade", "frost_seal", "thunder_strike", "sacred_recovery");

    @Getter
    @Builder
    public static class UnlockRule {
        private String type; // STARTER, STAGE_CLEAR, LEARNING, STAGE_AND_LEARNING
        private int requiredStageOrder;
        private int minTopicWords;
        private int minUniqueReviewedWords;
        private String label;
    }

    @Getter
    @Builder
    public static class HeroSpec {
        private String heroId;
        private String name;
        private String archetype;
        private boolean ranged;
        private int baseHp;
        private int baseMp;
        private int maxMp;
        private UnlockRule unlockRule;
        private List<String> starterSkillIds;
        private List<String> defaultLoadout;
    }

    @Getter
    @Builder
    public static class SkillLevelSpec {
        private int level;
        private int dmg;
        private int manaCost;
        private int cooldown;
        @Builder.Default
        private int hitCount = 1;
        @Builder.Default
        private double shieldMultiplier = 1.0;
        private int healHp;
        private int mitigationPct;
        private int reflectDmg;
        private String applyStatus;
        private int statusTurns;
        private int timeBonusSec;
    }

    @Getter
    @Builder
    public static class SkillSpec {
        private String id;
        private String name;
        private String heroId;
        private Set<String> allowedHeroes;
        private String branch;
        private String deckGroup; // knight, spell, both
        private int tier;
        private boolean ultimate;
        private boolean selfTarget;
        private boolean remoteSpell;
        private boolean requiresCoreClue;
        private int minCombo;
        private String animationProfile;
        private List<String> prerequisites;
        private UnlockRule unlockRule;
        private Map<Integer, UnlockRule> upgradeRequirements;
        private Map<Integer, SkillLevelSpec> levels;

        public SkillLevelSpec levelSpec(int level) {
            int clamped = Math.max(1, Math.min(3, level));
            SkillLevelSpec spec = levels.get(clamped);
            return spec != null ? spec : levels.get(1);
        }
    }

    private final Map<String, HeroSpec> heroes;
    private final Map<String, SkillSpec> skills;
    private final List<SkillSpec> orderedSkills;

    public RpgCatalogRegistry() {
        Map<String, HeroSpec> h = new LinkedHashMap<>();
        h.put("warrior", HeroSpec.builder()
                .heroId("warrior").name("Knight (Warrior)").archetype("MELEE").ranged(false)
                .baseHp(112).baseMp(6).maxMp(8)
                .unlockRule(UnlockRule.builder().type("STARTER").label("Starter").build())
                .starterSkillIds(List.of("knight_slash", "heavy_slash", "royal_guard", "blade_storm", "sacred_recovery", "lexical_judgment"))
                .defaultLoadout(List.of("knight_slash", "heavy_slash", "royal_guard", "sacred_recovery", "lexical_judgment"))
                .build());
        h.put("archer", HeroSpec.builder()
                .heroId("archer").name("Ranger (Archer)").archetype("RANGED").ranged(true)
                .baseHp(96).baseMp(7).maxMp(9)
                .unlockRule(UnlockRule.builder().type("STARTER").label("Starter").build())
                .starterSkillIds(List.of("quick_shot", "piercing_arrow", "triple_shot", "sacred_recovery"))
                .defaultLoadout(List.of("quick_shot", "piercing_arrow", "triple_shot", "sacred_recovery"))
                .build());
        h.put("lancer", HeroSpec.builder()
                .heroId("lancer").name("Vanguard (Lancer)").archetype("MELEE").ranged(false)
                .baseHp(118).baseMp(6).maxMp(8)
                .unlockRule(UnlockRule.builder().type("STARTER").label("Starter").build())
                .starterSkillIds(List.of("spear_thrust", "impaling_charge", "iron_fortress", "sacred_recovery"))
                .defaultLoadout(List.of("spear_thrust", "impaling_charge", "iron_fortress", "sacred_recovery"))
                .build());
        h.put("arcane_mage", HeroSpec.builder()
                .heroId("arcane_mage").name("Arcane Mage").archetype("RANGED").ranged(true)
                .baseHp(94).baseMp(8).maxMp(10)
                .unlockRule(UnlockRule.builder().type("STAGE_AND_LEARNING").requiredStageOrder(1).minTopicWords(1)
                        .label("Hoan thanh Stage 1 va giai >= 1 tu Topic").build())
                .starterSkillIds(List.of("magic_bolt", "fireball", "sacred_recovery"))
                .defaultLoadout(List.of("magic_bolt", "fireball", "arcane_beam", "sacred_recovery", "meteor_fall"))
                .build());
        this.heroes = Collections.unmodifiableMap(h);

        List<SkillSpec> sList = new ArrayList<>();
        // Warrior
        sList.add(skill("knight_slash", "Knight Slash", "warrior", Set.of("warrior"), "Sword Master", "knight", 1, false, false, false, false, 0,
                "MELEE_SLASH", List.of(), starter(), Map.of(),
                Map.of(
                        1, dmg(1, 14, 0, 0),
                        2, dmg(2, 18, 0, 0),
                        3, SkillLevelSpec.builder().level(3).dmg(23).manaCost(0).cooldown(0).shieldMultiplier(1.25).build()
                )));
        sList.add(skill("heavy_slash", "Heavy Slash", "warrior", Set.of("warrior"), "Sword Master", "knight", 2, false, false, false, false, 0,
                "MELEE_SLASH", List.of("knight_slash"), starter(), Map.of(),
                Map.of(
                        1, dmg(1, 22, 2, 2),
                        2, SkillLevelSpec.builder().level(2).dmg(28).manaCost(2).cooldown(2).applyStatus("burn").statusTurns(1).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(35).manaCost(2).cooldown(2).applyStatus("burn").statusTurns(2).build()
                )));
        sList.add(skill("phantom_dash", "Phantom Dash", "warrior", Set.of("warrior"), "Sword Master", "knight", 2, false, false, false, false, 0,
                "DASH_STRIKE", List.of("knight_slash"), stageClear(1), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(20).hitCount(2).manaCost(2).cooldown(2).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(27).hitCount(2).manaCost(2).cooldown(2).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(34).hitCount(2).manaCost(2).cooldown(1).build()
                )));
        sList.add(skill("blade_storm", "Blade Storm", "warrior", Set.of("warrior"), "Sword Master", "knight", 3, false, false, false, false, 2,
                "MULTI_HIT", List.of("heavy_slash"), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(24).hitCount(3).manaCost(3).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(32).hitCount(3).manaCost(3).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(42).hitCount(3).manaCost(3).cooldown(2).build()
                )));
        sList.add(skill("earthbreaker", "Earthbreaker", "warrior", Set.of("warrior"), "Sword Master", "knight", 3, false, false, false, false, 0,
                "GROUND_CAST", List.of("phantom_dash"), stageClear(4), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(24).manaCost(3).cooldown(3).shieldMultiplier(2.2).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(31).manaCost(3).cooldown(3).shieldMultiplier(2.6).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(39).manaCost(3).cooldown(2).shieldMultiplier(3.0).applyStatus("stunOnBreak").build()
                )));
        sList.add(skill("royal_guard", "Royal Guard", "warrior", Set.of("warrior", "lancer"), "Guardian", "both", 1, false, true, false, false, 0,
                "SHIELD_CAST", List.of(), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).mitigationPct(75).reflectDmg(6).manaCost(1).cooldown(2).build(),
                        2, SkillLevelSpec.builder().level(2).mitigationPct(82).reflectDmg(10).manaCost(1).cooldown(2).build(),
                        3, SkillLevelSpec.builder().level(3).mitigationPct(90).reflectDmg(15).manaCost(1).cooldown(1).build()
                )));
        sList.add(skill("shield_counter", "Shield Counter", "warrior", Set.of("warrior"), "Guardian", "knight", 2, false, true, false, false, 0,
                "SHIELD_CAST", List.of("royal_guard"), stageClear(2), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).mitigationPct(85).reflectDmg(12).manaCost(2).cooldown(2).build(),
                        2, SkillLevelSpec.builder().level(2).mitigationPct(88).reflectDmg(18).applyStatus("stun").statusTurns(1).manaCost(2).cooldown(2).build(),
                        3, SkillLevelSpec.builder().level(3).mitigationPct(95).reflectDmg(24).applyStatus("stun").statusTurns(1).manaCost(2).cooldown(2).build()
                )));
        sList.add(skill("divine_aegis", "Divine Aegis", "warrior", Set.of("warrior"), "Guardian", "knight", 3, false, true, false, false, 0,
                "SHIELD_CAST", List.of("shield_counter"),
                UnlockRule.builder().type("LEARNING").requiredStageOrder(2).minUniqueReviewedWords(2).label("Vuot Stage 2 & on tap >= 2 tu duy nhat").build(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).mitigationPct(90).reflectDmg(14).healHp(12).manaCost(3).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).mitigationPct(92).reflectDmg(18).healHp(18).manaCost(3).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).mitigationPct(96).reflectDmg(24).healHp(24).manaCost(3).cooldown(2).build()
                )));
        sList.add(skill("sacred_recovery", "Sacred Recovery", "warrior", Set.of("warrior", "archer", "lancer", "arcane_mage"), "Holy Knight", "both", 1, false, true, false, false, 0,
                "SELF_HEAL", List.of(), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).healHp(20).manaCost(2).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).healHp(28).manaCost(2).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).healHp(38).manaCost(2).cooldown(2).build()
                )));
        sList.add(skill("rune_prison", "Rune Prison", "warrior", Set.of("warrior"), "Holy Knight", "knight", 2, false, false, true, false, 0,
                "GROUND_CAST", List.of("sacred_recovery"), stageClear(3), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(18).applyStatus("frost").statusTurns(2).manaCost(2).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(24).applyStatus("frost").statusTurns(2).timeBonusSec(3).manaCost(2).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(31).applyStatus("frost").statusTurns(3).timeBonusSec(4).manaCost(2).cooldown(2).build()
                )));
        sList.add(skill("heavens_pillar", "Heaven Pillar", "warrior", Set.of("warrior"), "Holy Knight", "knight", 3, false, false, true, false, 0,
                "CHANNEL_BEAM", List.of("rune_prison"), stageClear(5), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(30).hitCount(3).manaCost(3).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(39).hitCount(3).healHp(8).manaCost(3).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(48).hitCount(3).healHp(12).manaCost(3).cooldown(2).build()
                )));
        sList.add(skill("lexical_judgment", "Lexical Judgment", "warrior", Set.of("warrior", "archer", "lancer"), "Legendary Ultimate", "both", 4, true, false, true, true, 0,
                "ULTIMATE", List.of("heavy_slash"), starter(),
                Map.of(
                        2, UnlockRule.builder().type("LEARNING").requiredStageOrder(1).minTopicWords(1).label("Vuot Stage 1 & >= 1 tu Topic").build(),
                        3, UnlockRule.builder().type("LEARNING").requiredStageOrder(2).minUniqueReviewedWords(2).label("Vuot Stage 2 & on >= 2 tu").build()
                ),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(38).manaCost(4).cooldown(4).shieldMultiplier(2.0).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(48).manaCost(4).cooldown(4).shieldMultiplier(2.5).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(60).manaCost(4).cooldown(3).shieldMultiplier(3.0).build()
                )));

        // Archer
        sList.add(skill("quick_shot", "Quick Shot", "archer", Set.of("archer"), "Marksman Path", "knight", 1, false, false, true, false, 0,
                "PROJECTILE", List.of(), starter(), Map.of(),
                Map.of(1, dmg(1, 14, 0, 0), 2, dmg(2, 18, 0, 0), 3, dmg(3, 23, 0, 0))));
        sList.add(skill("piercing_arrow", "Piercing Arrow", "archer", Set.of("archer"), "Marksman Path", "knight", 2, false, false, true, false, 0,
                "PROJECTILE", List.of("quick_shot"), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(22).manaCost(2).cooldown(2).shieldMultiplier(1.8).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(28).manaCost(2).cooldown(2).shieldMultiplier(2.2).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(35).manaCost(2).cooldown(1).shieldMultiplier(2.6).build()
                )));
        sList.add(skill("triple_shot", "Triple Shot", "archer", Set.of("archer"), "Marksman Path", "knight", 3, false, false, true, false, 0,
                "MULTI_HIT", List.of("piercing_arrow"), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(27).hitCount(3).manaCost(3).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(36).hitCount(3).manaCost(3).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(45).hitCount(3).manaCost(3).cooldown(2).build()
                )));
        sList.add(skill("celestial_arrow", "Celestial Arrow", "archer", Set.of("archer"), "Marksman Path", "both", 4, true, false, true, false, 0,
                "ULTIMATE", List.of("triple_shot"),
                UnlockRule.builder().type("LEARNING").requiredStageOrder(2).minTopicWords(2).label("Vuot Stage 2 & >= 2 tu Topic").build(),
                Map.of(
                        2, UnlockRule.builder().type("LEARNING").requiredStageOrder(2).minTopicWords(3).label("Dat >= 3 tu Topic").build(),
                        3, UnlockRule.builder().type("LEARNING").requiredStageOrder(3).minUniqueReviewedWords(2).label("Vuot Stage 3 & on >= 2 tu").build()
                ),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(40).applyStatus("stunOnBreak").manaCost(4).cooldown(4).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(50).applyStatus("stunOnBreak").manaCost(4).cooldown(4).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(62).applyStatus("stun").statusTurns(1).manaCost(4).cooldown(3).build()
                )));

        // Lancer
        sList.add(skill("spear_thrust", "Spear Thrust", "lancer", Set.of("lancer"), "Vanguard Path", "knight", 1, false, false, false, false, 0,
                "MELEE_SLASH", List.of(), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(15).shieldMultiplier(1.4).manaCost(0).cooldown(0).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(19).shieldMultiplier(1.6).manaCost(0).cooldown(0).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(24).shieldMultiplier(1.9).manaCost(0).cooldown(0).build()
                )));
        sList.add(skill("impaling_charge", "Impaling Charge", "lancer", Set.of("lancer"), "Vanguard Path", "knight", 2, false, false, false, false, 0,
                "DASH_STRIKE", List.of("spear_thrust"), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(24).hitCount(2).manaCost(2).cooldown(2).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(31).hitCount(2).manaCost(2).cooldown(2).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(38).hitCount(2).manaCost(2).cooldown(1).build()
                )));
        sList.add(skill("iron_fortress", "Iron Fortress", "lancer", Set.of("lancer"), "Vanguard Path", "both", 3, false, true, false, false, 0,
                "SHIELD_CAST", List.of("impaling_charge"), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).mitigationPct(82).reflectDmg(10).manaCost(2).cooldown(2).build(),
                        2, SkillLevelSpec.builder().level(2).mitigationPct(88).reflectDmg(15).manaCost(2).cooldown(2).build(),
                        3, SkillLevelSpec.builder().level(3).mitigationPct(94).reflectDmg(22).manaCost(2).cooldown(1).build()
                )));
        sList.add(skill("dragon_lance", "Dragon Lance", "lancer", Set.of("lancer"), "Vanguard Path", "both", 4, true, false, true, false, 0,
                "ULTIMATE", List.of("iron_fortress"),
                UnlockRule.builder().type("LEARNING").requiredStageOrder(3).minTopicWords(2).label("Vuot Stage 3 & >= 2 tu Topic").build(),
                Map.of(
                        2, UnlockRule.builder().type("LEARNING").requiredStageOrder(3).minTopicWords(3).label("Dat >= 3 tu Topic").build(),
                        3, UnlockRule.builder().type("LEARNING").requiredStageOrder(4).minUniqueReviewedWords(2).label("Vuot Stage 4 & on >= 2 tu").build()
                ),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(40).hitCount(3).shieldMultiplier(2.2).manaCost(4).cooldown(4).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(50).hitCount(3).shieldMultiplier(2.6).manaCost(4).cooldown(4).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(62).hitCount(3).shieldMultiplier(3.0).manaCost(4).cooldown(3).build()
                )));

        // Arcane Mage
        sList.add(skill("magic_bolt", "Magic Bolt", "arcane_mage", Set.of("arcane_mage"), "Elementalist Path", "knight", 1, false, false, true, false, 0,
                "PROJECTILE", List.of(), starter(), Map.of(),
                Map.of(1, dmg(1, 15, 0, 0), 2, dmg(2, 19, 0, 0), 3, dmg(3, 24, 0, 0))));
        sList.add(skill("fireball", "Fireball", "arcane_mage", Set.of("arcane_mage"), "Elementalist Path", "spell", 2, false, false, true, false, 0,
                "PROJECTILE", List.of("magic_bolt"), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(22).manaCost(2).cooldown(2).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(28).applyStatus("burn").statusTurns(2).manaCost(2).cooldown(2).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(36).applyStatus("burn").statusTurns(3).manaCost(2).cooldown(1).build()
                )));
        sList.add(skill("arcane_beam", "Arcane Beam", "arcane_mage", Set.of("arcane_mage"), "Elementalist Path", "spell", 3, false, false, true, false, 0,
                "CHANNEL_BEAM", List.of("fireball"),
                UnlockRule.builder().type("LEARNING").requiredStageOrder(1).label("Mo khoa Arcane Mage (Stage 1) + Fireball").build(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(30).hitCount(3).manaCost(3).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(39).hitCount(3).manaCost(3).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(48).hitCount(3).manaCost(3).cooldown(2).build()
                )));
        sList.add(skill("meteor_fall", "Meteor Fall", "arcane_mage", Set.of("arcane_mage"), "Elementalist Path", "both", 4, true, false, true, false, 0,
                "ULTIMATE", List.of("arcane_beam"),
                UnlockRule.builder().type("LEARNING").requiredStageOrder(2).minTopicWords(2).label("Vuot Stage 2 & >= 2 tu Topic").build(),
                Map.of(
                        2, UnlockRule.builder().type("LEARNING").requiredStageOrder(2).minTopicWords(3).label("Dat >= 3 tu Topic").build(),
                        3, UnlockRule.builder().type("LEARNING").requiredStageOrder(3).minUniqueReviewedWords(2).label("Vuot Stage 3 & on >= 2 tu").build()
                ),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(44).applyStatus("burn").statusTurns(2).manaCost(4).cooldown(4).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(54).applyStatus("burn").statusTurns(3).manaCost(4).cooldown(4).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(68).applyStatus("burn").statusTurns(3).shieldMultiplier(2.0).manaCost(4).cooldown(3).build()
                )));

        // Shared Elemental Spells
        sList.add(skill("fire_blade", "Fire Blade", "shared", Set.of("warrior", "archer", "lancer", "arcane_mage"), "Elemental Spellbook", "spell", 2, false, false, false, false, 0,
                "MELEE_SLASH", List.of(), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(16).applyStatus("burn").statusTurns(2).manaCost(2).cooldown(2).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(22).applyStatus("burn").statusTurns(2).manaCost(2).cooldown(2).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(29).applyStatus("burn").statusTurns(3).manaCost(2).cooldown(1).build()
                )));
        sList.add(skill("frost_seal", "Frost Seal", "shared", Set.of("warrior", "archer", "lancer", "arcane_mage"), "Elemental Spellbook", "spell", 2, false, false, true, false, 0,
                "GROUND_CAST", List.of(), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(14).applyStatus("frost").statusTurns(2).timeBonusSec(4).manaCost(2).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(20).applyStatus("frost").statusTurns(2).timeBonusSec(5).manaCost(2).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(27).applyStatus("frost").statusTurns(3).timeBonusSec(6).manaCost(2).cooldown(2).build()
                )));
        sList.add(skill("thunder_strike", "Thunder Strike", "shared", Set.of("warrior", "archer", "lancer", "arcane_mage"), "Elemental Spellbook", "spell", 3, false, false, true, false, 0,
                "SKY_STRIKE", List.of(), starter(), Map.of(),
                Map.of(
                        1, SkillLevelSpec.builder().level(1).dmg(18).shieldMultiplier(2.0).applyStatus("stunOnBreak").manaCost(3).cooldown(3).build(),
                        2, SkillLevelSpec.builder().level(2).dmg(25).shieldMultiplier(2.4).applyStatus("stunOnBreak").manaCost(3).cooldown(3).build(),
                        3, SkillLevelSpec.builder().level(3).dmg(33).shieldMultiplier(2.8).applyStatus("stunOnBreak").manaCost(3).cooldown(2).build()
                )));

        Map<String, SkillSpec> sMap = new LinkedHashMap<>();
        for (SkillSpec spec : sList) {
            sMap.put(spec.getId(), spec);
        }
        this.orderedSkills = Collections.unmodifiableList(sList);
        this.skills = Collections.unmodifiableMap(sMap);
    }

    private static UnlockRule starter() {
        return UnlockRule.builder().type("STARTER").label("Starter").build();
    }

    private static UnlockRule stageClear(int stageOrder) {
        return UnlockRule.builder().type("STAGE_CLEAR").requiredStageOrder(stageOrder).label("Danh bai Boss Stage " + stageOrder).build();
    }

    private static SkillLevelSpec dmg(int lv, int dmg, int mp, int cd) {
        return SkillLevelSpec.builder().level(lv).dmg(dmg).manaCost(mp).cooldown(cd).build();
    }

    private static SkillSpec skill(
            String id, String name, String heroId, Set<String> allowedHeroes, String branch, String deckGroup,
            int tier, boolean ultimate, boolean selfTarget, boolean remoteSpell, boolean requiresCoreClue, int minCombo,
            String animationProfile, List<String> prerequisites, UnlockRule unlockRule,
            Map<Integer, UnlockRule> upgradeRequirements, Map<Integer, SkillLevelSpec> levels
    ) {
        return SkillSpec.builder()
                .id(id).name(name).heroId(heroId).allowedHeroes(allowedHeroes).branch(branch).deckGroup(deckGroup)
                .tier(tier).ultimate(ultimate).selfTarget(selfTarget).remoteSpell(remoteSpell)
                .requiresCoreClue(requiresCoreClue).minCombo(minCombo).animationProfile(animationProfile)
                .prerequisites(prerequisites).unlockRule(unlockRule)
                .upgradeRequirements(upgradeRequirements).levels(levels)
                .build();
    }

    public HeroSpec getHero(String heroCode) {
        if (heroCode == null) return null;
        return heroes.get(heroCode.trim().toLowerCase(Locale.ROOT));
    }

    public Collection<HeroSpec> getAllHeroes() {
        return heroes.values();
    }

    public SkillSpec getSkill(String skillCode) {
        if (skillCode == null) return null;
        return skills.get(skillCode.trim().toLowerCase(Locale.ROOT));
    }

    public List<SkillSpec> getAllSkills() {
        return orderedSkills;
    }

    /**
     * Split server-determined multi-hit damage into integer ticks summing to totalDamage.
     */
    public List<Integer> splitMultiHitDamages(int totalDamage, int hitCount) {
        int safeHits = Math.max(1, hitCount);
        int safeTotal = Math.max(0, totalDamage);
        int base = safeTotal / safeHits;
        int rem = safeTotal % safeHits;
        List<Integer> ticks = new ArrayList<>(safeHits);
        for (int i = 0; i < safeHits; i++) {
            ticks.add(base + (i < rem ? 1 : 0));
        }
        return ticks;
    }
}

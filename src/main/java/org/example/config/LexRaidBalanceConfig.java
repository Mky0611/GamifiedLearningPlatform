package org.example.config;

import org.springframework.stereotype.Component;

/**
 * Centralized gameplay balance configuration for Lex Raid (Phase P4-B.3).
 * Keeps combat formulas, mana caps, and chapter pacing consistent in one place.
 */
@Component
public class LexRaidBalanceConfig {

    public static final int MIN_WORD_LENGTH = 3;
    public static final int ABSOLUTE_MIN_WHITELIST_LENGTH = 2;
    public static final int MAX_WORD_LENGTH = 12;
    public static final int DAMAGE_PER_CHAR = 5;
    public static final int DAMAGE_PER_COMBO = 2;
    public static final int TOPIC_BONUS_PERCENT = 30;
    public static final int LONG_WORD_THRESHOLD = 5;

    public static final int MIN_MANA_GAIN = 1;
    public static final int MAX_MANA_GAIN = 6;
    public static final int MAX_MANA_CAP = 6;
    public static final int TOPIC_EXTRA_MANA = 1;
    public static final int CORE_SOLVE_MANA = 2;

    public int computeBaseDamage(int wordLength, int comboAfter) {
        if (wordLength < ABSOLUTE_MIN_WHITELIST_LENGTH) {
            return 0;
        }
        return (wordLength * DAMAGE_PER_CHAR) + (Math.max(0, comboAfter) * DAMAGE_PER_COMBO);
    }

    public int computeTotalDamage(int wordLength, int comboAfter, boolean isTopicWord) {
        int base = computeBaseDamage(wordLength, comboAfter);
        if (!isTopicWord) {
            return base;
        }
        return Math.round(base * (1.0f + (TOPIC_BONUS_PERCENT / 100.0f)));
    }

    public int computeManaGain(int wordLength, boolean isTopicWord, boolean isCoreWord) {
        if (wordLength < ABSOLUTE_MIN_WHITELIST_LENGTH) {
            return 0;
        }
        int baseMana = Math.max(MIN_MANA_GAIN, Math.min(MAX_MANA_GAIN, wordLength / 2));
        if (isTopicWord) {
            baseMana += TOPIC_EXTRA_MANA;
        }
        if (isCoreWord) {
            baseMana += CORE_SOLVE_MANA;
        }
        return Math.min(MAX_MANA_CAP, baseMana);
    }

    public int applyManaGainWithCap(int currentMana, int gain) {
        return Math.min(MAX_MANA_CAP, Math.max(0, currentMana) + Math.max(0, gain));
    }

    public int resolveWordBaseScore(int wordLength, boolean isTopicWord) {
        int base = Math.max(10, wordLength * 8);
        return isTopicWord ? Math.round(base * 1.25f) : base;
    }
}

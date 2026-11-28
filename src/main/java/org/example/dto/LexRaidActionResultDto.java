package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LexRaidActionResultDto {
    private boolean accepted;
    private String actionType;
    private String submittedWord;
    private String normalizedWord;
    private Long vocabularyWordId;
    private Integer damageDealt;
    private Integer shieldDamage;
    private Integer manaGain;
    private Integer scoreGain;
    private Integer comboAfter;
    private Integer bossHpRemaining;
    private Integer bossShieldRemaining;
    private Integer rageValue;
    private String raidStatus;
    private String resultCode;
    private String rejectionReason;
    private String clueProgressJson;
    private List<String> unlockedClues;
    private Integer activeCoreIndex;
    private Long activeStageCoreWordId;
    private String activeCoreWord;
    private String activeClueText;
    private boolean coreSolved;
    private String wordCategory;
    private boolean topicBonusApplied;
    private Integer bonusDamage;
    private Integer manaAfter;
    private boolean hasMeaningCard;
    private List<LexRaidCoreWordDto> coreWords;
    private List<List<String>> board;
    private LexRaidSessionDto session;
    private Integer playerHp;
    private Integer playerMaxHp;
    private Integer waveIndex;
    private Integer totalWaves;
    private List<Integer> hitDamages;
    private String statusApplied;
    private java.util.Map<String, Integer> skillCooldowns;
    private String animationProfile;
    private Integer skillLevel;
    private Integer healHp;
    private String currentEnemyCode;
    private String currentEnemyName;
    private boolean replayed;
}

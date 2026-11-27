package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LexRaidSessionDto {
    private Long raidSessionId;
    private Long gameSessionId;
    private Long stageId;
    private Long userId;
    private String status;
    private String resultCode;
    private Integer currentRound;
    private Integer bossHpRemaining;
    private Integer bossShieldRemaining;
    private Integer rageValue;
    private Integer comboCount;
    private Integer manaValue;
    private Integer totalScore;
    private String clueProgressJson;
    private Integer xpEarned;
    private Integer coinsEarned;
    private Integer userLevelCurrent;
    private Integer userXpTotal;
    private Integer userCoins;
    private Boolean levelUpOccurred;
    private Integer levelsGained;
    private Integer starsEarned;
    private Integer playerHp;
    private Integer playerMaxHp;
    private Integer waveIndex;
    private Integer totalWaves;
    private String playMode;
    private String heroCode;
    private java.util.List<String> grantedMilestones;
}

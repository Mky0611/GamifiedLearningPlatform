package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerProfileDto {
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String unitCode;
    private String avatarKey;
    private Integer levelCurrent;
    private Integer xpTotal;
    private Integer xpCurrentInLevel;
    private Integer xpNeededForNextLevel;
    private Double levelProgressPercent;
    private Integer coins;
    private Integer streakDays;
    private Integer stagesCleared;
    private Integer totalBattles;
    private Integer bestScore;
}

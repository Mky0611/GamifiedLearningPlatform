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
}

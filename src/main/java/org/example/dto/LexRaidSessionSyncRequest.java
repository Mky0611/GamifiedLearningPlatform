package org.example.dto;

import lombok.Data;

@Data
public class LexRaidSessionSyncRequest {
    private Integer currentRound;
    private Integer bossHpRemaining;
    private Integer bossShieldRemaining;
    private Integer rageValue;
    private Integer comboCount;
    private Integer manaValue;
    private Integer totalScore;
    private String boardJson;
    private String selectedPathJson;
    private String clueProgressJson;
    private String status;
    private String resultCode;
    private Integer durationSec;
}

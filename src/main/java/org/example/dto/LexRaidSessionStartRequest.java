package org.example.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LexRaidSessionStartRequest {
    @NotNull
    private Long userId;
    @NotNull
    private Long stageId;
    private String seed;
    private String playMode; // CAMPAIGN (default) or PRACTICE
    private String heroCode; // warrior (default), archer, lancer, arcane_mage
}

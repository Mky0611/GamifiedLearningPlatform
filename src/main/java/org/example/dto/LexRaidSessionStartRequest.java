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
}

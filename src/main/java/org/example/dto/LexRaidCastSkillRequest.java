package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LexRaidCastSkillRequest {
    @NotNull
    private Long userId;
    @NotBlank
    private String skillCode;
    @NotBlank
    private String actionId;
}

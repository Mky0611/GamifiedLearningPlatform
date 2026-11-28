package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LexRaidCastSkillRequest {
    private Long userId;
    @NotBlank
    private String skillCode;
    @NotBlank
    private String actionId;
}

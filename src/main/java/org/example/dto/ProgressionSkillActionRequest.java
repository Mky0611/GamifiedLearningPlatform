package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProgressionSkillActionRequest {
    @NotNull
    private Long userId;
    @NotBlank
    private String heroCode;
    @NotBlank
    private String skillCode;
}

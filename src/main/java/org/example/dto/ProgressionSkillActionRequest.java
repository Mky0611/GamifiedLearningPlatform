package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProgressionSkillActionRequest {
    private Long userId;
    @NotBlank
    private String heroCode;
    @NotBlank
    private String skillCode;
}

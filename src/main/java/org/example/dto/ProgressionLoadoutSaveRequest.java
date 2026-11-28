package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ProgressionLoadoutSaveRequest {
    private Long userId;
    @NotBlank
    private String heroCode;
    @NotNull
    private List<String> activeSkillCodes;
    private String ultimateSkillCode;
}

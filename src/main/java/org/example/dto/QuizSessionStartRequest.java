package org.example.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizSessionStartRequest {
    @NotNull
    private Long userId;
    @NotNull
    private Long questionSetId;
}

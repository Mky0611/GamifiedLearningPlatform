package org.example.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizSessionStartRequest {
    private Long userId;
    @NotNull
    private Long questionSetId;
}

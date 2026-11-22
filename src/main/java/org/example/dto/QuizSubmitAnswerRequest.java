package org.example.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizSubmitAnswerRequest {
    @NotNull
    private Long questionId;
    private Long selectedAnswerId;
    private String answerTextRaw;
    private Integer responseTimeMs;
}

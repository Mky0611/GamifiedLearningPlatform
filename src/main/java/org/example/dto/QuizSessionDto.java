package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSessionDto {
    private Long gameSessionId;
    private Long questionSetId;
    private Long userId;
    private String status;
    private Integer scoreTotal;
    private Integer xpEarned;
    private Integer totalQuestions;
    private Integer answeredCount;
    private List<QuizQuestionDto> questions;
}

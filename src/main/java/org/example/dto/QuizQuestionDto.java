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
public class QuizQuestionDto {
    private Long questionId;
    private String questionType;
    private String questionText;
    private String difficulty;
    private Integer pointsBase;
    private Integer orderNo;
    private List<QuizAnswerOptionDto> options;
}

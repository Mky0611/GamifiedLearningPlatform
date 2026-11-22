package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSetDto {
    private Long questionSetId;
    private Long contentPackageId;
    private String title;
    private String description;
    private Integer totalQuestions;
    private Integer timeLimitSec;
    private String status;
}

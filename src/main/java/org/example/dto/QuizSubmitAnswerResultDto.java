package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSubmitAnswerResultDto {
    private boolean correct;
    private Long questionId;
    private Long selectedAnswerId;
    private Long correctAnswerId;
    private Integer pointsEarned;
    private Integer updatedScore;
    private Integer answeredCount;
    private Integer totalQuestions;
    private String sessionStatus;
    private Integer xpEarned;
    private Integer coinsEarned;
    private Boolean levelUpOccurred;
    private Integer newLevel;
    private Integer newXpTotal;
    private Integer newCoins;
}

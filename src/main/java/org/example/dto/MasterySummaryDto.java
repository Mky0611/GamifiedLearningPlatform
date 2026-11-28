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
public class MasterySummaryDto {
    private Long userId;
    private Integer totalTrackedWords;
    private Integer uniqueReviewedCount;
    private Integer masteredCount;
    private Integer topicWordsSolved;
    private List<MasteryWordItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MasteryWordItemDto {
        private Long wordId;
        private String wordText;
        private String meaningVi;
        private String meaningEn;
        private String masteryState;
        private Integer timesFound;
        private Integer timesGuessed;
        private Integer timesReviewed;
        private Integer timesAnsweredCorrect;
        private Integer masteryScore;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecallChallengeDto {
        private String challengeId;
        private Long wordId;
        private String promptMeaning;
        private String partOfSpeech;
        private List<String> options;
        private String expiresAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecallAttemptResultDto {
        private Long userId;
        private Long wordId;
        private boolean correct;
        private boolean newUniqueReview;
        private String masteryState;
        private Integer uniqueReviewedCount;
        private Integer masteredCount;
        private String message;
    }
}

package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProgressionSnapshotDto {
    private Long userId;
    private Integer skillPoints;
    private String selectedHeroCode;
    private List<String> unlockedHeroes;
    private Map<String, Integer> skillLevels;
    private Map<String, HeroLoadoutSnapshotDto> loadouts;
    private List<StageProgressSummaryDto> chapters;
    private List<String> rewardedMilestones;
    private Integer topicWordsSolved;
    private Integer uniqueReviewedWordsCount;
    private Integer masteredWordsCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HeroLoadoutSnapshotDto {
        private List<String> activeSkillCodes;
        private String ultimateSkillCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageProgressSummaryDto {
        private Long stageId;
        private Integer chapterNo;
        private Integer stageNo;
        private String name;
        private String status;
        private Integer clears;
        private Integer bestScore;
        private Integer stars;
    }
}

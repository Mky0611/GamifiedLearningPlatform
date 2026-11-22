package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageCardDto {
    private Long stageId;
    private String code;
    private Integer chapterNo;
    private Integer stageNo;
    private String name;
    private String difficulty;
    private Integer boardRows;
    private Integer boardCols;
    private Integer turnLimit;
    private Integer timePerRoundSec;
    private String description;
    private BossSummaryDto boss;
}

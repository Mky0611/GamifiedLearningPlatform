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
public class HomeOverviewDto {
    private List<GameCardDto> featuredGames;
    private List<UserSummaryDto> leaderboardPreview;
    private StageCardDto recommendedStage;
}

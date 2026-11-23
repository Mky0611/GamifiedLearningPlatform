package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRewardResultDto {
    private Integer oldLevel;
    private Integer newLevel;
    private Boolean levelUpOccurred;
    private Integer levelsGained;
    private Integer xpEarned;
    private Integer coinsEarned;
    private Integer newXpTotal;
    private Integer newCoins;

    public boolean isLevelUpOccurred() {
        return Boolean.TRUE.equals(levelUpOccurred);
    }
}

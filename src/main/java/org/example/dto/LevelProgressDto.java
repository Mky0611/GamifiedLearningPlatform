package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LevelProgressDto {
    private Integer level;
    private Integer xpTotal;
    private Integer xpBase;
    private Integer xpNext;
    private Integer xpCurrentInLevel;
    private Integer xpNeededForNextLevel;
    private Double progressPercent;
}

package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BossSummaryDto {
    private Long bossId;
    private String code;
    private String name;
    private String avatarUrl;
    private Integer baseHp;
    private Integer baseShield;
    private Integer rageThreshold;
    private String elementType;
}

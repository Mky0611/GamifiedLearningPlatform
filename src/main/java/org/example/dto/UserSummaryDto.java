package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDto {
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private Integer levelCurrent;
    private Integer xpTotal;
    private Integer coins;
}

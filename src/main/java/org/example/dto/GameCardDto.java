package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameCardDto {
    private Long gameId;
    private String code;
    private String name;
    private String gameType;
    private String description;
    private String thumbnailUrl;
    private String status;
}

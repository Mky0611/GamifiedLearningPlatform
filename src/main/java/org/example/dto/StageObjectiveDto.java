package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageObjectiveDto {
    private String objectiveType;
    private String description;
    private Integer targetValue;
    private Integer sortOrder;
}

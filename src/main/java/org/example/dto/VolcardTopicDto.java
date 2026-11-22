package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolcardTopicDto {
    private Long topicId;
    private String code;
    private String name;
    private String description;
    private Long totalSets;
    private Long totalWords;
}

package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolcardSetDto {
    private Long vocabularySetId;
    private String title;
    private String difficulty;
    private Integer totalWords;
    private String topicName;
    private String languageCode;
    private String description;
}

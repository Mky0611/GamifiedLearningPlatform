package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyWordDto {
    private Long wordId;
    private String wordText;
    private String normalizedText;
    private String partOfSpeech;
    private String meaningVi;
    private String meaningEn;
    private String levelCefr;
    private String itDomain;
    private String itTier;
    private Boolean boardEligible;
}

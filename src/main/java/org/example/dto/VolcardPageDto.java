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
public class VolcardPageDto {
    private Long vocabularySetId;
    private String title;
    private Integer offset;
    private Integer limit;
    private Long total;
    private List<VocabularyWordDto> cards;
}

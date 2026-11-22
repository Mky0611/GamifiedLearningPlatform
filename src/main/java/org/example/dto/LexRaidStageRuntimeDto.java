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
public class LexRaidStageRuntimeDto {
    private StageCardDto stage;
    private String topicCode;
    private String topicName;
    private String vocabularySetTitle;
    private Long stageCoreWordId;
    private String coreWord;
    private String clueText;
    private Integer activeCoreIndex;
    private Long activeStageCoreWordId;
    private String activeCoreWord;
    private String activeClueText;
    private List<LexRaidCoreWordDto> coreWords;
    private List<StageObjectiveDto> objectives;
    private List<String> topicWords;
    private List<VocabularyWordDto> vocabulary;
    private List<List<String>> board;
}

package org.example.service;

import org.example.dto.VolcardPageDto;
import org.example.dto.VolcardSetDto;
import org.example.dto.VolcardTopicDto;

import java.util.List;

public interface VolcardService {
    List<VolcardTopicDto> getTopics();
    List<VolcardSetDto> getSetsByTopic(Long topicId);
    VolcardPageDto getCards(Long vocabularySetId, Integer offset, Integer limit);
    VolcardPageDto getCards(Long vocabularySetId, Integer offset, Integer limit, String cefrLevel, String search);
}

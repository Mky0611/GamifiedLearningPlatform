package org.example.service;

import lombok.RequiredArgsConstructor;
import org.example.dto.VolcardPageDto;
import org.example.dto.VolcardSetDto;
import org.example.dto.VolcardTopicDto;
import org.example.dto.VocabularyWordDto;
import org.example.entity.VocabularySet;
import org.example.entity.VocabularyTopic;
import org.example.entity.VocabularyWord;
import org.example.repository.VocabularySetRepository;
import org.example.repository.VocabularyTopicRepository;
import org.example.repository.VocabularyWordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VolcardServiceImpl implements VolcardService {

    private final VocabularyTopicRepository vocabularyTopicRepository;
    private final VocabularySetRepository vocabularySetRepository;
    private final VocabularyWordRepository vocabularyWordRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VolcardTopicDto> getTopics() {
        return vocabularyTopicRepository.findAll().stream()
                .sorted(Comparator.comparing(VocabularyTopic::getName, String.CASE_INSENSITIVE_ORDER))
                .map(topic -> VolcardTopicDto.builder()
                        .topicId(topic.getTopicId())
                        .code(topic.getCode())
                        .name(topic.getName())
                        .description(topic.getDescription())
                        .totalSets((long) vocabularySetRepository.findByTopicTopicIdOrderByTitleAsc(topic.getTopicId()).size())
                        .totalWords(vocabularyWordRepository.countByVocabularySetTopicTopicId(topic.getTopicId()))
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VolcardSetDto> getSetsByTopic(Long topicId) {
        return vocabularySetRepository.findByTopicTopicIdOrderByTitleAsc(topicId).stream()
                .map(vs -> VolcardSetDto.builder()
                        .vocabularySetId(vs.getVocabularySetId())
                        .title(vs.getTitle())
                        .difficulty(vs.getDifficulty())
                        .totalWords(vs.getTotalWords())
                        .topicName(vs.getTopic() != null ? vs.getTopic().getName() : null)
                        .languageCode(vs.getLanguageCode() != null ? vs.getLanguageCode() : (vs.getContentPackage() != null ? vs.getContentPackage().getLanguageCode() : null))
                        .description(vs.getDescription())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public VolcardPageDto getCards(Long vocabularySetId, Integer offset, Integer limit) {
        VocabularySet set = vocabularySetRepository.findById(vocabularySetId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay vocabulary set voi id = " + vocabularySetId));

        int safeOffset = offset == null || offset < 0 ? 0 : offset;
        int safeLimit = limit == null || limit <= 0 ? 20 : Math.min(limit, 100);

        List<VocabularyWord> allWords = vocabularyWordRepository.findByVocabularySetVocabularySetIdOrderByWordTextAsc(vocabularySetId);
        List<VocabularyWordDto> cards = allWords.stream()
                .skip(safeOffset)
                .limit(safeLimit)
                .map(this::toDto)
                .toList();

        return VolcardPageDto.builder()
                .vocabularySetId(set.getVocabularySetId())
                .title(set.getTitle())
                .offset(safeOffset)
                .limit(safeLimit)
                .total((long) allWords.size())
                .cards(cards)
                .build();
    }

    private VocabularyWordDto toDto(VocabularyWord word) {
        return VocabularyWordDto.builder()
                .wordId(word.getWordId())
                .wordText(word.getWordText())
                .partOfSpeech(word.getPartOfSpeech())
                .meaningVi(word.getMeaningVi())
                .meaningEn(word.getMeaningEn())
                .levelCefr(word.getLevelCefr())
                .build();
    }
}

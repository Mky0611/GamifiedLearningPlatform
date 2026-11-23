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
import java.util.Locale;

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
        return getCards(vocabularySetId, offset, limit, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public VolcardPageDto getCards(Long vocabularySetId, Integer offset, Integer limit, String cefrLevel, String search) {
        VocabularySet set = vocabularySetRepository.findById(vocabularySetId)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay vocabulary set voi id = " + vocabularySetId));

        int safeOffset = offset == null || offset < 0 ? 0 : offset;
        int safeLimit = limit == null || limit <= 0 ? 20 : Math.min(limit, 100);

        List<VocabularyWord> allWords = vocabularyWordRepository.findByVocabularySetVocabularySetIdOrderByWordTextAsc(vocabularySetId);
        List<VocabularyWord> filteredWords = allWords.stream()
                .filter(word -> matchesCefr(word, cefrLevel))
                .filter(word -> matchesSearch(word, search))
                .toList();

        List<VocabularyWordDto> cards = filteredWords.stream()
                .skip(safeOffset)
                .limit(safeLimit)
                .map(word -> toDto(word, set))
                .toList();

        return VolcardPageDto.builder()
                .vocabularySetId(set.getVocabularySetId())
                .title(set.getTitle())
                .offset(safeOffset)
                .limit(safeLimit)
                .total((long) filteredWords.size())
                .cards(cards)
                .build();
    }

    private boolean matchesCefr(VocabularyWord word, String cefrFilter) {
        if (cefrFilter == null || cefrFilter.isBlank() || "ALL".equalsIgnoreCase(cefrFilter.trim())) {
            return true;
        }
        String trimmed = cefrFilter.trim().toUpperCase(Locale.ROOT);
        if ("UNKNOWN".equals(trimmed) || "UNVERIFIED".equals(trimmed) || "NULL".equals(trimmed)) {
            return word.getLevelCefr() == null || word.getLevelCefr().isBlank();
        }
        return word.getLevelCefr() != null && word.getLevelCefr().equalsIgnoreCase(trimmed);
    }

    private boolean matchesSearch(VocabularyWord word, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String q = search.trim().toLowerCase(Locale.ROOT);
        if (word.getWordText() != null && word.getWordText().toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        if (word.getMeaningVi() != null && word.getMeaningVi().toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        return word.getMeaningEn() != null && word.getMeaningEn().toLowerCase(Locale.ROOT).contains(q);
    }

    private VocabularyWordDto toDto(VocabularyWord word, VocabularySet set) {
        String pos = standardizePos(word.getPartOfSpeech());
        String topicCode = (set != null && set.getTopic() != null) ? set.getTopic().getCode() : "GENERAL";
        String tier = mapTier(set != null ? set.getDifficulty() : null);
        boolean eligible = isBoardEligible(word.getWordText());

        return VocabularyWordDto.builder()
                .wordId(word.getWordId())
                .wordText(word.getWordText())
                .normalizedText(word.getNormalizedText())
                .partOfSpeech(pos)
                .meaningVi(word.getMeaningVi())
                .meaningEn(word.getMeaningEn() != null && !word.getMeaningEn().isBlank() ? word.getMeaningEn() : null)
                .levelCefr(word.getLevelCefr())
                .itDomain(topicCode)
                .itTier(tier)
                .boardEligible(eligible)
                .build();
    }

    private String standardizePos(String rawPos) {
        if (rawPos == null || rawPos.isBlank()) return "noun";
        String cleaned = rawPos.trim().toLowerCase(Locale.ROOT);
        return switch (cleaned) {
            case "n.", "n", "noun" -> "noun";
            case "v.", "v", "verb" -> "verb";
            case "adj.", "adj", "adjective" -> "adjective";
            case "adv.", "adv", "adverb" -> "adverb";
            case "prep.", "prep", "preposition" -> "preposition";
            case "conj.", "conj", "conjunction" -> "conjunction";
            case "phr.", "phrase", "idiom" -> "phrase";
            default -> cleaned;
        };
    }

    private String mapTier(String difficulty) {
        if (difficulty == null) return "Foundation";
        return switch (difficulty.trim().toUpperCase(Locale.ROOT)) {
            case "EXPERT", "SPECIALIST" -> "Specialist";
            case "HARD", "ADVANCED" -> "Advanced";
            case "MEDIUM", "INTERMEDIATE", "PRACTITIONER" -> "Practitioner";
            default -> "Foundation";
        };
    }

    private boolean isBoardEligible(String wordText) {
        if (wordText == null) return false;
        String trimmed = wordText.trim();
        if (trimmed.length() < 3 || trimmed.length() > 10) return false;
        return trimmed.matches("^[A-Za-z]+$");
    }

    private VocabularyWordDto toDto(VocabularyWord word) {
        return toDto(word, word.getVocabularySet());
    }
}

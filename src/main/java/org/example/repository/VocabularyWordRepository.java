package org.example.repository;

import org.example.entity.VocabularyWord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VocabularyWordRepository extends JpaRepository<VocabularyWord, Long> {
    List<VocabularyWord> findTop40ByVocabularySetVocabularySetIdOrderByWordTextAsc(Long vocabularySetId);
    List<VocabularyWord> findByVocabularySetVocabularySetIdOrderByWordTextAsc(Long vocabularySetId);
    long countByVocabularySetTopicTopicId(Long topicId);
    Optional<VocabularyWord> findByVocabularySetVocabularySetIdAndNormalizedText(Long vocabularySetId, String normalizedText);
}

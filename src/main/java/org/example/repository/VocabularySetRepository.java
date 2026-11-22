package org.example.repository;

import org.example.entity.VocabularySet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VocabularySetRepository extends JpaRepository<VocabularySet, Long> {
    List<VocabularySet> findByTopicTopicIdOrderByTitleAsc(Long topicId);
    List<VocabularySet> findByContentPackage_Game_CodeIgnoreCaseOrderByTitleAsc(String gameCode);
}

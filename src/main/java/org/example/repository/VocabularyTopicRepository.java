package org.example.repository;

import org.example.entity.VocabularyTopic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VocabularyTopicRepository extends JpaRepository<VocabularyTopic, Long> {
}

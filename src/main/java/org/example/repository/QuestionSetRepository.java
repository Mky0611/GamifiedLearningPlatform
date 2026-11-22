package org.example.repository;

import org.example.entity.QuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, Long> {
    List<QuestionSet> findByStatusOrderByQuestionSetIdAsc(String status);
}

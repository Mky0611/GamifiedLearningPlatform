package org.example.repository;

import org.example.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByQuestionQuestionIdOrderByAnswerOrderAsc(Long questionId);
    Optional<Answer> findFirstByQuestionQuestionIdAndIsCorrectTrue(Long questionId);
}

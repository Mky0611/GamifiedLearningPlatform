package org.example.repository;

import org.example.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    long countByGameSessionGameSessionId(Long gameSessionId);
    boolean existsByGameSessionGameSessionIdAndQuestionQuestionId(Long gameSessionId, Long questionId);
}

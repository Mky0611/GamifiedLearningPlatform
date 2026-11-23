package org.example.repository;

import org.example.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    long countByUserUserId(Long userId);
}

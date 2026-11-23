package org.example.repository;

import jakarta.persistence.LockModeType;
import org.example.entity.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    long countByUserUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select gs from GameSession gs where gs.gameSessionId = :id")
    Optional<GameSession> findByIdForUpdate(@Param("id") Long id);
}

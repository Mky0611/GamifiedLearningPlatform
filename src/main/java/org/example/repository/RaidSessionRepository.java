package org.example.repository;

import jakarta.persistence.LockModeType;
import org.example.entity.RaidSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RaidSessionRepository extends JpaRepository<RaidSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select rs from RaidSession rs where rs.raidSessionId = :id")
    Optional<RaidSession> findByIdForUpdate(@Param("id") Long id);
}

package org.example.repository;

import jakarta.persistence.LockModeType;
import org.example.entity.MasteryRecallChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MasteryRecallChallengeRepository extends JpaRepository<MasteryRecallChallenge, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from MasteryRecallChallenge c where c.challengeId = :id")
    Optional<MasteryRecallChallenge> findByIdForUpdate(@Param("id") String id);
}

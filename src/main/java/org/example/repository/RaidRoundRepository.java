package org.example.repository;

import org.example.entity.RaidRound;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RaidRoundRepository extends JpaRepository<RaidRound, Long> {
    Optional<RaidRound> findByRaidSessionRaidSessionIdAndRoundNo(Long raidSessionId, Integer roundNo);
}

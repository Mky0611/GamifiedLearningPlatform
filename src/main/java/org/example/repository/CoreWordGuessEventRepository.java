package org.example.repository;

import org.example.entity.CoreWordGuessEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoreWordGuessEventRepository extends JpaRepository<CoreWordGuessEvent, Long> {
    long countByRaidSessionRaidSessionIdAndIsCorrectTrue(Long raidSessionId);
}

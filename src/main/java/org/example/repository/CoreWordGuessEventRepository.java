package org.example.repository;

import org.example.entity.CoreWordGuessEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoreWordGuessEventRepository extends JpaRepository<CoreWordGuessEvent, Long> {
    long countByRaidSessionRaidSessionIdAndIsCorrectTrue(Long raidSessionId);
    List<CoreWordGuessEvent> findByRaidSessionRaidSessionIdAndIsCorrectTrue(Long raidSessionId);
    List<CoreWordGuessEvent> findByRaidSessionRaidSessionId(Long raidSessionId);
}

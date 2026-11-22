package org.example.repository;

import org.example.entity.WordSubmitEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WordSubmitEventRepository extends JpaRepository<WordSubmitEvent, Long> {
    long countByRaidSessionRaidSessionIdAndIsValidTrue(Long raidSessionId);
    List<WordSubmitEvent> findByRaidSessionRaidSessionIdAndIsValidTrue(Long raidSessionId);
}

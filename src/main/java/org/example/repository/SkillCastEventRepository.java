package org.example.repository;

import org.example.entity.SkillCastEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkillCastEventRepository extends JpaRepository<SkillCastEvent, Long> {
    Optional<SkillCastEvent> findByRaidSessionRaidSessionIdAndActionId(Long raidSessionId, String actionId);
}

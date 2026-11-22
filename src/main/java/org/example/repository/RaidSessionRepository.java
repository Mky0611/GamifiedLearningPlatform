package org.example.repository;

import org.example.entity.RaidSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaidSessionRepository extends JpaRepository<RaidSession, Long> {
}

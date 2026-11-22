package org.example.repository;

import org.example.entity.BoardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardSnapshotRepository extends JpaRepository<BoardSnapshot, Long> {
    long countByRaidSessionRaidSessionId(Long raidSessionId);
}

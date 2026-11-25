package org.example.repository;

import org.example.entity.BoardSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BoardSnapshotRepository extends JpaRepository<BoardSnapshot, Long> {
    long countByRaidSessionRaidSessionId(Long raidSessionId);
    Optional<BoardSnapshot> findTopByRaidSessionRaidSessionIdOrderBySnapshotNoDesc(Long raidSessionId);
}

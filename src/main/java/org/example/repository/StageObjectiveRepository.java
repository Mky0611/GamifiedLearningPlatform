package org.example.repository;

import org.example.entity.StageObjective;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StageObjectiveRepository extends JpaRepository<StageObjective, Long> {
    List<StageObjective> findByStageStageIdOrderBySortOrderAsc(Long stageId);
}

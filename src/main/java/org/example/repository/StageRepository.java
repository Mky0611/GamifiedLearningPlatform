package org.example.repository;

import org.example.entity.Stage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StageRepository extends JpaRepository<Stage, Long> {
    List<Stage> findByStatusOrderByChapterNoAscStageNoAsc(String status);
    Optional<Stage> findFirstByStatusOrderByChapterNoAscStageNoAsc(String status);
}

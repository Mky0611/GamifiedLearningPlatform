package org.example.repository;

import org.example.entity.StageCoreWord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StageCoreWordRepository extends JpaRepository<StageCoreWord, Long> {
    List<StageCoreWord> findByStageStageIdOrderByRevealOrderAsc(Long stageId);
    Optional<StageCoreWord> findFirstByStageStageIdOrderByRevealOrderAsc(Long stageId);
}

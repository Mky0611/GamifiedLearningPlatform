package org.example.repository;

import org.example.entity.UserStageProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserStageProgressRepository extends JpaRepository<UserStageProgress, Long> {
    Optional<UserStageProgress> findByUserUserIdAndStageStageId(Long userId, Long stageId);
    List<UserStageProgress> findByUserUserId(Long userId);
    long countByUserUserIdAndClearCountGreaterThan(Long userId, Integer clearCount);
}

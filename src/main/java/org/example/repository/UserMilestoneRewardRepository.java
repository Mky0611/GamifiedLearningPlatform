package org.example.repository;

import org.example.entity.UserMilestoneReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserMilestoneRewardRepository extends JpaRepository<UserMilestoneReward, Long> {
    List<UserMilestoneReward> findByUserUserId(Long userId);
    boolean existsByUserUserIdAndMilestoneKey(Long userId, String milestoneKey);
}

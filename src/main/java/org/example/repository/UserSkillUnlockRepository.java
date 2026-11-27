package org.example.repository;

import org.example.entity.UserSkillUnlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSkillUnlockRepository extends JpaRepository<UserSkillUnlock, Long> {
    List<UserSkillUnlock> findByUserUserId(Long userId);
    Optional<UserSkillUnlock> findByUserUserIdAndSkillCode(Long userId, String skillCode);
}

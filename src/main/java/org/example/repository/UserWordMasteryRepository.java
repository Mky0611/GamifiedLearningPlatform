package org.example.repository;

import org.example.entity.UserWordMastery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserWordMasteryRepository extends JpaRepository<UserWordMastery, Long> {
    Optional<UserWordMastery> findByUserUserIdAndWordWordId(Long userId, Long wordId);
    List<UserWordMastery> findByUserUserIdOrderByLastSeenAtDesc(Long userId);
    long countByUserUserIdAndTimesAnsweredCorrectGreaterThan(Long userId, Integer count);
    long countByUserUserIdAndTimesFoundGreaterThan(Long userId, Integer count);
}

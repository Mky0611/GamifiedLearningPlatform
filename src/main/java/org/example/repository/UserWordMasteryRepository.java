package org.example.repository;

import org.example.entity.UserWordMastery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserWordMasteryRepository extends JpaRepository<UserWordMastery, Long> {
    Optional<UserWordMastery> findByUserUserIdAndWordWordId(Long userId, Long wordId);
}

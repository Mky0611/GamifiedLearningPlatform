package org.example.repository;

import org.example.entity.HeroOwnership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HeroOwnershipRepository extends JpaRepository<HeroOwnership, Long> {
    List<HeroOwnership> findByUserUserId(Long userId);
    Optional<HeroOwnership> findByUserUserIdAndHeroCode(Long userId, String heroCode);
    boolean existsByUserUserIdAndHeroCode(Long userId, String heroCode);
}

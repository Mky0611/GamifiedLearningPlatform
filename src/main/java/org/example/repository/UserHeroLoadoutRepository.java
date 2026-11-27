package org.example.repository;

import org.example.entity.UserHeroLoadout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserHeroLoadoutRepository extends JpaRepository<UserHeroLoadout, UserHeroLoadout.Key> {
    List<UserHeroLoadout> findByUserId(Long userId);
    Optional<UserHeroLoadout> findByUserIdAndHeroCode(Long userId, String heroCode);
}

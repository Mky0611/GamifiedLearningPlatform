package org.example.repository;

import org.example.entity.GameMode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameModeRepository extends JpaRepository<GameMode, Long> {
    Optional<GameMode> findByGame_CodeAndCodeIgnoreCase(String gameCode, String code);
}

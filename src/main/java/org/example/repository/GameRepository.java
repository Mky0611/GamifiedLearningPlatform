package org.example.repository;

import org.example.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findTop6ByStatusOrderByUpdatedAtDesc(String status);
    List<Game> findByStatusOrderByNameAsc(String status);
}

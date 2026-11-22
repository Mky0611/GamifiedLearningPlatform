package org.example.repository;

import org.example.entity.UserLoadout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLoadoutRepository extends JpaRepository<UserLoadout, Long> {
    Optional<UserLoadout> findByUserUserId(Long userId);
}

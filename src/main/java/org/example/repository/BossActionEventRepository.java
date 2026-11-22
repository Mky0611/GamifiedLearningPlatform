package org.example.repository;

import org.example.entity.BossActionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BossActionEventRepository extends JpaRepository<BossActionEvent, Long> {
}
